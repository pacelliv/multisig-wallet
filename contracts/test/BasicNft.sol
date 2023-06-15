// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract BasicNft is ERC721URIStorage {
    string[] private s_dogTokenUris;
    uint256 private s_tokenCounter;

    event DogMinted(address indexed minter, uint256 indexed tokenId, string tokenUri);

    constructor(string[3] memory dogTokenUris) ERC721("Dogie NFT Collection", "DOG") {
        s_tokenCounter = 0;
        s_dogTokenUris = dogTokenUris;
    }

    /**
     * @notice Mints an NFT
     * @param index Index to select a `tokenURI` from the `s_dogTokenUris` array to mint a NFT.
     * `0` to mint a `pug`. `1` to mint a `shiba-inu`. `2` to mint a `st-bernard`.
     */
    function mintNft(uint256 index) external {
        _safeMint(msg.sender, s_tokenCounter);
        _setTokenURI(s_tokenCounter, s_dogTokenUris[index]);
        emit DogMinted(msg.sender, s_tokenCounter, s_dogTokenUris[index]);
        s_tokenCounter = s_tokenCounter + 1;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return super.tokenURI(tokenId);
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
