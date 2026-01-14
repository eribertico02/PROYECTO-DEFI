# BTC Anchor Service

Bitcoin Timechain anchoring service for Solaris RWA notarization.

## Features

- ✅ Real Bitcoin OP_RETURN transaction creation
- ✅ Automatic confirmation monitoring
- ✅ PostgreSQL persistence
- ✅ RESTful API
- ✅ Testnet and Mainnet support

## Prerequisites

- Bitcoin Core node (synced)
- PostgreSQL database
- Node.js 18+

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`
2. Configure Bitcoin RPC credentials
3. Set database connection details

## Usage

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Anchor Hash
```bash
POST /anchor
Content-Type: application/json

{
  "assetHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "metadata": {
    "assetType": "RWA",
    "owner": "0x..."
  }
}
```

### Get Anchor Status
```bash
GET /anchor/:txid
```

### List All Anchors
```bash
GET /anchors?limit=50&offset=0&status=confirmed
```

### Verify Hash
```bash
POST /verify
Content-Type: application/json

{
  "assetHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

## Testing

```bash
# Test with curl
curl -X POST http://localhost:4003/anchor \
  -H "Content-Type: application/json" \
  -d '{"assetHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}'
```

## Production Deployment

See `btc_timechain_integration_guide.md` for complete deployment instructions.
