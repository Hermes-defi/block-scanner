"use strict";
const BANK_RATIO = 0.6610169492; // Bank Swap Ratio
const PUBLIC_RATIO = 0.5603998308; //Public Swap Ratio

const fs = require("fs");
// use this rpc for the scan
const rpcArchive = "https://rpc.hermesdefi.io/";

const Web3 = require("web3");
const web3 = new Web3(rpcArchive);

const banks = {
  "0x3074cf20ECD1Cfe96b3Ee43968d0c426f775171a": "dai",
  "0xB3617363eDEc16cB0D30a5912Eb7A6B1D48e2875": "lumen",
  "0xb684CAB219dE861a49b396Ae3BbB1fc8702286E3": "magic",
  "0x3636421e71dCF0Bfcbb08FeeB62E0275ea5AcD61": "uni",
  "0x88Cc1D5E92aE19441583968EEc1cd03BEF47B5ED": "hly",
};

async function generateNewBalance() {
  let balancesArray = [];
  let result = [];
  let txt = [];

  // 1st we read the transactions file
  console.log(`loading bytx.txt...`);
  const bytx = fs.readFileSync("./bytx_all.txt", "utf-8").split("\n");

  // We create an array of objects with all the lines from bytx file
  let iter = 0;
  for (let i in bytx) {
    const line = {
      tx: bytx[i].split(",")[0],
      account: bytx[i].split(",")[1],
      amount: bytx[i].split(",")[2],
    };
    balancesArray.push(line);
    iter++;
    if(iter == 50) break;
  }

  //Here we group all the information by account and classify them by bank
  result = await balancesArray.reduce(async function (previousValue, value) {
    //As this loop has async function we need to await from the previous iteraction
    let array = await previousValue;

    //Check if we have this account
    if (!array[value.account]) {
      array[value.account] = {
        account: value.account,
        whitelisted_PLTS: 0,
        whitelisted_pHRMS: 0,
        whitelisted_pHRMS_WEI: 0,
        airdropped_pHRMS: 0,
        airdropped_WEI: 0,
        total_pHRMS: 0,
        total_PLTS: 0,
      };
    }

    //Information of the transaction
    let bank = await web3.eth.getTransaction(value.tx);
    //Classification by bank
    if (banks[bank.to]) {
      //New HLY PUBLIC RATIO
      if (banks[bank.to] === "hly" && bank.blockNumber >= 23670581) {
        array[value.account].airdropped_pHRMS += +(value.amount * PUBLIC_RATIO);
        array[value.account].airdropped_WEI += +(value.amount * PUBLIC_RATIO * 1e18);
        array[value.account].total_pHRMS += +(value.amount * PUBLIC_RATIO);
        console.log(array[value.account])
      } 
      if (banks[bank.to] === "hly" && bank.blockNumber <= 23670580) {
        array[value.account].airdropped_pHRMS += +(value.amount * BANK_RATIO);
        // array[value.account].airdropped_WEI += +(web3.utils.toWei((value.amount * PUBLIC_RATIO).toString()));
        array[value.account].airdropped_WEI += +(value.amount * BANK_RATIO * 1e18);
        array[value.account].total_pHRMS += +(value.amount * BANK_RATIO);
        console.log(array[value.account])
      } 
      //BANK RATIO
      else {
        array[value.account].whitelisted_PLTS += +(value.amount);
        array[value.account].whitelisted_pHRMS += +(value.amount * BANK_RATIO);
        array[value.account].whitelisted_pHRMS_WEI += +(value.amount * BANK_RATIO * 1e18);
        console.log(`${banks[bank.to]} ETH: ${array[value.account].whitelisted_PLTS}`);
        array[value.account].total_pHRMS += +(value.amount * BANK_RATIO);
      }
      array[value.account].total_PLTS += +value.amount;
    }
    return array;
  }, Promise.resolve([]));

//   console.log(result["0x498Dd5A79ab7e19Be1dA81738239214F807E3462"]);

  //Write the new file
  console.log("writing deposits_grouped_by_account.txt");
  txt.push("account,whitelisted_PLTS,whitelisted_pHRMS,whitelisted_pHRMS_WEI,airdropped_pHRMS,airdropped_WEI,total_pHRMS,total_PLTS");
  for (let i in result) {
    txt.push(
      `${result[i].account},${result[i].whitelisted_PLTS},${result[i].whitelisted_pHRMS},${result[i].whitelisted_pHRMS_WEI},${result[i].airdropped_pHRMS},${result[i].airdropped_WEI},${result[i].total_pHRMS},${result[i].total_PLTS}`
    );
  }
  fs.writeFileSync("./deposits_grouped_by_account_WEI.txt", txt.join("\n"));
  console.log("done");
  return true;
}

function fileExist(file) {
  try {
    return fs.existsSync(file);
  } catch (e) {}
  return false;
}

async function main() {
  const tx = await web3.eth.getTransaction(
    "0x65fceef4b4bb748b242fa648c752f68b863698cf7d010f4032be55365a8747f0"
  );
  const tx2 = await web3.eth.getTransaction(
    "0x52a0dc46453f445abbf73cdc9c8677f17960db53e508b367d0cf760f87f5f0e0"
  );
  console.log(tx, tx2);
  await generateNewBalance();
}

main();
