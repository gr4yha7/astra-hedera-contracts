import { EventLog} from "ethers";
import { ethers } from "hardhat";
// import { AstraNFT } from "../typechain-types";

// type HardhatEthersSigner = Signer & {
//   address: string;
// };

const MINT_RECIPIENT = "0xd06e922AACEe8d326102C3643f40507265f51369";

async function main() {
  const [deployer] = await ethers.getSigners();

  // const AstraNFT = await ethers.getContractFactory("AstraNFT", deployer);
  const astraNFTProxyAddress = "0x1e1b90b8fb7AFABc07dbFD4D6e1cBd6e0271EB5b";
  const astraNFTProxy = await ethers.getContractAt("AstraNFT", astraNFTProxyAddress);

  const htsAddress = "0x0000000000000000000000000000000000000167";
  const usdcTokenAddress = "0x0000000000000000000000000000000000068cda";
  const hts = await ethers.getContractAt("IHederaTokenService", htsAddress);
  const amount = ethers.parseUnits("1.1", 6);
  console.log("amount: ", amount.toString());

  // Associate USDC token to astraNFTProxy contract
  // console.log("Associating USDC token to astraNFTProxy contract...");
  // const associateTx = await astraNFTProxy.associateUsdcToken();
  // const associateReceipt = await associateTx.wait();
  // console.log("associate status: ", associateReceipt?.status === 1 ? "success" : "failed");


  // Approve the contract to spend the tokens
  console.log("Approving USDC tokens for AstraNFT contract...");
  const approveTx = await hts.approve(usdcTokenAddress, astraNFTProxyAddress, amount);
  const approveReceipt = await approveTx.wait();
  console.log("approve status: ", approveReceipt?.status === 1 ? "success" : "failed");

  const DESIGN_ID = `DESIGN_${Date.now()}`;
  const DESIGN_NAME = "Cotton on Fleek";
  const FABRIC_TYPE = "Cotton";
  const DESIGN_IMAGE = "ipfs://QmYjazF3u7Kz3fDnSrwGk6TFVJ95yg11LgiZMJqWwP911u";
  const PROMPT = "A beautiful cotton fabric with a unique design";
  const METADATA_URI = "ipfs://QmYjazF3u7Kz3fDnSrwGk6TFVJ95yg11LgiZMJqWwP911u";

  // Mint NFT
  const mintTx = await astraNFTProxy.mintNFT(
    MINT_RECIPIENT, DESIGN_ID, DESIGN_NAME, FABRIC_TYPE, DESIGN_IMAGE, PROMPT, METADATA_URI);
  const mintReceipt = await mintTx.wait();
  console.log("mint status: ", mintReceipt?.status === 1 ? "success" : "failed");
  // console.log("mintReceipt: ", mintReceipt);
  // Find the NFTMinted event in the logs
  const nftMintedEvent = mintReceipt?.logs.find(log => {
    try {
      const parsed = astraNFTProxy.interface.parseLog(log);
      return parsed?.name === 'NFTMinted';
    } catch {
      return false;
    }
  });
  
  if (nftMintedEvent) {
    const parsed = astraNFTProxy.interface.parseLog(nftMintedEvent);
    const tokenId = parsed?.args.tokenId;
    console.log("NFT minted with ID:", tokenId);
    console.log("\n=== FETCHING NFT DETAILS ===");
    try {
      const promise = Promise.all([
        astraNFTProxy.getOwner(tokenId),
        astraNFTProxy.tokenURI(tokenId),
        astraNFTProxy.getDesignId(tokenId),
        astraNFTProxy.getDesignName(tokenId),
        astraNFTProxy.getFabricType(tokenId),
        astraNFTProxy.getDesignImage(tokenId),
        astraNFTProxy.getPrompt(tokenId),
      ]);
      const [owner, designId, designName, fabricType, designImage, prompt, uri] = await promise;
      console.log("NFT details:", {
        owner: owner,
        designId: designId,
        uri: uri,
        designName: designName,
        fabricType: fabricType,
        designImage: designImage,
        prompt: prompt,
      });
    } catch (error) {
      console.log("Error getting nft details:", error);
    }
  } else {
    console.log("NFTMinted event not found in logs");
  }
}

main().catch(console.error);