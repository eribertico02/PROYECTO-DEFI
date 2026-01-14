// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

/**
 * @title IntegrityEscrow
 * @dev A "Zero-Money" escrow for RWA NFTs.
 * Acts as a "Digital Notary" custodian.
 * 
 * DESIGN RULES FOR AML COMPLIANCE:
 * 1. NO ERC20/ETH handling (Blind to Money).
 * 2. Only handles ERC721 (Title Deeds).
 * 3. integrity logic relies on external Oracle (Bitcoin Node).
 */
contract IntegrityEscrow is AccessControl, ReentrancyGuard, Pausable, ERC721Holder {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    struct IntegrityDeposit {
        address depositor;
        address beneficiary;
        address nftContract;
        uint256 tokenId;
        string btcTxHash;     // Proof of Existence on Bitcoin
        bool isVerified;      // True if integrity check passed
        bool isReleased;
        uint256 createdAt;
    }

    // Mapping from unique Deposit ID to Deposit data
    mapping(bytes32 => IntegrityDeposit) public deposits;

    event NFTDeposited(bytes32 indexed depositId, address indexed depositor, address indexed nftContract, uint256 tokenId);
    event IntegrityProofLinked(bytes32 indexed depositId, string btcTxHash);
    event NFTReleased(bytes32 indexed depositId, address indexed beneficiary);
    event DepositCancelled(bytes32 indexed depositId, address indexed depositor);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender); // Admin is initial Oracle
    }

    /**
     * @dev Deposit an RWA NFT into the integrity vault.
     * @param _nftContract Address of the ERC721 contract (The 'Title Deed')
     * @param _tokenId ID of the specific item
     * @param _beneficiary Who receives the NFT upon verification (E.g., Buyer)
     */
    function depositNFT(address _nftContract, uint256 _tokenId, address _beneficiary) external nonReentrant whenNotPaused returns (bytes32) {
        require(_nftContract != address(0), "Invalid NFT address");
        require(_beneficiary != address(0), "Invalid beneficiary");

        // Transfer NFT to this contract
        IERC721(_nftContract).safeTransferFrom(msg.sender, address(this), _tokenId);

        // Generate unique ID
        bytes32 depositId = keccak256(abi.encodePacked(msg.sender, _nftContract, _tokenId, block.timestamp));

        deposits[depositId] = IntegrityDeposit({
            depositor: msg.sender,
            beneficiary: _beneficiary,
            nftContract: _nftContract,
            tokenId: _tokenId,
            btcTxHash: "",
            isVerified: false,
            isReleased: false,
            createdAt: block.timestamp
        });

        emit NFTDeposited(depositId, msg.sender, _nftContract, _tokenId);
        return depositId;
    }

    /**
     * @dev Oracle (Bitcoin Node) links the integrity proof (OP_RETURN hash) to the deposit.
     * This certifies the physical asset exists and was audited.
     */
    function linkIntegrityProof(bytes32 _depositId, string memory _btcTxHash) external onlyRole(ORACLE_ROLE) {
        IntegrityDeposit storage deposit = deposits[_depositId];
        require(deposit.depositor != address(0), "Deposit not found");
        require(!deposit.isReleased, "Already released");
        
        deposit.btcTxHash = _btcTxHash;
        deposit.isVerified = true;

        emit IntegrityProofLinked(_depositId, _btcTxHash);
    }

    /**
     * @dev Release NFT to beneficiary once Integrity is Verified.
     * Unlike financial escrow, here the condition is "Integrity Verified", not "Payment Received".
     * Payment is assumed to be P2P/External.
     */
    function releaseNFT(bytes32 _depositId) external nonReentrant whenNotPaused {
        IntegrityDeposit storage deposit = deposits[_depositId];
        require(deposit.depositor != address(0), "Deposit not found");
        require(!deposit.isReleased, "Already released");
        require(deposit.isVerified, "Integrity not verified yet");
        
        // Only Depositor or Oracle can trigger release to ensure control
        // Or Beneficiary if logic allows (simplified here to anyone if verified?)
        // Let's restrict to Admin/Oracle or Depositor for safety in this version.
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(ORACLE_ROLE, msg.sender) || msg.sender == deposit.depositor, "Not authorized to release");

        deposit.isReleased = true;
        IERC721(deposit.nftContract).safeTransferFrom(address(this), deposit.beneficiary, deposit.tokenId);

        emit NFTReleased(_depositId, deposit.beneficiary);
    }

    /**
     * @dev Cancel deposit and return NFT to depositor.
     * Useful if verification fails or deal falls through.
     */
    function cancelDeposit(bytes32 _depositId) external nonReentrant {
        IntegrityDeposit storage deposit = deposits[_depositId];
        require(msg.sender == deposit.depositor || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");
        require(!deposit.isReleased, "Already released");

        deposit.isReleased = true; // Mark as 'finalized' state to prevent re-entry
        IERC721(deposit.nftContract).safeTransferFrom(address(this), deposit.depositor, deposit.tokenId);

        emit DepositCancelled(_depositId, deposit.depositor);
    }
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
