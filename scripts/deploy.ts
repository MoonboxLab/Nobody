import { ethers } from "hardhat"

async function main() {
  const NobodyReserve = await ethers.getContractFactory("NobodyReserve")
  const nobodyReserve = await NobodyReserve.deploy("", "", { gasPrice: 3000000000 })
  await nobodyReserve.waitForDeployment()
  console.log("nobodyReserve deployed to:", await nobodyReserve.getAddress())

  // const setIsWhitelistReserveActiveTx = await nobodyReserve.setIsWhitelistReserveActive(true)
  // await setIsWhitelistReserveActiveTx.wait()

  const Nobody = await ethers.getContractFactory("Nobody")
  const nobody = await Nobody.deploy({ gasPrice: 3000000000 })
  await nobody.waitForDeployment()
  console.log("nobody deployed to:", await nobody.getAddress())

  // const setNotRevealedURITx = await nobody.setNotRevealedURI("")
  // await setNotRevealedURITx.wait()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
