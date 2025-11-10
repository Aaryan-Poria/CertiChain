const fs = require("fs");
const readline = require("readline");
const chalk = require("chalk");
const Table = require("cli-table3");
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

  const addrFile = "deployed_address.txt";
  if (!fs.existsSync(addrFile)) {
    console.error(
      chalk.red(
        `ERROR: ${addrFile} not found. Create it with the contract address.`
      )
    );
    process.exit(1);
  }
  const CONTRACT_ADDRESS = fs.readFileSync(addrFile, "utf8").trim();

  const tokenId = process.env.TOKEN_ID ? Number(process.env.TOKEN_ID) : null;
  if (!tokenId) {
    console.error(
      chalk.red("ERROR: Please provide TOKEN_ID env var (e.g. TOKEN_ID=42).")
    );
    process.exit(1);
  }

  const [caller] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt(
    "CertiChain",
    CONTRACT_ADDRESS,
    caller
  );

  // Read on-chain cert
  const spinner = ora(
    chalk.cyan(`Fetching certificate ${tokenId} from the blockchain...`)
  ).start();
  let onChain;
  try {
    onChain = await contract.getCertificate(tokenId);
    spinner.succeed(chalk.green("Certificate data retrieved."));
  } catch (err) {
    spinner.fail(
      chalk.red("\nERROR: Could not read certificate. Token may not exist.")
    );
    if (err && err.message)
      console.error(chalk.gray("Error message:", err.message));
    process.exitCode = 1;
    return;
  }

  const [onName, onCourse, onIssuer, onDate] = onChain;

  console.log(chalk.bold.blue("\n== On-chain Certificate =="));

  const table = new Table({
    head: [chalk.cyan("Property"), chalk.cyan("Value")],
    colWidths: [15, 45],
  });

  table.push(
    ["Token ID", tokenId],
    ["Name", onName],
    ["Course", onCourse],
    ["Issuer", onIssuer],
    ["Issue Date", onDate]
  );
  console.log(table.toString());

  // Collect expected values
  let expName = process.env.NAME;
  let expCourse = process.env.COURSE;
  let expIssuer = process.env.ISSUER;
  let expDate = process.env.DATE;

  if (!expName && !expCourse && !expIssuer && !expDate) {
    console.log(
      chalk.yellow(
        "\nNo expected values provided via env vars. Enter expected values to verify (leave blank to skip a field):"
      )
    );
    expName = await ask(chalk.cyan("Expected Name: "));
    expCourse = await ask(chalk.cyan("Expected Course: "));
    expIssuer = await ask(chalk.cyan("Expected Issuer: "));
    expDate = await ask(chalk.cyan("Expected Issue Date: "));
  }

  const anyProvided = expName || expCourse || expIssuer || expDate;
  if (!anyProvided) {
    console.log(
      chalk.gray(
        "\nNo expected values entered — verification skipped (printed on-chain data above)."
      )
    );
    return;
  }

  // Compare provided vs on-chain
  console.log(chalk.bold.yellow("\n== Comparison results =="));
  let allMatch = true;

  const checkField = (field, exp, on) => {
    if (exp) {
      const match = exp === on;
      console.log(
        `  ${field.padEnd(10)}: ${
          match
            ? chalk.green(`MATCH ✅`)
            : chalk.red(`MISMATCH ❌ (Expected: '${exp}', Found: '${on}')`)
        }`
      );
      if (!match) allMatch = false;
    }
  };

  checkField("Name", expName, onName);
  checkField("Course", expCourse, onCourse);
  checkField("Issuer", expIssuer, onIssuer);
  checkField("IssueDate", expDate, onDate);

  if (allMatch) {
    console.log(
      chalk.bold.green(
        "\nRESULT: ✅ Certificate is AUTHENTIC — all provided fields match on-chain data."
      )
    );
    process.exitCode = 0;
  } else {
    console.log(
      chalk.bold.red(
        "\nRESULT: ❌ Certificate is FAKE or ALTERED — one or more fields do not match on-chain."
      )
    );
    process.exitCode = 2;
  }
}

main().catch((e) => {
  console.error("Verify script failed:", e);
  process.exitCode = 1;
});
