import { ethers, upgrades } from "hardhat";

const HEDERA_TOKEN_SERVICE_ADDRESS = "0x0000000000000000000000000000000000000167";
const USDC_TOKEN_EVM_ADDRESS = "0x0000000000000000000000000000000000068cda";
const BASE_MINT_FEE = ethers.parseUnits("0.1", 6);

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying AstraNFTCollectible contract with the account:", deployer.address);

  // Deploy AstraNFTCollectible (using OpenZeppelin Upgrades plugin)
  const AstraNFTCollectible = await ethers.getContractFactory("AstraNFTCollectible");
  
  console.log("Deploying AstraNFTCollectible proxy...");
  const astraNFTCollectible = await upgrades.deployProxy(AstraNFTCollectible, [
    deployer.address,
    HEDERA_TOKEN_SERVICE_ADDRESS,
    USDC_TOKEN_EVM_ADDRESS,
    deployer.address,
    BASE_MINT_FEE,
  ], {
    initializer: "initialize",
    kind: "uups"
  });
  
  // Wait for deployment
  await astraNFTCollectible.waitForDeployment();
  
  const astraNFTCollectibleAddress = await astraNFTCollectible.getAddress();
  console.log("AstraNFTCollectible proxy deployed to:", astraNFTCollectibleAddress);
  
  // Get the implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(astraNFTCollectibleAddress);
  console.log("AstraNFTCollectible implementation deployed to:", implementationAddress);

  return astraNFTCollectibleAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });