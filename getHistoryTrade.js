

const { ethers, utils, BigNumber } = require('ethers');
const moment = require('moment');

const InputDataDecoder = require('ethereum-input-data-decoder');
const decoder = new InputDataDecoder("./abis/pancakeRouter.json");
const abiEvent = require("./abis/pairEvent.json");

const infuraWSS = 'https://bsc-dataseed1.ninicoin.io/'
// const infuraWSS = 'https://speedy-nodes-nyc.moralis.io/c7eea3644b5212d5f15eea04/bsc/mainnet'

const { insertHistoryTrade, insertOneHistoryTrade, getPairById } = require("./utils/collections/2021_trade_history");
const { getPriceBNB } = require("./config/ethers")

const addresses = {
    WETH: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
    factory: '0xca143ce32fe78f1f7019d7d551a6402fc5350c73', //uniswap v2 factory
    router: '0x10ED43C718714eb63d5aA57B78B54704E256024E', //uniswap v2 router
    recipient: '0xd9863d68Fb56dBcAd399541748f2cd0217238372', //this address receives the tokens (currently my main test account)
    primaryKey: '92dfc24992dc73263d176ed7051c7c8c53a1698d63498e050dc8042ddfdb70c7',
}

const provider = new ethers.providers.JsonRpcProvider(infuraWSS);


const getToken0Address = async (addressPair) => {
    try {
        const pair = new ethers.Contract(
            addressPair,
            [
                "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
                "function token0() external view returns (address)",
                "function token1() external view returns (address)",
            ],
            provider
        );
        const token0 = await pair.token0();
        return token0;
    } catch (error) {
        // console.log(error.message)
        return false;
    }
};

