import { Nobody } from "../typechain-types"

import { expect } from "chai"
import { ethers } from "hardhat"

describe("Nobody", function () {
  let nobody: Nobody
  const provenance = "0x299933cac28b9df1ae6dbf7f5d9814b5fe409a67795ed15dea6135b5fe78c6e3"

  beforeEach(async function () {
    const Nobody = await ethers.getContractFactory("Nobody")
    nobody = await Nobody.deploy()
    await nobody.waitForDeployment()
  })

  it("test setProvenance", async function () {
    const [, addr1] = await ethers.getSigners()

    await expect(nobody.connect(addr1).setProvenance(provenance)).to.be.revertedWith("Ownable: caller is not the owner")

    const setProvenanceTx = await nobody.setProvenance(provenance)
    await setProvenanceTx.wait()

    expect(await nobody.PROVENANCE()).to.equal(provenance)
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

  it("test tokenURI", async function () {
    const [, addr1, addr2, addr3] = await ethers.getSigners()

    expect(await nobody.isRevealed()).to.equal(false)

    await expect(nobody.connect(addr1).setNotRevealedURI("ipfs://NOTREVEALED")).to.be.revertedWith("Ownable: caller is not the owner")

    const setNotRevealedURITx = await nobody.setNotRevealedURI("ipfs://NOTREVEALED")
    await setNotRevealedURITx.wait()

    await expect(nobody.tokenURI(0)).to.be.revertedWith("ERC721: invalid token ID")

    const airdropTx = await nobody.airdrop([addr1], 5)
    await airdropTx.wait()

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
    const [owner, addr1, addr2, addr3, addr4, addr5, addr6] = await ethers.getSigners()

    for (let i = 0; i < 49; i++) {
      const airdropTx = await nobody.airdrop([addr1.address, addr2.address, addr3.address, addr4.address], 50)
      await airdropTx.wait()
    }

    await expect(await nobody.totalSupply()).to.equal(9800)
    await expect(await nobody.balanceOf(addr1.address)).to.equal(2450)
    await expect(await nobody.balanceOf(addr2.address)).to.equal(2450)
    await expect(await nobody.balanceOf(addr3.address)).to.equal(2450)
    await expect(await nobody.balanceOf(addr4.address)).to.equal(2450)

    const airdropTx = await nobody.airdrop([addr5.address], 199)
    await airdropTx.wait()

    await expect(await nobody.totalSupply()).to.equal(9999)
    await expect(await nobody.balanceOf(addr5.address)).to.equal(199)

    await expect(nobody.airdrop([addr6], 500)).to.be.revertedWithCustomError(nobody, "ExceedMaxSupply")
    await expect(nobody.airdrop([addr6], 2)).to.be.revertedWithCustomError(nobody, "ExceedMaxSupply")

    const airdropTx1 = await nobody.airdrop([addr6.address], 1)
    await airdropTx1.wait()

    await expect(await nobody.totalSupply()).to.equal(10000)
    await expect(await nobody.ownerOf(9999)).to.equal(addr6.address)

    const airdropTx2 = await nobody.airdrop([owner.address], 0)
    await airdropTx2.wait()

    await expect(await nobody.totalSupply()).to.equal(10000)
    await expect(nobody.ownerOf(10000)).to.be.revertedWith("ERC721: invalid token ID")

    await expect(nobody.airdrop([owner], 1)).to.be.revertedWithCustomError(nobody, "ExceedMaxSupply")
    await expect(nobody.airdrop([addr1], 50)).to.be.revertedWithCustomError(nobody, "ExceedMaxSupply")
  })
})
