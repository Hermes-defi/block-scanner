# Checking your balance
The summary files for all of the banks are available! 
1. If you participated in 1DAI, LUMEN, UNI, or MAGIC banks. [Whitelisted PLTS amounts](https://raw.githubusercontent.com/Hermes-defi/block-scanner/main/accounts_PLTS_whitelist.csv)
2. If you participated in the HLY bank, you will be airdropped pHRMS directly. [Airdrop pHRMS amounts](https://raw.githubusercontent.com/Hermes-defi/block-scanner/main/accounts_pHRMS_airdrop.csv)
3. If you wish to dig through the entire summary of this scanner, you can view it [here](https://raw.githubusercontent.com/Hermes-defi/block-scanner/main/deposits_grouped_by_account_WEI.txt). 

The available amount of whitelisted PLTS you are able to swap will be set by a whitelist function on the pHRMS swap contract. You will be able to view your remaining PLTS bonus swap amount on our front end as well.

## Unlocked by launch
```
1DAI BANK actually unlocks 1648389545 or Sun Mar 27 2022 09:59:05 UTC-0400
LUMEN Bank actually unlocks Mon 1650921064 or Apr 25 2022 17:11:04 UTC-0400
UNI Bank actually unlocks  1651689918 or Wed May 04 2022 14:45:18 UTC-0400
MAGIC Bank actually unlocks 1652295620 or Wed May 11 2022 15:00:20 UTC-0400
```
## Locked on launch
```
HLY Bank actually unlocks 1653490853 or Wed May 25 2022 11:00:53 UTC-040
```

# How to Run

- This application run on node 16.
- Run `npm i` or `yarn` to install dependencies.
- Run `node index.js` and wait!
- Run `node transitionScanner.js` to generate the final summary file from recorded transactions.

## File Descriptions
`bytx_all.txt` - All deposit events for our banks. 
`deposits_grouped_by_account.txt` - A summary of the bonus rate (0.66...) whitelisted PLTS for each wallet as well as any airdropped pHRMS.
`deposits_grouped_by_account_WEI.txt` - A summary file with additional formatting.
`accounts_PLTS_whitelist.csv` - A simplified file with whitelisted PLTS ONLY.
`accounts_pHRMS_airdrop.csv` - A simplified file with airdropped pHRMS ONLY.

`index.js` - Script to generate `bytx_all.txt`
`transitionScanner.js` - Script to generate simplified summary files from individual deposit transactions.
