import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("EscrowP2P - Aave Integration (Liquidity Mining)", function () {
    async function deployAaveFixture() {
        const [owner, buyer, seller, treasury] = await ethers.getSigners();

        // 1. Deploy Mock Tokens
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
        const aUsdc = await MockERC20.deploy("Aave Interest Bearing USDC", "aUSDC", 6);

        // 2. Deploy Mock Pool
        const MockPool = await ethers.getContractFactory("MockPool");
        const pool = await MockPool.deploy(await usdc.getAddress(), await aUsdc.getAddress());

        // 3. Deploy Escrow
        const EscrowP2P = await ethers.getContractFactory("EscrowP2P");
        const escrow = await EscrowP2P.deploy(await usdc.getAddress(), await pool.getAddress());

        // Setup Treasury and Whitelist
        await escrow.setTreasury(treasury.address);
        await escrow.updateWhitelist(buyer.address, true);
        await escrow.updateWhitelist(seller.address, true);

        // 4. Setup Funding
        const amount = ethers.parseUnits("1000", 6);
        await usdc.mint(seller.address, amount);
        await usdc.connect(seller).approve(await escrow.getAddress(), ethers.MaxUint256);

        // **Pool needs liquidity?**
        // In this Mock, Pool receives USDC when `supply` is called. So it has funds to `withdraw`.
        // But for `yield`, we want to simulate extra money.
        // We can mint USDC directly to the Pool to simulate that it earned fees from borrowers?
        // Wait, `withdraw` transfers USDC from Pool to User.
        // If we want to withdraw Yield, we need the Pool to have that extra USDC.
        // So we will mint extra USDC to the Pool during the test.

        return { escrow, pool, usdc, aUsdc, owner, buyer, seller, treasury };
    }

    it("Should deposit funds into Aave when creating an order", async function () {
        const { escrow, usdc, aUsdc, seller, buyer } = await loadFixture(deployAaveFixture);
        const amount = ethers.parseUnits("100", 6);

        await escrow.connect(buyer).createOrder(seller.address, amount, 3600);

        // Verify USDC left seller
        expect(await usdc.balanceOf(seller.address)).to.equal(ethers.parseUnits("900", 6));

        // Verify Escrow has NO USDC (it's in Aave)
        expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(0);

        // Verify Escrow has aTokens
        expect(await aUsdc.balanceOf(await escrow.getAddress())).to.equal(amount);

        // Verify Principal tracking
        expect(await escrow.totalPrincipal()).to.equal(amount);
    });

    it("Should withdraw principal from Aave when releasing funds", async function () {
        const { escrow, usdc, aUsdc, seller, buyer, treasury } = await loadFixture(deployAaveFixture);
        const amount = ethers.parseUnits("100", 6);

        await escrow.connect(buyer).createOrder(seller.address, amount, 3600);

        // Release
        await escrow.connect(seller).releaseToSeller(1);

        // Buyer gets funds (minus fee)
        const fee = (amount * 150n) / 10000n; // 1.5%
        const buyerAmount = amount - fee;
        expect(await usdc.balanceOf(buyer.address)).to.equal(buyerAmount);

        // Treasury gets fee
        expect(await usdc.balanceOf(treasury.address)).to.equal(fee);

        // Escrow principal should be 0
        expect(await escrow.totalPrincipal()).to.equal(0);

        // Escrow aTokens should be 0 (no yield generated yet)
        expect(await aUsdc.balanceOf(await escrow.getAddress())).to.equal(0);
    });

    it("Should allow treasury to claim generated yield", async function () {
        const { escrow, usdc, aUsdc, seller, buyer, treasury, pool, owner } = await loadFixture(deployAaveFixture);
        const amount = ethers.parseUnits("1000", 6); // $1000

        await escrow.connect(buyer).createOrder(seller.address, amount, 3600);

        // --- SIMULATE YIELD GENERATION ---
        // 1. Aave "rebases" -> aToken balance increases.
        // We simulate this by minting aTokens to the Escrow contract.
        const yieldAmount = ethers.parseUnits("50", 6); // $50 profit
        await aUsdc.mint(await escrow.getAddress(), yieldAmount);

        // 2. Ensuring Pool has liquidity to pay out that yield in USDC
        // In real Aave, borrowers pay interest. Here, we mint USDC to the pool.
        await usdc.mint(await pool.getAddress(), yieldAmount);

        // Check status before claim
        const escrowATokenBal = await aUsdc.balanceOf(await escrow.getAddress());
        console.log("Escrow aUSDC Balance (Principal + Yield):", escrowATokenBal.toString());
        expect(escrowATokenBal).to.equal(amount + yieldAmount);

        // Claim Yield
        // We need to pass the aToken address
        await escrow.connect(owner).claimYield(await aUsdc.getAddress()); // Owner is admin
        // Treasury address is just where funds go. msg.sender must be DEFAULT_ADMIN_ROLE.
        // In fixture: _grantRole(DEFAULT_ADMIN, msg.sender) -> Owner.
        // So we call with 'owner' (default signer).

        // Verify Treasury received the Yield
        // Treasury already had 0 USDC (unless loop interference, but fresh fixture)
        expect(await usdc.balanceOf(treasury.address)).to.equal(yieldAmount);

        // Verify Principal remains intact in Aave
        expect(await aUsdc.balanceOf(await escrow.getAddress())).to.equal(amount);
    });
});
