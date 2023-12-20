pragma solidity ^0.8.9;

import "forge-std/Test.sol";
import "../contracts/Nobody.sol";

contract Receiver1 is IERC721Receiver {
    address public nobodyAddress;
    bytes32[] public proof;

    constructor(address _nobodyAddress) {
        nobodyAddress = _nobodyAddress;
    }

    function mintWhitelist(uint8 number, bytes32[] calldata _proof) external payable {
        proof = _proof;
        (bool success, ) = nobodyAddress.call{value: msg.value}(
            abi.encodeWithSignature("mintWhitelist(uint8,bytes32[])", number, proof)
        );
        require(success, "Receiver:mintWhitelist call failed");
    }

    function onERC721Received(address, address, uint256, bytes calldata) external override returns (bytes4) {
        (bool success, ) = nobodyAddress.call{value: 1 ether}(
            abi.encodeWithSignature("mintWhitelist(uint8,bytes32[])", 1, proof)
        );
        require(success, "Receiver:onERC721Received call failed");

        return this.onERC721Received.selector;
    }
}

contract Receiver2 is IERC721Receiver {
    address public nobodyAddress;

    constructor(address _nobodyAddress) {
        nobodyAddress = _nobodyAddress;
    }

    function mintPublicSale(uint8 number) external payable {
        (bool success, ) = nobodyAddress.call{value: msg.value}(
            abi.encodeWithSignature("mintPublicSale(uint8)", number)
        );
        require(success, "Receiver:mintPublicSale call failed");
    }

    function onERC721Received(address, address, uint256, bytes calldata) external override returns (bytes4) {
        (bool success, ) = nobodyAddress.call{value: 1 ether}(abi.encodeWithSignature("mintPublicSale(uint8)", 1));
        require(success, "Receiver:onERC721Received call failed");

        return this.onERC721Received.selector;
    }
}

contract Receiver3 {
    address public nobodyAddress;
    bytes32[] public proof;

    constructor(address _nobodyAddress) {
        nobodyAddress = _nobodyAddress;
    }

    function mintWaitList(uint8 number, bytes32[] calldata _proof) external payable {
        proof = _proof;
        (bool success, ) = nobodyAddress.call{value: msg.value}(
            abi.encodeWithSignature("mintWaitList(uint8,bytes32[])", number, proof)
        );
        require(success, "Receiver: mintWaitList call failed");
    }

    receive() external payable {
        (bool success, ) = nobodyAddress.call{value: 1 ether}(
            abi.encodeWithSignature("mintWaitList(uint8,bytes32[])", 1, proof)
        );
        require(success, "Receiver: call failed");
    }
}

