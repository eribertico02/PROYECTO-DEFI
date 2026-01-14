import { ethers, run } from "hardhat";

async function main() {
    console.log("🚀 Starting IntegrityEscrow deployment to Amoy...");

    // 1. Get Deployer
    const [deployer] = await ethers.getSigners();
    console.log("👨‍✈️ Deploying with account:", deployer.address);
    console.log("💰 Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // 2. Deploy IntegrityEscrow
    const IntegrityFactory = await ethers.getContractFactory("IntegrityEscrow");
    const integrityEscrow = await IntegrityFactory.deploy();

    console.log("⏳ Waiting for deployment...");
    await integrityEscrow.waitForDeployment();

    const address = await integrityEscrow.getAddress();
    console.log("✅ IntegrityEscrow Deployed at:", address);

    // 3. Verify on PolygonScan (Wait/Verify pattern)
    console.log("Inspect: https://amoy.polygonscan.com/address/" + address);

    // Note: Verification usually requires waiting a few blocks.
    // We skip automatic verification call here to avoid timeouts, 
    // but user can run `npx hardhat verify --network amoy <address>` later.

    console.log("\n⚠️ IMPORTANT: Update your backend .env with this address:");
    console.log(`INTEGRITY_ESCROW_ADDRESS=${address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
