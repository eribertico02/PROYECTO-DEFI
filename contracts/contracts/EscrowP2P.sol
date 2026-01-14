// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IPool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title EscrowP2P
 * @notice Contrato de escrow para intercambios P2P seguros de USDC por moneda fiat
 * @dev Implementa State Machine con protección contra reentrancy y sistema de reputación
 * 
 * Flujo de una orden:
 * 1. Seller crea orden depositando USDC → AWAITING_PAYMENT
 * 2. Buyer confirma pago fiat → AWAITING_DELIVERY
 * 3. Seller libera USDC al buyer → COMPLETE
 * 
 * En caso de disputa:
 * - Cualquier parte puede abrir disputa → DISPUTED
 * - Árbitro resuelve → COMPLETE o REFUNDED
 */
contract EscrowP2P is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;
    
    /*//////////////////////////////////////////////////////////////
                                 ROLES
    //////////////////////////////////////////////////////////////*/
    
    bytes32 public constant ARBITER_ROLE = keccak256("ARBITER_ROLE");
    
    /*//////////////////////////////////////////////////////////////
                                 ENUMS
    //////////////////////////////////////////////////////////////*/
    
    enum State {
        AWAITING_PAYMENT,    // Esperando que buyer pague fiat
        AWAITING_DELIVERY,   // Esperando que seller libere USDC
        COMPLETE,            // Orden completada exitosamente
        DISPUTED,            // En disputa, esperando árbitro
        REFUNDED             // Fondos devueltos al seller
    }
    
    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/
    
    struct Order {
        address buyer;
        address seller;
        uint256 amount;
        State state;
        uint256 createdAt;
        uint256 expiresAt;
        string fiatPaymentProof;  // IPFS hash del comprobante
    }
    
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Token USDC utilizado para las transacciones
    IERC20 public immutable usdc;
    
    /// @notice Aave V3 Lending Pool
    IPool public immutable aavePool;

    /// @notice Dirección de la tesorería (donde se envían las comisiones)
    address public treasury;
    
    /// @notice Comisión del protocolo en puntos base (150 = 1.5%)
    uint256 public feeBasisPoints = 150; // 1.5% default

    /// @notice Whitelist para usuarios verificados (KYC/AML)
    mapping(address => bool) public whitelist;
    
    /// @notice Contador de órdenes (ID autoincremental)
    uint256 public orderCounter;
    
    /// @notice Mapping de ID de orden a datos de la orden
    mapping(uint256 => Order) public orders;
    
    /// @notice Total principal (User funds) locked in Aave. Anything above this is Yield.
    uint256 public totalPrincipal;

    /// @notice Sistema de reputación de sellers (0-100)
    mapping(address => uint256) public sellerReputation;
    
    /// @notice Tiempo mínimo de expiración (5 minutos)
    uint256 public constant MIN_EXPIRATION_TIME = 300;
    
    /// @notice Tiempo máximo de expiración (7 días)
    uint256 public constant MAX_EXPIRATION_TIME = 7 days;
    
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event OrderCreated(uint256 indexed orderId, address indexed buyer, address indexed seller, uint256 amount);
    event OrderCompelted(uint256 indexed orderId); // Typo fixed in next version if possible, keeping consistency
    event OrderDisputed(uint256 indexed orderId, address indexed disputer);
    event DisputeResolved(uint256 indexed orderId, bool favorBuyer);
    event OrderRefunded(uint256 indexed orderId);
    event ReputationUpdated(address indexed seller, uint256 newReputation);
    event TreasuryUpdated(address newTreasury);
    event FeeUpdated(uint256 newFee);
    event YieldClaimed(uint256 amount);
    event WhitelistUpdated(address indexed user, bool status);

    /*//////////////////////////////////////////////////////////////
                                MODIFIERS
    //////////////////////////////////////////////////////////////*/
    modifier onlyOrderParticipant(uint256 orderId) {
        require(
            msg.sender == orders[orderId].buyer || msg.sender == orders[orderId].seller,
            "Not participant"
        );
        _;
    }

    modifier inState(uint256 orderId, State expectedState) {
        require(orders[orderId].state == expectedState, "Invalid state");
        _;
    }

    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "User not whitelisted (KYC required)");
        _;
    }

    /*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor(address _usdc, address _aavePool) {
        require(_usdc != address(0), "Invalid USDC");
        require(_aavePool != address(0), "Invalid Aave Pool");
        
        usdc = IERC20(_usdc);
        aavePool = IPool(_aavePool);
        treasury = msg.sender;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ARBITER_ROLE, msg.sender);
    }
    
    /*//////////////////////////////////////////////////////////////
                           EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Crea orden y deposita fondos en Aave para generar yield
     */
    function createOrder(
        address seller,
        uint256 amount,
        uint256 expirationTime
    ) external nonReentrant whenNotPaused onlyWhitelisted returns (uint256) {
        require(seller != address(0), "Invalid seller");
        require(whitelist[seller], "Seller not whitelisted"); // Ensure seller is also verified
        require(seller != msg.sender, "Buyer cannot be seller");
        require(amount > 0, "Amount > 0");
        require(expirationTime >= MIN_EXPIRATION_TIME && expirationTime <= MAX_EXPIRATION_TIME, "Invalid expiration");

        // 1. Transferir USDC del Seller -> Contrato
        usdc.safeTransferFrom(seller, address(this), amount);

        // 2. Aprobar y Depositar en Aave (Liquidity Mining)
        usdc.approve(address(aavePool), amount);
        aavePool.supply(address(usdc), amount, address(this), 0);
        
        // 3. Registrar Principal
        totalPrincipal += amount;

        uint256 orderId = ++orderCounter;
        orders[orderId] = Order({
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            state: State.AWAITING_PAYMENT,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + expirationTime,
            fiatPaymentProof: ""
        });

        emit OrderCreated(orderId, msg.sender, seller, amount);
        return orderId;
    }

    /**
     * @notice Seller libera los fondos tras recibir pago fiat
     */
    function releaseToSeller(uint256 orderId) external nonReentrant whenNotPaused {
        Order storage order = orders[orderId];
        require(msg.sender == order.seller, "Only seller can release");
        require(order.state == State.AWAITING_PAYMENT || order.state == State.DISPUTED, "Invalid state");
        require(block.timestamp <= order.expiresAt || order.state == State.DISPUTED, "Order expired");

        order.state = State.COMPLETE;
        
        // 1. Retirar Principal de Aave
        // El yield se queda en el contrato (como aTokens extra)
        aavePool.withdraw(address(usdc), order.amount, address(this));
        
        // 2. Actualizar Principal
        totalPrincipal -= order.amount;

        // 3. Calcular Fee y Distribuir
        uint256 fee = (order.amount * feeBasisPoints) / 10000;
        uint256 buyerAmount = order.amount - fee;

        usdc.safeTransfer(order.buyer, buyerAmount);
        if (fee > 0) {
            usdc.safeTransfer(treasury, fee);
        }
        
        _updateReputation(order.seller, true);
        emit OrderCompelted(orderId);
    }

    // ... (markAsPaid omitted for brevity if unchanged, but keeping context usually safe)
    function markAsPaid(uint256 orderId, string memory proof) external nonReentrant onlyOrderParticipant(orderId) {
         Order storage order = orders[orderId];
         require(msg.sender == order.buyer, "Only buyer");
         require(order.state == State.AWAITING_PAYMENT, "Invalid state");
         
         order.fiatPaymentProof = proof;
         // No cambia estado, pero notifica
    }

    function disputeOrder(uint256 orderId) external nonReentrant onlyOrderParticipant(orderId) {
        Order storage order = orders[orderId];
        require(order.state == State.AWAITING_PAYMENT, "Invalid state");
        order.state = State.DISPUTED;
        emit OrderDisputed(orderId, msg.sender);
    }

    function resolveDispute(uint256 orderId, bool favorBuyer) external onlyRole(ARBITER_ROLE) nonReentrant {
        Order storage order = orders[orderId];
        require(order.state == State.DISPUTED, "Not disputed");

        // Retirar de Aave antes de resolver
        aavePool.withdraw(address(usdc), order.amount, address(this));
        totalPrincipal -= order.amount;

        if (favorBuyer) {
            order.state = State.COMPLETE; // Buyer won
            usdc.safeTransfer(order.buyer, order.amount);
            _updateReputation(order.seller, false); // Seller loses reputation
        } else {
            order.state = State.REFUNDED; // Returned to seller
            usdc.safeTransfer(order.seller, order.amount);
            // No reputation change for seller if dispute resolved in their favor (funds returned)
        }
        
        emit DisputeResolved(orderId, favorBuyer);
    }
    
    /**
     * @notice Cancela una orden. Puede ser por expiración o por mutuo acuerdo.
     * @param orderId ID de la orden
     */
    function cancelOrder(uint256 orderId) external nonReentrant whenNotPaused {
         Order storage order = orders[orderId];
        require(msg.sender == order.seller || msg.sender == order.buyer, "Not participant");
        require(order.state == State.AWAITING_PAYMENT, "Invalid state");
        
        if (msg.sender == order.seller) {
            require(block.timestamp > order.expiresAt, "Order not expired");
        }
        
        // Retirar de Aave
        aavePool.withdraw(address(usdc), order.amount, address(this));
        totalPrincipal -= order.amount;

        order.state = State.REFUNDED;
        usdc.safeTransfer(order.seller, order.amount);
        emit OrderRefunded(orderId);
    }
    
    /**
     * @notice Recolectar el rendimiento generado en Aave (Safe)
     * @param _aToken Address of the aToken (aUSDC) to check balance
     */
    function claimYield(address _aToken) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        // Check actual balance in Aave (via aToken)
        uint256 totalBalance = IERC20(_aToken).balanceOf(address(this));
        require(totalBalance > totalPrincipal, "No yield generated");
        
        uint256 yield = totalBalance - totalPrincipal;
        
        // Withdraw ONLY the yield
        aavePool.withdraw(address(usdc), yield, treasury);
        
        emit YieldClaimed(yield);
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Pausa el contrato en caso de emergencia
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Reanuda el contrato
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Actualiza la dirección de tesorería
     * @param _newTreasury Nueva dirección
     */
    function setTreasury(address _newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newTreasury != address(0), "Invalid treasury");
        treasury = _newTreasury;
        emit TreasuryUpdated(_newTreasury);
    }

    /**
     * @notice Actualiza la comisión del protocolo
     * @param _newFee Nueva comisión en puntos base (max 10% para seguridad)
     */
    function setFee(uint256 _newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newFee <= 1000, "Fee too high (max 10%)");
        feeBasisPoints = _newFee;
        emit FeeUpdated(_newFee);
    }

    /**
     * @notice Gestiona la Whitelist de usuarios (AML/KYC)
     * @param user Dirección del usuario
     * @param status true para permitir, false para bloquear
     */
    function updateWhitelist(address user, bool status) external onlyRole(DEFAULT_ADMIN_ROLE) {
        whitelist[user] = status;
        emit WhitelistUpdated(user, status);
    }
    
    /*//////////////////////////////////////////////////////////////
                         INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Actualiza la reputación del seller
     * @param seller Dirección del seller
     * @param positive true para aumentar, false para disminuir
     */
    function _updateReputation(address seller, bool positive) internal {
        uint256 currentReputation = sellerReputation[seller];
        
        if (positive) {
            // Aumentar reputación (máximo 100)
            sellerReputation[seller] = _min(currentReputation + 1, 100);
        } else {
            // Disminuir reputación (mínimo 0)
            sellerReputation[seller] = currentReputation > 5 ? currentReputation - 5 : 0;
        }
        
        emit ReputationUpdated(seller, sellerReputation[seller]);
    }
    
    /**
     * @notice Retorna el mínimo de dos números
     */
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
    
    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Obtiene los detalles de una orden
     * @param orderId ID de la orden
     * @return order Datos de la orden
     */
    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }
    
    /**
     * @notice Verifica si una orden está expirada
     * @param orderId ID de la orden
     * @return expired true si está expirada
     */
    function isExpired(uint256 orderId) external view returns (bool) {
        return block.timestamp >= orders[orderId].expiresAt;
    }
}