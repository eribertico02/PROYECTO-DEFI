const axios = require('axios');
require('dotenv').config();

const BTC_RPC_URL = process.env.BTC_RPC_URL || 'http://127.0.0.1:8332';
const BTC_RPC_USER = process.env.BTC_RPC_USER || 'user';
const BTC_RPC_PASS = process.env.BTC_RPC_PASS || 'password';

class BitcoinService {
    constructor() {
        this.client = axios.create({
            baseURL: BTC_RPC_URL,
            auth: {
                username: BTC_RPC_USER,
                password: BTC_RPC_PASS
            }
        });
    }

    async rpcCall(method, params = []) {
        try {
            const response = await this.client.post('/', {
                jsonrpc: '1.0',
                id: 'integrity-svc',
                method: method,
                params: params
            });

            if (response.data.error) {
                throw new Error(response.data.error.message);
            }

            return response.data.result;
        } catch (error) {
            console.error(`Bitcoin RPC Error [${method}]:`, error.message);
            throw error;
        }
    }

    async getInfo() {
        return await this.rpcCall('getblockchaininfo');
    }

    /**
     * Ancla un hash en la blockchain de Bitcoin usando OP_RETURN
     * @param {string} hexData - Hash o datos en hex (max 80 bytes)
     */
    async anchorData(hexData) {
        // 1. Obtener UTXOs disponibles (mínimo 1 confirmación)
        const unspents = await this.rpcCall('listunspent', [1, 9999999]);
        if (!unspents || unspents.length === 0) {
            throw new Error('No UTXOs available to pay for transaction fees.');
        }

        // 2. Seleccionar UTXO (Estrategia simple: el primero que alcance para fee básico)
        // En prod usaríamos coin selection real. Asumimos fee fijo 1000 sats por simplicidad aquí.
        const utxo = unspents[0];
        const fee = 0.00001; // 0.00001 BTC = 1000 sats (estimado bajo)
        const change = utxo.amount - fee;

        if (change < 0) {
            throw new Error(`Insufficient funds in UTXO ${utxo.txid} for fee.`);
        }

        // 3. Crear Inputs y Outputs
        const inputs = [{ txid: utxo.txid, vout: utxo.vout }];
        const outputs = [
            { "data": hexData }, // OP_RETURN output
            { [utxo.address]: change.toFixed(8) } // Change back to same address
        ];

        // 4. Crear Raw Transaction
        const rawTxHex = await this.rpcCall('createrawtransaction', [inputs, outputs]);

        // 5. Firmar Transacción
        const signedTx = await this.rpcCall('signrawtransactionwithwallet', [rawTxHex]);
        if (!signedTx.complete) {
            throw new Error('Could not sign transaction completely.');
        }

        // 6. Enviar Transacción
        const txId = await this.rpcCall('sendrawtransaction', [signedTx.hex]);

        console.log(`⚓ Datos anclados exitosamente. TXID: ${txId}`);
        return txId;
    }
}

module.exports = new BitcoinService();
