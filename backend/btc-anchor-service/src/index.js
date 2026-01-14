const express = require('express');
const Client = require('bitcoin-core');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Bitcoin RPC Client Configuration
const btcClient = new Client({
  network: process.env.BTC_NETWORK || 'testnet',
  username: process.env.BTC_RPC_USER || 'solaris_rpc',
  password: process.env.BTC_RPC_PASSWORD,
  port: parseInt(process.env.BTC_RPC_PORT) || 18332,
  host: process.env.BTC_RPC_HOST || 'localhost',
  wallet: process.env.BTC_WALLET || 'solaris_anchor'
});

// PostgreSQL Connection Pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'solaris',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

// Initialize database table
const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS btc_anchors (
        id SERIAL PRIMARY KEY,
        asset_hash VARCHAR(64) NOT NULL,
        tx_hash VARCHAR(64) UNIQUE NOT NULL,
        block_height INTEGER,
        confirmations INTEGER DEFAULT 0,
        metadata JSONB,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        confirmed_at TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_asset_hash ON btc_anchors(asset_hash);
      CREATE INDEX IF NOT EXISTS idx_tx_hash ON btc_anchors(tx_hash);
      CREATE INDEX IF NOT EXISTS idx_status ON btc_anchors(status);
    `);
    console.log('✅ Database initialized');
  } catch (err) {
    console.error('❌ Database init error:', err.message);
  }
};

// Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    const info = await btcClient.getBlockchainInfo();
    const walletInfo = await btcClient.getWalletInfo();
    
    res.json({
      status: 'healthy',
      bitcoin: {
        network: info.chain,
        blocks: info.blocks,
        headers: info.headers,
        sync_progress: (info.verificationprogress * 100).toFixed(2) + '%',
        pruned: info.pruned
      },
      wallet: {
        balance: walletInfo.balance,
        unconfirmed_balance: walletInfo.unconfirmed_balance
      },
      service: {
        uptime: process.uptime(),
        version: '1.0.0'
      }
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: err.message,
      hint: 'Check if Bitcoin node is running and RPC credentials are correct'
    });
  }
});

// Anchor Hash to Bitcoin Timechain
app.post('/anchor', async (req, res) => {
  const { assetHash, metadata } = req.body;
  
  // Validation
  if (!assetHash || typeof assetHash !== 'string') {
    return res.status(400).json({ error: 'assetHash is required and must be a string' });
  }
  
  if (assetHash.length !== 64 || !/^[a-fA-F0-9]{64}$/.test(assetHash)) {
    return res.status(400).json({ error: 'Invalid SHA-256 hash format (must be 64 hex characters)' });
  }

  try {
    console.log(`📌 Anchoring hash: ${assetHash}`);
    
    // 1. Check wallet balance
    const walletInfo = await btcClient.getWalletInfo();
    if (walletInfo.balance < 0.0001) {
      return res.status(402).json({ 
        error: 'Insufficient BTC balance',
        balance: walletInfo.balance,
        required: 0.0001
      });
    }

    // 2. Create OP_RETURN output with the hash
    const opReturnData = Buffer.from(assetHash, 'hex').toString('hex');
    
    // 3. Create raw transaction with OP_RETURN
    const outputs = [{ data: opReturnData }];
    const rawTx = await btcClient.createRawTransaction([], outputs);

    // 4. Fund the transaction (adds inputs and change output)
    const fundedTx = await btcClient.fundRawTransaction(rawTx, {
      feeRate: parseFloat(process.env.BTC_FEE_RATE) || 0.00001
    });

    // 5. Sign the transaction
    const signedTx = await btcClient.signRawTransactionWithWallet(fundedTx.hex);
    
    if (!signedTx.complete) {
      throw new Error('Transaction signing failed');
    }

    // 6. Broadcast to Bitcoin network
    const txid = await btcClient.sendRawTransaction(signedTx.hex);
    
    // 7. Get current block height
    const blockHeight = await btcClient.getBlockCount();

    // 8. Store in database
    await pool.query(
      `INSERT INTO btc_anchors (asset_hash, tx_hash, block_height, metadata, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [assetHash, txid, blockHeight, JSON.stringify(metadata || {})]
    );

    console.log(`✅ Anchored! TXID: ${txid}`);

    // 9. Return success response
    const explorerUrl = process.env.BTC_NETWORK === 'mainnet'
      ? `https://blockstream.info/tx/${txid}`
      : `https://blockstream.info/testnet/tx/${txid}`;

    res.json({
      success: true,
      txid,
      block_height: blockHeight,
      explorer_url: explorerUrl,
      fee: fundedTx.fee,
      message: 'Hash successfully anchored to Bitcoin Timechain'
    });

  } catch (err) {
    console.error('❌ Anchor error:', err);
    res.status(500).json({ 
      error: 'Failed to anchor to Bitcoin',
      details: err.message,
      code: err.code
    });
  }
});

