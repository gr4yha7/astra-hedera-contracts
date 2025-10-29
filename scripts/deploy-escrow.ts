import { ethers } from "hardhat";

const USDC_TOKEN_EVM_ADDRESS = "0x0000000000000000000000000000000000068cda";
const HEDERA_TOKEN_SERVICE_ADDRESS = "0x0000000000000000000000000000000000000167";
const ASTRA_NFT_COLLECTIBLE_CONTRACT_ADDRESS = process.env.ASTRA_NFT_COLLECTIBLE_CONTRACT_ADDRESS;

async function main() {
  if (!ASTRA_NFT_COLLECTIBLE_CONTRACT_ADDRESS) {
    throw new Error("Missing required environment variables [ASTRA_NFT_COLLECTIBLE_CONTRACT_ADDRESS]");
  }
  // Get the signer of the tx and address for minting the token
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with the account:", deployer.address);

  // The deployer will also be the owner of our NFT contract
  const Escrow = await ethers.getContractFactory("Escrow", deployer);
  const escrow = await Escrow.deploy(
    deployer.address,
    HEDERA_TOKEN_SERVICE_ADDRESS,
    USDC_TOKEN_EVM_ADDRESS,
    ASTRA_NFT_COLLECTIBLE_CONTRACT_ADDRESS
  );

  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("Escrow deployed at:", escrowAddress);
}

main().catch(console.error);