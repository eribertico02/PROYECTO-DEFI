// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IPool.sol";
import "./MockERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockPool is IPool {
    IERC20 public usdc;
    MockERC20 public aToken;

    constructor(address _usdc, address _aToken) {
        usdc = IERC20(_usdc);
        aToken = MockERC20(_aToken);
    }

    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 /*referralCode*/
    ) external override {
        require(asset == address(usdc), "Only USDC supported");
        // Transfer USDC from user to Pool
        usdc.transferFrom(msg.sender, address(this), amount);
        // Mint aTokens to onBehalfOf (Escrow contract)
        aToken.mint(onBehalfOf, amount);
    }

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external override returns (uint256) {
        require(asset == address(usdc), "Only USDC supported");
        
        // Burn aTokens from msg.sender (Escrow contract)
        aToken.burn(msg.sender, amount);
        
        // Transfer USDC from Pool to recipient
        usdc.transfer(to, amount);
        return amount;
    }
}
