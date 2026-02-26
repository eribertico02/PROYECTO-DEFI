import { expect } from "chai";
import { ethers } from "hardhat";
import { SmartWallet, YieldAggregator, MockERC20, MockPool } from "../typechain-types";

describe("Fase 2: Smart Contracts", function () {
    let smartWallet: SmartWallet;
    let yieldAggregator: YieldAggregator;
    let usdc: MockERC20;
    let aUsdc: MockERC20;
    let mockPool: MockPool;
    let owner: any;
    let user: any;
    let entryPoint: any;

    beforeEach(async function () {
        [owner, user, entryPoint] = await ethers.getSigners();

        // Deploy Mocks
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        usdc = await MockERC20.deploy("USD Coin", "USDC", 6) as MockERC20;
        aUsdc = await MockERC20.deploy("Aave USDC", "aUSDC", 6) as MockERC20;

        const MockPool = await ethers.getContractFactory("MockPool");
        mockPool = await MockPool.deploy(await usdc.getAddress(), await aUsdc.getAddress()) as MockPool;

        // Deploy Phase 2 Contracts
        const SmartWallet = await ethers.getContractFactory("SmartWallet");
        smartWallet = await SmartWallet.deploy(entryPoint.address, user.address) as SmartWallet;

        const YieldAggregator = await ethers.getContractFactory("YieldAggregator");
        yieldAggregator = await YieldAggregator.deploy(
            await usdc.getAddress(),
            await mockPool.getAddress(),
            await aUsdc.getAddress(),
            owner.address
        ) as YieldAggregator;

        // Initial setup
        await usdc.mint(user.address, ethers.parseUnits("1000", 6));
    });

    describe("SmartWallet (ERC-4337)", function () {
        it("Debe configurar el owner correctamente", async function () {
            expect(await smartWallet.owner()).to.equal(user.address);
        });

        it("Debe retornar el EntryPoint correcto", async function () {
            expect(await smartWallet.entryPoint()).to.equal(entryPoint.address);
        });
    });

    describe("YieldAggregator", function () {
        it("Debe permitir depósitos y generar principal", async function () {
            const amount = ethers.parseUnits("100", 6);
            await usdc.connect(user).approve(await yieldAggregator.getAddress(), amount);
            await yieldAggregator.connect(user).deposit(amount);

            expect(await yieldAggregator.userPrincipal(user.address)).to.equal(amount);
            expect(await yieldAggregator.totalPrincipal()).to.equal(amount);
        });

        it("Debe calcular el balance total incluyendo 'rendimiento' simulado", async function () {
            const amount = ethers.parseUnits("100", 6);
            await usdc.connect(user).approve(await yieldAggregator.getAddress(), amount);
            await yieldAggregator.connect(user).deposit(amount);

            // Simular rendimiento minteando aTokens extra al contrato del agregador
            const yieldAmount = ethers.parseUnits("10", 6);
            await aUsdc.mint(await yieldAggregator.getAddress(), yieldAmount);

            const balance = await yieldAggregator.getFullBalance(user.address);
            expect(balance).to.equal(ethers.parseUnits("110", 6));
        });
    });
});
