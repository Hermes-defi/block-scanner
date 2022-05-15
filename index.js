"use strict";
const BLOCK_START = 20699464; // 2021-12-19T19:31:54.000Z
// const BLOCK_START = 22432211; // 2021-12-19T19:31:54.000Z
// const BLOCK_END   = 23670112; // 2022-03-04T17:20:05.000Z
const BLOCK_END = 26434217; // 2022-03-04T17:20:05.000Z
const RATIO = 0.6610169492; // Bank Swap Ratio

const fs = require("fs");
// use this rpc for the scan
// const rpcArchive = 'wss://a.ws.s0.t.hmny.io';
// const rpcArchive = 'https://api.harmony.one/';
const rpcArchive = "https://rpc.hermesdefi.io/";
const Web3 = require("web3");
const web3 = new Web3(rpcArchive);
const jsonInterface = [
  {
    name: "Deposit",
    type: "event",
    anonymous: false,
    inputs: [
      { name: "user", indexed: true, internalType: "address", type: "address" },
      {
        internalType: "uint256",
        type: "uint256",
        indexed: false,
        name: "amount",
      },
    ],
  },
  {
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", internalType: "address", type: "address" }],
    outputs: [
      { name: "amount", type: "uint256", internalType: "uint256" },
      { internalType: "uint256", type: "uint256", name: "rewardDebt" },
    ],
    name: "userInfo",
  },
];

const ctx1 = new web3.eth.Contract(
  jsonInterface,
  "0xb684CAB219dE861a49b396Ae3BbB1fc8702286E3"
); // MAGIC Bank
const ctx2 = new web3.eth.Contract(
  jsonInterface,
  "0x3636421e71dcf0bfcbb08feeb62e0275ea5acd61"
); // UNI Bank
const ctx3 = new web3.eth.Contract(
  jsonInterface,
  "0xB3617363eDEc16cB0D30a5912Eb7A6B1D48e2875"
); // LUMEN Bank
const ctx4 = new web3.eth.Contract(
  jsonInterface,
  "0x3074cf20ecd1cfe96b3ee43968d0c426f775171a"
); // DAI Bank
const ctx5 = new web3.eth.Contract(
  jsonInterface,
  "0x88Cc1D5E92aE19441583968EEc1cd03BEF47B5ED"
); // HLY Bank

let balances = {},
  bytx = [];
const banks = {
  "0x3074cf20ecd1cfe96b3ee43968d0c426f775171a": "dai",
  "0xB3617363eDEc16cB0D30a5912Eb7A6B1D48e2875": "lumen",
  "0xb684CAB219dE861a49b396Ae3BbB1fc8702286E3": "magic",
  "0x3636421e71dcf0bfcbb08feeb62e0275ea5acd61": "uni",
  "0x88Cc1D5E92aE19441583968EEc1cd03BEF47B5ED": "hly",
};
async function events(ctx) {
  let size = 1000;
  for (let i = BLOCK_START; i < BLOCK_END; i += size) {
    const from = i;
    const to = i + size - 1;
    console.log(
      `i=${i}, from=${from}, to=${to}, address=${ctx.options.address}`
    );
    await ctx.getPastEvents(
      "Deposit",
      { fromBlock: from, toBlock: to },
      function (error, events) {
        if (error) {
          console.log(error);
        } else {
          // console.log(events.length)
          for (let j = 0; j < events.length; j++) {
            const e = events[j];
            if (!e.event) continue;
            console.log(e.event);
            // if (e.event != 'Deposit') continue;
            const user = e.returnValues;
            if (!balances[user.user]) balances[user.user] = 0;
            const amount = parseInt(user.amount) / 1e18;
            balances[user.user] += amount;
            console.log("\t", user.user, amount);

            bytx.push(
              `${ctx.address},${e.transactionHash},${user.user},${amount}`
            );
          }
        }
      }
    );
  }
}

async function scanBlockchain() {
  // await events(ctx1);
  // await events(ctx2);
  // await events(ctx3);
  await events(ctx4);
  // await events(ctx5);
  fs.writeFileSync("./bytx.txt", bytx.join("\n"));
  console.log("\tscan completed and bytx.txt generated with all tx.");
}

