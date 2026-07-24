require("dotenv").config();
const { askOracle } = require("../services/oracle");

async function main() {
  const response = await askOracle("finished cleaning the garage today, still need to call the dentist");
  console.log(response);
}

main().catch(err => {
  console.error("Oracle test failed:", err);
  process.exit(1);
});
