const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize('solaris_db', 'solaris_admin', 'solaris123', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL connected for Solaris');
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
    }
};

module.exports = { sequelize, connectDB };
