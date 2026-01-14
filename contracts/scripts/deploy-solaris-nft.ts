import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Desplegando SolarisNFT (RWA Test Token)...");

    const SolarisNFT = await ethers.getContractFactory("SolarisNFT");
    const solarisNft = await SolarisNFT.deploy();

    await solarisNft.waitForDeployment();

    const address = await solarisNft.getAddress();
    console.log("✅ SolarisNFT desplegado en:", address);
    console.log("------------------------------------------");
    console.log("Para probar en la interfaz:");
    console.log("1. Copia esta dirección:", address);
    console.log("2. Úsala en el panel de 'RWA Notary' -> 'Anchor Asset'");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
