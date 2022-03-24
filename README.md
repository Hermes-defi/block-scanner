# Checking your balance
If you wish to verify your calculated PLTS amount across all banks and the corresponding HRMS you will receive at the bonus swap rate, open https://raw.githubusercontent.com/Hermes-defi/block-scanner/main/addresses.txt and search for your address. 
The format of addresses.txt is:

`address, total PLTS, UnlockedBank PLTS (1DAI, LUMEN, UNI), LockedBank PLTS (MAGIC, HLY), Ratio, total HRMS`

# Updates due to Bank Lock Configuration
Due to a configuration error in the Bank deployment function, our Banks are unlocking at different times than the bonus reward end block. Our Audit report from Certik is expected by April 29th at the latest. We are splitting the banks into two groups based on if they will be unlocked by our new (delayed) DEX launch.

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
