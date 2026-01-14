import { ethers } from "hardhat";

async function main() {
    console.log("Deploying EscrowP2P contract...");

    // Get USDC address from environment or use default
    const usdcAddress = process.env.USDC_ADDRESS || process.env.USDC_BASE_SEPOLIA;

    if (!usdcAddress) {
        throw new Error("USDC_ADDRESS not set in .env file");
    }

    console.log(`Using USDC at: ${usdcAddress}`);

    // Deploy EscrowP2P
    // Polygon Addresses (Aave V3 Client)
    // USDC Polygon: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
    // Aave V3 Pool Polygon: 0x794a61358D6845594F94dc1DB02A252b5b4814aD

    usdcAddress = process.env.USDC_ADDRESS || "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
    let aavePoolAddress = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";

    if (hre.network.name === "amoy") {
        usdcAddress = "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582"; // USDC.e Amoy
        aavePoolAddress = "0xcC6114B9cc3916318b425830063648481Fab8397"; // Aave Pool Amoy (Example)
    } else if (hre.network.name === "hardhat" || hre.network.name === "localhost") {
        // Mock for local testing
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
        usdcAddress = await usdc.getAddress();

        // Mock Aave Pool locally if needed (would need to deploy MockPool)
        console.log("⚠️ Local network detected. Aave integration requires MockPool. Deploying simple Mock for now.");
        const MockPool = await ethers.getContractFactory("MockERC20"); // Hack to just get an address
        const pool = await MockPool.deploy("Mock Pool", "POOL", 18);
        aavePoolAddress = await pool.getAddress();
    }

    console.log("DeFi P2P Protocol Deployment");
    console.log("----------------------------");
    console.log("Network:", hre.network.name);
    console.log("USDC:", usdcAddress);
    console.log("Aave Pool:", aavePoolAddress);

    const escrow = await ethers.deployContract("EscrowP2P", [usdcAddress, aavePoolAddress]);
    await escrow.waitForDeployment();

    const escrowAddress = await escrow.getAddress();
    console.log(`✅ EscrowP2P deployed to: ${escrowAddress}`);

    // Setup Whitelist and Verify Fee
    console.log("\nConfiguring Protocol...");
    // Whitelist deployer for verification
    const [deployer] = await ethers.getSigners();
    const tx = await escrow.updateWhitelist(deployer.address, true);
    await tx.wait();
    console.log(`✅ Whitelisted deployer: ${deployer.address}`);

    // Verify Fee
    const fee = await escrow.feeBasisPoints();
    console.log(`✅ Protocol Fee: ${Number(fee) / 100}% (${fee} bps)`);
    if (Number(fee) !== 150) {
        console.error("❌ Warning: Fee is not 1.5%!");
    }

    console.log("\n🚀 Deployment Complete! Ready for Verification.");
    console.log("Run: npx hardhat verify --network <network> " + escrowAddress + " " + usdcAddress + " " + aavePoolAddress);

    // Save deployment info
    console.log("\nDeployment Summary:");
    console.log("===================");
    console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
    console.log(`EscrowP2P: ${escrowAddress}`);
    console.log(`USDC: ${usdcAddress}`);

    console.log("\nNext steps:");
    console.log("1. Verify contract on Basescan:");
    console.log(`   npx hardhat verify --network baseSepolia ${escrowAddress} ${usdcAddress}`);
    console.log("2. Grant arbiter role to trusted address");
    console.log("3. Test with small amounts first");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
