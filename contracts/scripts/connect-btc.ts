import { ethers } from "hardhat";

// Configuración del Nodo BTC (Mover a .env en producción)
const BTC_RPC_USER = process.env.BTC_RPC_USER || "user";
const BTC_RPC_PASS = process.env.BTC_RPC_PASS || "password";
const BTC_RPC_URL = process.env.BTC_RPC_URL || "http://127.0.0.1:8332";

async function main() {
    console.log("🔌 Conectando con el Nodo Bitcoin Local...");
    console.log(`📡 URL: ${BTC_RPC_URL}`);

    try {
        // 1. Verificar conexión (getblockchaininfo)
        console.log("1️⃣  Verificando estado del nodo...");
        const info = await btcRpcCall("getblockchaininfo", []);
        console.log(`   ✅ Conectado a: ${info.chain}`);
        console.log(`   🧱 Bloques: ${info.blocks}`);
        console.log(`   ✂️  Pruned: ${info.pruned ? "Sí" : "No"}`);

        if (info.pruned) {
            console.log("   ⚠️  Nota: El nodo es pruned, solo tenemos bloques recientes.");
        }

        // 2. Simular un Anclaje (OP_RETURN)
        console.log("\n2️⃣  Simulando Anclaje de Datos (Data Anchoring)...");

        // Hash de ejemplo (estado de la DB)
        const mockDbHash = ethers.keccak256(ethers.toUtf8Bytes("Estado Contable 2026-01-09"));
        console.log(`   📝 Hash a anclar: ${mockDbHash}`);

        // NOTA: Para escribir de verdad necesitamos UTXOs reales.
        // Aquí solo consultamos la estimación de fees para demostrar lectura.
        const fees = await btcRpcCall("estimatesmartfee", [6]);
        console.log(`   💰 Fee estimado (6 bloques): ${fees.feerate || "N/A (Falta data)"} BTC/kB`);

        console.log("\n🎉 Conexión Exitosa. Tu nodo Bitcoin está listo para ser el 'Integrity Service'.");

    } catch (error: any) {
        console.error("\n❌ Error conectando al nodo BTC:");
        if (error.cause) {
            console.error("   Causa:", error.cause.code || error.cause);
        } else {
            console.error("   ", error.message);
        }
        console.log("\n💡 Tip: Asegúrate de que el nodo esté corriendo con 'server=1' y credenciales correctas.");
    }
}

// Helper para llamadas RPC
async function btcRpcCall(method: string, params: any[]) {
    const auth = Buffer.from(`${BTC_RPC_USER}:${BTC_RPC_PASS}`).toString('base64');

    const response = await fetch(BTC_RPC_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            jsonrpc: '1.0',
            id: 'hardhat-btc-test',
            method: method,
            params: params
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${text}`);
    }

    const json = await response.json();
    if (json.error) {
        throw new Error(`RPC Error: ${json.error.message} (Code: ${json.error.code})`);
    }

    return json.result;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
