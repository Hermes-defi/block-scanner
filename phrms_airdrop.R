library(tidyverse)
library(readr)

url1 <- "https://raw.githubusercontent.com/Hermes-defi/block-scanner/main/addresses.txt"
headers <- c("address","total_bank","dai_bank","other_bank","ratio","total_hrms")


raw <- read_csv(url1,col_names = headers,col_types = c("address"="character")) %>% as_tibble()

df1 <- raw %>%
  mutate(
    dai_bank_hrms = dai_bank*ratio
    ,other_bank_hrms = other_bank*ratio
  ) %>%
  select(-ratio) %>%
  pivot_longer(
    cols=-address
    ,names_to = "type_l1"
    ,values_to = "amount"
  ) %>%
  mutate(
    type_l2 = case_when(
      type_l1 %in% c("total_bank","dai_bank","other_bank") ~ "PLTS"
      ,T ~ "HRMS"
    )
    ,type_l1 = str_remove_all(type_l1,"bank|hrms|_")
  )

df1 %>%
  filter(type_l2=="HRMS",type_l1 =="other") %>%
  write.csv("phrms_airdrop.csv")