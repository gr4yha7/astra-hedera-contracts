# Contract Updates Documentation

## Overview
This document describes the recent changes made to the Astra Hedera Contracts codebase, including function signature modifications, new features, and removed functionality.

## New Contract Addresses
```solidity
ASTRA_NFT_COLLECTIBLE_CONTRACT_ADDRESS=0x3da9616d78B6154D26B682e6F1e57aeaCDf2f3c1
ESCROW_CONTRACT_ADDRESS=0x2679b381f17371982b126f93026Ea8a9b50120f7
```

## Function Signature Changes (Before vs After Comparison)

### AstraNFTCollectible Contract

#### **REMOVED Functions:**
- `updateFabricType(uint256 tokenId, string memory newFabricType)`
- `getFabricType(uint256 tokenId)`
- `MAX_SUPPLY()`

#### **NFTMetadata Struct:**
```solidity
// BEFORE
struct NFTMetadata {
    string designId;
    string designName;
    string fabricType;    // REMOVED
    string designImage;
    string prompt;
    address[] previousOwners;
    address[] usersOfDesign;
}

// AFTER
struct NFTMetadata {
    string designId;
    string designName;
    string designImage;
    string prompt;
    address[] previousOwners;
    address[] usersOfDesign;
}
```

#### **NFTMinted Event:**
```solidity
// BEFORE
event NFTMinted(
    uint256 indexed tokenId,
    address indexed creator,
    address indexed owner,
    string designId,
    string designName,
    string fabricType,   // REMOVED
    string designImage,
    string prompt
);

// AFTER
event NFTMinted(
    uint256 indexed tokenId,
    address indexed creator,
    address indexed owner,
    string designId,
    string designName,
    string designImage,
    string prompt
);
```

#### **mintNFTs Function:**
```solidity
// BEFORE
function mintNFTs(
    address to,
    string memory designId,
    string memory designName,
    string memory fabricType,    // REMOVED
    string memory designImage,
    string memory prompt,
    uint256 _count
)

// AFTER
function mintNFTs(
    address to,
    string memory designId,
    string memory designName,
    string memory designImage,
    string memory prompt,
    uint256 _count
)
```

#### **listNFT Function:**
```solidity
// Call this function to list a single NFT
// ADDED
function listNFT(uint256 tokenId, uint256 price)
```

#### **listOwnedNFTsByQuantity Function:**
```solidity
// Call this function to list a specified number (quantity) of NFTs
// ADDED
function listOwnedNFTsByQuantity(uint256 quantity, uint256 price)
```

#### **NFTListed Event:**
```solidity
// ADDED
event NFTListed(
    uint256 indexed tokenId,
    address indexed seller,
    uint256 price,
    uint256 listingTime
);
```

#### **isNFTListed Function:**
```solidity
// Call this function to check if an NFT is currently listed
// ADDED
function isNFTListed(uint256 tokenId) public view returns (bool)
```

#### **getSellerListings Function:**
```solidity
// Call this function to fetch all the NFTs listed by a seller
// ADDED
function getSellerListings(address seller) public view returns (uint256[] memory)
```

#### **getActiveListings Function:**
```solidity
// Call this function to fetch all the active NFT listings
// ADDED
function getActiveListings() public view returns (uint256[] memory)
```

#### **getListing Function:**
```solidity
// Call this function to fetch the listing details for an NFT
// ADDED
function getListing(uint256 tokenId) public view returns (NFTListing memory)
```

#### **NFTListing Struct:**
```solidity
// ADDED
// NFT listing structure
struct NFTListing {
    uint256 tokenId;
    address seller;
    uint256 price;
    bool isActive;
    uint256 listingTime;
}
```


### Escrow Contract

#### **getAllEscrows Functions:**
```solidity
// Call this function to fetch all the escrows
// ADDED
function getAllEscrows() public view returns (EscrowData[] memory)
```

#### **createEscrowByAgent Function:**
```solidity
// BEFORE
function createEscrowByAgent(
    address shopper,
    address maker,
    address treasury,           // REMOVED
    address creator,
    uint256 amount
)

// AFTER
function createEscrowByAgent(
    address shopper,
    address maker,
    address creator,
    uint256 amount,
    uint256 nftTokenId          // ADDED
)
```

### **EscrowCreated Event:**
```solidity
// BEFORE
 event EscrowCreated(
  uint256 indexed escrowId,
  address shopper,
  address maker,
  address treasury,
  uint256 amount
);

// AFTER
event EscrowCreated(
  uint256 indexed escrowId,
  address shopper,
  address maker,
  address treasury,
  uint256 amount,
  uint256 nftTokenId          // ADDED
);
```

#### **EscrowData Struct:**
```solidity
// BEFORE
struct EscrowData {
    address shopper;
    address maker;
    address creator; // Optional creator address
    address treasury;           // REMOVED
    address agent;
    uint256 amount;
    uint8 milestonesCompleted;
    bytes status;
    uint256 remainingBalance;
    bool hasCreator;
}

// AFTER
struct EscrowData {
    address shopper;
    address maker;
    address creator; // Optional creator address
    address agent;
    uint256 amount;
    uint256 nftTokenId;          // ADDED
    uint8 milestonesCompleted;
    bytes status;
    uint256 remainingBalance;
    bool hasCreator;
}
```