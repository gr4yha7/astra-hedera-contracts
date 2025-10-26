import { EventLog, Log } from "ethers";
import { ethers } from "hardhat";
// import { AstraNFT } from "../typechain-types";

// type HardhatEthersSigner = Signer & {
//   address: string;
// };

const MINT_RECIPIENT = "0xd06e922AACEe8d326102C3643f40507265f51369";
const COUNT = 5;

async function main() {
  const [deployer] = await ethers.getSigners();

  const astraNFTCollectibleProxyAddress = "0xF55b52C237a946eDaE2988B561004FfCb880EC39";
  const astraNFTCollectibleProxy = await ethers.getContractAt("AstraNFTCollectible", astraNFTCollectibleProxyAddress);

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
  // console.log("Approving USDC tokens for AstraNFTCollectible contract...");
  // const approveTx = await hts.approve(usdcTokenAddress, astraNFTCollectibleProxyAddress, amount);
  // const approveReceipt = await approveTx.wait();
  // console.log("approve status: ", approveReceipt?.status === 1 ? "success" : "failed");

  // const DESIGN_ID = `DESIGN_${Date.now()}`;
  // const DESIGN_NAME = "Cotton on Fleek";
  // const FABRIC_TYPE = "Cotton";
  // const DESIGN_IMAGE = "ipfs://QmYjazF3u7Kz3fDnSrwGk6TFVJ95yg11LgiZMJqWwP911u";
  // const PROMPT = "A beautiful cotton fabric with a unique design";
  // const METADATA_URI = "ipfs://QmYjazF3u7Kz3fDnSrwGk6TFVJ95yg11LgiZMJqWwP911u/";

  // // Set Base Token URI
  // const setBaseTokenUriTx = await astraNFTCollectibleProxy.setBaseURI(METADATA_URI);
  // const setBaseTokenUriReceipt = await setBaseTokenUriTx.wait();
  // console.log("set base token uri status: ", setBaseTokenUriReceipt?.status === 1 ? "success" : "failed");

  // // Mint NFT
  // const mintTx = await astraNFTCollectibleProxy.mintNFTs(
  //   MINT_RECIPIENT, DESIGN_ID, DESIGN_NAME, FABRIC_TYPE, DESIGN_IMAGE, PROMPT, COUNT);
  // const mintReceipt = await mintTx.wait();
  // console.log("mint status: ", mintReceipt?.status === 1 ? "success" : "failed");
  // // console.log("mintReceipt: ", mintReceipt);
  // // Find the NFTMinted event in the logs
  // const nftMintedEvent = mintReceipt?.logs.find((log: EventLog | Log) => {
  //   try {
  //     const parsed = astraNFTCollectibleProxy.interface.parseLog(log);
  //     return parsed?.name === 'NFTMinted';
  //   } catch {
  //     return false;
  //   }
  // });
  
  // if (nftMintedEvent) {
  //   const parsed = astraNFTCollectibleProxy.interface.parseLog(nftMintedEvent);
  //   const tokenId = parsed?.args.tokenId;
  //   console.log("NFT minted with ID:", tokenId);
  //   console.log("\n=== FETCHING NFT DETAILS ===");
  //   try {
  //     const promise = Promise.all([
  //       astraNFTCollectibleProxy.getOwner(tokenId),
  //       astraNFTCollectibleProxy.tokenURI(tokenId),
  //       astraNFTCollectibleProxy.getDesignId(tokenId),
  //       astraNFTCollectibleProxy.getDesignName(tokenId),
  //       astraNFTCollectibleProxy.getFabricType(tokenId),
  //       astraNFTCollectibleProxy.getDesignImage(tokenId),
  //       astraNFTCollectibleProxy.getPrompt(tokenId),
  //     ]);
  //     const [owner, designId, designName, fabricType, designImage, prompt, uri] = await promise;
  //     console.log("NFT details:", {
  //       owner: owner,
  //       designId: designId,
  //       uri: uri,
  //       designName: designName,
  //       fabricType: fabricType,
  //       designImage: designImage,
  //       prompt: prompt,
  //     });
  //   } catch (error) {
  //     console.log("Error getting nft details:", error);
  //   }
  // } else {
  //   console.log("NFTMinted event not found in logs");
  // }

  try {
    const tokenIds = await astraNFTCollectibleProxy.tokensOfOwner(MINT_RECIPIENT);
    console.log("tokenIds: ", tokenIds);
    for (const tokenId of tokenIds) {
      const promise = Promise.all([
        astraNFTCollectibleProxy.getOwner(tokenId),
        astraNFTCollectibleProxy.getDesignId(tokenId),
        astraNFTCollectibleProxy.getDesignName(tokenId),
        astraNFTCollectibleProxy.getFabricType(tokenId),
        astraNFTCollectibleProxy.getDesignImage(tokenId),
        astraNFTCollectibleProxy.getPrompt(tokenId),
        astraNFTCollectibleProxy.tokenURI(tokenId),
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
    }
  } catch (error) {
    console.log("Error getting nft details:", error);
  }
}

main().catch(console.error);