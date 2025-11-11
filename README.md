# CertiChainV2 – Quick Run Guide


# Clone the repository
```
git clone https://github.com/<your-username>/certichain.git
cd certichain/CertiChainV2
```

# Install dependencies
```
xargs npm install < dependencies.txt
```
# or
```
npm install
```
# Start the local Hardhat blockchain
```
npx hardhat node
```
# Open a new terminal and deploy the contract
```
npx hardhat run scripts/deploy.js --network localhost
```
# Issue a certificate
```
npx hardhat run scripts/issue.js --network localhost
```
# Cleanup build and cache files if needed
rm -rf artifacts cache
