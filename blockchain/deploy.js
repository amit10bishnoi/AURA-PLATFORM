const hre = require("hardhat");

async function main() {
  console.log("Deploying AuditChain...");

  const AuditChain = await hre.ethers.getContractFactory("AuditChain");
  const auditChain = await AuditChain.deploy();

  await auditChain.waitForDeployment();

  const address = await auditChain.getAddress();
  console.log("AuditChain deployed to:", address);

  return address;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});