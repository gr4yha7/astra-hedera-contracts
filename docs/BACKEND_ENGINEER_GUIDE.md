# AstraNFT Collectible Backend Integration Guide

## Overview

This guide provides backend engineers with the necessary information to integrate with the AstraNFT Collectible system on Hedera testnet. The system involves uploading NFT images and metadata to IPFS/Pinata and minting collectible NFTs using Hedera's token service.

## Prerequisites

- Node.js 18+ installed
- Access to Hedera testnet
- IPFS node or service (Pinata, Infura, or local IPFS)
- Testnet USDC tokens from [Circle Faucet](https://faucet.circle.com/) (Select Hedera Testnet network and provide wallet address)
- Private key with sufficient testnet HBAR for gas fees. Get testnet HBAR from [Hedera Testnet Faucet](https://portal.hedera.com/faucet) using your EVM wallet address (0x... address). Note that, the faucet will generate an Hedera Account ID for your wallet address, ensure that you copy and save it.
- IPFS service account (Pinata recommended) with API keys

## Table of Contents

1. [System Architecture](#system-architecture)
2. [IPFS/Pinata Integration](#ipfspinata-integration)
3. [Hedera Testnet Setup](#hedera-testnet-setup)
4. [AstraNFT Collectible Contract Integration](#astranft-collectible-contract-integration)
5. [Code Examples](#code-examples)
6. [Troubleshooting](#troubleshooting)

## System Architecture

```
Backend Service
├── IPFS/Pinata Upload (Images + Metadata)
├── Hedera Token Service (USDC)
├── AstraNFT Collectible Contract (Batch Minting)
```

### Key Components

- **AstraNFT Collectible Contract**: Upgradeable ERC721Enumerable contract on Hedera with batch minting capabilities
- **IPFS/Pinata**: Decentralized storage for NFT images and metadata
- **Hedera Token Service**: For USDC token operations
- **USDC Token**: Required for payment (configurable fee per mint)
- **Batch Minting**: Ability to mint multiple NFTs with the same design in one transaction

## IPFS/Pinata Integration

### 1. Setup Pinata V2 Client

```bash
npm install pinata
```

```typescript
import { PinataSDK } from "pinata";

// Initialize Pinata V2 client
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT_TOKEN,
  pinataGateway: process.env.PINATA_GATEWAY_URL || "gateway.pinata.cloud"
});
```

### 2. Upload NFT Images to IPFS

```typescript
interface ImageUploadResult {
  ipfsHash: string;
  ipfsUrl: string;
}

async function uploadImageToIPFS(imageBuffer: Buffer, fileName: string): Promise<ImageUploadResult> {
  try {
    // Pinata V2 API structure - using public upload
    const file = new File([imageBuffer], fileName, { type: "image/png" });
    const uploadResult = await pinata.upload.public.file(file);

    return {
      ipfsHash: uploadResult.cid,
      ipfsUrl: `ipfs://${uploadResult.cid}`
    };
  } catch (error) {
    console.error('Image upload failed:', error);
    throw new Error('Failed to upload image to IPFS');
  }
}
```

### 3. Upload Metadata to IPFS

```typescript
interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  external_url?: string;
  background_color?: string;
  animation_url?: string;
}

async function uploadMetadataToIPFS(metadata: NFTMetadata, fileName: string): Promise<string> {
  try {
    // Pinata V2 API structure - using public upload
    const uploadResult = await pinata.upload.public.json(metadata);

    return `ipfs://${uploadResult.cid}`;
  } catch (error) {
    console.error('Metadata upload failed:', error);
    throw new Error('Failed to upload metadata to IPFS');
  }
}
```

### 4. Upload Metadata Folder for Base Token URI

**Important**: NFT metadata files should be organized in a folder structure on IPFS. The folder's IPFS hash will be used to set the `baseTokenURI` in the `AstraNFTCollectible.sol` contract.

```typescript
interface MetadataFolderUploadResult {
  folderHash: string;
  folderUrl: string;
}

async function uploadMetadataFolder(metadataFiles: { [tokenId: string]: NFTMetadata }): Promise<MetadataFolderUploadResult> {
  try {
    // Create a folder structure for metadata
    const folderStructure: { [key: string]: any } = {};
    
    // Add each metadata file to the folder structure
    Object.entries(metadataFiles).forEach(([tokenId, metadata]) => {
      folderStructure[`${tokenId}`] = metadata;
    });

    // Upload the entire folder structure
    const uploadResult = await pinata.upload.public.json(folderStructure);

    return {
      folderHash: uploadResult.cid,
      folderUrl: `ipfs://${uploadResult.cid}`
    };
  } catch (error) {
    console.error('Metadata folder upload failed:', error);
    throw new Error('Failed to upload metadata folder to IPFS');
  }
}

// Update the contract's base token URI
async function updateBaseTokenURI(contractAddress: string, folderHash: string): Promise<void> {
  try {
    const baseTokenURI = `ipfs://${folderHash}/`;
    
    // Call the setBaseURI function on the contract
    const tx = await astraNFTCollectibleContract.setBaseURI(baseTokenURI);
    await tx.wait();
    
    console.log(`Base token URI updated to: ${baseTokenURI}`);
  } catch (error) {
    console.error('Failed to update base token URI:', error);
    throw new Error('Failed to update base token URI');
  }
}
```

### 5. Complete Upload Process

```typescript
async function uploadNFTAssets(
  imageBuffer: Buffer, 
  metadata: NFTMetadata,
  designId: string
): Promise<{ imageUrl: string; metadataUrl: string }> {
  try {
    // Upload image first
    const imageResult = await uploadImageToIPFS(imageBuffer, `${designId}-image.png`);
    
    // Update metadata with image URL
    const updatedMetadata = {
      ...metadata,
      image: imageResult.ipfsUrl
    };
    
    // Upload metadata
    const metadataUrl = await uploadMetadataToIPFS(updatedMetadata, `${designId}-metadata.json`);
    
    return {
      imageUrl: imageResult.ipfsUrl,
      metadataUrl: metadataUrl
    };
  } catch (error) {
    console.error('Asset upload failed:', error);
    throw error;
  }
}

// Batch upload for multiple NFTs with folder organization
async function uploadBatchNFTAssets(
  nftAssets: Array<{ imageBuffer: Buffer; metadata: NFTMetadata; tokenId: string }>
): Promise<{ folderHash: string; imageUrls: string[] }> {
  try {
    const imageUrls: string[] = [];
    const metadataFiles: { [tokenId: string]: NFTMetadata } = {};
    
    // Upload all images first
    for (const asset of nftAssets) {
      const imageResult = await uploadImageToIPFS(asset.imageBuffer, `${asset.tokenId}-image.png`);
      imageUrls.push(imageResult.ipfsUrl);
      
      // Update metadata with image URL
      const updatedMetadata = {
        ...asset.metadata,
        image: imageResult.ipfsUrl
      };
      
      metadataFiles[asset.tokenId] = updatedMetadata;
    }
    
    // Upload metadata folder
    const folderResult = await uploadMetadataFolder(metadataFiles);
    
    return {
      folderHash: folderResult.folderHash,
      imageUrls: imageUrls
    };
  } catch (error) {
    console.error('Batch asset upload failed:', error);
    throw error;
  }
}
```
<!-- 
### 6. Pinata V2 Features

Pinata V2 introduces several new features that enhance NFT storage and management:

```typescript
// Private IPFS Storage (V2 Feature)
const privateUploadResult = await pinata.upload.file({
  file: imageBuffer,
  options: {
    pinataMetadata: {
      name: fileName,
      keyvalues: {
        type: "nft-image",
        collection: "astra-collectibles",
        visibility: "private" // V2 feature for private storage
      }
    },
    pinataOptions: {
      cidVersion: 1
    }
  }
});

// Dedicated Gateway (V2 Feature)
const customGatewayUrl = `https://${process.env.PINATA_DEDICATED_GATEWAY}/ipfs/${uploadResult.IpfsHash}`;

// Image Optimization (V2 Feature)
const optimizedImageUrl = `https://${process.env.PINATA_GATEWAY}/ipfs/${uploadResult.IpfsHash}?img-width=512&img-quality=80`;
``` -->

### 7. Example Metadata Structure for Collectibles
**Read this [article](https://medium.com/scrappy-squirrels/tutorial-nft-metadata-ipfs-and-pinata-9ab1948669a3) for clarification**

```typescript
const metadata: NFTMetadata = {
  name: "Astra Collectible #", // Leave this as it is, the AstraNFTCollectible will append the token ID to the name after minting (e.g "Astra Collectible #0" for the first NFT)
  description: "A unique fashion design collectible created with AI",
  image: "ipfs://QmYourImageHash", // Will be set after image upload
  attributes: [
    {
      trait_type: "Design ID",
      value: "DESIGN_001"
    },
    {
      trait_type: "Fabric Type",
      value: "Cotton"
    },
    {
      trait_type: "Design Name",
      value: "Summer Collection"
    },
    {
      trait_type: "Prompt",
      value: "A beautiful summer dress with floral patterns"
    },
    {
      trait_type: "Rarity",
      value: "Common"
    },
    {
      trait_type: "Collection",
      value: "Astra Fashion"
    }
  ],
  external_url: "https://astra.com/collectibles/001",
  background_color: "FFFFFF",
  animation_url: "ipfs://QmAnimationHash" // Optional: for animated NFTs
};
```

## Hedera Testnet Setup

### 1. Environment Configuration

```typescript
// .env file
HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api
HEDERA_PRIVATE_KEY=your_private_key_here
HEDERA_ACCOUNT_ID=your_hedera_account_id
HEDERA_USDC_TOKEN_ID=0.0.429274
ASTRA_NFT_COLLECTIBLE_CONTRACT_ADDRESS=0xF55b52C237a946eDaE2988B561004FfCb880EC39
ASTRA_TREASURY_ADDRESS=0x...
HEDERA_TOKEN_SERVICE_ADDRESS=0x0000000000000000000000000000000000000167
HEDERA_USDC_TOKEN_ADDRESS=0x0000000000000000000000000000000000068cda
PINATA_JWT_TOKEN=your_pinata_jwt_token
PINATA_GATEWAY_URL=gateway.pinata.cloud
PINATA_DEDICATED_GATEWAY=your_dedicated_gateway_subdomain
```

### 2. Hedera Client Setup
```bash
npm install @hashgraph/sdk ethers
```

```typescript
import { Client, PrivateKey, AccountId } from "@hashgraph/sdk";
import { ethers } from "ethers";

// Hedera SDK Client
const client = Client.forTestnet();
client.setOperator(
  AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
  PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!)
);

// Ethers provider for contract interaction
const provider = new ethers.JsonRpcProvider(process.env.HEDERA_TESTNET_RPC_URL);
const wallet = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY!, provider);
```

### 3. USDC Token Association

```typescript
async function associateUSDC(accountId: string): Promise<boolean> {
  try {
    const associateTx = new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds([process.env.HEDERA_USDC_TOKEN_ID!])
      .freezeWith(client);

    const signTx = await associateTx.sign(PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!));
    const submitTx = await signTx.execute(client);
    const receipt = await submitTx.getReceipt(client);
    
    return receipt.status === Status.Success;
  } catch (error) {
    console.error('USDC association failed:', error);
    return false;
  }
}
```

## AstraNFT Collectible Contract Integration

### 1. Contract Interface

```typescript
interface AstraNFTCollectibleContract {
  mintNFTs(
    to: string,
    designId: string,
    designName: string,
    fabricType: string,
    designImage: string,
    prompt: string,
    count: number
  ): Promise<ethers.ContractTransactionResponse>;

  getBaseMintFee(): Promise<bigint>;
  getOwner(tokenId: bigint): Promise<string>;
  getDesignId(tokenId: bigint): Promise<string>;
  getDesignName(tokenId: bigint): Promise<string>;
  getFabricType(tokenId: bigint): Promise<string>;
  getDesignImage(tokenId: bigint): Promise<string>;
  getPrompt(tokenId: bigint): Promise<string>;
  tokensOfOwner(owner: string): Promise<bigint[]>;
  totalSupply(): Promise<bigint>;
  MAX_SUPPLY(): Promise<bigint>;
  MAX_PER_MINT(): Promise<bigint>;
}
```

### 2. Contract Initialization

```typescript
import { ethers } from "ethers";

const astraNFTCollectibleContract = new ethers.Contract(
  process.env.ASTRA_NFT_COLLECTIBLE_CONTRACT_ADDRESS!,
  [
    "function mintNFTs(address to, string memory designId, string memory designName, string memory fabricType, string memory designImage, string memory prompt, uint256 count) external",
    "function getBaseMintFee() external view returns (uint256)",
    "function getOwner(uint256 tokenId) external view returns (address)",
    "function getDesignId(uint256 tokenId) external view returns (string)",
    "function getDesignName(uint256 tokenId) external view returns (string)",
    "function getFabricType(uint256 tokenId) external view returns (string)",
    "function getDesignImage(uint256 tokenId) external view returns (string)",
    "function getPrompt(uint256 tokenId) external view returns (string)",
    "function getPreviousOwners(uint256 tokenId) external view returns (address[])",
    "function getUsersOfDesign(uint256 tokenId) external view returns (address[])",
    "function isDesignIdUsed(string memory designId) external view returns (bool)",
    "function addUserOfDesign(uint256 tokenId, address user) external",
    "function updateDesignName(uint256 tokenId, string memory newDesignName) external",
    "function updateFabricType(uint256 tokenId, string memory newFabricType) external",
    "function updatePrompt(uint256 tokenId, string memory newPrompt) external",
    "function updateDesignImage(uint256 tokenId, string memory newDesignImage) external",
    "function transferNFT(address to, uint256 tokenId) external",
    "function safeMint(address to) external returns (uint256)",
    "function tokensOfOwner(address owner) external view returns (uint256[])",
    "function tokenURI(uint256 tokenId) external view returns (string)",
    "function setBaseURI(string memory _baseTokenURI) external",
    "function ownerOf(uint256 tokenId) external view returns (address)",
    "function balanceOf(address owner) external view returns (uint256)",
    "function totalSupply() external view returns (uint256)",
    "function MAX_SUPPLY() external view returns (uint256)",
    "function MAX_PER_MINT() external view returns (uint256)",
    "function getApproved(uint256 tokenId) external view returns (address)",
    "function isApprovedForAll(address owner, address operator) external view returns (bool)",
    "function approve(address to, uint256 tokenId) external",
    "function setApprovalForAll(address operator, bool approved) external",
    "function transferFrom(address from, address to, uint256 tokenId) external",
    "function safeTransferFrom(address from, address to, uint256 tokenId) external",
    "function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) external"
  ],
  wallet
);
```

### 3. Base Token URI Management

The `AstraNFTCollectible.sol` contract uses a `baseTokenURI` to construct the full token URI for each NFT. This should be set to the IPFS folder hash containing all metadata files.

```typescript
// Set the base token URI to the metadata folder
async function setContractBaseTokenURI(folderHash: string): Promise<void> {
  try {
    const baseTokenURI = `ipfs://${folderHash}/`;
    
    // Only the contract owner can call setBaseURI
    const tx = await astraNFTCollectibleContract.setBaseURI(baseTokenURI);
    await tx.wait();
    
    console.log(`Base token URI set to: ${baseTokenURI}`);
    console.log(`Token URIs will be: ${baseTokenURI}0.json, ${baseTokenURI}1.json, etc.`);
  } catch (error) {
    console.error('Failed to set base token URI:', error);
    throw new Error('Failed to set base token URI');
  }
}

// Verify token URI construction
async function verifyTokenURI(tokenId: number): Promise<string> {
  try {
    const tokenURI = await astraNFTCollectibleContract.tokenURI(tokenId);
    console.log(`Token ${tokenId} URI: ${tokenURI}`);
    return tokenURI;
  } catch (error) {
    console.error('Failed to get token URI:', error);
    throw new Error('Failed to get token URI');
  }
}
```

### 4. Batch Minting Process

```typescript
async function mintAstraNFTCollectibles(
  recipientAddress: string,
  designId: string,
  designName: string,
  fabricType: string,
  designImage: string,
  prompt: string,
  count: number
): Promise<{ success: boolean; tokenIds?: bigint[]; txHash?: string; error?: string }> {
  try {
    // 1. Check if design ID is already used
    const isDesignIdUsed = await astraNFTCollectibleContract.isDesignIdUsed(designId);
    if (isDesignIdUsed) {
      return { success: false, error: "Design ID already exists" };
    }

    // 2. Check supply limits
    const maxSupply = await astraNFTCollectibleContract.MAX_SUPPLY();
    const maxPerMint = await astraNFTCollectibleContract.MAX_PER_MINT();
    const totalSupply = await astraNFTCollectibleContract.totalSupply();
    
    if (totalSupply + BigInt(count) > maxSupply) {
      return { success: false, error: `Exceeds max supply. Available: ${maxSupply - totalSupply}` };
    }
    
    if (count > Number(maxPerMint)) {
      return { success: false, error: `Exceeds max per mint. Max: ${maxPerMint}` };
    }

    // 3. Get total fee required
    const baseMintFee = await astraNFTCollectibleContract.getBaseMintFee();
    const totalFee = baseMintFee * BigInt(count);
    console.log(`Total fee required: ${ethers.formatUnits(totalFee, 6)} USDC for ${count} NFTs`);

    // 4. Approve USDC spending
    await approveUSDC(astraNFTCollectibleContract.target, totalFee);

    // 5. Mint the NFTs
    const mintTx = await astraNFTCollectibleContract.mintNFTs(
      recipientAddress,
      designId,
      designName,
      fabricType,
      designImage,
      prompt,
      count
    );

    const receipt = await mintTx.wait();
    
    if (receipt.status === 1) {
      // Extract token IDs from events
      const tokenIds = extractTokenIdsFromEvents(receipt, count);
      return { 
        success: true, 
        tokenIds, 
        txHash: receipt.hash 
      };
    } else {
      return { success: false, error: "Transaction failed" };
    }

  } catch (error) {
    console.error('Batch minting failed:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to extract token IDs from mint events
function extractTokenIdsFromEvents(receipt: any, expectedCount: number): bigint[] {
  const tokenIds: bigint[] = [];
  
  for (const log of receipt.logs) {
    try {
      const parsed = astraNFTCollectibleContract.interface.parseLog(log);
      if (parsed && parsed.name === 'NFTMinted') {
        tokenIds.push(parsed.args.tokenId);
      }
    } catch (e) {
      // Skip logs that can't be parsed
    }
  }
  
  return tokenIds.slice(0, expectedCount);
}
```

### 5. USDC Token Operations via Hedera Token Service

```typescript
// Hedera Token Service Contract ABI (simplified)
const hederaTokenServiceABI = [
  "function approve(address token,address spender,uint256 amount) external returns (int64 responseCode)"
];

const hederaTokenServiceContract = new ethers.Contract(
  process.env.HEDERA_TOKEN_SERVICE_ADDRESS!,
  hederaTokenServiceABI,
  wallet
);

async function approveUSDC(spender: string, amount: bigint): Promise<void> {
  const tx = await hederaTokenServiceContract.approve(process.env.HEDERA_USDC_TOKEN_ADDRESS!, spender, amount);
  await tx.wait();
}
```

## Complete Workflow Example

Here's a complete example showing how to upload NFT assets with proper folder organization and set the base token URI:

```typescript
async function completeNFTWorkflow() {
  try {
    // 1. Prepare NFT assets
    const nftAssets = [
      {
        tokenId: "0",
        imageBuffer: Buffer.from("image1_data"),
        metadata: {
          name: "Astra Collectible #",
          description: "First collectible",
          image: "", // Will be set after upload
          attributes: [
            { trait_type: "Design ID", value: "DESIGN_001" },
            { trait_type: "Fabric Type", value: "Cotton" }
          ]
        }
      },
      {
        tokenId: "1", 
        imageBuffer: Buffer.from("image2_data"),
        metadata: {
          name: "Astra Collectible #",
          description: "Second collectible",
          image: "", // Will be set after upload
          attributes: [
            { trait_type: "Design ID", value: "DESIGN_002" },
            { trait_type: "Fabric Type", value: "Silk" }
          ]
        }
      }
    ];

    // 2. Upload all assets and create metadata folder
    const uploadResult = await uploadBatchNFTAssets(nftAssets);
    
    console.log(`Metadata folder hash: ${uploadResult.folderHash}`);
    console.log(`Image URLs: ${uploadResult.imageUrls.join(', ')}`);

    // 3. Set the base token URI in the contract
    await setContractBaseTokenURI(uploadResult.folderHash);

    // 4. Mint the NFTs
    const mintResult = await mintAstraNFTCollectibles(
      "0xRecipientAddress",
      "DESIGN_001", 
      "Summer Collection",
      "Cotton",
      uploadResult.imageUrls[0],
      "A beautiful summer dress",
      2
    );

    if (mintResult.success) {
      console.log(`Minted NFTs with token IDs: ${mintResult.tokenIds}`);
      
      // 5. Verify token URIs
      for (const tokenId of mintResult.tokenIds) {
        const tokenURI = await verifyTokenURI(Number(tokenId));
        console.log(`Token ${tokenId} URI: ${tokenURI}`);
      }
    }

  } catch (error) {
    console.error('Workflow failed:', error);
  }
}
```

## Code Examples

### Complete Backend Service

```typescript
import { ethers } from "ethers";
import { PinataSDK } from "pinata";

class AstraNFTCollectibleService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private astraNFTCollectibleContract: ethers.Contract;
  private hederaTokenServiceContract: ethers.Contract;
  private pinata: PinataSDK;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.HEDERA_TESTNET_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY!, this.provider);
    
    // Initialize contracts
    this.astraNFTCollectibleContract = new ethers.Contract(
      process.env.ASTRA_NFT_COLLECTIBLE_CONTRACT_ADDRESS!,
      [/* ABI as shown above */],
      this.wallet
    );
    
    this.hederaTokenServiceContract = new ethers.Contract(
      process.env.HEDERA_TOKEN_SERVICE_ADDRESS!,
      ["function approve(address token,address spender,uint256 amount) external returns (int64 responseCode)"],
      this.wallet
    );
    
    // Initialize Pinata V2
    this.pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT_TOKEN!,
      pinataGateway: process.env.PINATA_GATEWAY_URL || "gateway.pinata.cloud"
    });
  }

  async createCollectibleNFTs(nftData: {
    recipientAddress: string;
    designId: string;
    designName: string;
    fabricType: string;
    prompt: string;
    imageFile: Buffer;
    count: number;
  }): Promise<{ success: boolean; tokenIds?: bigint[]; imageUrl?: string; metadataUrl?: string; error?: string }> {
    try {
      // 1. Upload image to IPFS
      const imageResult = await this.uploadImageToIPFS(nftData.imageFile, `${nftData.designId}-image.png`);

      // 2. Create metadata
      const metadata = {
        name: `${nftData.designName} #${nftData.designId}`,
        description: `AI-generated fashion design collectible: ${nftData.designName}`,
        image: imageResult.ipfsUrl,
        attributes: [
          { trait_type: "Design ID", value: nftData.designId },
          { trait_type: "Fabric Type", value: nftData.fabricType },
          { trait_type: "Design Name", value: nftData.designName },
          { trait_type: "Prompt", value: nftData.prompt },
          { trait_type: "Collection", value: "Astra Fashion" },
          { trait_type: "Rarity", value: this.calculateRarity(nftData.count) }
        ],
        external_url: `https://astra.com/collectibles/${nftData.designId}`,
        background_color: "FFFFFF"
      };

      // 3. Upload metadata to IPFS
      const metadataUrl = await this.uploadMetadataToIPFS(metadata, `${nftData.designId}-metadata.json`);

      // 4. Mint NFTs
      const result = await this.mintAstraNFTCollectibles(
        nftData.recipientAddress,
        nftData.designId,
        nftData.designName,
        nftData.fabricType,
        imageResult.ipfsUrl,
        nftData.prompt,
        nftData.count
      );

      return {
        success: result.success,
        tokenIds: result.tokenIds,
        imageUrl: imageResult.ipfsUrl,
        metadataUrl,
        error: result.error
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async uploadImageToIPFS(imageBuffer: Buffer, fileName: string): Promise<{ ipfsHash: string; ipfsUrl: string }> {
    const file = new File([imageBuffer], fileName, { type: "image/png" });
    const uploadResult = await this.pinata.upload.public.file(file);

    return {
      ipfsHash: uploadResult.cid,
      ipfsUrl: `ipfs://${uploadResult.cid}`
    };
  }

  private async uploadMetadataToIPFS(metadata: any, fileName: string): Promise<string> {
    const uploadResult = await this.pinata.upload.public.json(metadata);
    return `ipfs://${uploadResult.cid}`;
  }

  private async mintAstraNFTCollectibles(
    recipientAddress: string,
    designId: string,
    designName: string,
    fabricType: string,
    designImage: string,
    prompt: string,
    count: number
  ): Promise<{ success: boolean; tokenIds?: bigint[]; error?: string }> {
    try {
      // Check if design ID is already used
      const isDesignIdUsed = await this.astraNFTCollectibleContract.isDesignIdUsed(designId);
      if (isDesignIdUsed) {
        return { success: false, error: "Design ID already exists" };
      }

      // Get total fee required
      const baseMintFee = await this.astraNFTCollectibleContract.getBaseMintFee();
      const totalFee = baseMintFee * BigInt(count);

      // Approve USDC spending
      await this.approveUSDC(this.astraNFTCollectibleContract.target, totalFee);

      // Mint the NFTs
      const mintTx = await this.astraNFTCollectibleContract.mintNFTs(
        recipientAddress,
        designId,
        designName,
        fabricType,
        designImage,
        prompt,
        count
      );

      const receipt = await mintTx.wait();
      
      if (receipt.status === 1) {
        const tokenIds = this.extractTokenIdsFromEvents(receipt, count);
        return { 
          success: true, 
          tokenIds
        };
      } else {
        return { success: false, error: "Transaction failed" };
      }

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async approveUSDC(spender: string, amount: bigint): Promise<void> {
    const tx = await this.hederaTokenServiceContract.approve(
      process.env.HEDERA_USDC_TOKEN_ADDRESS!, 
      spender, 
      amount
    );
    await tx.wait();
  }

  private extractTokenIdsFromEvents(receipt: any, expectedCount: number): bigint[] {
    const tokenIds: bigint[] = [];
    
    for (const log of receipt.logs) {
      try {
        const parsed = this.astraNFTCollectibleContract.interface.parseLog(log);
        if (parsed && parsed.name === 'NFTMinted') {
          tokenIds.push(parsed.args.tokenId);
        }
      } catch (e) {
        // Skip logs that can't be parsed
      }
    }
    
    return tokenIds.slice(0, expectedCount);
  }

  private calculateRarity(count: number): string {
    if (count === 1) return "Legendary";
    if (count <= 5) return "Epic";
    if (count <= 10) return "Rare";
    if (count <= 25) return "Uncommon";
    return "Common";
  }
}
```

## Troubleshooting

### Common Issues

1. **"Design ID already in use"**
   - Solution: Generate unique design IDs
   - Use UUID or timestamp-based IDs

2. **"Not enough NFTs left!"**
   - Solution: Check MAX_SUPPLY limit (100 NFTs)
   - Verify current totalSupply before minting

3. **"Cannot mint specified number of NFTs"**
   - Solution: Check MAX_PER_MINT limit (10 NFTs per transaction)
   - Reduce count or split into multiple transactions

4. **"Insufficient funds for minting"**
   - Solution: Ensure wallet has enough USDC for batch minting
   - Calculate: baseMintFee × count
   - Check USDC token association

5. **"Payment failed"**
   - Solution: Verify USDC approval for total amount
   - Check gas fees and network status

6. **IPFS Upload Failures**
   - Solution: Verify Pinata V2 API credentials
   - Check file size limits (Pinata V2: 1GB per file)
   - Ensure stable internet connection
   - Verify JWT token is valid and not expired
   - Check if using correct Pinata V2 endpoints

7. **"Not approved or owner"**
   - Check and confirm wallet address has the right permissions

### Best Practices

1. **Image Optimization**
   - Compress images before upload (recommended: 512x512px, <1MB)
   - Use WebP format for better compression
   - Include multiple image sizes for different use cases
   - Leverage Pinata V2's built-in image optimization features
   - Use dedicated gateways for faster content delivery

2. **Metadata Standards**
   - Follow OpenSea metadata standards
   - Include proper trait types and values
   - Use consistent naming conventions

3. **Batch Minting Strategy**
   - Start with small batches (1-5 NFTs) for testing
   - Monitor gas costs for larger batches
   - Consider minting during low-traffic periods

4. **Error Handling**
   - Implement retry logic for failed uploads
   - Log all transactions for debugging
   - Use proper error messages for users
   - Handle Pinata V2 specific error responses
   - Implement fallback strategies for upload failures

5. **Pinata V2 Specific Best Practices**
   - Use private IPFS storage for sensitive content
   - Set up dedicated gateways for production environments
   - Leverage CDN integration for global content delivery
   - Implement proper access control for private content
   - Use image optimization parameters for better performance