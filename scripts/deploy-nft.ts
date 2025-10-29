import { ethers, upgrades } from "hardhat";

const HEDERA_TOKEN_SERVICE_ADDRESS = "0x0000000000000000000000000000000000000167";
const USDC_TOKEN_EVM_ADDRESS = "0x0000000000000000000000000000000000068cda";
// const TREASURY_ADDRESS = "0x3Db2f85e7A204aB666229E637A2B9eA92e566F49";
// const ESCROW_ADDRESS = "0x";
const BASE_COLLECTION_FEE = ethers.parseUnits("1", 6);
const ADDITIONAL_PIECE_FEE = ethers.parseUnits("0.1", 6);

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying AstraNFT with the account:", deployer.address);

  // Deploy AstraNFT (using OpenZeppelin Upgrades plugin)
  const AstraNFT = await ethers.getContractFactory("AstraNFT");
  
  console.log("Deploying AstraNFT proxy...");
  const astraNFT = await upgrades.deployProxy(AstraNFT, [
    deployer.address,
    HEDERA_TOKEN_SERVICE_ADDRESS,
    USDC_TOKEN_EVM_ADDRESS,
    deployer.address,
    BASE_COLLECTION_FEE,
    ADDITIONAL_PIECE_FEE
  ], {
    initializer: "initialize",
    kind: "uups"
  });
  
  // Wait for deployment
  await astraNFT.waitForDeployment();
  
  const astraNFTAddress = await astraNFT.getAddress();
  console.log("AstraNFT proxy deployed to:", astraNFTAddress);
  
  // Get the implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(astraNFTAddress);
  console.log("AstraNFT implementation deployed to:", implementationAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });