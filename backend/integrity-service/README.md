# Integrity Service

Servicio de anclaje de datos para verificación de integridad utilizando Bitcoin.

## Propósito
Este servicio actúa como un "notario digital", tomando hashes del estado de la plataforma y escribiéndolos en la blockchain de Bitcoin utilizando transacciones `OP_RETURN` a través de un nodo local pruned.

## Stack Tecnológico
- Node.js / Go
- Bitcoin Core RPC (Local Pruned Node)

## Funcionalidad
1. **Snapshot**: Calcula hash de tablas críticas (Balances, Reputación).
2. **Anchor**: Envía tx a Bitcoin con el hash en `OP_RETURN`.
3. **Verify**: Permite consultar cuándo fue anclado un estado específico.

## Configuración Requerida
- Acceso a nodo Bitcoin local (RPC puerto 8332).
- Wallet con UTXOs para pagar fees de red.

## Estado
🚧 **Diseñado** - Pendiente de implementación.
