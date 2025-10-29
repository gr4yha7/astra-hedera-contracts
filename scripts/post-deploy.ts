import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  const escrowAddress = process.env.ESCROW_CONTRACT_ADDRESS;
  const astraNFTCollectibleProxyAddress = process.env.ASTRA_NFT_COLLECTIBLE_CONTRACT_ADDRESS;
  const htsAddress = process.env.HEDERA_TOKEN_SERVICE_ADDRESS;
  if (!escrowAddress || !astraNFTCollectibleProxyAddress || !htsAddress) {
    throw new Error("Missing required environment variables");
  }

  const astraNFTCollectibleProxy = await ethers.getContractAt("AstraNFTCollectible", astraNFTCollectibleProxyAddress);
  const escrowContract = await ethers.getContractAt("Escrow", escrowAddress);

  // Update the Escrow contract address in the AstraNFTCollectible contract
  console.log("Updating the Escrow contract address in the AstraNFTCollectible contract...");
  const updateEscrowAddressTx = await astraNFTCollectibleProxy.updateEscrowAddress(escrowAddress);
  const updateEscrowAddressReceipt = await updateEscrowAddressTx.wait();
  console.log("update escrow address status: ", updateEscrowAddressReceipt?.status === 1 ? "success" : "failed");

  // Associate USDC token to astraNFTProxy contract
  console.log("Associating USDC token to astraNFTProxy contract...");
  const associateTx = await astraNFTCollectibleProxy.associateUsdcToken();
  const associateReceipt = await associateTx.wait();
  console.log("associate status: ", associateReceipt?.status === 1 ? "success" : "failed");

  // Associate USDC token to escrow contract
  console.log("Associating USDC token to escrow contract...");
  const associateTx1 = await escrowContract.associateUsdcTokenToContract();
  const associate1Receipt = await associateTx1.wait();
  console.log("associate status: ", associate1Receipt?.status === 1 ? "success" : "failed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });