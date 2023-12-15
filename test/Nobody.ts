import { Nobody } from "../typechain-types"

import { expect } from "chai"
import { ethers } from "hardhat"

// https://lab.miguelmota.com/merkletreejs/example/
// Hash function: Keccak-256
// Options: hashLeaves sortPairs

// whitelist
// [
//   "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
//   "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
//   "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
// ]
// Tree
//  └─ 299933cac28b9df1ae6dbf7f5d9814b5fe409a67795ed15dea6135b5fe78c6e3
//     ├─ 343750465941b29921f50a28e0e43050e5e1c2611a3ea8d7fe1001090d5e1436
//     │  ├─ 00314e565e0574cb412563df634608d76f5c59d9f817e85966100ec1d48005c0  addr1 Keccak-256 hash
//     │  └─ 8a3552d60a98e0ade765adddad0a2e420ca9b1eef5f326ba7ab860bb4ea72c94  addr2 Keccak-256 hash
//     └─ 1ebaa930b8e9130423c183bf38b0564b0103180b7dad301013b18e59880541ae
//        └─ 1ebaa930b8e9130423c183bf38b0564b0103180b7dad301013b18e59880541ae  addr3 Keccak-256 hash

// wait list
// [
//   "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
//   "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
//   "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
//   "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"
// ]
// Tree
// └─ ee068f44d79b0b5ec5c9fdce424d1cb399ed31b481f41d901b2d90447857ca89
//    ├─ 7e0eefeb2d8740528b8f598997a219669f0842302d3c573e9bb7262be3387e63
//    │  ├─ 8a3552d60a98e0ade765adddad0a2e420ca9b1eef5f326ba7ab860bb4ea72c94 addr2 Keccak-256 hash
//    │  └─ 1ebaa930b8e9130423c183bf38b0564b0103180b7dad301013b18e59880541ae addr3 Keccak-256 hash
//    └─ a22d2d4af6076ff70babd4ffc5035bdce39be98f440f86a0ddc202e3cd935a59
//       ├─ f4ca8532861558e29f9858a3804245bb30f0303cc71e4192e41546237b6ce58b addr4 Keccak-256 hash
//       └─ e5c951f74bc89efa166514ac99d872f6b7a3c11aff63f51246c3742dfa925c9b addr5 Keccak-256 hash

