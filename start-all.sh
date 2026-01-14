#!/bin/bash

# Get the absolute path of the project root
PROJECT_ROOT=$(pwd)

# Clean up existing processes on the same ports
fuser -k 5173/tcp 4001/tcp 4002/tcp 4003/tcp 3001/tcp 2>/dev/null

echo "🚀 Iniciando Ecosistema Solaris P2P..."

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# 1. Auth Service
cd "$PROJECT_ROOT/backend/auth-service" && nohup node src/index.js > "../../logs/auth.log" 2>&1 &
echo "🔑 Auth Service iniciado (Ver logs/auth.log)"
sleep 1

# 2. P2P Engine
cd "$PROJECT_ROOT/backend/p2p-engine" && nohup node src/index.js > "../../logs/p2p.log" 2>&1 &
echo "🚀 P2P Engine iniciado (Ver logs/p2p.log)"
sleep 1

# 3. BTC Anchor Service (Real Timechain)
cd "$PROJECT_ROOT/backend/btc-anchor-service" && nohup node src/index.js > "../../logs/btc-anchor.log" 2>&1 &
echo "🔗 BTC Anchor Service iniciado (Ver logs/btc-anchor.log)"
sleep 1

# 4. Integrity Service
cd "$PROJECT_ROOT/backend/integrity-service" && nohup node src/integrity-bot.js > "../../logs/integrity.log" 2>&1 &
echo "🤖 Integrity Bot iniciado (Ver logs/integrity.log)"
sleep 1

# 5. Frontend
echo "✨ Limpiando caché de Solaris..."
rm -rf "$PROJECT_ROOT/frontend/node_modules/.vite"
cd "$PROJECT_ROOT/frontend" && nohup npm run dev -- --host > "../logs/frontend.log" 2>&1 &
echo "🎨 Frontend iniciado (Ver logs/frontend.log)"

echo "------------------------------------------------"
echo "✅ TODO CORRIENDO"
echo "Frontend: http://localhost:5173"
echo "BTC Anchor: http://localhost:4003"
echo "Para ver errores, revisa la carpeta 'logs/'"
echo "------------------------------------------------"

# Display last few lines of frontend log after a short wait
sleep 5
if [ -f "$PROJECT_ROOT/logs/frontend.log" ]; then
    echo "--- Últimas líneas del log del Frontend ---"
    tail -n 15 "$PROJECT_ROOT/logs/frontend.log"
else
    echo "⚠️ Esperando a que se genere el log del frontend..."
fi
