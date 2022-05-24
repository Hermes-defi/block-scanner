# Checking your balance
The available amount of whitelisted PLTS you are able to swap will be set by a whitelist function on the pHRMS swap contract. You will be able to view your remaining PLTS bonus swap amount on our front end as well. To view the amount of PLTS you are whitelisted for, check `accounts_PLTS.csv`.

## Unlocked by launch
```
1DAI BANK actually unlocks 1648389545 or Sun Mar 27 2022 09:59:05 UTC-0400
LUMEN Bank actually unlocks Mon 1650921064 or Apr 25 2022 17:11:04 UTC-0400
UNI Bank actually unlocks  1651689918 or Wed May 04 2022 14:45:18 UTC-0400
MAGIC Bank actually unlocks 1652295620 or Wed May 11 2022 15:00:20 UTC-0400
HLY Bank actually unlocks 1653490853 or Wed May 25 2022 11:00:53 UTC-040
```

# How to Run

- This application run on node 16.
- Run `npm i` or `yarn` to install dependencies.
- Run `node index.js` and wait!

## File Descriptions
- `bytx.txt` - All deposit events for our banks before the snapshot block. 
- `accounts_whitelist.txt` - `account,whitelist_PLTS,received_pHRMS`.
- `accounts_PLTS.csv` - `account,whitelist_PLTS`.

## Script Descriptions
- `index.js` - Script to generate `bytx.txt`, `accounts_whitelist.txt`, `accounts_PLTS.csv`.
