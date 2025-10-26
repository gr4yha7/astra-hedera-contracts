// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAstraNFT {
    function updateTreasuryAddress(address _treasuryAddress) external;
    function updateFees(uint256 _baseCollectionFee, uint256 _additionalPieceFee) external;
    function mintNFT(
        address to,
        string memory designId,
        string memory designName,
        string memory fabricType,
        string memory designImage,
        string memory prompt,
        string memory metadataURI
    ) external;
    function transferNFT(
        uint256 tokenId,
        address to
    ) external;
    function getTotalFee() external view returns (uint256);
    function getTreasuryAddress() external view returns (address);
    function getBaseCollectionFee() external view returns (uint256);
    function getAdditionalPieceFee() external view returns (uint256);
    function getTokenURI(uint256 tokenId) external view returns (string memory);
    function getTokenOwner(uint256 tokenId) external view returns (address);
    function getTokenDesignId(uint256 tokenId) external view returns (string memory);
}