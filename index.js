'use strict'
const fs = require('fs');
const rpc = 'https://a.api.s0.t.hmny.io';
const Web3 = require('web3');
const web3 = new Web3(rpc);
const jsonInterface = [
    {"name": "Deposit", "type": "event", "anonymous": false, "inputs": [{"name": "user", "indexed": true, "internalType": "address", "type": "address"}, {"internalType": "uint256", "type": "uint256", "indexed": false, "name": "amount"}]},
    {"type": "function", "stateMutability": "view", "inputs": [{"name": "", "internalType": "address", "type": "address"}], "outputs": [{"name": "amount", "type": "uint256", "internalType": "uint256"}, {"internalType": "uint256", "type": "uint256", "name": "rewardDebt"}], "name": "userInfo"}
];

const ctx1 = new web3.eth.Contract(jsonInterface, '0xb684CAB219dE861a49b396Ae3BbB1fc8702286E3');
const ctx2 = new web3.eth.Contract(jsonInterface, '0x3636421e71dcf0bfcbb08feeb62e0275ea5acd61');
const ctx3 = new web3.eth.Contract(jsonInterface, '0xB3617363eDEc16cB0D30a5912Eb7A6B1D48e2875');
const ctx4 = new web3.eth.Contract(jsonInterface, '0x3074cf20ecd1cfe96b3ee43968d0c426f775171a');
const ctx5 = new web3.eth.Contract(jsonInterface, '0x88Cc1D5E92aE19441583968EEc1cd03BEF47B5ED');

function delay(){
    return new Promise((resolve) => setTimeout(function(){
        resolve();
    }, 10))
}
let balances = {}, bytx = [];
async function events(ctx) {
    // const start = 23539122;
    // const   end = 23539123;
    const start = 20699464;
    const   end = 23681398;
    let size = 1000;
    for (let i = start; i < end; i += size) {
        const from = i;
        const to = (i + size) - 1;
        // await delay();
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

async function main(){
    await events(ctx1);
    await events(ctx2);
    await events(ctx3);
    await events(ctx4);
    await events(ctx5);

    fs.writeFileSync('./bytx.txt', bytx.join('\n') );

    // let txt = [];
    // console.log('building balances...');
    // for( let i in balances ){
    //     txt.push( await balance(i,ctx4) );
    // }
    // console.log('writing addresses.txt');
    // fs.writeFileSync('./addresses.txt', txt.join('\n'));
    // console.log('margin balances');
    // mergeBalances();
}



async function balance(user, ctx){
    const info4 = await ctx.methods.userInfo(user).call();
    const amount = (info4.amount.toString())/1e18;
    const ratio = 0.6610169492;
    const HRMS = amount * ratio;
    return user+","+amount+","+ratio+","+HRMS ;
}
async function test(){
    const bal = await balance('0x01d5e2a324bd51c95556bE094BbaF7d0D48c3D7f',ctx4);
    console.log(bal);
}

function mergeBalances(){
    const lines = fs.readFileSync('./addresses.txt', 'utf-8').split('\n');
    const t = lines.length;
    let res = {};
    for( let i = 0 ; i < t ; i ++ ){
        const p = lines[i].split(',');
        const u = p[0];
        const v = parseFloat(p[1]);
        if( ! v ) continue;
        let vv = res[u] ? res[u] : 0;
        vv += v;
        res[u] = vv;
    }

    let final = []
    for( let u in res ){
        const vv = res[u] * 0.6610169492;
        final.push( u+','+res[u]+',0.6610169492,'+vv );
    }
    fs.writeFileSync('./addresses-merged.txt', final.join('\n'));
}


main();