async function generateBalance() {
  console.log("loading bytx.txt...");
  const bytx = fs.readFileSync("./bytx new.txt", "utf-8").split("\n");
  let balancesArray = [];
  for (let i in bytx) {
    const id = bytx[i].split(",")[1];
    if (balances[id]) continue;
    balances[id] = true;
    balancesArray.push(id);
  }
  let txt = [];
  const balancesTotal = balancesArray.length;
  console.log("building balances... total " + balancesTotal);
  for (let i = 0; i < balancesTotal; i++) {
    const address = balancesArray[i];
    const balance1 = await balance(address, ctx1);
    const balance2 = await balance(address, ctx2);
    const balance3 = await balance(address, ctx3);
    const balance4 = await balance(address, ctx4);
    const balance5 = await balance(address, ctx5);
    const total = balance1 + balance2 + balance3 + balance4 + balance5;
    const unlockedbank = balance1 + balance4 + balance3 + balance2; // Unlock before May 11th
    const lockedbank = balance5; // Unlock after May 11th
    const HRMS = total * RATIO;
    const unlockedHRMS = unlockedbank * RATIO;
    const airdropHRMS = lockedbank * RATIO;
    const info =
      address +
      "," +
      total +
      "," +
      unlockedbank +
      "," +
      lockedbank +
      "," +
      RATIO +
      "," +
      HRMS +
      "," +
      unlockedHRMS +
      "," +
      airdropHRMS;
    // const info = address+","+total+","+lockedbank+","+RATIO+","+HRMS+","+airdropHRMS;
    txt.push(info);
    console.log(i + " of " + balancesTotal + ") " + info);
  }
  console.log("writing all_addresses.txt");
  fs.writeFileSync("./all_addresses.txt", txt.join("\n"));

  let txtFiltered = [];
  for (let i = 0; i < txt.length; i++) {
    if (txt[i].split(",").at(3) > 0) {
      txtFiltered.push(txt[i]);
    }
  }

  console.log("writing affected_addresses.txt");
  fs.writeFileSync("./affected_addresses.txt", txtFiltered.join("\n"));
  console.log("done.");
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
        total: 0,
        dai: 0,
        lumen: 0,
        magic: 0,
        uni: 0,
        hly: 0,
        locked: 0,
        unlocked: 0,
      };
      result.push(array[value.account]);
    }

    //Information of the transaction
    let bank = await web3.eth.getTransaction(value.tx);

    //Classification by bank
    if (banks[bank.to]) {
      switch (banks[bank.to]) {
        case "dai":
          array[value.account].dai += +value.amount;
          array[value.account].unlocked += +value.amount;
          break;
        case "lumen":
          array[value.account].lumen += +value.amount;
          array[value.account].unlocked += +value.amount;
          break;
        case "magic":
          array[value.account].magic += +value.amount;
          array[value.account].unlocked += +value.amount;
          break;
        case "uni":
          array[value.account].uni += +value.amount;
          array[value.account].unlocked += +value.amount;
          break;
        case "hly":
          array[value.account].hly += +value.amount;
          array[value.account].locked += +value.amount;
          break;
      }
      array[value.account].total += +value.amount;
    }
    return array;
  }, Promise.resolve([]));

  //Write the new file
  console.log("writing deposits_grouped_by_account.txt");
  txt.push("account,dai,lumen,magic,uni,hly,locked,unlocked,total");
  for (let i in result) {
    txt.push(
      `${result[i].account},${result[i].dai},${result[i].lumen},${result[i].magic},${result[i].uni},${result[i].hly},${result[i].locked},${result[i].unlocked},${result[i].total}`
    );
  }
  fs.writeFileSync("./deposits_grouped_by_account.txt", txt.join("\n"));
}

async function balance(user, ctx) {
  const info4 = await ctx.methods.userInfo(user).call();
  return parseFloat(web3.utils.fromWei(info4.amount.toString()));
}

function fileExist(file) {
  try {
    return fs.existsSync(file);
  } catch (e) {}
  return false;
}

async function main() {
  // if( ! fileExist('bytx.txt') ){
  //     console.log('Scanning blockchain to load all deposit transactions...')
  //     await scanBlockchain();
  // }
  // console.log('Building whitelist based on transaction list...')
  // await generateBalance();
  await generateNewBalance();
}

main();