describe("Nobody", function () {
  let nobody: Nobody
  const whitelistMerkelRoot = "0x299933cac28b9df1ae6dbf7f5d9814b5fe409a67795ed15dea6135b5fe78c6e3"
  const waitListMerkelRoot = "0xee068f44d79b0b5ec5c9fdce424d1cb399ed31b481f41d901b2d90447857ca89"
  const addr1WhitelistProof = ["0x8a3552d60a98e0ade765adddad0a2e420ca9b1eef5f326ba7ab860bb4ea72c94", "0x1ebaa930b8e9130423c183bf38b0564b0103180b7dad301013b18e59880541ae"]
  const addr2WhitelistProof = ["0x00314e565e0574cb412563df634608d76f5c59d9f817e85966100ec1d48005c0", "0x1ebaa930b8e9130423c183bf38b0564b0103180b7dad301013b18e59880541ae"]
  const addr3WhitelistProof = ["0x343750465941b29921f50a28e0e43050e5e1c2611a3ea8d7fe1001090d5e1436"]
  const addr2WaitListProof = ["0x1ebaa930b8e9130423c183bf38b0564b0103180b7dad301013b18e59880541ae", "0xa22d2d4af6076ff70babd4ffc5035bdce39be98f440f86a0ddc202e3cd935a59"]
  const addr3WaitListProof = ["0x8a3552d60a98e0ade765adddad0a2e420ca9b1eef5f326ba7ab860bb4ea72c94", "0xa22d2d4af6076ff70babd4ffc5035bdce39be98f440f86a0ddc202e3cd935a59"]
  const addr4WaitListProof = ["0xe5c951f74bc89efa166514ac99d872f6b7a3c11aff63f51246c3742dfa925c9b", "0x7e0eefeb2d8740528b8f598997a219669f0842302d3c573e9bb7262be3387e63"]
  const addr5WaitListProof = ["0xf4ca8532861558e29f9858a3804245bb30f0303cc71e4192e41546237b6ce58b", "0x7e0eefeb2d8740528b8f598997a219669f0842302d3c573e9bb7262be3387e63"]

  beforeEach(async function () {
    const Nobody = await ethers.getContractFactory("Nobody")
    nobody = await Nobody.deploy()
    await nobody.waitForDeployment()
  })

  it("test setTokenPrice", async function () {
    const [, addr1] = await ethers.getSigners()

    expect(await nobody.presalePricePerToken()).to.equal(ethers.parseEther("0.1"))
    expect(await nobody.publicSalePricePerToken()).to.equal(ethers.parseEther("0.2"))

    await expect(nobody.connect(addr1).setTokenPrice(ethers.parseEther("0.22"), ethers.parseEther("0.33"))).to.be.revertedWith("Ownable: caller is not the owner")

    const setTokenPriceTx = await nobody.setTokenPrice(ethers.parseEther("0.22"), ethers.parseEther("0.33"))
    await setTokenPriceTx.wait()

    expect(await nobody.presalePricePerToken()).to.equal(ethers.parseEther("0.22"))
    expect(await nobody.publicSalePricePerToken()).to.equal(ethers.parseEther("0.33"))
  })

  it("test setMerkleRoot", async function () {
    const [, addr1] = await ethers.getSigners()

    await expect(nobody.connect(addr1).setMerkleRoot(whitelistMerkelRoot, waitListMerkelRoot)).to.be.revertedWith("Ownable: caller is not the owner")

    const setMerkleRootTx = await nobody.setMerkleRoot(whitelistMerkelRoot, waitListMerkelRoot)
    await setMerkleRootTx.wait()

    expect(await nobody.whitelistMerkleRoot()).to.equal(whitelistMerkelRoot)
    expect(await nobody.waitListMerkleRoot()).to.equal(waitListMerkelRoot)
  })

  it("test setProvenance", async function () {
    const [, addr1] = await ethers.getSigners()

    await expect(nobody.connect(addr1).setProvenance(whitelistMerkelRoot)).to.be.revertedWith("Ownable: caller is not the owner")

    const setProvenanceTx = await nobody.setProvenance(whitelistMerkelRoot)
    await setProvenanceTx.wait()

    expect(await nobody.PROVENANCE()).to.equal(whitelistMerkelRoot)
  })

  it("test supportsInterface", async function () {
    expect(await nobody.supportsInterface("0x00000001")).to.equal(false)
    expect(await nobody.supportsInterface("0x01ffc9a7")).to.equal(true) // ERC165
    expect(await nobody.supportsInterface("0x80ac58cd")).to.equal(true) // ERC721
    expect(await nobody.supportsInterface("0x5b5e139f")).to.equal(true) // ERC721Metadata
    expect(await nobody.supportsInterface("0x780e9d63")).to.equal(true) // ERC721Enumerable
    expect(await nobody.supportsInterface("0x2a55205a")).to.equal(true) // ERC2981
  })

  it("test airdrop", async function () {
    const [, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners()
    await expect(nobody.connect(addr1).airdrop([addr1, addr2, addr3, addr4, addr5], 2)).to.be.revertedWith("Ownable: caller is not the owner")

    const airdropTx = await nobody.airdrop([addr1, addr2, addr3, addr4, addr5], 5)
    await airdropTx.wait()

    await expect(await nobody.totalSupply()).to.equal(25)
    await expect(await nobody.balanceOf(addr1.address)).to.equal(5)
    await expect(await nobody.balanceOf(addr2.address)).to.equal(5)
    await expect(await nobody.balanceOf(addr3.address)).to.equal(5)
    await expect(await nobody.balanceOf(addr4.address)).to.equal(5)
    await expect(await nobody.balanceOf(addr5.address)).to.equal(5)
  })

  it("test mintWhitelist", async function () {
    const [, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners()

    expect(await nobody.isPresaleActive()).to.equal(false)

    await expect(nobody.connect(addr1).setIsPresaleActive(true)).to.be.revertedWith("Ownable: caller is not the owner")

    const setMerkleRootTx = await nobody.setMerkleRoot(whitelistMerkelRoot, waitListMerkelRoot)
    await setMerkleRootTx.wait()

    await expect(nobody.connect(addr1).mintWhitelist(1, addr1WhitelistProof)).to.be.revertedWith("Nobody: presale is not active.")

    const setIsPresaleActiveTx = await nobody.setIsPresaleActive(true)
    await setIsPresaleActiveTx.wait()

    expect(await nobody.isPresaleActive()).to.equal(true)

    //addr1
    await expect(nobody.connect(addr1).mintWhitelist(0, addr1WhitelistProof)).to.be.revertedWith("Nobody: invalid mint number.")

    await expect(nobody.connect(addr1).mintWhitelist(2, addr1WhitelistProof)).to.be.revertedWith("Nobody: exceeded max mint number per address.")

    await expect(nobody.connect(addr1).mintWhitelist(1, addr1WhitelistProof)).to.be.revertedWith("Nobody: ether value is not enough.")

    await expect(nobody.connect(addr1).mintWhitelist(1, addr1WhitelistProof, { value: ethers.parseEther("0.0999") })).to.be.revertedWith("Nobody: ether value is not enough.")

    const mintWhitelistTx = await nobody.connect(addr1).mintWhitelist(1, addr1WhitelistProof, { value: ethers.parseEther("0.1") })
    await mintWhitelistTx.wait()

    expect(await ethers.provider.getBalance(await nobody.getAddress())).to.equal(ethers.parseEther("0.1"))
    expect(await nobody.balanceOf(addr1)).to.equal(1)

    await expect(nobody.connect(addr1).mintWhitelist(1, addr1WhitelistProof, { value: ethers.parseEther("0.1") })).to.be.revertedWith("Nobody: exceeded max mint number per address.")

    //addr2 check refund
    const addr2Balance = await ethers.provider.getBalance(addr2.address)

    const mintWhitelistTx2 = await nobody.connect(addr2).mintWhitelist(1, addr2WhitelistProof, { value: ethers.parseEther("1") })
    const receipt = await mintWhitelistTx2.wait()
    // @ts-ignore
    const gasFee = receipt.gasUsed * mintWhitelistTx2.gasPrice

    expect(await ethers.provider.getBalance(await nobody.getAddress())).to.equal(ethers.parseEther("0.2"))
    expect(await nobody.balanceOf(addr2)).to.equal(1)
    //refund
    expect(await ethers.provider.getBalance(addr2.address)).to.equal(addr2Balance - ethers.parseEther("0.1") - gasFee)

    //addr3  check verify
    await expect(nobody.connect(addr3).mintWhitelist(1, addr1WhitelistProof)).to.be.revertedWith("Nobody: invalid whitelist merkle proof.")
    await expect(nobody.connect(addr3).mintWhitelist(1, addr2WhitelistProof)).to.be.revertedWith("Nobody: invalid whitelist merkle proof.")

    const mintWhitelistTx3 = await nobody.connect(addr3).mintWhitelist(1, addr3WhitelistProof, { value: ethers.parseEther("0.1") })
    await mintWhitelistTx3.wait()

    expect(await ethers.provider.getBalance(await nobody.getAddress())).to.equal(ethers.parseEther("0.3"))
    expect(await nobody.balanceOf(addr3)).to.equal(1)

    //addr4 addr5
    await expect(nobody.connect(addr4).mintWhitelist(1, addr1WhitelistProof, { value: ethers.parseEther("0.1") })).to.be.revertedWith("Nobody: invalid whitelist merkle proof.")
    await expect(nobody.connect(addr5).mintWhitelist(1, addr2WhitelistProof, { value: ethers.parseEther("0.1") })).to.be.revertedWith("Nobody: invalid whitelist merkle proof.")
    await expect(nobody.connect(addr4).mintWhitelist(1, addr4WaitListProof, { value: ethers.parseEther("0.1") })).to.be.revertedWith("Nobody: invalid whitelist merkle proof.")
    await expect(nobody.connect(addr5).mintWhitelist(1, addr5WaitListProof, { value: ethers.parseEther("0.1") })).to.be.revertedWith("Nobody: invalid whitelist merkle proof.")
  })

  it("test mintWaitList", async function () {
    const [, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners()

    const setMerkleRootTx = await nobody.setMerkleRoot(whitelistMerkelRoot, waitListMerkelRoot)
    await setMerkleRootTx.wait()

    await expect(nobody.connect(addr4).mintWaitList(1, addr4WaitListProof)).to.be.revertedWith("Nobody: presale is not active.")

    const setIsPresaleActiveTx = await nobody.setIsPresaleActive(true)
    await setIsPresaleActiveTx.wait()

    expect(await nobody.isPresaleActive()).to.equal(true)

    await expect(nobody.connect(addr4).mintWaitList(0, addr4WaitListProof)).to.be.revertedWith("Nobody: invalid mint number.")

    await expect(nobody.connect(addr4).mintWaitList(2, addr4WaitListProof, { value: ethers.parseEther("0.2") })).to.be.revertedWith("Nobody: exceeded max mint number per address.")

    await expect(nobody.connect(addr4).mintWaitList(1, addr4WaitListProof)).to.be.revertedWith("Nobody: ether value is not enough.")

    await expect(nobody.connect(addr1).mintWaitList(1, addr1WhitelistProof, { value: ethers.parseEther("0.1") })).to.be.revertedWith("Nobody: invalid wait list merkle proof.")
    await expect(nobody.connect(addr1).mintWaitList(1, addr4WaitListProof, { value: ethers.parseEther("0.1") })).to.be.revertedWith("Nobody: invalid wait list merkle proof.")

    const mintWaitListTx = await nobody.connect(addr4).mintWaitList(1, addr4WaitListProof, { value: ethers.parseEther("0.1") })
    await mintWaitListTx.wait()

    expect(await ethers.provider.getBalance(await nobody.getAddress())).to.equal(ethers.parseEther("0.1"))
    expect(await nobody.balanceOf(addr4)).to.equal(0)

    await expect(nobody.connect(addr4).mintWaitList(1, addr4WaitListProof, { value: ethers.parseEther("0.1") })).to.be.revertedWith("Nobody: already minted.")

    const addr5Balance = await ethers.provider.getBalance(addr5.address)
    const mintWaitListTx1 = await nobody.connect(addr5).mintWaitList(1, addr5WaitListProof, { value: ethers.parseEther("1") })
    const receipt = await mintWaitListTx1.wait()
    // @ts-ignore
    const gasFee = receipt.gasUsed * mintWaitListTx1.gasPrice

    expect(await ethers.provider.getBalance(await nobody.getAddress())).to.equal(ethers.parseEther("0.2"))
    expect(await nobody.balanceOf(addr5)).to.equal(0)
    expect(await ethers.provider.getBalance(addr5.address)).to.equal(addr5Balance - ethers.parseEther("0.1") - gasFee)

    const mintWhitelistTx = await nobody.connect(addr1).mintWhitelist(1, addr1WhitelistProof, { value: ethers.parseEther("0.1") })
    await mintWhitelistTx.wait()
    expect(await nobody.balanceOf(addr1)).to.equal(1)
    expect(await ethers.provider.getBalance(await nobody.getAddress())).to.equal(ethers.parseEther("0.3"))

    const mintWhitelistTx2 = await nobody.connect(addr2).mintWhitelist(1, addr2WhitelistProof, { value: ethers.parseEther("0.1") })
    await mintWhitelistTx2.wait()
    expect(await nobody.balanceOf(addr2)).to.equal(1)
    expect(await ethers.provider.getBalance(await nobody.getAddress())).to.equal(ethers.parseEther("0.4"))
    await expect(nobody.connect(addr2).mintWaitList(1, addr2WaitListProof, { value: ethers.parseEther("0.1") })).to.be.revertedWith("Nobody: exceeded max mint number per address.")

    const mintWaitListTx3 = await nobody.connect(addr3).mintWaitList(1, addr3WaitListProof, { value: ethers.parseEther("0.1") })
    await mintWaitListTx3.wait()
    expect(await nobody.balanceOf(addr3)).to.equal(0)
    expect(await ethers.provider.getBalance(await nobody.getAddress())).to.equal(ethers.parseEther("0.5"))

    const mintWhitelistTx3 = await nobody.connect(addr3).mintWhitelist(1, addr3WhitelistProof, { value: ethers.parseEther("0.1") })
    await mintWhitelistTx3.wait()
    expect(await nobody.balanceOf(addr3)).to.equal(1)
    expect(await ethers.provider.getBalance(await nobody.getAddress())).to.equal(ethers.parseEther("0.6"))

    const setIsPresaleActiveTx1 = await nobody.setIsPresaleActive(false)
    await setIsPresaleActiveTx1.wait()

    await expect(nobody.connect(addr1).airdropWaitList([addr1.address, addr4.address, addr5.address])).to.be.revertedWith("Ownable: caller is not the owner")
    await expect(nobody.airdropWaitList([addr1.address, addr4.address, addr5.address])).to.be.revertedWith("Nobody: invalid address.")
    await expect(nobody.airdropWaitList([addr3.address, addr4.address, addr5.address])).to.be.revertedWith("Nobody: exceeded max mint number per address.")

    const airdropWaitListTx = await nobody.airdropWaitList([addr4.address])
    await airdropWaitListTx.wait()
    expect(await nobody.balanceOf(addr4)).to.equal(1)
    await expect(nobody.airdropWaitList([addr4.address])).to.be.revertedWith("Nobody: invalid address.")

    await expect(nobody.connect(addr1).refundWaitList([addr1.address, addr4.address, addr5.address])).to.be.revertedWith("Ownable: caller is not the owner")

    const addr1Balance = await ethers.provider.getBalance(addr1.address)
    const addr2Balance = await ethers.provider.getBalance(addr2.address)
    const addr3Balance = await ethers.provider.getBalance(addr3.address)
    const addr4Balance = await ethers.provider.getBalance(addr4.address)
    const addr5Balance2 = await ethers.provider.getBalance(addr5.address)

    const refundWaitListTx = await nobody.refundWaitList([addr1, addr2, addr3, addr4, addr5])
    await refundWaitListTx.wait()

    expect(await ethers.provider.getBalance(await nobody.getAddress())).to.equal(ethers.parseEther("0.4"))
    expect(await ethers.provider.getBalance(addr1.address)).to.equal(addr1Balance)
    expect(await ethers.provider.getBalance(addr2.address)).to.equal(addr2Balance)
    expect(await ethers.provider.getBalance(addr3.address)).to.equal(addr3Balance + ethers.parseEther("0.1"))
    expect(await ethers.provider.getBalance(addr4.address)).to.equal(addr4Balance)
    expect(await ethers.provider.getBalance(addr5.address)).to.equal(addr5Balance2 + ethers.parseEther("0.1"))
  })

  it("test mintPublicSale", async function () {
    const [, addr1, addr2, addr3, addr4, addr5, addr6] = await ethers.getSigners()

    expect(await nobody.isPublicSaleActive()).to.equal(false)

    await expect(nobody.connect(addr1).setIsPublicSaleActive(true)).to.be.revertedWith("Ownable: caller is not the owner")

    const setMerkleRootTx = await nobody.setMerkleRoot(whitelistMerkelRoot, waitListMerkelRoot)
    await setMerkleRootTx.wait()

    const setIsPresaleActiveTx = await nobody.setIsPresaleActive(true)
    await setIsPresaleActiveTx.wait()

    const mintWhitelistTx = await nobody.connect(addr1).mintWhitelist(1, addr1WhitelistProof, { value: ethers.parseEther("0.1") })
    await mintWhitelistTx.wait()

    const mintWhitelistTx2 = await nobody.connect(addr2).mintWhitelist(1, addr2WhitelistProof, { value: ethers.parseEther("1") })
    await mintWhitelistTx2.wait()

    const mintWhitelistTx4 = await nobody.connect(addr4).mintWaitList(1, addr4WaitListProof, { value: ethers.parseEther("0.1") })
    await mintWhitelistTx4.wait()

    const setIsPresaleActiveTx1 = await nobody.setIsPresaleActive(false)
    await setIsPresaleActiveTx1.wait()

    const airdropWaitListTx = await nobody.airdropWaitList([addr4.address])
    await airdropWaitListTx.wait()

    await expect(nobody.connect(addr3).mintWhitelist(1, addr3WhitelistProof, { value: ethers.parseEther("0.1") })).to.be.revertedWith("Nobody: presale is not active.")

    await expect(nobody.connect(addr3).mintPublicSale(1)).to.be.revertedWith("Nobody: public sale is not active.")

    const setIsPublicSaleActiveTx = await nobody.setIsPublicSaleActive(true)
    await setIsPublicSaleActiveTx.wait()

    expect(await nobody.isPublicSaleActive()).to.equal(true)

    // addr1
    await expect(nobody.connect(addr1).mintPublicSale(0)).to.be.revertedWith("Nobody: invalid mint number.")
    await expect(nobody.connect(addr1).mintPublicSale(1, { value: ethers.parseEther("0.2") })).to.be.revertedWith("Nobody: exceeded max mint number per address.")

    expect(await ethers.provider.getBalance(await nobody.getAddress())).to.equal(ethers.parseEther("0.3"))
    expect(await nobody.balanceOf(addr1)).to.equal(1)

    // addr3
    await expect(nobody.connect(addr3).mintPublicSale(2)).to.be.revertedWith("Nobody: exceeded max mint number per address.")

    const mintPublicSaleTx3 = await nobody.connect(addr3).mintPublicSale(1, { value: ethers.parseEther("0.2") })
    await mintPublicSaleTx3.wait()

    expect(await ethers.provider.getBalance(await nobody.getAddress())).to.equal(ethers.parseEther("0.5"))
    expect(await nobody.balanceOf(addr3)).to.equal(1)

    // addr4
    await expect(nobody.connect(addr4).mintPublicSale(1, { value: ethers.parseEther("0.2") })).to.be.revertedWith("Nobody: exceeded max mint number per address.")

    expect(await ethers.provider.getBalance(await nobody.getAddress())).to.equal(ethers.parseEther("0.5"))
    expect(await nobody.balanceOf(addr4)).to.equal(1)

    // addr5
    expect(await nobody.balanceOf(addr5)).to.equal(0)
    await expect(nobody.connect(addr5).mintPublicSale(2)).to.be.revertedWith("Nobody: exceeded max mint number per address.")
    await expect(nobody.connect(addr5).mintPublicSale(1)).to.be.revertedWith("Nobody: ether value is not enough.")

    const mintPublicSaleTx5 = await nobody.connect(addr5).mintPublicSale(1, { value: ethers.parseEther("0.2") })
    await mintPublicSaleTx5.wait()

    expect(await ethers.provider.getBalance(await nobody.getAddress())).to.equal(ethers.parseEther("0.7"))
    expect(await nobody.balanceOf(addr5)).to.equal(1)

    await expect(nobody.connect(addr5).mintPublicSale(1, { value: ethers.parseEther("0.2") })).to.be.revertedWith("Nobody: exceeded max mint number per address.")

    // addr6
    const addr6Balance = await ethers.provider.getBalance(addr6.address)

    const mintPublicSaleTx6 = await nobody.connect(addr6).mintPublicSale(1, { value: ethers.parseEther("1") })
    const receipt = await mintPublicSaleTx6.wait()
    // @ts-ignore
    const gasFee = receipt.gasUsed * mintPublicSaleTx6.gasPrice

    expect(await ethers.provider.getBalance(await nobody.getAddress())).to.equal(ethers.parseEther("0.9"))
    expect(await nobody.balanceOf(addr6)).to.equal(1)
    //refund
    expect(await ethers.provider.getBalance(addr6.address)).to.equal(addr6Balance - ethers.parseEther("0.2") - gasFee)
  })

  it("test setRoyaltyInfo", async function () {
    const [owner, addr1] = await ethers.getSigners()

    await expect(nobody.connect(addr1).setRoyaltyInfo(addr1.address, 500)).to.be.revertedWith("Ownable: caller is not the owner")

    const [receiver, amount] = await nobody.royaltyInfo(0, ethers.parseEther("0.22"))
    expect(receiver).to.equal(ethers.ZeroAddress)
    expect(amount).to.equal(0)

    const setRoyaltyInfoTx = await nobody.setRoyaltyInfo(owner.address, 500)
    await setRoyaltyInfoTx.wait()

    const [receiver1, amount1] = await nobody.royaltyInfo(0, ethers.parseEther("1"))
    expect(receiver1).to.equal(owner.address)
    expect(amount1).to.equal(ethers.parseEther("0.05"))
  })

  it("test withdraw", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners()

    // mintPresale
    const setMerkleRootTx = await nobody.setMerkleRoot(whitelistMerkelRoot, waitListMerkelRoot)
    await setMerkleRootTx.wait()

    const setIsPresaleActiveTx = await nobody.setIsPresaleActive(true)
    await setIsPresaleActiveTx.wait()

    const mintWhitelistTx = await nobody.connect(addr1).mintWhitelist(1, addr1WhitelistProof, { value: ethers.parseEther("1") })
    await mintWhitelistTx.wait()

    const setIsPublicSaleActiveTx = await nobody.setIsPublicSaleActive(true)
    await setIsPublicSaleActiveTx.wait()

    const mintPublicSaleTx = await nobody.connect(addr2).mintPublicSale(1, { value: ethers.parseEther("0.2") })
    await mintPublicSaleTx.wait()

    expect(await ethers.provider.getBalance(await nobody.getAddress())).to.equal(ethers.parseEther("0.3"))

    await expect(nobody.connect(addr3).withdraw(0)).to.be.revertedWith("Ownable: caller is not the owner")

    const ownerBalance = await ethers.provider.getBalance(owner.address)
    const withdrawTx = await nobody.withdraw(ethers.parseEther("0.1"))
    const receipt = await withdrawTx.wait()
    // @ts-ignore
    const gasFee = receipt.gasUsed * withdrawTx.gasPrice
    expect(await ethers.provider.getBalance(owner.address)).to.equal(ownerBalance + ethers.parseEther("0.1") - gasFee)
    expect(await ethers.provider.getBalance(await nobody.getAddress())).to.equal(ethers.parseEther("0.2"))

    const ownerBalance1 = await ethers.provider.getBalance(owner.address)
    const withdrawTx1 = await nobody.withdraw(0)
    const receipt1 = await withdrawTx1.wait()
    // @ts-ignore
    const gasFee1 = receipt1.gasUsed * withdrawTx1.gasPrice
    expect(await ethers.provider.getBalance(owner.address)).to.equal(ownerBalance1 + ethers.parseEther("0.2") - gasFee1)
    expect(await ethers.provider.getBalance(await nobody.getAddress())).to.equal(0)
  })

  it("test tokenURI", async function () {
    const [, addr1, addr2, addr3] = await ethers.getSigners()

    expect(await nobody.isRevealed()).to.equal(false)

    await expect(nobody.connect(addr1).setNotRevealedURI("ipfs://NOTREVEALED")).to.be.revertedWith("Ownable: caller is not the owner")

    const setNotRevealedURITx = await nobody.setNotRevealedURI("ipfs://NOTREVEALED")
    await setNotRevealedURITx.wait()

    await expect(nobody.tokenURI(0)).to.be.revertedWith("ERC721: invalid token ID")

    const setMerkleRootTx = await nobody.setMerkleRoot(whitelistMerkelRoot, waitListMerkelRoot)
    await setMerkleRootTx.wait()

    const setIsPresaleActiveTx = await nobody.setIsPresaleActive(true)
    await setIsPresaleActiveTx.wait()

    const mintWhitelistTx = await nobody.connect(addr2).mintWhitelist(1, addr2WhitelistProof, { value: ethers.parseEther("0.1") })
    await mintWhitelistTx.wait()

    const mintWhitelistTx1 = await nobody.connect(addr3).mintWhitelist(1, addr3WhitelistProof, { value: ethers.parseEther("0.1") })
    await mintWhitelistTx1.wait()

    await expect(await nobody.tokenURI(0)).to.be.equal("ipfs://NOTREVEALED")
    await expect(await nobody.tokenURI(1)).to.be.equal("ipfs://NOTREVEALED")

    await expect(nobody.connect(addr1).setBaseURI("ipfs://BASEURI/")).to.be.revertedWith("Ownable: caller is not the owner")
    await expect(nobody.connect(addr1).setIsRevealed(true)).to.be.revertedWith("Ownable: caller is not the owner")

    const setBaseURITx = await nobody.setBaseURI("ipfs://BASEURI/")
    await setBaseURITx.wait()

    const setIsRevealedTx = await nobody.setIsRevealed(true)
    await setIsRevealedTx.wait()

    expect(await nobody.baseURI()).to.equal("ipfs://BASEURI/")
    expect(await nobody.isRevealed()).to.equal(true)

    await expect(await nobody.tokenURI(0)).to.be.equal("ipfs://BASEURI/0")
    await expect(await nobody.tokenURI(1)).to.be.equal("ipfs://BASEURI/1")
  })

  it("test maxSupply", async function () {
    const [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners()

    const setMerkleRootTx = await nobody.setMerkleRoot(whitelistMerkelRoot, waitListMerkelRoot)
    await setMerkleRootTx.wait()

    for (let i = 0; i < 39; i++) {
      const airdropTx = await nobody.airdrop([addr1.address], 250)
      await airdropTx.wait()
    }

    const airdropTx = await nobody.airdrop([addr1.address], 249)
    await airdropTx.wait()

    await expect(await nobody.totalSupply()).to.equal(9999)
    await expect(await nobody.balanceOf(addr1.address)).to.equal(9999)

    const setIsPresaleActiveTx = await nobody.setIsPresaleActive(true)
    await setIsPresaleActiveTx.wait()

    const mintWaitListTx1 = await nobody.connect(addr4).mintWaitList(1, addr4WaitListProof, { value: ethers.parseEther("0.1") })
    await mintWaitListTx1.wait()

    const mintWhitelistTx = await nobody.connect(addr2).mintWhitelist(1, addr2WhitelistProof, { value: ethers.parseEther("0.1") })
    await mintWhitelistTx.wait()
    await expect(await nobody.totalSupply()).to.equal(10000)
    await expect(await nobody.ownerOf(9999)).to.equal(addr2.address)

    await expect(nobody.airdrop([addr3], 1)).to.be.revertedWith("Nobody: airdrop would exceed max supply.")
    await expect(nobody.connect(addr3).mintWhitelist(1, addr3WhitelistProof, { value: ethers.parseEther("0.1") })).to.be.revertedWith("Nobody: mint would exceed max supply.")
    await expect(nobody.airdropWaitList([addr4])).to.be.revertedWith("Nobody: airdrop would exceed max supply.")
    await expect(nobody.connect(addr5).mintWaitList(1, addr5WaitListProof, { value: ethers.parseEther("0.1") })).to.be.revertedWith("Nobody: mint would exceed max supply.")

    const setIsPresaleActiveTx1 = await nobody.setIsPresaleActive(false)
    await setIsPresaleActiveTx1.wait()
    const setIsPublicSaleActiveTx = await nobody.setIsPublicSaleActive(true)
    await setIsPublicSaleActiveTx.wait()

    await expect(nobody.connect(addr3).mintPublicSale(1, { value: ethers.parseEther("0.2") })).to.be.revertedWith("Nobody: mint would exceed max supply.")
  })
})
