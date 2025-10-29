# Contract Changes Documentation

## Overview
This document describes the recent changes made to the Astra Hedera Contracts codebase, including function signature modifications, new features, and removed functionality.

## Summary of Changes
Based on commit history analysis, the following major changes have been implemented:

1. **Removed `fabricType` metadata field** from NFT structure
2. **Added NFT marketplace functionality** with listing capabilities
3. **Enhanced Escrow contract** with NFT transfer integration
4. **Added new interface** `IAstraNFTCollectible.sol`
5. **Commented out batch listing functions** (temporarily disabled)
6. **New Contract Addresses**
```solidity
ASTRA_NFT_COLLECTIBLE_CONTRACT_ADDRESS=0x26163113B34bF2e8bE685B2DBBD8a1bA22ad5f54
ESCROW_CONTRACT_ADDRESS=0xb4a704f97CD22376AD9E867fcdeE6FB7C53FF42E
```

---

## Contract-Specific Changes

### 1. AstraNFTCollectible.sol

#### **REMOVED Functions:**
- `updateFabricType(uint256 tokenId, string memory newFabricType)`
- `getFabricType(uint256 tokenId)`

#### **REMOVED Parameters:**
- `fabricType` parameter removed from:
  - `mintNFTs()` function
  - `_mintSingleNFT()` function
  - `NFTMinted` event
  - `NFTMetadata` struct

#### **NEW Functions Added:**
- `listNFT(uint256 tokenId, uint256 price)` - List single NFT for sale
- `listOwnedNFTsByQuantity(uint256 quantity, uint256 price)` - List owned NFTs by quantity
- `getListing(uint256 tokenId)` - Get listing details
- `getActiveListings()` - Get all active listings
- `getSellerListings(address seller)` - Get seller's listings
- `isNFTListed(uint256 tokenId)` - Check if NFT is listed
- `_removeFromActiveListings(uint256 tokenId)` - Internal helper
- `_removeFromSellerListings(address seller, uint256 tokenId)` - Internal helper

#### **COMMENTED OUT Functions (Temporarily Disabled):**
- `listMultipleNFTs(uint256[] memory tokenIds, uint256[] memory prices)`
- `listMultipleNFTsSamePrice(uint256[] memory tokenIds, uint256 price)`
- `unlistNFT(uint256 tokenId)`
- `buyNFT(uint256 tokenId)`

#### **NEW Data Structures:**
```solidity
struct NFTListing {
    uint256 tokenId;
    address seller;
    uint256 price;
    bool isActive;
    uint256 listingTime;
}
```

#### **NEW Mappings:**
- `mapping(uint256 => NFTListing) private _listings`
- `uint256[] private _activeListings`
- `mapping(address => uint256[]) private _sellerListings`

#### **NEW Events:**
- `NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price, uint256 listingTime)`
- `NFTUnlisted(uint256 indexed tokenId, address indexed seller)`
- `NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price)`

#### **REMOVED Events:**
- `FabricTypeUpdated(uint256 indexed tokenId, string fabricType)`

#### **MODIFIED Functions:**
- `tokensOfOwner(address _owner)` - Changed visibility from `external` to `public`
- `_transfer()` - Added automatic unlisting when NFT is transferred

---

### 2. Escrow.sol

#### **NEW Parameters Added:**
- `nftTokenId` parameter added to:
  - `EscrowData` struct
  - `createEscrowByAgent()` function
  - `EscrowCreated` event

#### **REMOVED Parameters:**
- `treasury` parameter removed from:
  - `EscrowData` struct
  - `createEscrowByAgent()` function

#### **NEW Constructor Parameters:**
```solidity
constructor(
    address _treasuryAddress,        // NEW
    address _hederaTokenService,
    address _usdcAddress,
    address _astraNFTCollectibleAddress  // NEW
)
```

#### **NEW Functions:**
- `updateTreasuryAddress(address _treasuryAddress)` - Update treasury address
- `updateAstraNFTCollectibleAddress(address _astraNFTCollectibleAddress)` - Update NFT contract address
- `getAllEscrows()` - Get all escrow data

