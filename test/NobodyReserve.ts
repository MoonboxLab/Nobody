import { NobodyReserve, VRFCoordinatorV2Mock } from "../typechain-types"

import { expect } from "chai"
import { ethers, network } from "hardhat"

describe("NobodyReserve", function () {
  let reserve: NobodyReserve
  let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock
  // vrf parameter
  const keyHash = "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f"
  const requestConfirmations = 3
  const callbackGasLimit = 2000000
  const numWords = 3

  beforeEach(async function () {
    const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock")
    vrfCoordinatorV2Mock = await VRFCoordinatorV2Mock.deploy(0, 0)
    await vrfCoordinatorV2Mock.waitForDeployment()
    await vrfCoordinatorV2Mock.createSubscription()
    await vrfCoordinatorV2Mock.fundSubscription(1, ethers.parseEther("1"))

    const NobodyReserve = await ethers.getContractFactory("NobodyReserve")
    reserve = await NobodyReserve.deploy(vrfCoordinatorV2Mock.getAddress(), 1)
    await reserve.waitForDeployment()

    await vrfCoordinatorV2Mock.addConsumer(1, await reserve.getAddress())
  })

  it("test setReservePrice", async function () {
    const [, addr1] = await ethers.getSigners()

    expect(await reserve.reservePrice()).to.equal(ethers.parseEther("0.19527"))

    await expect(reserve.connect(addr1).setReservePrice(ethers.parseEther("0.22"))).to.be.revertedWith("Ownable: caller is not the owner")

    const setReservePriceTx = await reserve.setReservePrice(ethers.parseEther("0.22"))
    await setReservePriceTx.wait()

    expect(await reserve.reservePrice()).to.equal(ethers.parseEther("0.22"))
  })

  it("test setPriorityTime", async function () {
    const [, addr1] = await ethers.getSigners()

    expect(await reserve.priorityTime()).to.equal(1706792400)

    await expect(reserve.connect(addr1).setPriorityTime(1710000000)).to.be.revertedWith("Ownable: caller is not the owner")

    const setPriorityTimeTx = await reserve.setPriorityTime(1710000000)
    await setPriorityTimeTx.wait()

    expect(await reserve.priorityTime()).to.equal(1710000000)
  })

  it("test setIsWhitelistReserveActive", async function () {
    const [, addr1] = await ethers.getSigners()

    expect(await reserve.isWhitelistReserveActive()).to.equal(false)

    await expect(reserve.connect(addr1).setIsWhitelistReserveActive(true)).to.be.revertedWith("Ownable: caller is not the owner")

    const setIsWhitelistReserveActiveTx = await reserve.setIsWhitelistReserveActive(true)
    await setIsWhitelistReserveActiveTx.wait()

    expect(await reserve.isWhitelistReserveActive()).to.equal(true)

    await expect(reserve.connect(addr1).setIsWhitelistReserveActive(false)).to.be.revertedWith("Ownable: caller is not the owner")

    const setIsWhitelistReserveActiveTx1 = await reserve.setIsWhitelistReserveActive(false)
    await setIsWhitelistReserveActiveTx1.wait()

    expect(await reserve.isWhitelistReserveActive()).to.equal(false)
  })

  it("test setIsPublicReserveActive", async function () {
    const [, addr1] = await ethers.getSigners()

    expect(await reserve.isPublicReserveActive()).to.equal(false)

    await expect(reserve.connect(addr1).setIsPublicReserveActive(true)).to.be.revertedWith("Ownable: caller is not the owner")

    const setIsPublicReserveActiveTx = await reserve.setIsPublicReserveActive(true)
    await setIsPublicReserveActiveTx.wait()

    expect(await reserve.isPublicReserveActive()).to.equal(true)

    await expect(reserve.connect(addr1).setIsPublicReserveActive(false)).to.be.revertedWith("Ownable: caller is not the owner")

    const setIsPublicReserveActiveTx1 = await reserve.setIsPublicReserveActive(false)
    await setIsPublicReserveActiveTx1.wait()

    expect(await reserve.isPublicReserveActive()).to.equal(false)
  })

  it("test setIsRefundActive", async function () {
    const [, addr1] = await ethers.getSigners()

    expect(await reserve.isRefundActive()).to.equal(false)

    await expect(reserve.connect(addr1).setIsRefundActive(true)).to.be.revertedWith("Ownable: caller is not the owner")

    const setIsRefundActiveTx = await reserve.setIsRefundActive(true)
    await setIsRefundActiveTx.wait()

    expect(await reserve.isRefundActive()).to.equal(true)

    await expect(reserve.connect(addr1).setIsRefundActive(false)).to.be.revertedWith("Ownable: caller is not the owner")

    const setIsRefundActiveTx1 = await reserve.setIsRefundActive(false)
    await setIsRefundActiveTx1.wait()

    expect(await reserve.isRefundActive()).to.equal(false)
  })

  it("test setVRFSubscriptionId", async function () {
    const [, addr1] = await ethers.getSigners()

    // | Name                     | Type                     | Slot | Offset | Bytes | Contract                                  |
    // |--------------------------|--------------------------|------|--------|-------|-------------------------------------------|
    // | isWhitelistReserveActive | bool                     | 4    | 0      | 1     | contracts/NobodyReserve.sol:NobodyReserve |
    // | isPublicReserveActive    | bool                     | 4    | 1      | 1     | contracts/NobodyReserve.sol:NobodyReserve |
    // | isRefundActive           | bool                     | 4    | 2      | 1     | contracts/NobodyReserve.sol:NobodyReserve |
    // | _VRFSubscriptionId       | uint64                   | 4    | 3      | 8     | contracts/NobodyReserve.sol:NobodyReserve |
    let rawData = await ethers.provider.getStorage(reserve, 4)
    let data = ethers.zeroPadValue(ethers.dataSlice(rawData, 0, 29), 32)
    expect(ethers.AbiCoder.defaultAbiCoder().decode(["uint64"], data)[0]).to.equal(1)

    await expect(reserve.connect(addr1).setVRFSubscriptionId(9527)).to.be.revertedWith("Ownable: caller is not the owner")

    const setVRFSubscriptionIdTx1 = await reserve.setVRFSubscriptionId(9527)
    await setVRFSubscriptionIdTx1.wait()

    rawData = await ethers.provider.getStorage(reserve, 4)
    data = ethers.zeroPadValue(ethers.dataSlice(rawData, 0, 29), 32)
    expect(ethers.AbiCoder.defaultAbiCoder().decode(["uint64"], data)[0]).to.equal(9527)
  })

  it("test setWhitelist", async function () {
    const [, addr1, addr2, addr3] = await ethers.getSigners()

    expect(await reserve.whitelist(addr1.address)).to.equal(false)
    expect(await reserve.whitelist(addr2.address)).to.equal(false)
    expect(await reserve.whitelist(addr3.address)).to.equal(false)

    await expect(reserve.connect(addr1).setWhitelist([addr1.address, addr2.address], true)).to.be.revertedWith("Ownable: caller is not the owner")

    const setWhitelistTx1 = await reserve.setWhitelist([addr1.address, addr2.address], true)
    await setWhitelistTx1.wait()

    expect(await reserve.whitelist(addr1.address)).to.equal(true)
    expect(await reserve.whitelist(addr2.address)).to.equal(true)
    expect(await reserve.whitelist(addr3.address)).to.equal(false)

    await expect(reserve.connect(addr2).setWhitelist([addr1.address], false)).to.be.revertedWith("Ownable: caller is not the owner")

    const setWhitelistTx2 = await reserve.setWhitelist([addr1.address], false)
    await setWhitelistTx2.wait()

    expect(await reserve.whitelist(addr1.address)).to.equal(false)
    expect(await reserve.whitelist(addr2.address)).to.equal(true)
    expect(await reserve.whitelist(addr3.address)).to.equal(false)
  })

  it("test withdraw", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners()

    const setIsWhitelistReserveActiveTx = await reserve.setIsWhitelistReserveActive(true)
    await setIsWhitelistReserveActiveTx.wait()

    const setWhitelistTx = await reserve.setWhitelist([addr1.address], true)
    await setWhitelistTx.wait()

    const mintWhitelistTx = await reserve.connect(addr1).whitelistReserve({ value: ethers.parseEther("0.19527") })
    await mintWhitelistTx.wait()

    const setIsPublicSaleActiveTx = await reserve.setIsPublicReserveActive(true)
    await setIsPublicSaleActiveTx.wait()

    const mintPublicSaleTx = await reserve.connect(addr2).publicReserve({ value: ethers.parseEther("0.19527") })
    await mintPublicSaleTx.wait()

    expect(await ethers.provider.getBalance(await reserve.getAddress())).to.equal(ethers.parseEther("0.39054"))

    await expect(reserve.connect(addr3).withdraw(0)).to.be.revertedWith("Ownable: caller is not the owner")

    const ownerBalance = await ethers.provider.getBalance(owner.address)
    const withdrawTx = await reserve.withdraw(ethers.parseEther("0.1"))
    const receipt = await withdrawTx.wait()
    // @ts-ignore
    const gasFee = receipt.gasUsed * withdrawTx.gasPrice
    expect(await ethers.provider.getBalance(owner.address)).to.equal(ownerBalance + ethers.parseEther("0.1") - gasFee)
    expect(await ethers.provider.getBalance(await reserve.getAddress())).to.equal(ethers.parseEther("0.29054"))

    const ownerBalance1 = await ethers.provider.getBalance(owner.address)
    const withdrawTx1 = await reserve.withdraw(0)
    const receipt1 = await withdrawTx1.wait()
    // @ts-ignore
    const gasFee1 = receipt1.gasUsed * withdrawTx1.gasPrice
    expect(await ethers.provider.getBalance(owner.address)).to.equal(ownerBalance1 + ethers.parseEther("0.29054") - gasFee1)
    expect(await ethers.provider.getBalance(await reserve.getAddress())).to.equal(0)
  })

  it("test whitelistReserve", async function () {
    const [, addr1, addr2] = await ethers.getSigners()

    await expect(reserve.connect(addr1).whitelistReserve()).to.be.revertedWithCustomError(reserve, "RserveNotActive")

    const setIsWhitelistReserveActiveTx = await reserve.setIsWhitelistReserveActive(true)
    await setIsWhitelistReserveActiveTx.wait()

    await expect(reserve.connect(addr1).whitelistReserve()).to.be.revertedWithCustomError(reserve, "InvalidAddress")
    await expect(reserve.connect(addr2).whitelistReserve()).to.be.revertedWithCustomError(reserve, "InvalidAddress")

    const setWhitelistTx = await reserve.setWhitelist([addr1.address], true)
    await setWhitelistTx.wait()

    await expect(reserve.connect(addr1).whitelistReserve()).to.be.revertedWithCustomError(reserve, "InvalidValue")
    await expect(reserve.connect(addr1).whitelistReserve({ value: ethers.parseEther("1") })).to.be.revertedWithCustomError(reserve, "InvalidValue")

    expect(await reserve.reserved(addr1)).to.equal(false)
    expect(await reserve.totalReserved()).to.equal(0)

    const whitelistReserveTx = await reserve.connect(addr1).whitelistReserve({ value: ethers.parseEther("0.19527") })
    await whitelistReserveTx.wait()

    expect(await reserve.reserved(addr1)).to.equal(true)
    expect(await reserve.totalReserved()).to.equal(1)

    await expect(whitelistReserveTx).to.emit(reserve, "WhitelistReserved").withArgs(addr1.address)

    await expect(reserve.connect(addr1).whitelistReserve({ value: ethers.parseEther("0.19527") })).to.be.revertedWithCustomError(reserve, "AlreadyReserved")
    await expect(reserve.connect(addr2).whitelistReserve()).to.be.revertedWithCustomError(reserve, "InvalidAddress")
  })

  it("test publicReserve", async function () {
    const [, addr1, addr2] = await ethers.getSigners()

    const setWhitelistTx = await reserve.setWhitelist([addr1.address], true)
    await setWhitelistTx.wait()

    await expect(reserve.connect(addr2).publicReserve()).to.be.revertedWithCustomError(reserve, "RserveNotActive")

    const setIsPublicReserveActiveTx = await reserve.setIsPublicReserveActive(true)
    await setIsPublicReserveActiveTx.wait()

    await expect(reserve.connect(addr1).publicReserve()).to.be.revertedWithCustomError(reserve, "InvalidAddress")

    await expect(reserve.connect(addr2).publicReserve()).to.be.revertedWithCustomError(reserve, "InvalidValue")
    await expect(reserve.connect(addr2).publicReserve({ value: ethers.parseEther("1") })).to.be.revertedWithCustomError(reserve, "InvalidValue")

    expect(await reserve.reserved(addr2)).to.equal(false)
    expect(await reserve.totalReserved()).to.equal(0)
    // | Name                     | Type                     | Slot | Offset | Bytes | Contract                                  |
    // |--------------------------|--------------------------|------|--------|-------|-------------------------------------------|
    // | _publicReservers         | address[]                | 9    | 0      | 32    | contracts/NobodyReserve.sol:NobodyReserve |
    let rawData = await ethers.provider.getStorage(reserve, 9)
    expect(ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], rawData)[0]).to.equal(0)

    const publicReserveTx = await reserve.connect(addr2).publicReserve({ value: ethers.parseEther("0.19527") })
    await publicReserveTx.wait()

    expect(await reserve.reserved(addr2)).to.equal(true)
    expect(await reserve.totalReserved()).to.equal(1)

    rawData = await ethers.provider.getStorage(reserve, 9)
    expect(ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], rawData)[0]).to.equal(1)

    const slotIndex = ethers.solidityPackedKeccak256(["uint256"], [9])
    rawData = await ethers.provider.getStorage(reserve, slotIndex)
    expect(ethers.AbiCoder.defaultAbiCoder().decode(["address"], rawData)[0]).to.equal(addr2.address)

    await expect(publicReserveTx).to.emit(reserve, "PublicReserved").withArgs(addr2.address)

    await expect(reserve.connect(addr2).publicReserve({ value: ethers.parseEther("0.19527") })).to.be.revertedWithCustomError(reserve, "AlreadyReserved")
    await expect(reserve.connect(addr1).publicReserve()).to.be.revertedWithCustomError(reserve, "InvalidAddress")
  })

  it("test requestRaffleRandomWords", async function () {
    const [, addr1] = await ethers.getSigners()

    await expect(reserve.connect(addr1).requestRaffleRandomWords(keyHash, requestConfirmations, callbackGasLimit, numWords)).to.be.revertedWith("Ownable: caller is not the owner")

    const requestRaffleRandomWordsTx = await reserve.requestRaffleRandomWords(keyHash, requestConfirmations, callbackGasLimit, numWords)
    await requestRaffleRandomWordsTx.wait()

    await expect(requestRaffleRandomWordsTx).to.emit(reserve, "RandomWordsRequested").withArgs(1)
    await expect(requestRaffleRandomWordsTx).to.emit(vrfCoordinatorV2Mock, "RandomWordsRequested")

    const fulfillRandomWordsTx = await vrfCoordinatorV2Mock.fulfillRandomWords(1, await reserve.getAddress())
    await fulfillRandomWordsTx.wait()

    await expect(fulfillRandomWordsTx).to.emit(reserve, "RandomWordsFulfilled")
    await expect(fulfillRandomWordsTx).to.emit(vrfCoordinatorV2Mock, "RandomWordsFulfilled")

    const filter = reserve.filters.RandomWordsFulfilled
    const events = await reserve.queryFilter(filter, -1)
    expect(events[0].args.requestId).to.equal(1)
    expect(events[0].args.randomWords.length).to.equal(3)
    // | Name                     | Type                     | Slot | Offset | Bytes | Contract                                  |
    // |--------------------------|--------------------------|------|--------|-------|-------------------------------------------|
    // | _randomWords             | uint256[]                | 5    | 0      | 32    | contracts/NobodyReserve.sol:NobodyReserve |
    let rawData = await ethers.provider.getStorage(reserve, 5)
    expect(ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], rawData)[0]).to.equal(3)

    const slotIndex0 = ethers.solidityPackedKeccak256(["uint256"], [5])
    rawData = await ethers.provider.getStorage(reserve, slotIndex0)
    expect(ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], rawData)[0]).to.equal(events[0].args.randomWords[0])

    const slotIndex1 = BigInt(ethers.solidityPackedKeccak256(["uint256"], [5])) + BigInt(1)
    rawData = await ethers.provider.getStorage(reserve, slotIndex1)
    expect(ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], rawData)[0]).to.equal(events[0].args.randomWords[1])

    const slotIndex2 = BigInt(ethers.solidityPackedKeccak256(["uint256"], [5])) + BigInt(2)
    rawData = await ethers.provider.getStorage(reserve, slotIndex2)
    expect(ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], rawData)[0]).to.equal(events[0].args.randomWords[2])
  })

  it("test executeRaffle", async function () {
    const [, addr1, addr2, addr3, addr4, addr5, addr6] = await ethers.getSigners()

    const setIsPublicReserveActiveTx = await reserve.setIsPublicReserveActive(true)
    await setIsPublicReserveActiveTx.wait()

    // | Name                     | Type                     | Slot | Offset | Bytes | Contract                                  |
    // |--------------------------|--------------------------|------|--------|-------|-------------------------------------------|
    // | _totalWeight             | uint256                  | 7    | 0      | 32    | contracts/NobodyReserve.sol:NobodyReserve |
    // | _priorityCount           | uint256                  | 8    | 0      | 32    | contracts/NobodyReserve.sol:NobodyReserve |

    const publicReserveTx2 = await reserve.connect(addr2).publicReserve({ value: ethers.parseEther("0.19527") })
    await publicReserveTx2.wait()

    const publicReserveTx3 = await reserve.connect(addr3).publicReserve({ value: ethers.parseEther("0.19527") })
    await publicReserveTx3.wait()

    let rawData = await ethers.provider.getStorage(reserve, 7)
    expect(ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], rawData)[0]).to.equal(9527 * 2)

    rawData = await ethers.provider.getStorage(reserve, 8)
    expect(ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], rawData)[0]).to.equal(2)

    await network.provider.send("evm_setNextBlockTimestamp", [1706792401])

    const publicReserveTx4 = await reserve.connect(addr4).publicReserve({ value: ethers.parseEther("0.19527") })
    await publicReserveTx4.wait()

    const publicReserveTx5 = await reserve.connect(addr5).publicReserve({ value: ethers.parseEther("0.19527") })
    await publicReserveTx5.wait()

    const publicReserveTx6 = await reserve.connect(addr6).publicReserve({ value: ethers.parseEther("0.19527") })
    await publicReserveTx6.wait()

    await network.provider.send("evm_mine")

    rawData = await ethers.provider.getStorage(reserve, 7)
    expect(ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], rawData)[0]).to.equal(9527 * 2 + 1000 * 3)

    rawData = await ethers.provider.getStorage(reserve, 8)
    expect(ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], rawData)[0]).to.equal(2)

    const requestRaffleRandomWordsTx = await reserve.requestRaffleRandomWords(keyHash, requestConfirmations, callbackGasLimit, numWords)
    await requestRaffleRandomWordsTx.wait()

    const fulfillRandomWordsTx = await vrfCoordinatorV2Mock.fulfillRandomWords(1, await reserve.getAddress())
    await fulfillRandomWordsTx.wait()
    //   randomWords
    //   78541660797044910968829902406342334108369226379826116161446442989268089806461
    //   92458281274488595289803937127152923398167637295201432141969818930235769911599
    //   105409183525425523237923285454331214386340807945685310246717412709691342439136

    await expect(reserve.connect(addr1).executeRaffle(1, 2)).to.be.revertedWith("Ownable: caller is not the owner")

    await expect(reserve.executeRaffle(4, 2)).to.be.revertedWithCustomError(reserve, "InvalidRaffle")

    expect(await reserve.raffleWon(addr2)).to.equal(false)
    expect(await reserve.raffleWon(addr3)).to.equal(false)
    expect(await reserve.raffleWon(addr4)).to.equal(false)
    expect(await reserve.raffleWon(addr5)).to.equal(false)
    expect(await reserve.raffleWon(addr6)).to.equal(false)

    const executeRaffleTx1 = await reserve.executeRaffle(1, 2)
    await executeRaffleTx1.wait()

    await expect(executeRaffleTx1).to.emit(reserve, "RaffleWon").withArgs(addr2.address)
    await expect(executeRaffleTx1).to.emit(reserve, "RaffleWon").withArgs(addr3.address)

    expect(await reserve.raffleWon(addr2)).to.equal(true)
    expect(await reserve.raffleWon(addr3)).to.equal(true)
    expect(await reserve.raffleWon(addr4)).to.equal(false)
    expect(await reserve.raffleWon(addr5)).to.equal(false)
    expect(await reserve.raffleWon(addr6)).to.equal(false)

    const executeRaffleTx2 = await reserve.executeRaffle(2, 2)
    await executeRaffleTx2.wait()

    await expect(executeRaffleTx2).to.emit(reserve, "RaffleWon").withArgs(addr4.address)
    await expect(executeRaffleTx2).to.emit(reserve, "RaffleWon").withArgs(addr5.address)

    expect(await reserve.raffleWon(addr2)).to.equal(true)
    expect(await reserve.raffleWon(addr3)).to.equal(true)
    expect(await reserve.raffleWon(addr4)).to.equal(true)
    expect(await reserve.raffleWon(addr5)).to.equal(true)
    expect(await reserve.raffleWon(addr6)).to.equal(false)

    const executeRaffleTx3 = await reserve.executeRaffle(3, 1)
    await executeRaffleTx3.wait()

    await expect(executeRaffleTx3).to.emit(reserve, "RaffleWon").withArgs(addr6.address)

    expect(await reserve.raffleWon(addr2)).to.equal(true)
    expect(await reserve.raffleWon(addr3)).to.equal(true)
    expect(await reserve.raffleWon(addr4)).to.equal(true)
    expect(await reserve.raffleWon(addr5)).to.equal(true)
    expect(await reserve.raffleWon(addr6)).to.equal(true)
  })

  it("test refund", async function () {
    const [owner, addr1, addr2, addr3, addr4, addr5, addr6] = await ethers.getSigners()

    // set block.timestamp after 1706792401
    const setPriorityTimeTx = await reserve.setPriorityTime(1706793000)
    await setPriorityTimeTx.wait()

    const setWhitelistTx = await reserve.setWhitelist([addr1.address], true)
    await setWhitelistTx.wait()

    const setIsWhitelistReserveActiveTx = await reserve.setIsWhitelistReserveActive(true)
    await setIsWhitelistReserveActiveTx.wait()

    const setIsPublicReserveActiveTx = await reserve.setIsPublicReserveActive(true)
    await setIsPublicReserveActiveTx.wait()

    const whitelistReserveTx = await reserve.connect(addr1).whitelistReserve({ value: ethers.parseEther("0.19527") })
    await whitelistReserveTx.wait()

    const publicReserveTx2 = await reserve.connect(addr2).publicReserve({ value: ethers.parseEther("0.19527") })
    await publicReserveTx2.wait()

    const publicReserveTx3 = await reserve.connect(addr3).publicReserve({ value: ethers.parseEther("0.19527") })
    await publicReserveTx3.wait()

    const publicReserveTx4 = await reserve.connect(addr4).publicReserve({ value: ethers.parseEther("0.19527") })
    await publicReserveTx4.wait()

    await network.provider.send("evm_setNextBlockTimestamp", [1706793001])

    const publicReserveTx5 = await reserve.connect(addr5).publicReserve({ value: ethers.parseEther("0.19527") })
    await publicReserveTx5.wait()

    const publicReserveTx6 = await reserve.connect(addr6).publicReserve({ value: ethers.parseEther("0.19527") })
    await publicReserveTx6.wait()

    await network.provider.send("evm_mine")

    const requestRaffleRandomWordsTx = await reserve.requestRaffleRandomWords(keyHash, requestConfirmations, callbackGasLimit, numWords)
    await requestRaffleRandomWordsTx.wait()

    const fulfillRandomWordsTx = await vrfCoordinatorV2Mock.fulfillRandomWords(1, await reserve.getAddress())
    await fulfillRandomWordsTx.wait()
    //   randomWords
    //   78541660797044910968829902406342334108369226379826116161446442989268089806461
    //   92458281274488595289803937127152923398167637295201432141969818930235769911599
    //   105409183525425523237923285454331214386340807945685310246717412709691342439136

    expect(await reserve.raffleWon(addr2)).to.equal(false)
    expect(await reserve.raffleWon(addr3)).to.equal(false)
    expect(await reserve.raffleWon(addr4)).to.equal(false)
    expect(await reserve.raffleWon(addr5)).to.equal(false)
    expect(await reserve.raffleWon(addr6)).to.equal(false)

    const executeRaffleTx1 = await reserve.executeRaffle(1, 1)
    await executeRaffleTx1.wait()

    await expect(executeRaffleTx1).to.emit(reserve, "RaffleWon").withArgs(addr2.address)

    const executeRaffleTx2 = await reserve.executeRaffle(2, 1)
    await executeRaffleTx2.wait()

    await expect(executeRaffleTx2).to.emit(reserve, "RaffleWon").withArgs(addr4.address)

    const executeRaffleTx3 = await reserve.executeRaffle(3, 1)
    await executeRaffleTx3.wait()

    await expect(executeRaffleTx3).to.emit(reserve, "RaffleWon").withArgs(addr5.address)

    expect(await reserve.raffleWon(addr2)).to.equal(true)
    expect(await reserve.raffleWon(addr3)).to.equal(false)
    expect(await reserve.raffleWon(addr4)).to.equal(true)
    expect(await reserve.raffleWon(addr5)).to.equal(true)
    expect(await reserve.raffleWon(addr6)).to.equal(false)

    await expect(reserve.connect(addr2).refund()).to.be.revertedWithCustomError(reserve, "RefundNotActive")
    await expect(reserve.connect(addr3).refund()).to.be.revertedWithCustomError(reserve, "RefundNotActive")

    const setIsRefundActiveTx = await reserve.setIsRefundActive(true)
    await setIsRefundActiveTx.wait()

    await expect(reserve.connect(owner).refund()).to.be.revertedWithCustomError(reserve, "NotRefundable")
    await expect(reserve.connect(addr1).refund()).to.be.revertedWithCustomError(reserve, "NotRefundable")
    await expect(reserve.connect(addr2).refund()).to.be.revertedWithCustomError(reserve, "NotRefundable")
    await expect(reserve.connect(addr4).refund()).to.be.revertedWithCustomError(reserve, "NotRefundable")
    await expect(reserve.connect(addr5).refund()).to.be.revertedWithCustomError(reserve, "NotRefundable")

    expect(await ethers.provider.getBalance(await reserve.getAddress())).to.equal(ethers.parseEther("1.17162"))

    const addr3Balance = await ethers.provider.getBalance(addr3.address)
    const refundTx3 = await reserve.connect(addr3).refund()
    const receipt3 = await refundTx3.wait()
    // @ts-ignore
    const gasFee3 = receipt3.gasUsed * refundTx3.gasPrice
    expect(await ethers.provider.getBalance(addr3.address)).to.equal(addr3Balance + ethers.parseEther("0.19527") - gasFee3)
    expect(await ethers.provider.getBalance(await reserve.getAddress())).to.equal(ethers.parseEther("0.97635"))
    await expect(refundTx3).to.emit(reserve, "Refunded").withArgs(addr3.address)

    await expect(reserve.connect(addr3).refund()).to.be.revertedWithCustomError(reserve, "AlreadyRefund")

    const addr6Balance = await ethers.provider.getBalance(addr6.address)
    const refundTx6 = await reserve.connect(addr6).refund()
    const receipt6 = await refundTx6.wait()
    // @ts-ignore
    const gasFee6 = receipt6.gasUsed * refundTx6.gasPrice
    expect(await ethers.provider.getBalance(addr6.address)).to.equal(addr6Balance + ethers.parseEther("0.19527") - gasFee6)
    expect(await ethers.provider.getBalance(await reserve.getAddress())).to.equal(ethers.parseEther("0.78108"))
    await expect(refundTx6).to.emit(reserve, "Refunded").withArgs(addr6.address)

    await expect(reserve.connect(addr6).refund()).to.be.revertedWithCustomError(reserve, "AlreadyRefund")

    await expect(reserve.connect(owner).refund()).to.be.revertedWithCustomError(reserve, "NotRefundable")
    await expect(reserve.connect(addr1).refund()).to.be.revertedWithCustomError(reserve, "NotRefundable")
    await expect(reserve.connect(addr2).refund()).to.be.revertedWithCustomError(reserve, "NotRefundable")
    await expect(reserve.connect(addr4).refund()).to.be.revertedWithCustomError(reserve, "NotRefundable")
    await expect(reserve.connect(addr5).refund()).to.be.revertedWithCustomError(reserve, "NotRefundable")
  })
})
