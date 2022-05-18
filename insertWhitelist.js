"use strict";
const BANK_RATIO = 0.6610169492; // Bank Swap Ratio
const PUBLIC_RATIO = 0.5603998308; //Public Swap Ratio

const fs = require("fs");
// use this rpc for the scan
const rpcArchive = "https://api.harmony.one/";

const Web3 = require("web3");
const web3 = new Web3(rpcArchive);

const whitelistInterface = [
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "adminSetWhitelist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "addresses",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
    ],
    name: "adminSetWhitelistMulti",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const swapContract = new web3.eth.Contract(
  whitelistInterface,
  "0xAF5395f4980C3B32A09eEFf2cC7308e4e3282395"
);

const banks = {
  "0x3074cf20ECD1Cfe96b3Ee43968d0c426f775171a": "dai",
  "0xB3617363eDEc16cB0D30a5912Eb7A6B1D48e2875": "lumen",
  "0xb684CAB219dE861a49b396Ae3BbB1fc8702286E3": "magic",
  "0x3636421e71dCF0Bfcbb08FeeB62E0275ea5AcD61": "uni",
  "0x88Cc1D5E92aE19441583968EEc1cd03BEF47B5ED": "hly",
};

async function insertWhitelist() {
  const file = fs
    .readFileSync("./deposits_grouped_by_account_WEI.txt", "utf-8")
    .split("\n");
  const addresses = [];
  const amounts = [];
  let iter = 0;
  for (let i in file) {
    if (iter !== 0) {
      addresses.push(file[i].split(",")[0]);
      amounts.push(web3.utils.toWei(file[i].split(",")[1]));
      // amounts.push(web3.utils.toWei(file[i].split(",")[1]), "wei");
    }
    iter++
  }
  console.log(addresses, amounts);
  await swapContract.methods
    .adminSetWhitelistMulti(addresses, amounts)
    .send({ from: "0x498Dd5A79ab7e19Be1dA81738239214F807E3462" });
}

async function generateNewBalance() {
  let balancesArray = [];
  let result = [];
  let txt = [];

  // 1st we read the transactions file
  console.log(`loading bytx.txt...`);
  const bytx = fs.readFileSync("./bytx_all.txt", "utf-8").split("\n");

  // We create an array of objects with all the lines from bytx file
  for (let i in bytx) {
    const line = {
      tx: bytx[i].split(",")[0],
      account: bytx[i].split(",")[1],
      amount: bytx[i].split(",")[2],
    };
    balancesArray.push(line);
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
        whitelisted_WEI: 0,
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
      //   if (value.account === "0x498Dd5A79ab7e19Be1dA81738239214F807E3462")
      //     console.log(bank.to);
      //New HLY PUBLIC RATIO
      if (banks[bank.to] === "hly" && bank.blockNumber >= 23670581) {
        array[value.account].airdropped_pHRMS += +(value.amount * PUBLIC_RATIO);
        // array[value.account].airdropped_WEI += +(web3.utils.toWei((value.amount * PUBLIC_RATIO).toString()));
        array[value.account].airdropped_WEI += +(
          value.amount *
          PUBLIC_RATIO *
          1e18
        );
        array[value.account].total_pHRMS += +(value.amount * PUBLIC_RATIO);
        console.log(array[value.account]);
      }
      //BANK RATIO
      else {
        array[value.account].whitelisted_PLTS += +(value.amount * BANK_RATIO);
        // array[value.account].whitelisted_WEI += +(web3.utils.toWei((value.amount * BANK_RATIO).toString()));
        array[value.account].whitelisted_WEI += +(
          value.amount *
          BANK_RATIO *
          1e18
        );
        console.log(
          `${banks[bank.to]} WEI: ${array[value.account].whitelisted_WEI}`
        );
        console.log(
          `${banks[bank.to]} ETH: ${array[value.account].whitelisted_PLTS}`
        );
        array[value.account].total_pHRMS += +(value.amount * BANK_RATIO);
      }
      array[value.account].total_PLTS += +value.amount;
    }
    return array;
  }, Promise.resolve([]));

  //   console.log(result["0x498Dd5A79ab7e19Be1dA81738239214F807E3462"]);

  //Write the new file
  console.log("writing deposits_grouped_by_account.txt");
  txt.push(
    "account,whitelisted_PLTS,whitelisted_WEI,airdropped_pHRMS,airdropped_WEI,total_pHRMS,total_PLTS"
  );
  for (let i in result) {
    txt.push(
      `${result[i].account},${result[i].whitelisted_PLTS},${result[i].whitelisted_WEI},${result[i].airdropped_pHRMS},${result[i].airdropped_WEI},${result[i].total_pHRMS},${result[i].total_PLTS}`
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
  await insertWhitelist();
}

main();
