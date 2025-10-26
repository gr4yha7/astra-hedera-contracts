import { ethers } from "hardhat";

const USDC_TOKEN_EVM_ADDRESS = "0x0000000000000000000000000000000000068cda";
const HEDERA_TOKEN_SERVICE_ADDRESS = "0x0000000000000000000000000000000000000167";

async function main() {
  // Get the signer of the tx and address for minting the token
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with the account:", deployer.address);

  // The deployer will also be the owner of our NFT contract
  const Escrow = await ethers.getContractFactory("Escrow", deployer);
  const escrow = await Escrow.deploy(HEDERA_TOKEN_SERVICE_ADDRESS, USDC_TOKEN_EVM_ADDRESS);

  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("Escrow deployed at:", escrowAddress);
}

main().catch(console.error);