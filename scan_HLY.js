'use strict'

const BLOCK_START = 23670112; // 2022-03-04T17:20:05.000Z
const BLOCK_END   = 'latest';
const RATIO = 0.5603998308; // Public Swap Ratio

const fs = require('fs');
// use this rpc for the scan
const rpcArchive = 'wss://a.ws.s0.t.hmny.io';
const Web3 = require('web3');
const web3 = new Web3(rpcArchive);
const jsonInterface = [
    {"name": "Deposit", "type": "event", "anonymous": false, "inputs": [{"name": "user", "indexed": true, "internalType": "address", "type": "address"}, {"internalType": "uint256", "type": "uint256", "indexed": false, "name": "amount"}]},
    {"type": "function", "stateMutability": "view", "inputs": [{"name": "", "internalType": "address", "type": "address"}], "outputs": [{"name": "amount", "type": "uint256", "internalType": "uint256"}, {"internalType": "uint256", "type": "uint256", "name": "rewardDebt"}], "name": "userInfo"}
];

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
    await events(ctx5);
    fs.writeFileSync('./HLY_deposits.txt', bytx.join('\n') );
    console.log('\tscan completed and HLY_deposits.txt generated with all post snapshot tx.')
}

async function generateBalance(){
    console.log('loading HLY_deposits.txt...');
    const bytx = fs.readFileSync('./HLY_deposits.txt', 'utf-8').split('\n');
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
        // TODO Switch from calling current contract balance to generation of amount from bytx.txt
        const balance5 = await balance(address,ctx5);
        const HRMS = balance5 * RATIO;
        const unlockedHRMS = 0;
        const airdropHRMS = balance5 * RATIO;
        const info = address+","+RATIO+","+HRMS+","+unlockedHRMS+","+airdropHRMS;
        // const info = address+","+total+","+lockedbank+","+RATIO+","+HRMS+","+airdropHRMS;
        txt.push( info );
        console.log(i+' of '+balancesTotal+') '+info);
    }
    console.log('writing hly_addresses.txt');
    fs.writeFileSync('./hly_addresses.txt', txt.join('\n'));
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
    if( ! fileExist('HLY_deposits.txt') ){
        console.log('Scanning blockchain to load all deposit transactions...')
        await scanBlockchain();
    }
    console.log('Building whitelist based on transaction list...')
    await generateBalance();
    console.log('Complete.')
}

main();
