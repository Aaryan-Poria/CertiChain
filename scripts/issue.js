const fs = require("fs");
const readline = require("readline");
const chalk = require("chalk");
const ora = require("ora");

async function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

async function main() {
  const hre = require("hardhat");

  console.log(chalk.bold.blue("\n=== CertiChain Certificate Issuer ===\n"));

  const name = await ask(chalk.cyan("Enter recipient name: "));
  const course = await ask(chalk.cyan("Enter course name: "));
  const issuer = await ask(chalk.cyan("Enter issuer (institution): "));
  const issueDate = await ask(
    chalk.cyan("Enter issue date (e.g. 30-10-2025): ")
  );

  const addrFile = "deployed_address.txt";
  if (!fs.existsSync(addrFile)) {
    console.error(
      chalk.red(
        `\n❌ ${addrFile} not found. Please deploy the contract first using 'npx hardhat run scripts/deploy.js'`
      )
    );
    process.exit(1);
  }

  const CONTRACT_ADDRESS = fs.readFileSync(addrFile, "utf8").trim();
  const [owner] = await hre.ethers.getSigners();

  console.log(chalk.yellow("\nIssuing certificate..."));
  console.log(chalk.gray("Using signer:"), owner.address);

  const contract = await hre.ethers.getContractAt(
    "CertiChain",
    CONTRACT_ADDRESS,
    owner
  );

  // Generate a random token ID
  const tokenId = Math.floor(Math.random() * 1_000_000_000);

  const spinner = ora("Sending transaction to the network...").start();

  try {
    const tx = await contract.issueCertificate(
      owner.address, // recipient
      tokenId,
      name,
      course,
      issuer,
      issueDate
    );

    spinner.text = "Transaction sent, awaiting confirmation...";
    console.log(chalk.gray(`\n  Transaction hash: ${tx.hash}`));

    const receipt = await tx.wait();

    spinner.succeed(
      chalk.green(`Transaction mined in block ${receipt.blockNumber}`)
    );

    console.log(chalk.bold.green("\n✅ Certificate issued successfully!"));
    console.log(chalk.cyan("Token ID:"), tokenId);

    console.log(
      chalk.yellow("\nYou can verify it using the following command:\n")
    );
    console.log(
      chalk.gray(
        `TOKEN_ID=${tokenId} NAME="${name}" COURSE="${course}" ISSUER="${issuer}" DATE="${issueDate}" npx hardhat run scripts/verify.js --network localhost\n`
      )
    );
  } catch (err) {
    spinner.fail(chalk.red("\n❌ Failed to issue certificate:"));
    console.error(err.message || err);
  }
}

main().catch((err) => {
  console.error("Script error:", err);
  process.exit(1);
});
