import { EventLog, Wallet, Signer } from "ethers";
import { ethers } from "hardhat";
import { Escrow } from "../typechain-types";

// type HardhatEthersSigner = Signer & {
//   address: string;
// };

const MAKER_ADDRESS = "0xd06e922AACEe8d326102C3643f40507265f51369";
const TREASURY_ADDRESS = "0x3Db2f85e7A204aB666229E637A2B9eA92e566F49"; // 0.0.7115708
const CREATOR_ADDRESS = "0x1b6e16403b06a51C42Ba339E356a64fE67348e92"; // 0.0.7115713
// const CREATOR_PRIVATE_KEY = 'bd83404727a183edcc32ce0c9a7e07e004b179f65a14c8aca8f106e2cc73556a';
// const TREASURY_PRIVATE_KEY = '94c53c04a356104796be0b95ecf578fb9e4ac3dabe9367d1d5a17d0fbce9bac1';
// const MAKER_PRIVATE_KEY = 'f8fdc66b423a3c9f66374ee9d144f0acc7ebe318fc23164f5d0e9efd6f7895dc';

// const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
// const makerSigner = new ethers.Wallet(MAKER_PRIVATE_KEY, provider);
// const treasurySigner = new ethers.Wallet(TREASURY_PRIVATE_KEY, provider);
// const creatorSigner = new ethers.Wallet(CREATOR_PRIVATE_KEY, provider);

async function main() {
  const [deployer] = await ethers.getSigners();

  // const Escrow = await ethers.getContractFactory("Escrow", deployer);
  const escrowContractAddress = process.env.ESCROW_CONTRACT_ADDRESS;
  if (!escrowContractAddress) {
    throw new Error("Missing required environment variables [ESCROW_CONTRACT_ADDRESS]");
  }
  const escrowContract = await ethers.getContractAt("Escrow", escrowContractAddress);

  const htsAddress = "0x0000000000000000000000000000000000000167";
  const usdcTokenAddress = "0x0000000000000000000000000000000000068cda";
  const hts = await ethers.getContractAt("IHederaTokenService", htsAddress);
  const amount = ethers.parseUnits("1", 6);
  console.log("amount: ", amount.toString());

  // Associate USDC token to escrow contract
  console.log("Associating USDC token to escrow contract...");
  const associateTx = await escrowContract.associateUsdcTokenToContract();
  const associateReceipt = await associateTx.wait();
  console.log("associate status: ", associateReceipt?.status === 1 ? "success" : "failed");

  // Helper: Associate USDC for the given account using its signer
  // async function associateUsdcForAccount(
  //   accountSigner: Wallet | HardhatEthersSigner,
  // ) {
  //   try {
  //     const tx = await hts.connect(accountSigner).associateToken(accountSigner.address, usdcTokenAddress);
  //     const receipt = await tx.wait();
  //     console.log(`USDC association successful for ${accountSigner.address}. Status: ${receipt?.status === 1 ? "success" : "failed"}`);
  //   } catch (err) {
  //     console.error(`Could not associate USDC token for ${accountSigner.address}:`, err);
  //   }
  // }

  // // Run USDC association for maker, treasury, and creator (if present)
  // await associateUsdcForAccount(makerSigner);
  // await associateUsdcForAccount(treasurySigner);
  // if (creatorSigner) {
  //   await associateUsdcForAccount(creatorSigner);
  // }

  // Approve the contract to spend the tokens
  // console.log("Approving USDC tokens for escrow contract...");
  // const approveTx = await hts.approve(usdcTokenAddress, escrowContractAddress, amount);
  // const approveReceipt = await approveTx.wait();
  // console.log("approve status: ", approveReceipt?.status === 1 ? "success" : "failed");


  // Shopper === deployer.address & agent
  // Deposit funds
  // const depositTx = await escrowContract.depositFunds(amount, deployer.address);
  // const depositReceipt = await depositTx.wait();
  // console.log("depositFunds status: ", depositReceipt?.status === 1 ? "success" : "failed");
  // const transferredAmount = receipt?.logs[1].args.amount;
  // console.log("Deposited amount:", transferredAmount);
  // console.log("Deposited to agent:", receipt?.logs[1].args.agent);
  // console.log("Deposited by user:", receipt?.logs[0].args.user);

  // Create escrow
  // const createEscrowTx = await escrowContract.createEscrowByAgent(deployer.address, MAKER_ADDRESS, CREATOR_ADDRESS, amount);
  // const createEscrowReceipt = await createEscrowTx.wait();
  // console.log("createEscrow status: ", createEscrowReceipt?.status === 1 ? "success" : "failed");
  // const escrowId = (createEscrowReceipt?.logs[0] as EventLog).args.escrowId;
  // console.log("Escrow created with ID:", escrowId);

  // const escrowId = 1;
  // Debug: Check escrow details before completing milestone
  // console.log("\n=== FETCHING ESCROW DETAILS ===");
  // try {
  //   const escrowDetails = await escrowContract.getEscrowDetails(escrowId);
  //   console.log("Escrow details:", {
  //     shopper: escrowDetails.shopper,
  //     maker: escrowDetails.maker,
  //     creator: escrowDetails.creator,
  //     treasury: escrowDetails.treasury,
  //     agent: escrowDetails.agent,
  //     amount: escrowDetails.amount.toString(),
  //     milestonesCompleted: escrowDetails.milestonesCompleted,
  //     remainingBalance: escrowDetails.remainingBalance.toString(),
  //     hasCreator: escrowDetails.hasCreator
  //   });
  // } catch (error) {
  //   console.log("Error getting escrow details:", error);
  // }

  // // Debug: Check escrow balance
  // try {
  //   const balance = await escrowContract.getEscrowBalance(escrowId);
  //   console.log("Escrow balance:", balance.toString());
  // } catch (error) {
  //   console.log("Error getting escrow balance:", error);
  // }

  // // Debug: Check if caller is authorized agent
  // try {
  //   const details = await escrowContract.getEscrowDetails(escrowId);
  //   console.log("Authorized agent:", details.agent);
  //   console.log("Current caller:", deployer.address);
  //   console.log("Is authorized:", details.agent.toLowerCase() === deployer.address.toLowerCase());
  // } catch (error) {
  //   console.log("Error checking authorization:", error);
  // }

  // // Debug: Check deposit balance
  // try {
  //   const depositBalance = await escrowContract.getDepositBalance(deployer.address, deployer.address);
  //   console.log("Deposit balance for shopper-agent pair:", depositBalance.toString());
  // } catch (error) {
  //   console.log("Error getting deposit balance:", error);
  // }

  // console.log("=== END DEBUGGING ===\n");

  // const completeMilestoneTx = await escrowContract.completeMilestoneByAgent(escrowId);
  // const completeMilestoneReceipt = await completeMilestoneTx.wait();
  // console.log("completeMilestone hash: ", completeMilestoneReceipt?.hash);
  // console.log("completeMilestone status: ", completeMilestoneReceipt?.status === 1 ? "success" : "failed");

}

main().catch(console.error);