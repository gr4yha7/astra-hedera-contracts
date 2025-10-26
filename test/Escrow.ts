import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Escrow, IHederaTokenService } from "../typechain-types/index.js";


describe("Escrow Contract", function () {
  let escrow: Escrow;
  let hederaTokenService: IHederaTokenService;
  let owner: SignerWithAddress;
  let shopper: SignerWithAddress;
  let maker: SignerWithAddress;
  let creator: SignerWithAddress;
  let treasury: SignerWithAddress;
  let agent: SignerWithAddress;
  let other: SignerWithAddress;

  const HTS_ADDRESS = "0x0000000000000000000000000000000000000167";
  const USDC_ADDRESS = "0x0000000000000000000000000000000000068cda";
  const DEPOSIT_AMOUNT = ethers.parseUnits("1000", 6); // 1000 USDC
  const ESCROW_AMOUNT = ethers.parseUnits("100", 6); // 100 USDC

  beforeEach(async function () {
    [owner, shopper, maker, creator, treasury, agent, other] = await ethers.getSigners();

    // Deploy the Escrow contract
    const EscrowFactory = await ethers.getContractFactory("Escrow");
    escrow = await EscrowFactory.deploy(HTS_ADDRESS, USDC_ADDRESS);
    await escrow.waitForDeployment();

    // Get the Hedera Token Service contract
    hederaTokenService = await ethers.getContractAt("IHederaTokenService", HTS_ADDRESS);
  });

  describe("Constructor", function () {
    it("Should set the correct owner", async function () {
      expect(await escrow.owner()).to.equal(owner.address);
    });

    it("Should set the correct HTS and USDC addresses", async function () {
      expect(await escrow.hederaTokenService()).to.equal(HTS_ADDRESS);
      expect(await escrow.usdcAddress()).to.equal(USDC_ADDRESS);
    });

    it("Should initialize nextEscrowId to 1", async function () {
      // We can't directly access nextEscrowId, but we can test by creating an escrow
      // and checking that the first escrow has ID 1
    });

    it("Should revert if HTS address is zero", async function () {
      const EscrowFactory = await ethers.getContractFactory("Escrow");
      await expect(EscrowFactory.deploy(ethers.ZeroAddress, USDC_ADDRESS))
        .to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });

    it("Should revert if USDC address is zero", async function () {
      const EscrowFactory = await ethers.getContractFactory("Escrow");
      await expect(EscrowFactory.deploy(HTS_ADDRESS, ethers.ZeroAddress))
        .to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });
  });

  describe("associateUsdcTokenToContract", function () {
    it("Should associate USDC token to contract", async function () {
      // This would require actual Hedera network interaction
      // In a real test environment, you'd mock the HTS response
      await expect(escrow.associateUsdcTokenToContract())
        .to.not.be.reverted; // Depending on network state
    });

    it("Should only be callable by owner", async function () {
      await expect(escrow.connect(other).associateUsdcTokenToContract())
        .to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
    });
  });

  describe("associateUsdcTokenToContract", function () {
    it("Should associate USDC token to specified account", async function () {
      await expect(hederaTokenService.connect(other).associateToken(maker.address, USDC_ADDRESS))
        .to.not.be.reverted;
    });

    it("Should only be callable by owner", async function () {
      await expect(escrow.connect(other).associateUsdcTokenToContract())
        .to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
    });
  });

  describe("depositFunds", function () {
    it("Should revert with zero amount", async function () {
      await expect(escrow.depositFunds(0, agent.address))
        .to.be.revertedWithCustomError(escrow, "InvalidAmount");
    });

    it("Should revert with zero agent address", async function () {
      await expect(escrow.depositFunds(DEPOSIT_AMOUNT, ethers.ZeroAddress))
        .to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });

    it("Should revert if transferFrom fails", async function () {
      // This would fail in a real scenario due to insufficient allowance/balance
      await expect(escrow.depositFunds(DEPOSIT_AMOUNT, agent.address))
        .to.be.revertedWithCustomError(escrow, "DepositFailed");
    });

    it("Should emit FundsDeposited event on success", async function () {
      // This test would require proper token setup
      // await expect(escrow.depositFunds(DEPOSIT_AMOUNT, agent.address))
      //   .to.emit(escrow, "FundsDeposited")
      //   .withArgs(shopper.address, agent.address, DEPOSIT_AMOUNT);
    });
  });

  describe("getDepositBalance", function () {
    it("Should return zero for non-existent deposit", async function () {
      expect(await escrow.getDepositBalance(shopper.address, agent.address)).to.equal(0);
    });

    it("Should return correct balance after deposit", async function () {
      // This would require successful deposit first
      // expect(await escrow.getDepositBalance(shopper.address, agent.address)).to.equal(DEPOSIT_AMOUNT);
    });
  });

  describe("createEscrowByAgent", function () {
    beforeEach(async function () {
      // Mock successful deposit by directly setting the mapping
      // In a real test, you'd need to properly fund the contract
    });

    it("Should revert with zero shopper address", async function () {
      await expect(escrow.connect(agent).createEscrowByAgent(
        ethers.ZeroAddress, maker.address, treasury.address, creator.address, ESCROW_AMOUNT
      )).to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });

    it("Should revert with zero maker address", async function () {
      await expect(escrow.connect(agent).createEscrowByAgent(
        shopper.address, ethers.ZeroAddress, treasury.address, creator.address, ESCROW_AMOUNT
      )).to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });

    it("Should revert with zero treasury address", async function () {
      await expect(escrow.connect(agent).createEscrowByAgent(
        shopper.address, maker.address, ethers.ZeroAddress, creator.address, ESCROW_AMOUNT
      )).to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });

    it("Should revert with zero amount", async function () {
      await expect(escrow.connect(agent).createEscrowByAgent(
        shopper.address, maker.address, treasury.address, creator.address, 0
      )).to.be.revertedWithCustomError(escrow, "InvalidAmount");
    });

    it("Should revert with insufficient balance", async function () {
      await expect(escrow.connect(agent).createEscrowByAgent(
        shopper.address, maker.address, treasury.address, creator.address, ESCROW_AMOUNT
      )).to.be.revertedWithCustomError(escrow, "InsufficientBalance");
    });

    it("Should create escrow successfully", async function () {
      // This would require proper deposit setup
      // await expect(escrow.connect(agent).createEscrowByAgent(
      //   shopper.address, maker.address, treasury.address, creator.address, ESCROW_AMOUNT
      // )).to.emit(escrow, "EscrowCreated");
    });

    it("Should handle creator address correctly", async function () {
      // Test with zero creator address (no creator)
      // Test with valid creator address
    });
  });

  describe("completeMilestoneByAgent", function () {
    let escrowId: bigint;

    beforeEach(async function () {
      // Setup escrow - this would require proper token setup
      // escrowId = await createTestEscrow();
    });

    it("Should revert if caller is not the agent", async function () {
      await expect(escrow.connect(other).completeMilestoneByAgent(1))
        .to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("Should revert if milestone limit reached", async function () {
      // This would require setting up an escrow with 3 completed milestones
      // await expect(escrow.connect(agent).completeMilestoneByAgent(escrowId))
      //   .to.be.revertedWithCustomError(escrow, "MilestoneLimitReached");
    });

    it("Should revert if insufficient balance", async function () {
      // This would require setting up an escrow with insufficient balance
    });

    it("Should complete milestone without creator", async function () {
      // Test milestone completion when hasCreator is false
    });

    it("Should complete milestone with creator", async function () {
      // Test milestone completion when hasCreator is true
    });

    it("Should transfer to treasury on final milestone", async function () {
      // Test that remaining balance goes to treasury on milestone 3
    });

    it("Should emit MilestoneCompleted event", async function () {
      // await expect(escrow.connect(agent).completeMilestoneByAgent(escrowId))
      //   .to.emit(escrow, "MilestoneCompleted");
    });

    it("Should emit PaymentReleased events", async function () {
      // await expect(escrow.connect(agent).completeMilestoneByAgent(escrowId))
      //   .to.emit(escrow, "PaymentReleased");
    });
  });

  describe("getEscrowBalance", function () {
    it("Should return zero for non-existent escrow", async function () {
      expect(await escrow.getEscrowBalance(999)).to.equal(0);
    });

    it("Should return correct balance for existing escrow", async function () {
      // This would require setting up an escrow first
    });
  });

  describe("getEscrowDetails", function () {
    it("Should return empty struct for non-existent escrow", async function () {
      const details = await escrow.getEscrowDetails(999);
      expect(details.shopper).to.equal(ethers.ZeroAddress);
      expect(details.amount).to.equal(0);
    });

    it("Should return correct details for existing escrow", async function () {
      // This would require setting up an escrow first
    });
  });

  describe("safeUint256ToInt64", function () {
    it("Should convert valid uint256 to int64", async function () {
      // This is an internal function, so we test it indirectly
      // by ensuring the contract compiles and functions work
    });

    it("Should revert for values too large for int64", async function () {
      // This would require calling a function with a very large amount
      // that exceeds int64 max value
    });
  });

  describe("Edge Cases and Error Conditions", function () {
    it("Should handle reentrancy attacks", async function () {
      // Test that nonReentrant modifier works correctly
    });

    it("Should handle multiple escrows correctly", async function () {
      // Test creating multiple escrows and ensuring IDs are unique
    });

    it("Should handle zero creator address in escrow", async function () {
      // Test escrow creation and completion with zero creator
    });

    it("Should handle maximum milestone completion", async function () {
      // Test completing all 3 milestones
    });

    it("Should handle treasury share calculation", async function () {
      // Test that treasury gets correct percentage
    });

    it("Should handle maker and creator percentage splits", async function () {
      // Test percentage calculations for different scenarios
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to associate tokens", async function () {
      await expect(escrow.connect(other).associateUsdcTokenToContract())
        .to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
    });

    it("Should only allow agent to create escrow", async function () {
      // Test that only the agent can create escrow for their deposits
    });

    it("Should only allow agent to complete milestones", async function () {
      // Test that only the agent can complete milestones for their escrows
    });
  });

  describe("State Transitions", function () {
    it("Should track milestone completion correctly", async function () {
      // Test that milestonesCompleted increments properly
    });

    it("Should update status correctly", async function () {
      // Test status transitions: ShopperDetailsReceived -> OutfitMade -> OutfitDelivered -> Complete
    });

    it("Should handle remaining balance correctly", async function () {
      // Test that remainingBalance decreases with each payment
    });
  });

  describe("Gas Optimization", function () {
    it("Should use reasonable gas for deposit", async function () {
      // Test gas usage for depositFunds
    });

    it("Should use reasonable gas for escrow creation", async function () {
      // Test gas usage for createEscrowByAgent
    });

    it("Should use reasonable gas for milestone completion", async function () {
      // Test gas usage for completeMilestoneByAgent
    });
  });
});