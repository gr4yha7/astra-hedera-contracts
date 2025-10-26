# Astra Hedera Escrow & NFT System

A comprehensive blockchain solution built on Hedera Hashgraph that combines escrow functionality with NFT collectibles for the fashion industry. This system enables milestone-based payments for custom fashion work and minting of AI-generated fashion design NFTs.

## Architecture Overview

The system consists of three main smart contracts:

- **Escrow Contract**: Handles milestone-based payments between shoppers, makers, and creators
- **AstraNFT Contract**: Individual NFT minting with custom metadata
- **AstraNFTCollectible Contract**: Batch NFT minting for collectible series

## Features

### Escrow System
- **Milestone-based Payments**: 3-stage payment system (Shopper Details → Outfit Made → Outfit Delivered)
- **Multi-party Support**: Shoppers, Makers, Creators, Treasury, and Agents
- **USDC Integration**: Built-in Hedera Token Service integration for USDC payments
- **Automatic Distribution**: Smart contract automatically distributes payments based on predefined percentages
- **Security**: ReentrancyGuard and Ownable patterns for secure operations

### NFT System
- **Upgradeable Contracts**: UUPS upgradeable pattern for future improvements
- **Batch Minting**: Support for minting multiple NFTs in a single transaction
- **Rich Metadata**: Custom metadata structure for fashion designs
- **Ownership Tracking**: Track previous owners and design users
- **IPFS Integration**: Metadata stored on IPFS with configurable base URI

## Quick Start

### Prerequisites

- Node.js 18+
- Access to Hedera testnet
- Testnet USDC tokens from [Circle Faucet](https://faucet.circle.com/)
- Testnet HBAR from [Hedera Testnet Faucet](https://portal.hedera.com/faucet)
- Private key with sufficient testnet HBAR for gas fees

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd hedera-escrow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Hedera Configuration
HEDERA_RPC_URL=https://testnet.hashio.io/api
HEDERA_OPERATOR_PRIVATE_KEY=your_private_key_here
HEDERA_ACCOUNT_ID=your_hedera_account_id

# Token Configuration
HEDERA_USDC_TOKEN_ID=0.0.429274
HEDERA_USDC_TOKEN_ADDRESS=0x0000000000000000000000000000000000068cda
HEDERA_TOKEN_SERVICE_ADDRESS=0x0000000000000000000000000000000000000167

# Contract Addresses (set after deployment)
ASTRA_NFT_COLLECTIBLE_CONTRACT_ADDRESS=0xF55b52C237a946eDaE2988B561004FfCb880EC39
ASTRA_TREASURY_ADDRESS=your_treasury_address
```

## Available Scripts

### Compilation & Testing
```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Clean artifacts
npm run clean
```

### Deployment
```bash
# Deploy Escrow contract
npm run deploy:escrow

# Deploy AstraNFT contract
npm run deploy:nft

# Deploy AstraNFTCollectible contract
npm run deploy:nft-collectible
```

### Interaction Scripts
```bash
# Run escrow operations
npm run run:escrow

# Run NFT minting
npm run run:nft

# Run collectible NFT minting
npm run run:nft-collectible
```

## Contract Details

### Escrow Contract

**Key Functions:**
- `depositFunds(address agent, uint256 amount)`: Deposit USDC for escrow
- `createEscrowByAgent(...)`: Create new escrow with milestone tracking
- `completeMilestoneByAgent(uint256 escrowId)`: Complete milestones and distribute payments
- `getEscrowDetails(uint256 escrowId)`: Retrieve escrow information

**Payment Distribution:**
- Treasury: 10%
- Maker: 65%
- Creator: 35%

### AstraNFTCollectible Contract

**Key Functions:**
- `mintNFTs(...)`: Batch mint NFTs with custom metadata
- `setBaseURI(string)`: Set IPFS base URI for metadata
- `transferNFT(address, uint256)`: Transfer with ownership tracking
- `updateDesignName/FabricType/Prompt/Image(...)`: Update NFT metadata

**Constants:**
- `MAX_SUPPLY`: 100 NFTs
- `MAX_PER_MINT`: 10 NFTs per transaction
- `MAX_PREVIOUS_OWNERS`: 100 previous owners tracked
- `MAX_USERS_PER_DESIGN`: 100 users per design

## Project Structure

```
hedera-escrow/
├── contracts/                 # Smart contracts
│   ├── Escrow.sol            # Main escrow contract
│   ├── AstraNFT.sol          # Individual NFT contract
│   ├── AstraNFTCollectible.sol # Batch NFT contract
│   └── IAstraNFT.sol         # NFT interface
├── scripts/                   # Deployment and interaction scripts
│   ├── deploy.ts             # Escrow deployment
│   ├── deploy-nft.ts         # NFT deployment
│   ├── deploy-nft-collectible.ts # Collectible deployment
│   ├── run-escrow.ts         # Escrow operations
│   ├── run-nft.ts            # NFT operations
│   └── run-nft-collectible.ts # Collectible operations
├── test/                      # Test files
├── docs/                      # Documentation
│   └── BACKEND_ENGINEER_GUIDE.md # Integration guide
├── artifacts/                 # Compiled contracts
├── cache/                     # Hardhat cache
└── typechain-types/           # TypeScript types
```

## Integration Guide

For detailed backend integration instructions, including IPFS/Pinata setup and NFT metadata management, see the [Backend Engineer Guide](docs/BACKEND_ENGINEER_GUIDE.md).

### Key Integration Points:

1. **IPFS/Pinata V2**: Upload NFT images and metadata
2. **Metadata Folder Structure**: Organize metadata files for base token URI
3. **Batch Operations**: Efficient batch minting and asset uploads
4. **USDC Payments**: Hedera Token Service integration

## Testing

```bash
# Run all tests
npm test

# Run tests with gas reporting
REPORT_GAS=true npm test

# Run specific test file
npx hardhat test test/Escrow.ts
```

## Important Notes

### Security Considerations
- Always test on Hedera testnet before mainnet deployment
- Ensure proper USDC token association before operations
- Verify contract addresses and configurations
- Use secure private key management

### Gas Optimization
- Contracts use Solidity 0.8.28 with optimizer enabled
- Batch operations reduce gas costs
- Efficient storage patterns implemented

### Upgradeability
- AstraNFTCollectible uses UUPS upgradeable pattern
- Only contract owner can perform upgrades
- Upgrade authorization is built into the contract

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Links

- [Hedera Documentation](https://docs.hedera.com/)
- [Hedera Token Service](https://docs.hedera.com/hedera/core-concepts/smart-contracts/hedera-token-service-hts)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)

## Support

For questions and support:
- Create an issue in the repository
- Check the documentation in the `docs/` folder
- Review the Backend Engineer Guide for integration help