const ethers = require('ethers');
require('dotenv').config();
const bitcoinService = require('./services/bitcoin.service');

// Configuration
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology/";
// Placeholder - should be updated after deployment
const INTEGRITY_ESCROW_ADDRESS = process.env.INTEGRITY_ESCROW_ADDRESS || "0x0000000000000000000000000000000000000000";
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Admin/Oracle Key

if (!PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY is missing in .env");
    process.exit(1);
}

// Minimal ABI for IntegrityEscrow
const CONTRACT_ABI = [
    "event NFTDeposited(bytes32 indexed depositId, address indexed depositor, address indexed nftContract, uint256 tokenId)",
    "function linkIntegrityProof(bytes32 _depositId, string memory _btcTxHash) external"
];

async function startBot() {
    console.log("🤖 Starting Integrity Bot...");

    // 1. Connect to Polygon
    const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(INTEGRITY_ESCROW_ADDRESS, CONTRACT_ABI, wallet);

    console.log(`📡 Listening to IntegrityEscrow at ${INTEGRITY_ESCROW_ADDRESS}`);

    // 2. Listen for Events
    contract.on("NFTDeposited", async (depositId, depositor, nftContract, tokenId, event) => {
        console.log(`\n📥 New NFT Deposit Detected!`);
        console.log(`   Deposit ID: ${depositId}`);
        console.log(`   Depositor: ${depositor}`);
        console.log(`   NFT: ${nftContract} #${tokenId}`);

        try {
            // 3. Perform "Digital Notary" Verification
            console.log("🔍 Verifying Asset Integrity (Mocking PDF/Physical check)...");
            await new Promise(r => setTimeout(r, 2000)); // Simulate delay
            console.log("✅ Asset Verified.");

            // 4. Anchor to Bitcoin
            console.log("⚓ Anchoring Proof to Bitcoin...");
            // We hash the deposit ID to create the proof data (simplified)
            // In production, this would be a hash of the documents + depositId
            const integrityHash = depositId; // Already a hash

            // Note: integrityHash is 32 bytes (64 hex chars), fits in OP_RETURN (80 bytes)
            // Remove '0x' prefix if present for bitcoin service if it expects strict hex
            const cleanHash = integrityHash.replace('0x', '');

            const btcTxId = await bitcoinService.anchorData(cleanHash);
            console.log(`🎉 Bitcoin Anchor Successful! TXID: ${btcTxId}`);

            // 5. Link Proof on Polygon
            console.log("🔗 Linking Proof to Smart Contract...");
            const tx = await contract.linkIntegrityProof(depositId, btcTxId);
            console.log(`⏳ Waiting for Polygon confirmation... (Tx: ${tx.hash})`);
            await tx.wait();

            console.log("✅ Integrity Cycle Completed! NFT Release Authorized.");

        } catch (error) {
            console.error("❌ Bot Error processing deposit:", error.message);
        }
    });
}

// Start
startBot().catch(console.error);
