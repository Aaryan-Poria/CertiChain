const { ethers } = require("hardhat");
const fs = require("fs");
const chalk = require("chalk");
const ora = require("ora");

async function main() {
  const spinner = ora("Deploying CertiChain contract...").start();

  try {
    const CertiChain = await ethers.getContractFactory("CertiChain");
    const certiChain = await CertiChain.deploy();

    await certiChain.waitForDeployment();
    const address = await certiChain.getAddress();

    spinner.succeed(chalk.green("CertiChain deployed successfully!"));
    console.log(chalk.cyan("Contract address:"), address);

    fs.writeFileSync("deployed_address.txt", address);
    console.log(chalk.blue("Wrote contract address to 'deployed_address.txt'"));
  } catch (error) {
    spinner.fail(chalk.red("Deployment failed."));
    console.error(error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
