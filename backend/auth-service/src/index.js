const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();
const { connectDB, sequelize } = require('./database');
const User = require('./models/User');

const app = express();
app.use(express.json());
app.use(cors());

// Verbose logging middleware
app.use((req, res, next) => {
    console.log(`📡 [${new Date().toISOString()}] ${req.method} request to ${req.url} from ${req.ip}`);
    next();
});

const PORT = process.env.PORT || 4001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.get('/', (req, res) => {
    res.send('🛰️ Solaris Auth Service: ACTIVE & RECEPTIVE');
});

// Database Synchronization
const startServer = async () => {
    await connectDB();
    await sequelize.sync(); // Create tables if they don't exist

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🔑 Solaris Auth Service (Persistent) LIVE on: http://0.0.0.0:${PORT}`);
    });
};

app.post('/register', async (req, res) => {
    const { email, password, walletAddress } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ email, password: hashedPassword, walletAddress, role: 'USER' });

        res.status(201).json({ message: 'User registered securely in Solaris DB' });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });

        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ email: user.email, wallet: user.walletAddress }, JWT_SECRET);
            res.json({ token, user: { email: user.email, wallet: user.walletAddress } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ where: { email: req.user.email } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({
            email: user.email,
            wallet: user.walletAddress,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

startServer();
