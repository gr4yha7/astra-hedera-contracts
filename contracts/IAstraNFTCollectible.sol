// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// NFT listing structure
struct NFTListing {
    uint256 tokenId;
    address seller;
    uint256 price;
    bool isActive;
    uint256 listingTime;
}

interface IAstraNFTCollectible {
    // Core NFT Functions
    function mintNFTs(
        address to,
        string memory designId,
        string memory designName,
        string memory designImage,
        string memory prompt,
        uint256 count
    ) external;
    
    function transferNFT(address to, uint256 tokenId) external;
    function safeMint(address to) external returns (uint256);
    
    // Listing Functions
    function listNFT(uint256 tokenId, uint256 price) external;
    function listOwnedNFTsByQuantity(uint256 quantity, uint256 price) external;
    // function listMultipleNFTs(uint256[] memory tokenIds, uint256[] memory prices) external;
    // function listMultipleNFTsSamePrice(uint256[] memory tokenIds, uint256 price) external;
    // function buyNFT(uint256 tokenId) external;
    function getListing(uint256 tokenId) external view returns (NFTListing memory);
    function getActiveListings() external view returns (uint256[] memory);
    function getSellerListings(address seller) external view returns (uint256[] memory);
    function isNFTListed(uint256 tokenId) external view returns (bool);
    
    // Metadata Functions
    function updateDesignName(uint256 tokenId, string memory newDesignName) external;
    function updatePrompt(uint256 tokenId, string memory newPrompt) external;
    function updateDesignImage(uint256 tokenId, string memory newDesignImage) external;
    function addUserOfDesign(uint256 tokenId, address user) external;
    
    // Getter Functions
    function getOwner(uint256 tokenId) external view returns (address);
    function getDesignId(uint256 tokenId) external view returns (string memory);
    function getDesignName(uint256 tokenId) external view returns (string memory);
    function getDesignImage(uint256 tokenId) external view returns (string memory);
    function getPrompt(uint256 tokenId) external view returns (string memory);
    function getPreviousOwners(uint256 tokenId) external view returns (address[] memory);
    function getUsersOfDesign(uint256 tokenId) external view returns (address[] memory);
    function getBaseMintFee() external view returns (uint256);
    function isDesignIdUsed(string memory designId) external view returns (bool);
    
    // Owner Functions
    function tokensOfOwner(address owner) external view returns (uint256[] memory);
    function totalSupply() external view returns (uint256);
    function MAX_SUPPLY() external view returns (uint256);
    function MAX_PER_MINT() external view returns (uint256);
    function setBaseURI(string memory _baseTokenURI) external;
    
    // Configuration Functions
    function updateTreasuryAddress(address _treasuryAddress) external;
    function updateEscrowAddress(address _escrowAddress) external;
    function updateBaseMintFee(uint256 _baseMintFee) external;
    function associateUsdcToken() external;
    
    // Standard ERC721 Functions
    function ownerOf(uint256 tokenId) external view returns (address);
    function balanceOf(address owner) external view returns (uint256);
    function getApproved(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) external;
    function tokenURI(uint256 tokenId) external view returns (string memory);
}