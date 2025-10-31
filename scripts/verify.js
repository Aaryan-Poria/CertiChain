const fs = require("fs");
const readline = require("readline");

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
      `ERROR: ${addrFile} not found. Create it with the contract address.`
    );
    process.exit(1);
  }
  const CONTRACT_ADDRESS = fs.readFileSync(addrFile, "utf8").trim();

  const tokenId = process.env.TOKEN_ID ? Number(process.env.TOKEN_ID) : null;
  if (!tokenId) {
    console.error("ERROR: Please provide TOKEN_ID env var (e.g. TOKEN_ID=42).");
    process.exit(1);
  }

  const [caller] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt(
    "CertiChain",
    CONTRACT_ADDRESS,
    caller
  );

  // Read on-chain cert
  let onChain;
  try {
    onChain = await contract.getCertificate(tokenId);
  } catch (err) {
    console.error("\nERROR: Could not read certificate. Token may not exist.");
    if (err && err.message) console.error("Error message:", err.message);
    process.exitCode = 1;
    return;
  }

  const onName = onChain[0];
  const onCourse = onChain[1];
  const onIssuer = onChain[2];
  const onDate = onChain[3];

  console.log("\n== On-chain certificate ==");
  console.log("Token ID :", tokenId);
  console.log("Name     :", onName);
  console.log("Course   :", onCourse);
  console.log("Issuer   :", onIssuer);
  console.log("IssueDate:", onDate);

  // Collect expected values: prefer env vars, otherwise ask interactively
  let expName = process.env.NAME;
  let expCourse = process.env.COURSE;
  let expIssuer = process.env.ISSUER;
  let expDate = process.env.DATE;

  if (!expName && !expCourse && !expIssuer && !expDate) {
    console.log(
      "\nNo expected values provided via env vars. Enter expected values to verify (leave blank to skip a field):"
    );
    expName = await ask("Expected Name: ");
    expCourse = await ask("Expected Course: ");
    expIssuer = await ask("Expected Issuer: ");
    expDate = await ask("Expected Issue Date: ");
  }

  // If user skipped all expected fields, we just printed the cert and exit 0
  const anyProvided = expName || expCourse || expIssuer || expDate;
  if (!anyProvided) {
    console.log(
      "\nNo expected values entered — verification skipped (printed on-chain data above)."
    );
    return;
  }

  // Compare provided vs on-chain
  console.log("\n== Comparison results ==");
  let allMatch = true;

  if (expName) {
    const match = expName === onName;
    console.log(
      `Name     : provided="${expName}" -> ${
        match ? "MATCH ✅" : `MISMATCH ❌ (on-chain='${onName}')`
      }`
    );
    if (!match) allMatch = false;
  }
  if (expCourse) {
    const match = expCourse === onCourse;
    console.log(
      `Course   : provided="${expCourse}" -> ${
        match ? "MATCH ✅" : `MISMATCH ❌ (on-chain='${onCourse}')`
      }`
    );
    if (!match) allMatch = false;
  }
  if (expIssuer) {
    const match = expIssuer === onIssuer;
    console.log(
      `Issuer   : provided="${expIssuer}" -> ${
        match ? "MATCH ✅" : `MISMATCH ❌ (on-chain='${onIssuer}')`
      }`
    );
    if (!match) allMatch = false;
  }
  if (expDate) {
    const match = expDate === onDate;
    console.log(
      `IssueDate: provided="${expDate}" -> ${
        match ? "MATCH ✅" : `MISMATCH ❌ (on-chain='${onDate}')`
      }`
    );
    if (!match) allMatch = false;
  }

  if (allMatch) {
    console.log(
      "\nRESULT: ✅ Certificate is AUTHENTIC — provided fields match on-chain data."
    );
    process.exitCode = 0;
  } else {
    console.log(
      "\nRESULT: ❌ Certificate is FAKE or ALTERED — one or more fields do not match on-chain."
    );
    process.exitCode = 2;
  }
}

main().catch((e) => {
  console.error("Verify script failed:", e);
  process.exitCode = 1;
});
