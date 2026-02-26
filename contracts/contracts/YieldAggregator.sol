// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IPool.sol";

/**
 * @title YieldAggregator
 * @notice Gestiona el depósito de USDC en Aave para generar rendimientos
 * @dev Los rendimientos se distribuyen o se quedan en el protocolo según configuración
 */
contract YieldAggregator is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    IPool public immutable aavePool;
    address public immutable aUsdc;

    mapping(address => uint256) public userPrincipal;
    uint256 public totalPrincipal;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, uint256 yield);

    constructor(
        address _usdc,
        address _aavePool,
        address _aUsdc,
        address initialOwner
    ) Ownable(initialOwner) {
        usdc = IERC20(_usdc);
        aavePool = IPool(_aavePool);
        aUsdc = _aUsdc;
    }

    /**
     * @notice Deposita USDC en Aave para generar rendimiento
     * @param amount Cantidad a depositar
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        
        usdc.approve(address(aavePool), amount);
        aavePool.supply(address(usdc), amount, address(this), 0);

        userPrincipal[msg.sender] += amount;
        totalPrincipal += amount;

        emit Deposited(msg.sender, amount);
    }

    /**
     * @notice Retira el principal más el rendimiento proporcional
     * @param amount Cantidad de principal a retirar (0 para retirar todo)
     */
    function withdraw(uint256 amount) external nonReentrant {
        uint256 principal = userPrincipal[msg.sender];
        require(principal > 0, "No balance");

        uint256 toWithdrawPrincipal = amount == 0 ? principal : amount;
        require(toWithdrawPrincipal <= principal, "Exceeds balance");

        // Calcular rendimiento (yield)
        // Ratio = balance total en Aave / principal total
        uint256 totalBalanceAave = IERC20(aUsdc).balanceOf(address(this));
        uint256 totalWithdrawAmount;

        if (totalPrincipal > 0) {
            totalWithdrawAmount = (toWithdrawPrincipal * totalBalanceAave) / totalPrincipal;
        } else {
            totalWithdrawAmount = toWithdrawPrincipal;
        }

        uint256 yield = totalWithdrawAmount > toWithdrawPrincipal ? totalWithdrawAmount - toWithdrawPrincipal : 0;

        userPrincipal[msg.sender] -= toWithdrawPrincipal;
        totalPrincipal -= toWithdrawPrincipal;

        aavePool.withdraw(address(usdc), totalWithdrawAmount, msg.sender);

        emit Withdrawn(msg.sender, toWithdrawPrincipal, yield);
    }

    /**
     * @notice Obtiene el balance total (principal + rendimiento) de un usuario
     */
    function getFullBalance(address user) external view returns (uint256) {
        if (totalPrincipal == 0) return 0;
        uint256 totalBalanceAave = IERC20(aUsdc).balanceOf(address(this));
        return (userPrincipal[user] * totalBalanceAave) / totalPrincipal;
    }
}
