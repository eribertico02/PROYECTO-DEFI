import { expect } from "chai";
import { ethers } from "hardhat";
import { IntegrityEscrow, MockERC721 } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("IntegrityEscrow (RWA Platform)", function () {
    let integrityEscrow: IntegrityEscrow;
    let mockNFT: MockERC721;
    let admin: HardhatEthersSigner;
    let depositor: HardhatEthersSigner;
    let beneficiary: HardhatEthersSigner;
    let oracle: HardhatEthersSigner;

    const TOKEN_ID = 1;

    beforeEach(async function () {
        [admin, depositor, beneficiary, oracle] = await ethers.getSigners();

        // Deploy Mock NFT
        const MockNFTFactory = await ethers.getContractFactory("MockERC721");
        mockNFT = (await MockNFTFactory.deploy()) as MockERC721;
        await mockNFT.waitForDeployment();

        // Deploy Integrity Escrow
        const IntegrityEscrowFactory = await ethers.getContractFactory("IntegrityEscrow");
        integrityEscrow = (await IntegrityEscrowFactory.deploy()) as IntegrityEscrow;
        await integrityEscrow.waitForDeployment();

        // Grant Oracle Role
        const ORACLE_ROLE = await integrityEscrow.ORACLE_ROLE();
        await integrityEscrow.grantRole(ORACLE_ROLE, oracle.address);

        // Mint NFT to depositor
        await mockNFT.mint(depositor.address, TOKEN_ID);
    });

    it("Should allow depositing an NFT", async function () {
        // Approve
        await mockNFT.connect(depositor).approve(await integrityEscrow.getAddress(), TOKEN_ID);

        // Deposit
        const tx = await integrityEscrow.connect(depositor).depositNFT(
            await mockNFT.getAddress(),
            TOKEN_ID,
            beneficiary.address
        );

        const receipt = await tx.wait();
        if (!receipt) throw new Error("No receipt");

        // Verify ownership
        expect(await mockNFT.ownerOf(TOKEN_ID)).to.equal(await integrityEscrow.getAddress());

        // Check event
        const log = receipt.logs.find((l: any) => l.fragment && l.fragment.name === 'NFTDeposited');
        expect(log).to.not.be.undefined;
    });

    it("Should allow Oracle to link Bitcoin Integrity Proof", async function () {
        // 1. Deposit
        await mockNFT.connect(depositor).approve(await integrityEscrow.getAddress(), TOKEN_ID);
        const tx = await integrityEscrow.connect(depositor).depositNFT(
            await mockNFT.getAddress(),
            TOKEN_ID,
            beneficiary.address
        );
        const receipt = await tx.wait();
        // Getting depositId from event is tricky in generic tests without explicit parsing, 
        // but here we can iterate logs or assume it's the first deposit. 
        // Ideally we parse the event.

        // Quick hack for test simplicity: Re-calculate hash or parse logs properly
        const filter = integrityEscrow.filters.NFTDeposited();
        const events = await integrityEscrow.queryFilter(filter);
        const depositId = events[0].args[0];

        // 2. Link Proof
        const btcTxHash = "abc123btcproof";
        await integrityEscrow.connect(oracle).linkIntegrityProof(depositId, btcTxHash);

        const deposit = await integrityEscrow.deposits(depositId);
        expect(deposit.btcTxHash).to.equal(btcTxHash);
        expect(deposit.isVerified).to.be.true;
    });

    it("Should release NFT to beneficiary after verification", async function () {
        // Setup: Deposit + Verify
        await mockNFT.connect(depositor).approve(await integrityEscrow.getAddress(), TOKEN_ID);
        await integrityEscrow.connect(depositor).depositNFT(await mockNFT.getAddress(), TOKEN_ID, beneficiary.address);

        const filter = integrityEscrow.filters.NFTDeposited();
        const event = (await integrityEscrow.queryFilter(filter))[0];
        const depositId = event.args[0];

        await integrityEscrow.connect(oracle).linkIntegrityProof(depositId, "valid_proof");

        // Release
        await integrityEscrow.connect(oracle).releaseNFT(depositId);

        // Verify ownership transferred
        expect(await mockNFT.ownerOf(TOKEN_ID)).to.equal(beneficiary.address);
    });

    it("Should NOT release NFT if not verified", async function () {
        await mockNFT.connect(depositor).approve(await integrityEscrow.getAddress(), TOKEN_ID);
        await integrityEscrow.connect(depositor).depositNFT(await mockNFT.getAddress(), TOKEN_ID, beneficiary.address);

        const filter = integrityEscrow.filters.NFTDeposited();
        const event = (await integrityEscrow.queryFilter(filter))[0];
        const depositId = event.args[0];

        await expect(
            integrityEscrow.connect(depositor).releaseNFT(depositId)
        ).to.be.revertedWith("Integrity not verified yet");
    });
});
