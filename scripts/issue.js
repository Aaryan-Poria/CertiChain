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

  console.log("\n=== CertiChain Certificate Issuer ===\n");

  // Ask user for certificate details
  const name = await ask("Enter recipient name: ");
  const course = await ask("Enter course name: ");
  const issuer = await ask("Enter issuer (institution): ");
  const issueDate = await ask("Enter issue date (e.g. 30-10-2025): ");

  const addrFile = "deployed_address.txt";
  if (!fs.existsSync(addrFile)) {
    console.error(
      `\n❌ ${addrFile} not found. Please deploy the contract first.`
    );
    process.exit(1);
  }

  const CONTRACT_ADDRESS = fs.readFileSync(addrFile, "utf8").trim();
  const [owner] = await hre.ethers.getSigners();

  console.log("\nIssuing certificate...");
  console.log("Using signer:", owner.address);

  const contract = await hre.ethers.getContractAt(
    "CertiChain",
    CONTRACT_ADDRESS,
    owner
  );

  // Generate a random token ID (can be replaced by incremental logic later)
  const tokenId = Math.floor(Math.random() * 1_000_000_000);

  try {
    const tx = await contract.issueCertificate(
      owner.address, // recipient
      tokenId,
      name,
      course,
      issuer,
      issueDate
    );

    console.log("\nTransaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction mined in block", receipt.blockNumber);

    console.log("\n✅ Certificate issued successfully!");
    console.log("Token ID:", tokenId);

    console.log("\nYou can verify it using the following command:\n");
    console.log(
      `TOKEN_ID=${tokenId} NAME="${name}" COURSE="${course}" ISSUER="${issuer}" DATE="${issueDate}" npx hardhat run scripts/verify.js --network localhost\n`
    );
  } catch (err) {
    console.error("\n❌ Failed to issue certificate:");
    console.error(err.message || err);
  }
}

main().catch((err) => {
  console.error("Script error:", err);
  process.exit(1);
});
