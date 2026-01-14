import pkg from "hardhat";
const { ethers } = pkg;
import { expect } from "chai";

describe("EscrowP2P - Seguridad", function () {
  async function deploy() {
    const [comprador, vendedor] = await ethers.getSigners();
    const monto = ethers.parseEther("1.0");
    const Escrow = await ethers.getContractFactory("EscrowP2P");
    const escrow = await Escrow.deploy(vendedor.address, { value: monto });
    await escrow.waitForDeployment(); // Importante en Ethers 6
    return { escrow, comprador, vendedor, monto };
  }

  it("Debe tener el balance correcto", async function () {
    const { escrow, monto } = await deploy();
    const balance = await ethers.provider.getBalance(escrow.target);
    expect(balance).to.equal(monto);
  });
  
  it("Solo el comprador puede liberar", async function () {
    const { escrow, vendedor } = await deploy();
    await expect(escrow.connect(vendedor).liberarFondos())
      .to.be.revertedWith("Solo el comprador libera");
  });
});