// Get Anchor Status by Transaction ID
app.get('/anchor/:txid', async (req, res) => {
  const { txid } = req.params;

  if (!/^[a-fA-F0-9]{64}$/.test(txid)) {
    return res.status(400).json({ error: 'Invalid transaction ID format' });
  }

  try {
    // Get from database first
    const dbResult = await pool.query(
      'SELECT * FROM btc_anchors WHERE tx_hash = $1',
      [txid]
    );

    if (dbResult.rows.length === 0) {
      return res.status(404).json({ error: 'Anchor not found' });
    }

    const anchor = dbResult.rows[0];

    // Get latest confirmation count from Bitcoin node
    try {
      const tx = await btcClient.getTransaction(txid);
      const confirmations = tx.confirmations || 0;
      const status = confirmations >= 6 ? 'confirmed' : 'pending';

      // Update database
      await pool.query(
        `UPDATE btc_anchors 
         SET confirmations = $1, status = $2, confirmed_at = $3 
         WHERE tx_hash = $4`,
        [
          confirmations,
          status,
          confirmations >= 6 ? new Date() : null,
          txid
        ]
      );

      const explorerUrl = process.env.BTC_NETWORK === 'mainnet'
        ? `https://blockstream.info/tx/${txid}`
        : `https://blockstream.info/testnet/tx/${txid}`;

      res.json({
        txid,
        asset_hash: anchor.asset_hash,
        confirmations,
        status,
        block_hash: tx.blockhash,
        block_height: anchor.block_height,
        created_at: anchor.created_at,
        confirmed_at: confirmations >= 6 ? new Date() : null,
        explorer_url: explorerUrl,
        metadata: anchor.metadata
      });

    } catch (nodeErr) {
      // Transaction not found in node (might be in mempool or not broadcast yet)
      res.json({
        txid,
        asset_hash: anchor.asset_hash,
        confirmations: 0,
        status: 'broadcasting',
        block_height: anchor.block_height,
        created_at: anchor.created_at,
        metadata: anchor.metadata
      });
    }

  } catch (err) {
    console.error('❌ Status check error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get All Anchors (with pagination)
app.get('/anchors', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const status = req.query.status; // 'pending' or 'confirmed'

  try {
    let query = 'SELECT * FROM btc_anchors';
    const params = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      total: result.rows.length,
      limit,
      offset,
      anchors: result.rows
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify Hash Exists on Bitcoin
app.post('/verify', async (req, res) => {
  const { assetHash } = req.body;

  if (!assetHash || assetHash.length !== 64) {
    return res.status(400).json({ error: 'Invalid hash' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM btc_anchors WHERE asset_hash = $1 AND status = $2',
      [assetHash, 'confirmed']
    );

    if (result.rows.length === 0) {
      return res.json({
        verified: false,
        message: 'Hash not found or not yet confirmed on Bitcoin'
      });
    }

    const anchor = result.rows[0];
    
    res.json({
      verified: true,
      txid: anchor.tx_hash,
      confirmations: anchor.confirmations,
      block_height: anchor.block_height,
      confirmed_at: anchor.confirmed_at,
      message: 'Hash is permanently anchored on Bitcoin Timechain'
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 4003;

const startServer = async () => {
  await initDatabase();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║  🔗 Bitcoin Timechain Anchor Service                 ║
║  🛰️  Solaris P2P Nexus - RWA Notarization            ║
╠═══════════════════════════════════════════════════════╣
║  Port: ${PORT}                                         
║  Network: ${process.env.BTC_NETWORK || 'testnet'}                                  
║  Status: http://localhost:${PORT}/health              
╚═══════════════════════════════════════════════════════╝
    `);
  });
};

startServer().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
