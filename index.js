'use strict'

const BLOCK_START = 20699464; // 2021-12-19T19:31:54.000Z
const BLOCK_END   = 23670112; // 2022-03-04T17:20:05.000Z
const RATIO = 0.6610169492; // Bank Swap Ratio

const fs = require('fs');
// use this rpc for the scan
const rpcArchive = 'wss://a.ws.s0.t.hmny.io';
const Web3 = require('web3');
const web3 = new Web3(rpcArchive);
const jsonInterface = [
    {"name": "Deposit", "type": "event", "anonymous": false, "inputs": [{"name": "user", "indexed": true, "internalType": "address", "type": "address"}, {"internalType": "uint256", "type": "uint256", "indexed": false, "name": "amount"}]},
    {"type": "function", "stateMutability": "view", "inputs": [{"name": "", "internalType": "address", "type": "address"}], "outputs": [{"name": "amount", "type": "uint256", "internalType": "uint256"}, {"internalType": "uint256", "type": "uint256", "name": "rewardDebt"}], "name": "userInfo"}
];

const ctx1 = new web3.eth.Contract(jsonInterface, '0xb684CAB219dE861a49b396Ae3BbB1fc8702286E3'); // MAGIC Bank
const ctx2 = new web3.eth.Contract(jsonInterface, '0x3636421e71dcf0bfcbb08feeb62e0275ea5acd61'); // UNI Bank
const ctx3 = new web3.eth.Contract(jsonInterface, '0xB3617363eDEc16cB0D30a5912Eb7A6B1D48e2875'); // LUMEN Bank
const ctx4 = new web3.eth.Contract(jsonInterface, '0x3074cf20ecd1cfe96b3ee43968d0c426f775171a'); // DAI Bank
const ctx5 = new web3.eth.Contract(jsonInterface, '0x88Cc1D5E92aE19441583968EEc1cd03BEF47B5ED'); // HLY Bank

const banks = {
  "0x3074cf20ECD1Cfe96b3Ee43968d0c426f775171a": "dai",
  "0xB3617363eDEc16cB0D30a5912Eb7A6B1D48e2875": "lumen",
  "0xb684CAB219dE861a49b396Ae3BbB1fc8702286E3": "magic",
  "0x3636421e71dCF0Bfcbb08FeeB62E0275ea5AcD61": "uni",
  "0x88Cc1D5E92aE19441583968EEc1cd03BEF47B5ED": "hly",
};

let balances = {}, bytx = [];
async function events(ctx) {
    let size = 1000;
    for (let i = BLOCK_START; i < BLOCK_END; i += size) {
        const from = i;
        const to = (i + size) - 1;
        console.log(`i=${i}, from=${from}, to=${to}`);
        await ctx.getPastEvents({}, {fromBlock: from, toBlock: to},
            function (error, events) {
                if (error) {
                    console.log(error);
                } else {
                    for (let j = 0; j < events.length; j++) {
                        const e = events[j];
                        if ( ! e.event ) continue;
                        // console.log(e);
                        // if (e.event != 'Deposit') continue;
                        const user = e.returnValues;
                        if( ! balances[user.user] )
                            balances[user.user] = 0;
                        const amount = parseInt(user.amount)/1e18;
                        balances[user.user] += amount;
                        console.log('\t', user.user, amount);
                        bytx.push(`${e.transactionHash},${user.user},${amount}`);
                    }
                }
            });
    }

}


async function scanBlockchain(){
    await events(ctx1);
    await events(ctx2);
    await events(ctx3);
    await events(ctx4);
    await events(ctx5);
    fs.writeFileSync('./bytx.txt', bytx.join('\n') );
    console.log('\tscan completed and bytx.txt generated with all tx.')
}


async function generateNewBalance() {
  let balancesArray = [];
  let result = [];
  let txt = [];

  // 1st we read the transactions file
  console.log(`loading bytx.txt...`);
  const bytx = fs.readFileSync("./bytx.txt", "utf-8").split("\n");

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
        whitelisted_pHRMS: 0
      };
    }


    //Information of the transaction
    let bank = await web3.eth.getTransaction(value.tx);
    //Classification by bank
    if (banks[bank.to]) {
      if (bank.blockNumber <= 23670112) {
        array[value.account].whitelisted_PLTS += +(value.amount);
        array[value.account].whitelisted_pHRMS += +(value.amount * RATIO);
        console.log(`${banks[bank.to]} ETH: ${array[value.account].whitelisted_PLTS}`);
      } 
    };
    return array;
  }, Promise.resolve([]));


  //Write the whitelist
  console.log("writing accounts_whitelist.txt");
  txt.push("account,whitelisted_PLTS,whitelisted_pHRMS");
  for (let i in result) {
    txt.push(
      `${result[i].account},${result[i].whitelisted_PLTS},${result[i].whitelisted_pHRMS}`
    );
  }
  fs.writeFileSync("./accounts_whitelist.txt", txt.join("\n"));
  console.log("done");
  return true;
}


async function formatWhitelist() {
  let formatted = [];
  // 1st we read the transactions file
  console.log(`loading accounts_whitelist.txt...`);
  const whitelist = fs.readFileSync("./accounts_whitelist.txt", "utf-8").split("\n");
  console.log("writing accounts_PLTS.csv");
  for (let i in whitelist) {
    formatted.push(`${whitelist[i].split(",")[0]},${whitelist[i].split(",")[1]}`);
    fs.writeFileSync("./accounts_PLTS.csv", formatted.join("\n"));
  }
}


async function balance(user, ctx){
    const info4 = await ctx.methods.userInfo(user).call();
    return parseFloat( web3.utils.fromWei( info4.amount.toString() ) );
}


function fileExist(file){
    try{
        return fs.existsSync(file)
    }catch(e){

    }
    return false;
}


async function main(){
    if( ! fileExist('bytx.txt') ){
        console.log('Scanning blockchain to load all deposit transactions...')
        await scanBlockchain();
    }
    if( ! fileExist('accounts_whitelist.txt') ){
        console.log('Building whitelist based on transaction list...')
        await generateNewBalance();
        console.log('Whitelist built!');
    }
    if( ! fileExist('accounts_PLTS.csv') ){
      console.log('Generate formatted file.');
      await formatWhitelist();
      console.log('Formatting complete.');
    }
}

main();