#### **NEW State Variables:**
- `address public treasuryAddress`
- `address public astraNFTCollectibleAddress`
- `EscrowData[] public allEscrows`

#### **NEW Events:**
- `AstraNFTCollectibleAddressUpdated(address indexed astraNFTCollectibleAddress)`
- `TreasuryUpdated(address indexed treasuryAddress)`

#### **MODIFIED Functions:**
- `completeMilestoneByAgent()` - Added NFT transfer to shopper when milestones complete
- `createEscrowByAgent()` - Updated to use global treasury address and include NFT token ID

---

### 3. IAstraNFTCollectible.sol (NEW FILE)

#### **Complete Interface Definition:**
This is a new interface file that defines all public functions for the AstraNFTCollectible contract, including:

- Core NFT functions (`mintNFTs`, `transferNFT`, `safeMint`)
- Listing functions (`listNFT`, `listOwnedNFTsByQuantity`)
- Metadata functions (`updateDesignName`, `updatePrompt`, `updateDesignImage`)
- Getter functions (design info, ownership, listings)
- Owner functions (configuration, tokens management)
- Standard ERC721 functions

#### **Commented Out Functions:**
- `listMultipleNFTs()` and `listMultipleNFTsSamePrice()` are commented out in the interface

---

## Function Signature Changes

### Before vs After Comparison

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
    string memory designImage,   // fabricType removed
    string memory prompt,
    uint256 _count
)
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

#### **Constructor Changes:**
```solidity
// BEFORE
constructor(address _hederaTokenService, address _usdcAddress)

// AFTER
constructor(
    address _treasuryAddress,                    // ADDED
    address _hederaTokenService,
    address _usdcAddress,
    address _astraNFTCollectibleAddress           // ADDED
)
```

---

## Migration Guide

### For Frontend/Backend Integration:

1. **Update mintNFTs calls** - Remove `fabricType` parameter
2. **Update createEscrowByAgent calls** - Remove `treasury` parameter, add `nftTokenId` parameter
3. **Update constructor calls** - Add `treasuryAddress` and `astraNFTCollectibleAddress` parameters
4. **Use new listing functions** - `listNFT()` and `listOwnedNFTsByQuantity()` are available
5. **Avoid commented functions** - `listMultipleNFTs()` and `listMultipleNFTsSamePrice()` are temporarily disabled

### For Contract Deployment:

1. **Deploy AstraNFTCollectible** with updated constructor parameters
2. **Deploy Escrow** with new constructor signature including treasury and NFT contract addresses
3. **Set escrow address** in AstraNFTCollectible using `updateEscrowAddress()`
4. **Set NFT contract address** in Escrow using `updateAstraNFTCollectibleAddress()`

---

## Testing Changes

### Updated Test Scripts:
- `test-listing.ts` - Tests single NFT listing functionality
- `test-batch-listing.ts` - Tests batch listing (with commented sections for disabled functions)
- `integration-test.ts` - End-to-end workflow testing

### Script Updates Required:
- Remove `fabricType` parameter from minting calls
- Update escrow creation calls with new parameters
- Use `listOwnedNFTsByQuantity()` instead of batch listing functions

---

## Breaking Changes Summary

1. **BREAKING**: `fabricType` parameter removed from all minting functions
2. **BREAKING**: `treasury` parameter removed from `createEscrowByAgent()`
3. **BREAKING**: Constructor signatures changed for both contracts
4. **BREAKING**: `tokensOfOwner()` visibility changed from `external` to `public`
5. **TEMPORARY**: Batch listing functions are commented out and unavailable

---

## Recommendations

1. **Update all integration code** to remove `fabricType` references
2. **Update deployment scripts** with new constructor parameters
3. **Use `listOwnedNFTsByQuantity()`** for batch operations until batch functions are re-enabled
4. **Test thoroughly** with the new NFT transfer functionality in escrow completion
5. **Monitor gas usage** with the new listing functionality

---

*Last Updated: Based on commit analysis from HEAD~5 to HEAD*
*Documentation covers changes from commits: feadf72, 4302956, 3dc1d11, 0b9ce3f, 794323e*
