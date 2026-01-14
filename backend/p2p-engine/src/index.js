const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB, sequelize } = require('./database');
const Order = require('./models/Order');

const app = express();
app.use(express.json());
app.use(cors());

// Verbose logging middleware
app.use((req, res, next) => {
    console.log(`🚀 [${new Date().toISOString()}] ${req.method} request to ${req.url} from ${req.ip}`);
    next();
});

const PORT = process.env.PORT || 4002;

app.get('/', (req, res) => {
    res.send('🚀 Solaris P2P Engine: ACTIVE & RECEPTIVE');
});

// Database Synchronization
const startServer = async () => {
    await connectDB();
    await sequelize.sync(); // Create tables if they don't exist

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Solaris P2P Engine (Persistent) LIVE on: http://0.0.0.0:${PORT}`);
    });
};

/**
 * @api {get} /orders Get All Orders
 * @apiDescription Obtiene todas las órdenes activas en el mercado P2P.
 */
app.get('/orders', async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { status: 'OPEN' },
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @api {post} /orders Create Order
 * @apiDescription Crea una nueva orden de compra o venta en el mercado.
 */
app.post('/orders', async (req, res) => {
    const { type, amount, price, paymentMethod, creator } = req.body;

    if (!type || !amount || !price || !paymentMethod || !creator) {
        return res.status(400).json({ error: 'Missing required order fields' });
    }

    try {
        const newOrder = await Order.create({
            type,
            amount,
            price,
            paymentMethod,
            creator,
            status: 'OPEN'
        });
        res.status(201).json(newOrder);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

startServer();
