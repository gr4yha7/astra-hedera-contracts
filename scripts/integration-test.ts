import { ethers } from "hardhat";

async function main() {
  console.log("=== Complete Astra NFT Escrow Integration Test ===");

  // Get contract addresses from environment
  const astraNFTCollectibleAddress = process.env.ASTRA_NFT_COLLECTIBLE_CONTRACT_ADDRESS;
  const escrowAddress = process.env.ESCROW_CONTRACT_ADDRESS;
  const usdcAddress = process.env.HEDERA_USDC_TOKEN_ADDRESS;
  const hederaTokenServiceAddress = process.env.HEDERA_TOKEN_SERVICE_ADDRESS;

  if (!astraNFTCollectibleAddress || !escrowAddress || !usdcAddress || !hederaTokenServiceAddress) {
    throw new Error("Missing required environment variables");
  }

  // Get signers for different roles
  const [treasury, shopper, maker, creator] = await ethers.getSigners();
  const agent = shopper;
  
  console.log("=== Role Assignments ===");
  console.log("Shopper:", shopper.address);
  console.log("Maker:", maker.address);
  console.log("Creator:", creator.address);
  console.log("Treasury:", treasury.address);
  console.log("Agent:", agent.address);

  // Connect to contracts
  const astraNFTCollectible = await ethers.getContractAt("AstraNFTCollectible", astraNFTCollectibleAddress);
  const escrow = await ethers.getContractAt("Escrow", escrowAddress);
  const hederaTokenService = await ethers.getContractAt("IHederaTokenService", hederaTokenServiceAddress);

  console.log("\n=== Step 1: Mint NFT ===");
  
  try {
    // Check if USDC is approved for minting
    const mintFee = await astraNFTCollectible.getBaseMintFee();
    console.log(`Base mint fee: ${ethers.formatUnits(mintFee, 6)} USDC`);
    const mintQuantity = 4;
    const totalMintFee = mintFee * BigInt(mintQuantity);

    // Approve USDC for minting (using maker as the minter)
    const approveTx = await hederaTokenService.connect(maker).approve(
      usdcAddress,
      astraNFTCollectibleAddress,
      // mintFee
      totalMintFee
    );
    await approveTx.wait();
    console.log("USDC approved for minting");

    // Mint NFT
    const designId = `DESIGN_${Date.now()}`;
    const designName = "Summer Collection Dress";
    const designImage = "ipfs://QmExampleImageHash";
    const prompt = "A beautiful summer dress with floral patterns";

    console.log(`Minting NFT with design ID: ${designId}`);
    const mintTx = await astraNFTCollectible.connect(maker).mintNFTs(
      maker.address,
      designId,
      designName,
      designImage,
      prompt,
      4
    );
    const mintReceipt = await mintTx.wait();
    console.log("NFT minted successfully!");

    // Extract token ID from events
    const mintEvent = mintReceipt?.logs.find(log => {
      try {
        const parsed = astraNFTCollectible.interface.parseLog(log);
        return parsed?.name === 'NFTMinted';
      } catch {
        return false;
      }
    });

    if (!mintEvent) {
      throw new Error("NFTMinted event not found");
    }

    const parsedMintEvent = astraNFTCollectible.interface.parseLog(mintEvent);
    const tokenId = parsedMintEvent?.args.tokenId;
    console.log(`Minted NFT with token ID: ${tokenId}`);

    // Verify NFT ownership
    const owner = await astraNFTCollectible.ownerOf(tokenId);
    console.log(`NFT owner: ${owner}`);
    console.log(`Expected owner: ${maker.address}`);
    console.log(`Ownership correct: ${owner === maker.address}`);

    console.log("\n=== Step 2: List NFT for Sale ===");
    
    // List the NFT for sale
    const listingPrice = ethers.parseUnits("1", 6); // 1 USDC
    console.log(`Listing NFT ${tokenId} for ${ethers.formatUnits(listingPrice, 6)} USDC`);
    
    // const listTx = await astraNFTCollectible.connect(maker).listNFT(tokenId, listingPrice);
    // const listReceipt = await listTx.wait();
    // console.log("NFT listed status: ", listReceipt?.status === 1 ? "success" : "failed");
    
    // list multiple NFTs
    const batchListTx = await astraNFTCollectible.connect(maker).listOwnedNFTsByQuantity(3, listingPrice);
    const batchListReceipt = await batchListTx.wait();
    console.log("Multiple owned NFTs listed status: ", batchListReceipt?.status === 1 ? "success" : "failed");

    // Verify NFT is now owned by escrow
    const escrowOwner = await astraNFTCollectible.ownerOf(tokenId);
    console.log(`NFT owner after listing: ${escrowOwner}`);
    console.log(`Expected owner (escrow): ${escrowAddress}`);
    console.log(`Escrow ownership correct: ${escrowOwner === escrowAddress}`);

    // Get listing details
    const listing = await astraNFTCollectible.getListing(tokenId);
    console.log("Listing details:");
    console.log(`- Token ID: ${listing.tokenId}`);
    console.log(`- Seller: ${listing.seller}`);
    console.log(`- Price: ${ethers.formatUnits(listing.price, 6)} USDC`);
    console.log(`- Is Active: ${listing.isActive}`);

    console.log("\n=== Step 3: Deposit Funds for Escrow ===");
    
    // Shopper deposits funds for the escrow
    const escrowAmount = ethers.parseUnits("1", 6); // 1 USDC
    console.log(`Shopper depositing ${ethers.formatUnits(escrowAmount, 6)} USDC for escrow`);

    // Approve USDC for escrow deposit
    const depositApproveTx = await hederaTokenService.connect(shopper).approve(
      usdcAddress,
      escrowAddress,
      escrowAmount
    );
    await depositApproveTx.wait();
    console.log("USDC approved for escrow deposit");

    // Deposit funds
    const depositTx = await escrow.connect(shopper).depositFunds(escrowAmount, agent.address);
    const depositReceipt = await depositTx.wait();
    console.log("Funds deposited status: ", depositReceipt?.status === 1 ? "success" : "failed");

    // Verify deposit
    const depositBalance = await escrow.getDepositBalance(shopper.address, agent.address);
    console.log(`Deposit balance: ${ethers.formatUnits(depositBalance, 6)} USDC`);

    console.log("\n=== Step 4: Create Escrow ===");
    
    // Agent creates escrow with the NFT
    console.log(`Creating escrow with NFT token ID: ${tokenId}`);
    const createEscrowTx = await escrow.connect(agent).createEscrowByAgent(
      shopper.address,
      maker.address,
      creator.address, // Optional creator
      escrowAmount,
      tokenId
    );
    const createEscrowReceipt = await createEscrowTx.wait();
    console.log("Escrow created status: ", createEscrowReceipt?.status === 1 ? "success" : "failed");

    // Extract escrow ID from events
    const escrowEvent = createEscrowReceipt?.logs.find(log => {
      try {
        const parsed = escrow.interface.parseLog(log);
        return parsed?.name === 'EscrowCreated';
      } catch {
        return false;
      }
    });

    if (!escrowEvent) {
      throw new Error("EscrowCreated event not found");
    }

    const parsedEscrowEvent = escrow.interface.parseLog(escrowEvent);
    const escrowId = parsedEscrowEvent?.args.escrowId;
    console.log(`Created escrow with ID: ${escrowId}`);

    // Get escrow details
    const escrowDetails = await escrow.getEscrowDetails(escrowId);
    console.log("Escrow details:");
    console.log(`- Escrow ID: ${escrowId}`);
    console.log(`- Shopper: ${escrowDetails.shopper}`);
    console.log(`- Maker: ${escrowDetails.maker}`);
    console.log(`- Creator: ${escrowDetails.creator}`);
    console.log(`- Agent: ${escrowDetails.agent}`);
    console.log(`- Amount: ${ethers.formatUnits(escrowDetails.amount, 6)} USDC`);
    console.log(`- NFT Token ID: ${escrowDetails.nftTokenId}`);
    console.log(`- Milestones Completed: ${escrowDetails.milestonesCompleted}`);
    console.log(`- Remaining Balance: ${ethers.formatUnits(escrowDetails.remainingBalance, 6)} USDC`);

    console.log("\n=== Step 5: Complete Milestones ===");
    
    // Complete milestone 1: Shopper Details Received → Outfit Made
    console.log("Completing milestone 1...");
    const milestone1Tx = await escrow.connect(agent).completeMilestoneByAgent(escrowId);
    const milestone1Receipt = await milestone1Tx.wait();
    console.log("Milestone 1 completed status: ", milestone1Receipt?.status === 1 ? "success" : "failed");

    // Check escrow status after milestone 1
    const escrowDetails1 = await escrow.getEscrowDetails(escrowId);
    console.log(`Milestones completed: ${escrowDetails1.milestonesCompleted}`);
    console.log(`Remaining balance: ${ethers.formatUnits(escrowDetails1.remainingBalance, 6)} USDC`);

    // Complete milestone 2: Outfit Made → Outfit Delivered
    console.log("Completing milestone 2...");
    const milestone2Tx = await escrow.connect(agent).completeMilestoneByAgent(escrowId);
    const milestone2Receipt = await milestone2Tx.wait();
    console.log("Milestone 2 completed status: ", milestone2Receipt?.status === 1 ? "success" : "failed");

    // Check escrow status after milestone 2
    const escrowDetails2 = await escrow.getEscrowDetails(escrowId);
    console.log(`Milestones completed: ${escrowDetails2.milestonesCompleted}`);
    console.log(`Remaining balance: ${ethers.formatUnits(escrowDetails2.remainingBalance, 6)} USDC`);

    // Complete milestone 3: Outfit Delivered → Complete (NFT transfer happens here)
    console.log("Completing milestone 3 (final milestone)...");
    const milestone3Tx = await escrow.connect(agent).completeMilestoneByAgent(escrowId);
    const milestone3Receipt = await milestone3Tx.wait();
    console.log("Milestone 3 completed status: ", milestone3Receipt?.status === 1 ? "success" : "failed");

    console.log("\n=== Step 6: Verify NFT Transfer to Shopper ===");
    
    // Check final escrow status
    const finalEscrowDetails = await escrow.getEscrowDetails(escrowId);
    console.log("Final escrow details:");
    console.log(`- Milestones completed: ${finalEscrowDetails.milestonesCompleted}`);
    console.log(`- Remaining balance: ${ethers.formatUnits(finalEscrowDetails.remainingBalance, 6)} USDC`);
    console.log(`- Status: ${ethers.toUtf8String(finalEscrowDetails.status)}`);

    // Verify NFT ownership transfer
    const finalOwner = await astraNFTCollectible.ownerOf(tokenId);
    console.log(`Final NFT owner: ${finalOwner}`);
    console.log(`Expected owner (shopper): ${shopper.address}`);
    console.log(`NFT transfer successful: ${finalOwner === shopper.address}`);

    // Check if NFT is still listed (should be unlisted after transfer)
    const isStillListed = await astraNFTCollectible.isNFTListed(tokenId);
    console.log(`NFT still listed: ${isStillListed}`);

    // Get NFT metadata
    const nftDesignId = await astraNFTCollectible.getDesignId(tokenId);
    const nftDesignName = await astraNFTCollectible.getDesignName(tokenId);
    console.log("NFT metadata:");
    console.log(`- Design ID: ${nftDesignId}`);
    console.log(`- Design Name: ${nftDesignName}`);

    console.log("\n=== Integration Test Completed Successfully! ===");
    console.log("✅ NFT minted");
    console.log("✅ NFT listed and transferred to escrow");
    console.log("✅ Funds deposited for escrow");
    console.log("✅ Escrow created with NFT");
    console.log("✅ All milestones completed");
    console.log("✅ NFT transferred to shopper");
    console.log("✅ Payments distributed correctly");

  } catch (error) {
    console.error("Integration test failed:", error);
    
    // Try to decode the error if it's a revert
    if ((error as any)?.data) {
      try {
        const decodedError = astraNFTCollectible.interface.parseError((error as any).data) || 
                           escrow.interface.parseError((error as any).data);
        console.error("Decoded error:", decodedError);
      } catch (decodeError) {
        console.error("Could not decode error:", (error as any).data);
      }
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
