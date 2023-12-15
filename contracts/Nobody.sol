// SPDX-License-Identifier: MIT

/***
 *     __    __   ______   _______    ______   _______   __      __
 *    /  \  /  | /      \ /       \  /      \ /       \ /  \    /  |
 *    $$  \ $$ |/$$$$$$  |$$$$$$$  |/$$$$$$  |$$$$$$$  |$$  \  /$$/
 *    $$$  \$$ |$$ |  $$ |$$ |__$$ |$$ |  $$ |$$ |  $$ | $$  \/$$/
 *    $$$$  $$ |$$ |  $$ |$$    $$ |$$ |  $$ |$$ |  $$ |  $$  $$/
 *    $$ $$ $$ |$$ |  $$ |$$$$$$$  |$$ |  $$ |$$ |  $$ |   $$$$/
 *    $$ |$$$$ |$$ \__$$ |$$ |__$$ |$$ \__$$ |$$ |__$$ |    $$ |
 *    $$ | $$$ |$$    $$/ $$    $$/ $$    $$/ $$    $$/     $$ |
 *    $$/   $$/  $$$$$$/  $$$$$$$/   $$$$$$/  $$$$$$$/      $$/
 */

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract Nobody is ERC721Enumerable, ERC2981, Ownable, ReentrancyGuard {
    using Strings for uint256;

    string public PROVENANCE;
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MAX_MINT_NUMBER_PER_ADDRESS = 1;

    uint256 public presalePricePerToken = 0.1 ether;
    uint256 public publicSalePricePerToken = 0.2 ether;

    bytes32 public whitelistMerkleRoot;
    bytes32 public waitListMerkleRoot;

    bool public isPresaleActive = false;
    bool public isPublicSaleActive = false;
    bool public isRevealed = false;

    string public baseURI;
    string private _notRevealedURI;

    mapping(address => uint8) private _addressMintedNumber;

    address[] private _waitListAddresses;
    mapping(address => uint8) private _waitListAddressNumber;
    mapping(address => uint256) private _waitListAddressAmount;

    constructor() ERC721("Nobody", "NOBODY") {}

    function setProvenance(string memory provenance) external onlyOwner {
        PROVENANCE = provenance;
    }

    function setTokenPrice(uint256 _presalePricePerToken, uint256 _publicSalePricePerToken) external onlyOwner {
        presalePricePerToken = _presalePricePerToken;
        publicSalePricePerToken = _publicSalePricePerToken;
    }

    function setMerkleRoot(bytes32 _whitelistMerkleRoot, bytes32 _waitListMerkleRoot) external onlyOwner {
        whitelistMerkleRoot = _whitelistMerkleRoot;
        waitListMerkleRoot = _waitListMerkleRoot;
    }

    function setIsPresaleActive(bool _isPresaleActive) external onlyOwner {
        isPresaleActive = _isPresaleActive;
    }

    function setIsPublicSaleActive(bool _isPublicSaleActive) external onlyOwner {
        isPublicSaleActive = _isPublicSaleActive;
    }

    function setIsRevealed(bool _isRevealed) external onlyOwner {
        isRevealed = _isRevealed;
    }

    function setBaseURI(string memory baseURI_) external onlyOwner {
        baseURI = baseURI_;
    }

    function setNotRevealedURI(string memory notRevealedURI_) external onlyOwner {
        _notRevealedURI = notRevealedURI_;
    }

    function airdrop(address[] calldata addresses, uint8 number) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            uint256 ts = totalSupply();
            require(ts + number <= MAX_SUPPLY, "Nobody: airdrop would exceed max supply.");
            for (uint256 j = 0; j < number; j++) {
                _safeMint(addresses[i], ts + j);
            }
        }
    }

    function airdropWaitList(address[] calldata addresses) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            address _address = addresses[i];
            require(_waitListAddressAmount[_address] != 0, "Nobody: invalid address.");

            uint8 number = _waitListAddressNumber[_address];
            require(
                _addressMintedNumber[_address] + number <= MAX_MINT_NUMBER_PER_ADDRESS,
                "Nobody: exceeded max mint number per address."
            );

            uint256 ts = totalSupply();
            require(ts + number <= MAX_SUPPLY, "Nobody: airdrop would exceed max supply.");

            delete _waitListAddressAmount[_address];
            _addressMintedNumber[_address] += number;

            for (uint256 j = 0; j < number; j++) {
                _safeMint(_address, ts + j);
            }
        }
    }

    function refundWaitList(address[] calldata addresses) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            address _address = addresses[i];
            uint256 amount = _waitListAddressAmount[_address];
            if (amount != 0) {
                delete _waitListAddressAmount[_address];
                Address.sendValue(payable(_address), amount);
            }
        }
    }

    function setRoyaltyInfo(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function withdraw(uint256 amount) external onlyOwner {
        if (amount == 0) {
            amount = address(this).balance;
        }
        Address.sendValue(payable(msg.sender), amount);
    }

    function mintWhitelist(uint8 number, bytes32[] calldata proof) external payable nonReentrant {
        require(isPresaleActive, "Nobody: presale is not active.");

        require(number > 0, "Nobody: invalid mint number.");
        require(
            _addressMintedNumber[msg.sender] + number <= MAX_MINT_NUMBER_PER_ADDRESS,
            "Nobody: exceeded max mint number per address."
        );

        require(_verify(proof, whitelistMerkleRoot, _leaf(msg.sender)), "Nobody: invalid whitelist merkle proof.");

        uint256 ts = totalSupply();
        require(ts + number <= MAX_SUPPLY, "Nobody: mint would exceed max supply.");

        uint256 costToMint = presalePricePerToken * number;
        require(costToMint <= msg.value, "Nobody: ether value is not enough.");

        _addressMintedNumber[msg.sender] += number;

        for (uint256 i = 0; i < number; i++) {
            _safeMint(msg.sender, ts + i);
        }

        if (msg.value > costToMint) {
            Address.sendValue(payable(msg.sender), msg.value - costToMint);
        }
    }

    function mintWaitList(uint8 number, bytes32[] calldata proof) external payable nonReentrant {
        require(isPresaleActive, "Nobody: presale is not active.");

        require(number > 0, "Nobody: invalid mint number.");
        require(
            _addressMintedNumber[msg.sender] + number <= MAX_MINT_NUMBER_PER_ADDRESS,
            "Nobody: exceeded max mint number per address."
        );

        require(_verify(proof, waitListMerkleRoot, _leaf(msg.sender)), "Nobody: invalid wait list merkle proof.");

        require(_waitListAddressAmount[msg.sender] == 0, "Nobody: already minted.");

        uint256 ts = totalSupply();
        require(ts + number <= MAX_SUPPLY, "Nobody: mint would exceed max supply.");

        uint256 costToMint = presalePricePerToken * number;
        require(costToMint <= msg.value, "Nobody: ether value is not enough.");

        _waitListAddresses.push(msg.sender);
        _waitListAddressNumber[msg.sender] = number;
        _waitListAddressAmount[msg.sender] = costToMint;

        if (msg.value > costToMint) {
            Address.sendValue(payable(msg.sender), msg.value - costToMint);
        }
    }

    function mintPublicSale(uint8 number) external payable nonReentrant {
        require(isPublicSaleActive, "Nobody: public sale is not active.");

        require(number > 0, "Nobody: invalid mint number.");
        require(
            _addressMintedNumber[msg.sender] + number <= MAX_MINT_NUMBER_PER_ADDRESS,
            "Nobody: exceeded max mint number per address."
        );

        uint256 ts = totalSupply();
        require(ts + number <= MAX_SUPPLY, "Nobody: mint would exceed max supply.");

        uint256 costToMint = publicSalePricePerToken * number;
        require(costToMint <= msg.value, "Nobody: ether value is not enough.");

        _addressMintedNumber[msg.sender] += number;

        for (uint256 i = 0; i < number; i++) {
            _safeMint(msg.sender, ts + i);
        }

        if (msg.value > costToMint) {
            Address.sendValue(payable(msg.sender), msg.value - costToMint);
        }
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireMinted(tokenId);

        if (isRevealed == false) {
            return _notRevealedURI;
        }

        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
    }

    function _leaf(address account) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(account));
    }

    function _verify(bytes32[] memory proof, bytes32 root, bytes32 leaf) internal pure returns (bool) {
        return MerkleProof.verify(proof, root, leaf);
    }
}
