// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IEscrowP2P
 * @dev Interface del contrato EscrowP2P
 */
interface IEscrowP2P {
    enum State {
        AWAITING_PAYMENT,
        AWAITING_DELIVERY,
        COMPLETE,
        DISPUTED,
        REFUNDED
    }

    struct Order {
        address buyer;
        address seller;
        uint256 amount;
        State state;
        uint256 createdAt;
        uint256 expiresAt;
        string fiatPaymentProof;
    }

    event OrderCreated(uint256 indexed orderId, address indexed buyer, address indexed seller, uint256 amount);
    event PaymentConfirmed(uint256 indexed orderId, string proof);
    event OrderCompleted(uint256 indexed orderId);
    event DisputeRaised(uint256 indexed orderId, address initiator);
    event DisputeResolved(uint256 indexed orderId, bool favorBuyer);
    event OrderRefunded(uint256 indexed orderId);

    function createOrder(address seller, uint256 amount, uint256 expirationTime) external returns (uint256);
    function confirmPayment(uint256 orderId, string calldata paymentProof) external;
    function releaseToSeller(uint256 orderId) external;
    function raiseDispute(uint256 orderId) external;
    function resolveDispute(uint256 orderId, bool favorBuyer) external;
    function cancelExpiredOrder(uint256 orderId) external;
}
