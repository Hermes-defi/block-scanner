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

                        bytx.push(`${e.transactionHash},${user.user},${amount}`)

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

async function generateBalance(){
    console.log('loading bytx.txt...');
    const bytx = fs.readFileSync('./bytx.txt', 'utf-8').split('\n');
    let balancesArray = [];
    for( let i in bytx ){
        const id = bytx[i].split(',')[1];
        if( balances[id] ) continue;
        balances[id] = true;
        balancesArray.push(id);
    }
    let txt = [];
    const balancesTotal = balancesArray.length;
    console.log('building balances... total '+balancesTotal);
    for( let i = 0 ; i < balancesTotal; i ++ ){
        const address = balancesArray[i];
        const balance1 = await balance(address,ctx1);
        const balance2 = await balance(address,ctx2);
        const balance3 = await balance(address,ctx3);
        const balance4 = await balance(address,ctx4);
        const balance5 = await balance(address,ctx5);
        const total = balance1 + balance2 + balance3 + balance4 + balance5;
        // const total = balance1 + balance5
        const unlockedbank = balance4 + balance3 + balance2; // Unlocked before May 4th
        const lockedbank = balance1 + balance5; // Estimated unlock > May 4th
        const HRMS = total * RATIO;
        const unlockedHRMS = unlockedbank * RATIO;
        const airdropHRMS = lockedbank * RATIO;
        const info = address+","+total+","+ unlockedbank +","+ lockedbank +","+RATIO+","+HRMS+","+unlockedHRMS+","+airdropHRMS;
        // const info = address+","+total+","+lockedbank+","+RATIO+","+HRMS+","+airdropHRMS;
        txt.push( info );
        console.log(i+' of '+balancesTotal+') '+info);
    }
    console.log('writing all_addresses.txt');
    fs.writeFileSync('./all_addresses.txt', txt.join('\n'));

    let txtFiltered = [];
    for (let i = 0; i < txt.length; i++) {
        if (txt[i].split(',').at(3) > 0) {
            txtFiltered.push(txt[i]);
        }
    }

    console.log('writing affected_addresses.txt');
    fs.writeFileSync('./affected_addresses.txt', txtFiltered.join('\n'));
    console.log('done.');
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
    console.log('Building whitelist based on transaction list...')
    await generateBalance();
}

main();
