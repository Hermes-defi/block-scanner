# Checking your balance
If you wish to verify your calculated PLTS amount across all banks and the corresponding HRMS you will receive at the bonus swap rate, open https://github.com/Hermes-defi/block-scanner/blob/main/all_addresses.txt and search for your address.
The format of all_addresses.txt is:

`address, total PLTS, UnlockedBank PLTS (1DAI, LUMEN, UNI), LockedBank PLTS (MAGIC, HLY), Ratio, total HRMS, unlockedHRMS, airdroppedHRMS`

# Updates due to Bank Lock Configuration
Due to a configuration error in the Bank deployment function, our Banks are unlocking at different times than the bonus reward end block. Our Audit report from Certik is expected by April 29th at the latest. We are splitting the banks into two groups based on if they will be unlocked by our new (delayed) DEX launch. If you are affected by this, you can view your address in https://github.com/Hermes-defi/block-scanner/blob/main/affected_addresses.txt

## Unlocked by launch
```
1DAI BANK actually unlocks 1648389545 or Sun Mar 27 2022 09:59:05 UTC-0400
LUMEN Bank actually unlocks Mon 1650921064 or Apr 25 2022 17:11:04 UTC-0400
UNI Bank actually unlocks  1651689918 or Wed May 04 2022 14:45:18 UTC-0400
```
## Locked on launch
```
MAGIC Bank actually unlocks 1652295620 or Wed May 11 2022 15:00:20 UTC-0400
HLY Bank actually unlocks 1653490853 or Wed May 25 2022 11:00:53 UTC-040
```
Because users will not be able to swap PLTS contained within the locked banks, we will instead airdrop pHRMS to the affected wallets directly. This will be done for both the bonus rate (this repo) and at the public rate (soonTM).

# How to Run

- This application run on node 16.
- Run `npm i` or `yarn` to install dependencies.
- Run `node index.js` and wait to generate bytx.txt and later addresses.txt
- Check your balance on addresses.txt

# How to run using Ubuntu

Create a dir to hold the project:
 $ cd Hermes/

Clone the HERMES-presale-contract:
 $ git clone https://github.com/pythinking/HERMES-presale-contracts.git

Enter dir
 $ cd HERMES-presale-contracts/

Install dependencies
 $ yarn install

Connect your metamask to Harmony testnet
https://docs.harmony.one/home/general/wallets/browser-extensions-wallets/metamask-wallet/adding-harmony



Compile the contract
 $ npx hardhat compile

Run tests scripts

 $ PRIVATE_KEY=df57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14exxxxxx npx hardhat compile
 $ PRIVATE_KEY=df57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14xxxxxxx npx hardhat run scripts/testnet-deploy.js 

