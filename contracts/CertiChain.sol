// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CertiChain is ERC721, Ownable {
    struct Certificate {
        string name;
        string course;
        string issuedBy;
        string issueDate;
    }

    mapping(uint256 => Certificate) private certificates;

    constructor() ERC721("CertiChain", "CERT") Ownable(msg.sender) {}

    function issueCertificate(
        address recipient,
        uint256 tokenId,
        string memory name,
        string memory course,
        string memory issuedBy,
        string memory issueDate
    ) external onlyOwner {
        require(_ownerOf(tokenId) == address(0), "Certificate already exists");
        _mint(recipient, tokenId);
        certificates[tokenId] = Certificate(name, course, issuedBy, issueDate);
    }

    function getCertificate(uint256 tokenId)
        external
        view
        returns (Certificate memory)
    {
        address owner = _ownerOf(tokenId);
        require(owner != address(0), "Certificate does not exist");
        return certificates[tokenId];
    }

    function revokeCertificate(uint256 tokenId) external onlyOwner {
        address owner = _ownerOf(tokenId);
        require(owner != address(0), "Certificate does not exist");
        _burn(tokenId);
        delete certificates[tokenId];
    }
}
