# Investigación: Integración de Nodo Bitcoin Pruned para Integridad de Datos

**Fecha**: 8 de Enero 2026
**Objetivo**: Integrar un nodo Bitcoin pruned existente como verificador de integridad de datos para la plataforma DeFi.

---

## 1. Análisis de Capacidades (Nodo Pruned)

Un nodo Bitcoin "pruned" (podado) mantiene la seguridad completa de la red pero descarta datos históricos antiguos para ahorrar espacio.

### Lo que PUEDE hacer:
- ✅ **Verificar Pagos Recientes**: Validar transacciones en bloques recientes y en la mempool.
- ✅ **Mantener el UTXO Set**: Conoce el estado actual de todos los balances de Bitcoin.
- ✅ **Transmitir Transacciones**: Puede enviar transacciones a la red.
- ✅ **Validar Proof-of-Work**: Tiene todos los encabezados de bloques (headers), garantizando que sigue la cadena más larga y segura.
- ✅ **Verificar Inclusión (Merkle Proofs)**: Puede verificar matemáticamente que una transacción está en un bloque reciente.

### Lo que NO PUEDE hacer:
- ❌ **Consultar Historia Antigua**: No puede servir datos de transacciones de hace 5 años (a menos que tenga indexación externa activada antes del pruning, lo cual es raro).
- ❌ **Ser un Explorador de Bloques Completo**: No sirve para buscar cualquier tx arbitraria del pasado.

---

## 2. Estrategia de Integración: "El Ancla de Verdad"

Para su proyecto DeFi, la mejor manera de utilizar este nodo es como un **Servicio de Anclaje de Datos (Data Anchoring)**. Bitcoin actúa como el reloj y notario inmutable del mundo.

### Caso de Uso: Verificación de Integridad de Datos (Timestamping)

Podemos usar el nodo para "certificar" el estado de su plataforma DeFi. Si su base de datos se corrompe o alguien cuestiona la integridad de los registros financieros, la blockchain de Bitcoin tendrá la prueba matemática inalterable.

#### Flujo Propuesto:
1.  **Snapshot Diario/Horario**: Su backend toma un "snapshot" de los datos críticos (e.g., hash del último bloque de la DB, balances de usuarios, reputación).
2.  **Hashing**: Se genera un hash SHA-256 de este snapshot.
3.  **OP_RETURN**: El nodo Bitcoin envía una transacción pequeña que incluye este hash en un output `OP_RETURN` (hasta 80 bytes).
4.  **Verificación**:
    - El cliente (usuario) puede tomar los datos públicos de la plataforma.
    - Calcular el hash.
    - Buscar esa transacción en cualquier explorador de Bitcoin (o en su nodo).
    - **Resultado**: Prueba criptográfica de que esos datos existían en esa fecha y no han sido modificados.

---

## 3. Arquitectura Propuesta

Se añade un nuevo microservicio llamado **"Integrity Service"**.

```mermaid
graph LR
    subgraph "DeFi Platform"
        DB[(PostgreSQL)]
        API[Backend API]
        Verifier[Integrity Service<br/>(Go/Node.js)]
    end
    
    subgraph "Local Infrastructure"
        BTC[Bitcoin Pruned Node]
    end
    
    subgraph "Bitcoin Network"
        Network[Bitcoin Blockchain]
    end
    
    API -->|1. Request Snapshot| DB
    DB -->|2. Data Hash| Verifier
    Verifier -->|3. RPC: createrawtransaction| BTC
    BTC -->|4. Broadcast OP_RETURN| Network
    Network --o|5. Confirmation| BTC
```

### Stack Tecnológico
- **Comunicación**: JSON-RPC (Puerto 8332 estándar).
- **Autenticación**: `rpcuser` / `rpcpassword` del nodo.
- **Costos**: Solo los fees de red de Bitcoin (satoshis/vbyte). Muy bajo si se hace batching (1 tx diaria).

---

## 4. Implementación Técnica (Draft)

No instalaremos nada aún, pero este sería el script conceptual en Node.js que correría en su servidor y hablaría con su nodo:

```javascript
// integrity-service.js (Conceptual)
const axios = require('axios');

async function anchorData(dataHash) {
    // 1. Crear el payload OP_RETURN
    const data = Buffer.from(dataHash, 'hex');
    const script = bitcoin.script.compile([
        bitcoin.opcodes.OP_RETURN,
        data
    ]);
    
    // 2. Comunicar con Nodo Local via RPC
    const rpcPayload = {
        jsonrpc: '1.0',
        id: 'anchor',
        method: 'createrawtransaction',
        params: [
            [], // inputs (seleccion automática si wallet está activa)
            { "data": script.toString('hex') } // output OP_RETURN
        ]
    };
    
    const response = await axios.post('http://localhost:8332', rpcPayload, {
        auth: { username: 'user', password: 'password' }
    });
    
    console.log("Tx ID de Anclaje:", response.data.result);
}
```

---

## 5. Ventajas para el Cliente (Marketing)

Puede vender esto en su web como:
> **"Auditado por Bitcoin"**: "Nuestros registros financieros son inmutables. Cada 24 horas, el estado de nuestra plataforma se ancla criptográficamente en la red Bitcoin, la base de datos más segura del mundo, utilizando nuestros propios nodos verificadores."

---

## 6. Siguientes Pasos (Si da Luz Verde)

1.  **Configurar RPC**: Asegurar que su nodo pruned tenga `server=1` en `bitcoin.conf` y credenciales RPC.
2.  **Crear Integrity Service**: Desarrollar el script pequeño que conecta su Backend con el Nodo.
3.  **Definir Frecuencia**: Decidir cada cuánto anclar datos (costo vs. granularidad).
