const express = require('express');
const bitcoinService = require('./services/bitcoin.service');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Endpoint para verificar estado del nodo
app.get('/health', async (req, res) => {
    try {
        const info = await bitcoinService.getInfo();
        res.json({
            status: 'online',
            chain: info.chain,
            blocks: info.blocks,
            pruned: info.pruned
        });
    } catch (error) {
        res.status(503).json({
            status: 'offline',
            error: 'No se puede conectar al Nodo Bitcoin'
        });
    }
});

// Endpoint para anclar datos (Admin only)
app.post('/anchor', async (req, res) => {
    try {
        const { hash } = req.body;
        if (!hash) return res.status(400).json({ error: 'Hash requerido' });

        const txId = await bitcoinService.anchorData(hash);
        res.json({ success: true, txId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🛡️  Integrity Service corriendo en puerto ${PORT}`);
    console.log(`🔌 Conectando al nodo Bitcoin en ${process.env.BTC_RPC_URL || 'http://127.0.0.1:8332'}`);
});