contract Receiver4 is IERC721Receiver {
    address public nobodyAddress;

    constructor(address _nobodyAddress) {
        nobodyAddress = _nobodyAddress;
    }

    function mintWhitelist(uint8 number, bytes32[] calldata _proof) external payable {
        (bool success, ) = nobodyAddress.call{value: msg.value}(
            abi.encodeWithSignature("mintWhitelist(uint8,bytes32[])", number, _proof)
        );
        require(success, "Receiver: mintWhitelist call failed");
    }

    receive() external payable {
        (bool success, ) = nobodyAddress.call{value: 1 ether}(abi.encodeWithSignature("mintPublicSale(uint8)", 1));
        require(success, "Receiver: call failed");
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}

contract Receiver5 is IERC721Receiver {
    address public nobodyAddress;
    bytes32[] public proof;

    constructor(address _nobodyAddress) {
        nobodyAddress = _nobodyAddress;
    }

    function mintWaitList(uint8 number, bytes32[] calldata _proof) external payable {
        proof = _proof;
        (bool success, ) = nobodyAddress.call{value: msg.value}(
            abi.encodeWithSignature("mintWaitList(uint8,bytes32[])", number, proof)
        );
        require(success, "Receiver: mintWaitList call failed");
    }

    receive() external payable {
        (bool success, ) = nobodyAddress.call{value: 0.1 ether}(
            abi.encodeWithSignature("mintWaitList(uint8,bytes32[])", 1, proof)
        );
        require(success, "Receiver: call failed");
    }

    function onERC721Received(address, address, uint256, bytes calldata) external override returns (bytes4) {
        (bool success, ) = nobodyAddress.call{value: 0.1 ether}(abi.encodeWithSignature("mintPublicSale(uint8)", 1));
        require(success, "Receiver:onERC721Received call failed");

        return this.onERC721Received.selector;
    }
}

contract Receiver6 {
    address public nobodyAddress;
    bytes32[] public proof;

    constructor(address _nobodyAddress) {
        nobodyAddress = _nobodyAddress;
    }

    function mintWaitList(uint8 number, bytes32[] calldata _proof) external payable {
        proof = _proof;
        (bool success, ) = nobodyAddress.call{value: msg.value}(
            abi.encodeWithSignature("mintWaitList(uint8,bytes32[])", number, proof)
        );
        require(success, "Receiver: mintWaitList call failed");
    }
}

contract NobodyTest is Test {
    Nobody nobody;
    bytes32[] proof;

    function setUp() public {
        nobody = new Nobody();
        //Tree
        //  └─ 3f11e07bb04a021422b82de54e893d032728d7b63a452efe04f2519d1c60e02a
        //     ├─ 7e0eefeb2d8740528b8f598997a219669f0842302d3c573e9bb7262be3387e63
        //     │  ├─ 8a3552d60a98e0ade765adddad0a2e420ca9b1eef5f326ba7ab860bb4ea72c94
        //     │  └─ 1ebaa930b8e9130423c183bf38b0564b0103180b7dad301013b18e59880541ae
        //     └─ b5bb773374649e0c7feeaec23c888d460c8c14995c7a75f6bbdd122a6b68c8a8
        //        ├─ f4ca8532861558e29f9858a3804245bb30f0303cc71e4192e41546237b6ce58b
        //        └─ 78f6b9d2b7f2913cd44e23d702ed8b2d23933033015e8d553edc9a2e3abb88e6  // receiver address 0x2e234DAe75C793f67A35089C9d99245E1C58470b
        nobody.setMerkleRoot(
            bytes32(0x3f11e07bb04a021422b82de54e893d032728d7b63a452efe04f2519d1c60e02a),
            bytes32(0x3f11e07bb04a021422b82de54e893d032728d7b63a452efe04f2519d1c60e02a)
        );

        proof = new bytes32[](2);
        proof[0] = bytes32(0xf4ca8532861558e29f9858a3804245bb30f0303cc71e4192e41546237b6ce58b);
        proof[1] = bytes32(0x7e0eefeb2d8740528b8f598997a219669f0842302d3c573e9bb7262be3387e63);
    }

    function testFail_mintWhitelist() public {
        Receiver1 receiver = new Receiver1(address(nobody));

        nobody.setIsPresaleActive(true);

        address caller = address(0x1111111111111111111111111111111111111111);
        vm.prank(caller);
        vm.deal(caller, 10 ether);
        vm.deal(address(receiver), 1 ether);

        receiver.mintWhitelist{value: 1 ether}(1, proof);
    }

    function testFail_mintPublicSale() public {
        Receiver2 receiver = new Receiver2(address(nobody));

        nobody.setIsPublicSaleActive(true);

        address caller = address(0x1111111111111111111111111111111111111111);
        vm.prank(caller);
        vm.deal(caller, 10 ether);
        vm.deal(address(receiver), 1 ether);

        receiver.mintPublicSale{value: 1 ether}(1);
    }

    function testFail_mintWaitList() public {
        Receiver3 receiver = new Receiver3(address(nobody));

        nobody.setIsPresaleActive(true);

        address caller = address(0x1111111111111111111111111111111111111111);
        vm.prank(caller);
        vm.deal(caller, 10 ether);
        vm.deal(address(receiver), 1 ether);

        receiver.mintWaitList{value: 1 ether}(1, proof);
    }

    function testFail_refund() public {
        Receiver4 receiver = new Receiver4(address(nobody));

        nobody.setIsPresaleActive(true);
        nobody.setIsPublicSaleActive(true);

        address caller = address(0x1111111111111111111111111111111111111111);
        vm.prank(caller);
        vm.deal(caller, 10 ether);
        vm.deal(address(receiver), 1 ether);

        receiver.mintWhitelist{value: 1 ether}(1, proof);
    }

    function testFail_airdropWaitList() public {
        Receiver5 receiver = new Receiver5(address(nobody));

        nobody.setIsPresaleActive(true);
        nobody.setIsPublicSaleActive(true);

        address caller = address(0x1111111111111111111111111111111111111111);
        vm.prank(caller);
        vm.deal(caller, 10 ether);
        vm.deal(address(receiver), 1 ether);

        receiver.mintWaitList{value: 0.1 ether}(1, proof);

        address[] memory addresses = new address[](1);
        addresses[0] = address(receiver);
        nobody.airdropWaitList(addresses);
    }

    function test_refundWaitList_0() public {
        Receiver5 receiver = new Receiver5(address(nobody));

        nobody.setIsPresaleActive(true);

        address caller = address(0x1111111111111111111111111111111111111111);
        vm.prank(caller);
        vm.deal(caller, 10 ether);
        vm.deal(address(receiver), 1 ether);

        receiver.mintWaitList{value: 0.1 ether}(1, proof);

        nobody.setIsPresaleActive(false);

        address[] memory addresses = new address[](1);
        addresses[0] = address(receiver);
        nobody.refundWaitList(addresses);
    }

    function test_refundWaitList_1() public {
        Receiver6 receiver = new Receiver6(address(nobody));

        nobody.setIsPresaleActive(true);

        address caller = address(0x1111111111111111111111111111111111111111);
        vm.prank(caller);
        vm.deal(caller, 10 ether);
        vm.deal(address(receiver), 1 ether);

        receiver.mintWaitList{value: 0.1 ether}(1, proof);

        nobody.setIsPresaleActive(false);

        address[] memory addresses = new address[](1);
        addresses[0] = address(receiver);
        nobody.refundWaitList(addresses);
    }
}
