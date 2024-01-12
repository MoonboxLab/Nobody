import { ethers } from "hardhat"

async function main() {
  const Nobody = await ethers.getContractFactory("Nobody")
  const nobody = await Nobody.deploy({ gasPrice: 3000000000 })
  await nobody.waitForDeployment()
  console.log("nobody deployed to:", await nobody.getAddress())

  // const setTokenPriceTx = await nobody.setTokenPrice(ethers.parseEther("0.001"), ethers.parseEther("0.002"))
  // await setTokenPriceTx.wait()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
