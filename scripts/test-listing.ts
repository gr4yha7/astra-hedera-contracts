import { ethers } from "hardhat";

async function main() {
  console.log("=== Astra NFT Collectible Listing Test ===");

  // Get the contract addresses from environment
  const astraNFTCollectibleAddress = process.env.ASTRA_NFT_COLLECTIBLE_CONTRACT_ADDRESS;
  const usdcAddress = process.env.HEDERA_USDC_TOKEN_ADDRESS;
  const hederaTokenServiceAddress = process.env.HEDERA_TOKEN_SERVICE_ADDRESS;

  if (!astraNFTCollectibleAddress || !usdcAddress || !hederaTokenServiceAddress) {
    throw new Error("Missing required environment variables");
  }

  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // Connect to the AstraNFTCollectible contract
  const astraNFTCollectible = await ethers.getContractAt("AstraNFTCollectible", astraNFTCollectibleAddress);

  // Connect to Hedera Token Service for USDC operations
  const hederaTokenService = await ethers.getContractAt(
    "IHederaTokenService",
    hederaTokenServiceAddress
  );

  console.log("\n=== Testing NFT Listing Functionality ===");

  try {
    // 1. Check current balance
    const balance = await astraNFTCollectible.balanceOf(signer.address);
    console.log(`Current NFT balance: ${balance}`);

    if (balance === 0n) {
      console.log("No NFTs found. Please mint some NFTs first using run-nft-collectible.ts");
      return;
    }

    // 2. Get tokens owned by the signer
    const ownedTokens = await astraNFTCollectible.tokensOfOwner(signer.address);
    console.log(`Owned token IDs: ${ownedTokens}`);

    if (ownedTokens.length === 0) {
      console.log("No NFTs owned. Please mint some NFTs first.");
      return;
    }

    const tokenId = ownedTokens[0];
    console.log(`\nUsing token ID: ${tokenId}`);

    // 3. Check if NFT is already listed
    const isListed = await astraNFTCollectible.isNFTListed(tokenId);
    console.log(`Is NFT ${tokenId} currently listed? ${isListed}`);

    // if (isListed) {
    //   console.log("NFT is already listed. Unlisting first...");
    //   const unlistTx = await astraNFTCollectible.unlistNFT(tokenId);
    //   await unlistTx.wait();
    //   console.log("NFT unlisted successfully");
    // }

    // 4. List the NFT for sale
    const listingPrice = ethers.parseUnits("10", 6); // 10 USDC
    console.log(`\nListing NFT ${tokenId} for ${ethers.formatUnits(listingPrice, 6)} USDC...`);
    
    const listTx = await astraNFTCollectible.listNFT(tokenId, listingPrice);
    const listReceipt = await listTx.wait();
    console.log("NFT listed successfully!");
    console.log("Transaction hash:", listReceipt?.hash);

    // 5. Get listing details
    const listing = await astraNFTCollectible.getListing(tokenId);
    console.log("\nListing details:");
    console.log(`- Token ID: ${listing.tokenId}`);
    console.log(`- Seller: ${listing.seller}`);
    console.log(`- Price: ${ethers.formatUnits(listing.price, 6)} USDC`);
    console.log(`- Is Active: ${listing.isActive}`);
    console.log(`- Listing Time: ${new Date(Number(listing.listingTime) * 1000).toISOString()}`);

    // 6. Get all active listings
    const activeListings = await astraNFTCollectible.getActiveListings();
    console.log(`\nTotal active listings: ${activeListings.length}`);
    console.log("Active listing token IDs:", activeListings);

    // 7. Get seller's listings
    const sellerListings = await astraNFTCollectible.getSellerListings(signer.address);
    console.log(`\nSeller's listings: ${sellerListings.length}`);
    console.log("Seller's token IDs:", sellerListings);

    // 8. Test unlisting
    // console.log("\nUnlisting the NFT...");
    // const unlistTx2 = await astraNFTCollectible.unlistNFT(tokenId);
    // await unlistTx2.wait();
    // console.log("NFT unlisted successfully");

    // 9. Verify unlisting
    const isListedAfter = await astraNFTCollectible.isNFTListed(tokenId);
    console.log(`Is NFT ${tokenId} still listed? ${isListedAfter}`);

    const activeListingsAfter = await astraNFTCollectible.getActiveListings();
    console.log(`Active listings after unlisting: ${activeListingsAfter.length}`);

    console.log("\n=== Listing Test Completed Successfully ===");

  } catch (error: any) {
    console.error("Error during listing test:", error);
    
    // Try to decode the error if it's a revert
    if (error.data) {
      try {
        const decodedError = astraNFTCollectible.interface.parseError(error.data);
        console.error("Decoded error:", decodedError);
      } catch (decodeError) {
        console.error("Could not decode error:", error.data);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
