const { getListTranstionTrade } = require("./getHistoryTrade");
const { getAllPairByStatus } = require("./utils/collections/2021_list_pair_token");
const { getTokenInformation } = require("./utils/collections/2021_list_token_info");


const handleHistoryTrade = async () => {
    const allPair = await getAllPairByStatus({ status: 0 });
    const data = allPair.data[0];
    const { pairAddress, addressTokenA, addressTokenB, symbol } = data;
    const getTokenInfo = await getTokenInformation({ addressTokenA });
    const { decimals } = getTokenInfo.data;
    // console.log(data);
    // console.log(pairAddress, addressTokenA, decimals, addressTokenB, symbol);
    // const aaa = await getListTranstionTrade(pairAddress, addressTokenA, decimals, addressTokenB, symbol);

    const post = {
        pairAddress:"0x0eD7e52944161450477ee417DE9Cd3a859b14fD0",
        addressTokenA:"0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
        decimals:18,
        addressTokenB:"0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
        symbol:"CAKE/BNB"
    }
    const aaaa = await getListTranstionTrade('0x0eD7e52944161450477ee417DE9Cd3a859b14fD0', '0e09fabb73bd3ade0a17ecc321fd13a19e81ce82', 18, '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', 'CAKE/BNB')
    console.log(aaaa.length);
}

handleHistoryTrade();