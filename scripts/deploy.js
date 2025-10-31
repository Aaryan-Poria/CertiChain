const { ethers } = require("hardhat");

async function main() {
  const CertiChain = await ethers.getContractFactory("CertiChain");
  const certiChain = await CertiChain.deploy();

  // Wait for deployment to finish (v6 syntax)
  await certiChain.waitForDeployment();

  console.log("CertiChain deployed to:", await certiChain.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