function decodeEvent(logs, fragment) {
    try {
        const Interface = new ethers.utils.Interface(abiEvent)
        const result = Interface.decodeEventLog(fragment, logs.data, logs.topics);
        return result
    } catch (error) {
        console.log(error);
        return false;
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function getTransctionFromPair(params) {
    try {

        const { pairAddress } = params;


        const getBlock = await provider.getBlock("latest");
        const timestamp = getBlock.timestamp;
        let blockNumber = getBlock.number;

        // if (blockNumber > _blockNumber) {
        //     blockNumber = _blockNumber;
        // }

        const blockResult = await provider.getLogs({
            address: pairAddress,
            topics: [
                ethers.utils.id("Swap(address,uint256,uint256,uint256,uint256,address)"),
            ],
            fromBlock: blockNumber - 500,
            toBlock: 'latest',
        })


        console.log(blockResult.length, 'block');

        const result = await handingBlock({ blockResult, timestamp, params })
        return result;

    } catch (error) {
        // console.log(error, 'error');
        return false;
    }

}
function calculateAction(eventSwap, paramMain) {


    // (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOut) : (amountOut, uint(0));
    //token0 = money => input A => sell
    //token0 = A => input B => buy

    const { decimals, tokenAddressB, token0 } = paramMain;
    const { sender, amount0In, amount1In, amount0Out, amount1Out, to } = eventSwap;

    const token0isMoney = token0.toLowerCase() === tokenAddressB.toLowerCase() ? true : false;

    let action = null;
    let amountTokenA = 0;
    let amountTokenB = 0;


    if (amount0Out > 0) {
        //input =! token0
        if (token0isMoney) {
            action = 'SELL';
            amountTokenA = amount1In;
            amountTokenB = amount0Out;
        } else {
            action = 'BUY';
            amountTokenA = amount0Out;
            amountTokenB = amount1In;
        }

    } else {
        //input == token0
        if (token0isMoney) {
            action = 'BUY';
            amountTokenA = amount1Out;
            amountTokenB = amount0In;
        } else {
            action = 'SELL';
            amountTokenA = amount0In;
            amountTokenB = amount1Out;
        }
    }





    const amountA = parseFloat(ethers.utils.formatUnits(amountTokenA, decimals));
    const amountB = parseFloat(ethers.utils.formatUnits(amountTokenB, 'ether'));

    return {
        sender,
        to,
        amountA,
        amountB,
        action
    };

}
async function callTransaction(txHash, eventDetail, timestamp, paramMain) {
    try {
        const decode = decodeEvent(eventDetail, 'Swap');
        const dataAction = calculateAction(decode, paramMain);
        const { amountA, amountB, action, to } = dataAction;
        const { priceBNB, tokenAddressA, tokenAddressB, pairAddress, symbol } = paramMain;
        // console.log(dataAction);
        if (amountA > 0 && amountB > 0) {
            let priceToken = 0;
            if (tokenAddressB.toLowerCase() === (addresses.WETH).toLowerCase()) {
                priceToken = amountB / amountA * priceBNB;
            } else {
                priceToken = amountB / amountA;
            }
            const post = {
                idPair: pairAddress.toLowerCase(),
                namePair: symbol,
                addressTokenA: tokenAddressA.toLowerCase(),
                addressTokenB: tokenAddressB.toLowerCase(),
                walletAddress: to.toLowerCase(),
                txHash: txHash.toLowerCase(),
                amountTokenA: amountA,
                amountTokenB: amountB,
                priceToken,
                isUpdate: false,
                type: action === 'SELL' ? 1 : 2,
                timeTransaction: moment.unix(timestamp).format("YYYY-MM-DD HH:mm:ss")
            }
            // console.log((await insertOneHistoryTrade(post)).status, symbol);
            // console.log(post);
            // socket.emit(pairAddress.toLowerCase(), { tx, from, to, tokenAddressA, tokenAddressB, timestamp, priceToken, data })
            return post;
        }

    } catch (error) {
        console.log(error, 'error');
    }
}
async function handingBlock(paramMain) {
    const { blockResult, timestamp, params } = paramMain;
    let result = [];
    await Promise.all(blockResult.map(async (eventDetail, index) => {
        const txHash = eventDetail.transactionHash.toLowerCase();
        if (!historyTxt.includes(txHash)) {
            historyTxt.push(txHash);
            const dataTransaction = callTransaction(txHash, eventDetail, timestamp, params);
            if (dataTransaction) { result.push(dataTransaction) }
        } 
    }))
    return result;
}
async function getListTranstionTrade(pairAddress, tokenAddressA, decimals, tokenAddressB, symbol) {
    try {
        const priceBNB = await getPriceBNB();
        const token0 = await getToken0Address(pairAddress);

        // console.log(token0,'token0');

        const param = {
            pairAddress,
            tokenAddressA,
            decimals,
            symbol,
            tokenAddressB,
            priceBNB,
            token0
        }
        const result = await getTransctionFromPair(param);
        console.log(historyTxt.length);
        if (result) {
            return result;

        }
    } catch (error) {

        console.log(error, 'error');

    }
}





module.exports = {
    getListTranstionTrade
}




async function run() {
    // console.log(provider);

    // filter = {
    //     address: "0x0ed7e52944161450477ee417de9cd3a859b14fd0",
    //     topics: [
    //         "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822"
    //     ]
    // }
    // provider.on(filter, (log, event) => {
    //     console.log(log.transactionHash, moment().format("YYYY-MM-DD HH:mm:ss"));
    //     // Emitted whenever a DAI token transfer occurs
    // })

    //     // CAKE/BNB
    //     // lp : 0x0eD7e52944161450477ee417DE9Cd3a859b14fD0
    //     // emitSocketPairBSC('0e09fabb73bd3ade0a17ecc321fd13a19e81ce82', '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0', 'CAKE/BNB');
    //     // getListTranstionTrade('','0x0eD7e52944161450477ee417DE9Cd3a859b14fD0', '0e09fabb73bd3ade0a17ecc321fd13a19e81ce82', 18, '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', 'CAKE/BNB')
    //     // CAKE/BUSD
    //     // lp: 0x804678fa97d91B974ec2af3c843270886528a9E6
    //     // getListTranstionTrade('','0x804678fa97d91B974ec2af3c843270886528a9E6', '0e09fabb73bd3ade0a17ecc321fd13a19e81ce82', 18, '0xe9e7cea3dedca5984780bafc599bd69add087d56', 'CAKE/BUSD')
    //     // BNB/BUSD
    //     // lp:  0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16
    getListTranstionTrade('', '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16', '0xe9e7cea3dedca5984780bafc599bd69add087d56', 18, '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', 'BUSD/BNB')
    //     // 'RACA/BUSD'
    // getListTranstionTrade('', '0x8e744ec2795c8b836689d1b4ebe1489204357dac', '0x12bb890508c125661e03b09ec06e404bc9289040', 18, '0xe9e7cea3dedca5984780bafc599bd69add087d56', 'RACA/BUSD')
    //     // 'KBOX/USDT
    // getListTranstionTrade('', '0x0614c301aCAb5A289c4e27727d93455864709Fc2', '0x3523d58d8036B1C5C9A13493143c97aEfC5Ad422', 18, '0x55d398326f99059fF775485246999027B3197955', 'KBOX/USDT')

}

// run();

