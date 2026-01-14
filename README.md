# # STARTBTC - Proyecto Completo de Código Abierto
## 🌐 DeFi P2P Protocol - Banca sin Permiso para Mercados Emergentes

> [!NOTE]
> **Espejo del Proyecto**: Este repositorio es un espejo (mirror) para seguir el desarrollo en tiempo real. Invitamos a la comunidad a contribuir, auditar y clonar este entorno para fortalecer la libertad financiera en mercados emergentes.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22-orange)](https://hardhat.org/)
[![Base](https://img.shields.io/badge/Network-Base-blue)](https://base.org/)
[![Tests](https://img.shields.io/badge/Coverage-95%25+-green)](./contracts/test)

> Plataforma DeFi que permite a usuarios en mercados emergentes ahorrar en stablecoins, acceder a crédito colateralizado y generar rendimientos automáticos sin intermediarios bancarios tradicionales.

---

## 🎯 Propuesta de Valor

### Para el Usuario Final:
- **💰 Ahorro en Dólares Digitales**: Convierte moneda local a USDC y gana 4-8% APY automáticamente
- **💳 Micro-préstamos Colateralizados**: Pide prestado sin vender tus activos crypto
- **📨 Remesas Productivas**: Recibe dinero que genera intereses automáticamente
- **🆔 Identidad On-chain**: Construye historial crediticio global sin intermediarios

### Diferenciadores Clave:
- ✅ UX más simple que una app financiera tradicional (onboarding en 5 minutos)
- ✅ Tecnología invisible (Account Abstraction - sin seed phrases)
- ✅ Enfoque local (Venezuela primero, luego expansión LATAM)
- ✅ Producto integral (ahorro + crédito + remesas), no solo exchange

---

## 🏗️ Arquitectura

### Smart Contracts (Solidity en Base)
1. **EscrowP2P** ✅: Intercambios P2P seguros con sistema de reputación
2. **SmartWallet** 🚧: Account Abstraction (ERC-4337)
3. **YieldAggregator** 🚧: Integración con Aave V4

### Backend (Microservicios)
- Auth Service (Go) 🚧
- P2P Matching Engine (Go + Redis) 🚧
- Blockchain Bridge (Node.js) 🚧
- Oracle Service (Chainlink) 🚧

### Frontend
- Mobile App (Flutter) 🚧
- Admin Dashboard (React) 🚧

---

## 🚀 Quick Start

### Prerrequisitos
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Instalación

\`\`\`bash
# Clonar repositorio
git clone <tu-repo-url>
cd PROYECTO\\ DEFI

# Instalar dependencias de contratos
cd contracts
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus claves privadas
\`\`\`

### Compilar Contratos

\`\`\`bash
npx hardhat compile
\`\`\`

### Ejecutar Tests

\`\`\`bash
# Todos los tests
npx hardhat test

# Con coverage
npx hardhat coverage

# Con gas reporter
REPORT_GAS=true npx hardhat test
\`\`\`

### Deploy a Testnet (Base Sepolia)

\`\`\`bash
# Asegúrate de tener USDC de testnet y ETH para gas
npx hardhat run scripts/deploy-escrow.ts --network baseSepolia

# Verificar en Basescan
npx hardhat run scripts/verify.ts --network baseSepolia
\`\`\`

---

## 📁 Estructura del Proyecto

\`\`\`
PROYECTO DEFI/
├── docs/                   # Documentación técnica
│   ├── roadmap.md
│   ├── technical_architecture.md
│   └── executive_summary.md
├── contracts/              # Smart Contracts (Hardhat)
│   ├── contracts/
│   │   ├── EscrowP2P.sol
│   │   ├── mocks/
│   │   └── interfaces/
│   ├── test/
│   │   └── EscrowP2P.test.ts
│   └── scripts/
├── backend/                # Microservicios (TODO)
├── mobile/                 # Flutter App (TODO)
└── infrastructure/         # DevOps (TODO)
\`\`\`

---

## 🧪 Testing

**Cobertura actual**: **95%+**

\`\`\`bash
# Ejecutar todos los tests
npm test

# Con reporte de gas
REPORT_GAS=true npm test

# Coverage report (genera carpeta coverage/)
npm run coverage
\`\`\`

### Categorías de Tests:
- ✅ Deployment (3 tests)
- ✅ Order Creation (8 tests)
- ✅ Payment Confirmation (5 tests)
- ✅ Fund Release (6 tests)
- ✅ Disputes (8 tests)
- ✅ Order Expiration (3 tests)
- ✅ Pause Functionality (3 tests)
- ✅ View Functions (2 tests)
- ✅ Gas Optimization (1 test)

**Total**: 40+ tests

---

## 🔐 Seguridad

### Medidas Implementadas:
- ✅ ReentrancyGuard en todas las funciones críticas
- ✅ Access Control (roles de Admin y Árbitro)
- ✅ Pausable para emergencias
- ✅ SafeERC20 para transferencias
- ✅ Time-locks para expiración de órdenes
- ✅ Sistema de reputación anti-fraude

### Auditorías:
- 🚧 Pendiente auditoría por firma reconocida
- 🚧 Bug Bounty Program (próximamente)

**Reportar vulnerabilidades**: security@tudominio.com

---

## 📊 Roadmap

- [x] **Fase 1**: Investigación y Diseño (Completado)
- [x] **Fase 2**: Smart Contracts - EscrowP2P (Completado)
- [ ] **Fase 3**: Smart Contracts - SmartWallet y YieldAggregator
- [ ] **Fase 4**: Backend Services
- [ ] **Fase 5**: Mobile App
- [ ] **Fase 6**: Testing y Auditoría
- [ ] **Fase 7**: Lanzamiento Beta

Ver [roadmap completo](docs/roadmap.md)

---

## 🛠️ Tecnologías Utilizadas

### Blockchain
- **Solidity** 0.8.20
- **Hardhat** 2.22.10
- **Ethers.js** 6.13.2
- **OpenZeppelin** 5.1.0
- **Base Network** (Layer 2)

### Backend (Próximamente)
- Go (Golang)
- Node.js
- PostgreSQL
- Redis

### Frontend (Próximamente)
- Flutter
- Dart

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE)

---

## 👥 Equipo

- **Founder**: [Tu Nombre]
- **Ingeniero Senior**: 25+ años de experiencia

---

## 📞 Contacto

- Email: contact@tudominio.com
- Twitter: @tuproyecto
- Telegram: t.me/tuproyecto

---

## 📚 Documentación Adicional

- [Roadmap Detallado](docs/roadmap.md) - Plan de 18 meses
- [Arquitectura Técnica](docs/technical_architecture.md) - Diseño completo del sistema
- [Resumen Ejecutivo](docs/executive_summary.md) - Visión y estrategia

---

**⚠️ Disclaimer**: Este proyecto está en desarrollo activo. No usar en producción sin auditoría completa de seguridad.

**Estado actual**: MVP de Smart Contracts - EscrowP2P completado y testeado ✅
