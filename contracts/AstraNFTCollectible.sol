// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

// Hedera Token Service Contracts
import {IHederaTokenService} from "@hashgraph/smart-contracts/contracts/system-contracts/hedera-token-service/IHederaTokenService.sol";
import {HederaResponseCodes} from "@hashgraph/smart-contracts/contracts/system-contracts/HederaResponseCodes.sol";


contract AstraNFTCollectible is
    Initializable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _tokenIdCounter;

    // NFT metadata structure
    struct NFTMetadata {
        string designId;
        string designName;
        string fabricType;
        string designImage;
        string prompt;
        address[] previousOwners;
        address[] usersOfDesign;
    }

    // Mapping from token ID to metadata
    mapping(uint256 => NFTMetadata) private _tokenMetadata;
    
    // Mapping to track used design IDs for uniqueness check
    mapping(string => bool) private _usedDesignIds;

    string public baseTokenURI;
    
    // Maximum number of previous owners to track
    uint256 public constant MAX_PREVIOUS_OWNERS = 100;
    
    // Maximum number of users to track per design
    uint256 public constant MAX_USERS_PER_DESIGN = 100;

    uint256 public constant MAX_SUPPLY = 100;
    uint256 public constant MAX_PER_MINT = 10;

    address public treasuryAddress;
    uint256 public baseMintFee;
    address public usdcAddress;
    address public escrowAddress;
    IHederaTokenService public hederaTokenService;
    // Events
    event NFTMinted(
        uint256 indexed tokenId,
        address indexed creator,
        address indexed owner,
        string designId,
        string designName,
        string fabricType,
        string designImage,
        string prompt
    );

    event NFTTransferred(
        uint256 indexed tokenId,
        address indexed previousOwner,
        address indexed newOwner
    );

    event UserAddedToDesign(
        uint256 indexed tokenId,
        address indexed user
    );

    event DesignNameUpdated(
        uint256 indexed tokenId,
        string designName
    );

    event FabricTypeUpdated(
        uint256 indexed tokenId,
        string fabricType
    );

    event PromptUpdated(
        uint256 indexed tokenId,
        string prompt
    );

    event DesignImageUpdated(
        uint256 indexed tokenId,
        string designImage
    );
    
    // Event for contract upgrades
    event ContractUpgraded(address indexed implementation);

    // Payment related events
    event TreasuryUpdated(address indexed newTreasury);
    event BaseMintFeeUpdated(uint256 baseMintFee);
    event PaymentReceived(address indexed payer, uint256 amount);
    event UsdcTokenAssociated();
    event EscrowAddressUpdated(address indexed newEscrowAddress);
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
      address initialOwner,
      address _hederaTokenService,
      address _usdcAddress,
      address _treasuryAddress,
    //   address _escrowAddress,
      uint256 _baseMintFee
    ) public initializer {
        require(initialOwner != address(0), "Owner cannot be zero address");
        require(_hederaTokenService != address(0), "Hedera token service cannot be zero address");
        require(_usdcAddress != address(0), "USDC address cannot be zero address");
        require(_treasuryAddress != address(0), "Treasury address cannot be zero address");
        // require(_escrowAddress != address(0), "Escrow address cannot be zero address");
        __ERC721_init("AstraNFTCollectible", "ASTRA-C");
        __ERC721Enumerable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();

        hederaTokenService = IHederaTokenService(_hederaTokenService);
        usdcAddress = _usdcAddress;
        treasuryAddress = _treasuryAddress;
        // escrowAddress = _escrowAddress;
        baseMintFee = _baseMintFee;

        // After initialization, transfer ownership
        transferOwnership(initialOwner);
    }

    /**
     * @dev Associate the USDC token to this contract (should be called after deployment)
     */
    function associateUsdcToken() external onlyOwner {
        require(usdcAddress != address(0), "USDC address cannot be zero address");
        int64 responseCode = hederaTokenService.associateToken(address(this), usdcAddress);
        require(responseCode == HederaResponseCodes.SUCCESS, "Associate USDC token failed");
        emit UsdcTokenAssociated();
    }

    function safeMint(address to) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        return tokenId;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {
      emit ContractUpgraded(newImplementation);
    }

    /**
     * @dev Updates the treasury address
     */
    function updateTreasuryAddress(address _treasuryAddress) external onlyOwner {
        require(_treasuryAddress != address(0), "Treasury cannot be zero address");
        treasuryAddress = _treasuryAddress;
        emit TreasuryUpdated(_treasuryAddress);
    }

    /**
     * @dev Updates the escrow address
     */
    function updateEscrowAddress(address _escrowAddress) external onlyOwner {
        require(_escrowAddress != address(0), "Escrow address cannot be zero address");
        escrowAddress = _escrowAddress;
        emit EscrowAddressUpdated(_escrowAddress);
    }
    /**
     * @dev Updates the base minting fee
     */
    function updateBaseMintFee(uint256 _baseMintFee) external onlyOwner {
        baseMintFee = _baseMintFee;
        emit BaseMintFeeUpdated(_baseMintFee);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }
    
    function setBaseURI(string memory _baseTokenURI) public onlyOwner {
        baseTokenURI = _baseTokenURI;
    }
    
    function mintNFTs(
      address to,
      string memory designId,
      string memory designName,
      string memory fabricType,
      string memory designImage,
      string memory prompt,
      uint256 _count
    ) public {
        uint totalMinted = _tokenIdCounter.current();

        require(totalMinted + _count <= MAX_SUPPLY, "Not enough NFTs left!");
        require(_count > 0 && _count <= MAX_PER_MINT, "Cannot mint specified number of NFTs.");
        // Uniqueness check for designId
        require(!_usedDesignIds[designId], "Design ID already in use");
        // Check allowance of USDC if sufficient
        uint256 totalFee = baseMintFee * _count;
        (int64 responseCode, uint256 allowance) = hederaTokenService.allowance(usdcAddress, msg.sender, address(this));
        require(responseCode == HederaResponseCodes.SUCCESS, "Allowance check failed");
        require(allowance >= totalFee, "Insufficient funds for minting");
        // Collect payment
        responseCode = hederaTokenService.transferFrom(usdcAddress, msg.sender, treasuryAddress, totalFee);
        require(responseCode == HederaResponseCodes.SUCCESS, "Payment failed");
        emit PaymentReceived(msg.sender, totalFee);

        // Mark design ID as used
        _usedDesignIds[designId] = true;

        for (uint i = 0; i < _count; i++) {
            _mintSingleNFT(to, designId, designName, fabricType, designImage, prompt);
        }
    }
    
    function tokensOfOwner(address _owner) external view returns (uint[] memory) {

        uint tokenCount = balanceOf(_owner);
        uint[] memory tokensId = new uint256[](tokenCount);

        for (uint i = 0; i < tokenCount; i++) {
            tokensId[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokensId;
    }

    /**
     * @dev Mints a new NFT with the specified metadata and collects payment
     */
    function _mintSingleNFT(
        address to,
        string memory designId,
        string memory designName,
        string memory fabricType,
        string memory designImage,
        string memory prompt
    ) private returns (uint256) {
        // Zero address validation
        require(to != address(0), "Recipient cannot be zero address");
        
        // Input validation
        require(bytes(designId).length > 0, "Design ID cannot be empty");
        require(bytes(designName).length > 0, "Design name cannot be empty");
        require(bytes(fabricType).length > 0, "Fabric type cannot be empty");
        require(bytes(designImage).length > 0, "Design image cannot be empty");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);

        // Create storage for the arrays
        _tokenMetadata[tokenId].previousOwners = new address[](0);
        _tokenMetadata[tokenId].usersOfDesign = new address[](0);

        // Set metadata
        _tokenMetadata[tokenId].designId = designId;
        _tokenMetadata[tokenId].designName = designName;
        _tokenMetadata[tokenId].fabricType = fabricType;
        _tokenMetadata[tokenId].designImage = designImage;
        _tokenMetadata[tokenId].prompt = prompt;

        // Emit the minted event
        emit NFTMinted(
            tokenId,
            msg.sender,
            to,
            designId,
            designName,
            fabricType,
            designImage,
            prompt
        );

        return tokenId;
    }

    /**
     * @dev Transfers ownership of the NFT and updates previous owners list.
     * This function will also be used to list the NFT on the marketplace by setting the to address to the treasury (escrow) address.
     * @param to The address to transfer the NFT to
     * @param tokenId The ID of the NFT to transfer
     */
    function transferNFT(address to, uint256 tokenId) public {
        require(to != address(0), "Cannot transfer to zero address");
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not approved or owner");
        address currentOwner = ownerOf(tokenId);
        
        // Check previous owners array size limit
        require(_tokenMetadata[tokenId].previousOwners.length < MAX_PREVIOUS_OWNERS, 
                "Previous owners list is full");
        
        // Update previous owners list
        _tokenMetadata[tokenId].previousOwners.push(currentOwner);
        
        // Transfer the NFT
        _transfer(currentOwner, to, tokenId);
        
        // Emit transfer event
        emit NFTTransferred(tokenId, currentOwner, to);
    }

    /**
     * @dev Adds a user to the list of users who can use this design
     */
    function addUserOfDesign(uint256 tokenId, address user) public {
        require(user != address(0), "User cannot be zero address");
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not approved or owner");
        
        // Check users array size limit
        require(_tokenMetadata[tokenId].usersOfDesign.length < MAX_USERS_PER_DESIGN, 
                "Users list is full");
        
        // Add user to the users of design list
        _tokenMetadata[tokenId].usersOfDesign.push(user);
        
        // Emit event
        emit UserAddedToDesign(tokenId, user);
    }

    /**
     * @dev Updates the design name
     */
    function updateDesignName(uint256 tokenId, string memory newDesignName) public {
        require(bytes(newDesignName).length > 0, "Design name cannot be empty");
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not approved or owner");
        
        _tokenMetadata[tokenId].designName = newDesignName;
        
        emit DesignNameUpdated(tokenId, newDesignName);
    }

    /**
     * @dev Updates the fabric type
     */
    function updateFabricType(uint256 tokenId, string memory newFabricType) public {
        require(bytes(newFabricType).length > 0, "Fabric type cannot be empty");
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not approved or owner");
        
        _tokenMetadata[tokenId].fabricType = newFabricType;
        
        emit FabricTypeUpdated(tokenId, newFabricType);
    }

    /**
     * @dev Updates the prompt
     */
    function updatePrompt(uint256 tokenId, string memory newPrompt) public {
        require(bytes(newPrompt).length > 0, "Prompt cannot be empty");
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not approved or owner");
        
        _tokenMetadata[tokenId].prompt = newPrompt;
        
        emit PromptUpdated(tokenId, newPrompt);
    }

    /**
     * @dev Updates the design image
     */
    function updateDesignImage(uint256 tokenId, string memory newDesignImage) public {
        require(bytes(newDesignImage).length > 0, "Design image cannot be empty");
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not approved or owner");
        
        _tokenMetadata[tokenId].designImage = newDesignImage;
        
        emit DesignImageUpdated(tokenId, newDesignImage);
    }

    /**
     * @dev Check if the address is approved or owner
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view override returns (bool) {
        address owner = ERC721Upgradeable.ownerOf(tokenId);
        return (spender == owner || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    }

    /**
     * @dev Check if a design ID is already in use
     */
    function isDesignIdUsed(string memory designId) public view returns (bool) {
        return _usedDesignIds[designId];
    }

    // === Getter Functions ===
    /**
     * @dev Gets the base minting fee
     */
    function getBaseMintFee() public view returns (uint256) {
        return baseMintFee;
    }

    /**
     * @dev Gets the owner of the NFT
     */
    function getOwner(uint256 tokenId) public view returns (address) {
        require(_exists(tokenId), "Token does not exist");
        return ownerOf(tokenId);
    }

    /**
     * @dev Gets the design ID
     */
    function getDesignId(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenMetadata[tokenId].designId;
    }

    /**
     * @dev Gets the design name
     */
    function getDesignName(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenMetadata[tokenId].designName;
    }

    /**
     * @dev Gets the fabric type
     */
    function getFabricType(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenMetadata[tokenId].fabricType;
    }

    /**
     * @dev Gets the design image
     */
    function getDesignImage(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenMetadata[tokenId].designImage;
    }

    /**
     * @dev Gets the prompt
     */
    function getPrompt(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenMetadata[tokenId].prompt;
    }

    /**
     * @dev Gets the previous owners
     */
    function getPreviousOwners(uint256 tokenId) public view returns (address[] memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenMetadata[tokenId].previousOwners;
    }

    /**
     * @dev Gets the users of design
     */
    function getUsersOfDesign(uint256 tokenId) public view returns (address[] memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenMetadata[tokenId].usersOfDesign;
    }

    // Override required functions
    function _exists(uint256 tokenId) internal view override returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // Implementation of _burn to handle the conflict between parent contracts
    function _burn(uint256 tokenId) internal override(ERC721Upgradeable) {
        // Get the design ID before burning
        string memory designId = _tokenMetadata[tokenId].designId;
        
        // Clear metadata
        delete _tokenMetadata[tokenId];
        
        // Mark design ID as available again
        // TODO: set to false ONLY if this is the last NFT with that design ID
        _usedDesignIds[designId] = false;
        
        super._burn(tokenId);
    }

    // The following functions are overrides required by Solidity.
    function _transfer(address from, address to, uint256 tokenId)
        internal
        override
    {
        super._transfer(from, to, tokenId);
    }

    function _beforeTokenTransfer(address from, address to, uint256 firstTokenId, uint256 batchSize)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}