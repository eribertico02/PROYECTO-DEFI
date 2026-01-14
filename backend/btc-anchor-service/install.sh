#!/bin/bash

echo "🔗 Installing Bitcoin Timechain Anchor Service..."

# Navigate to service directory
cd "$(dirname "$0")"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚙️  Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and configure your Bitcoin RPC credentials"
    echo "   Run: nano .env"
fi

echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Configure .env with your Bitcoin node credentials"
echo "2. Ensure Bitcoin Core is running and synced"
echo "3. Start the service with: npm start"
echo ""
echo "For detailed setup instructions, see:"
echo "  - README.md"
echo "  - ../../.gemini/antigravity/brain/.../btc_timechain_integration_guide.md"
