// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SolarisNFT
 * @dev Contrato de prueba para representar activos reales (RWA) en la plataforma Solaris P2P.
 * Permite acuñar NFTs rápidamente para probar el flujo de anclaje en Bitcoin.
 */
contract SolarisNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721("Solaris Real World Asset", "SOLR") Ownable(msg.sender) {}

    /**
     * @dev Acuña un nuevo NFT a la dirección especificada.
     * @param to Dirección que recibirá el NFT.
     */
    function mint(address to) public {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }
}
