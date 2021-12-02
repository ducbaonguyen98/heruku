const { getListPairToken, countListPairToken, updatePairToken, getListPairTokenLimit } = require("./utils/collections/2021_list_pair_token");
const { updateToken } = require("./utils/collections/2021_list_token_info");

const got = require('got');
const delay = require("delay");

const { ethers, utils, BigNumber } = require("ethers");

const url_1 = "https://bsc-dataseed.binance.org/";
const url_2 = "https://bsc-dataseed1.defibit.io/";
const url_3 = "https://bsc-dataseed1.ninicoin.io/"; 
const URL = [url_1, url_2, url_3];

const initProvider = (infuraWSS) => {
    const config = {
        factory: "0xca143ce32fe78f1f7019d7d551a6402fc5350c73", //uniswap v2 factory
        router: "0x10ED43C718714eb63d5aA57B78B54704E256024E", //uniswap v2 router
    };

    const provider = new ethers.providers.JsonRpcProvider(infuraWSS);

    const router = new ethers.Contract(
        config.router,
        [
            "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
        ],
        provider
    );

    const getPriceBNB = async () => {
        const amounts = await router.getAmountsOut(
            ethers.utils.parseUnits("1", 18),
            [
                "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
                "0x55d398326f99059fF775485246999027B3197955",
            ]
        );
        return parseFloat(ethers.utils.formatUnits(amounts[1], 18));
    };

    const getInfoPair = async (addressPair) => {
        try {
            const pair = new ethers.Contract(
                addressPair,
                [
                    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
                    "function token0() external view returns (address)",
                    "function token1() external view returns (address)"
                ],
                provider
            );

            const [tokenA, tokenB, getReserves] = await Promise.all([pair.token0(), pair.token1(), pair.getReserves()])

            return {
                tokenA,
                tokenB,
                getReserves
            };
        } catch (error) { 
            return false;
        }
    };

    return {
        getPriceBNB,
        getInfoPair
    }
}

const initUpdatePairToken = async (skip, limit) => {
    const infuraWSS = url_1;
    const provider = initProvider(infuraWSS); 
    while (true) {
        const result = await getListPairTokenLimit(skip, limit); 
        await handleUpdatePairToken(provider, result.status === "success" ? result.data : [], skip/100);
        await delay(5 * 1000);
    }
}; 

const getHolders = async (token) => {
    try {
        const url = `https://api.covalenthq.com/v1/56/tokens/${token}/token_holders/?key=ckey_dfa7b9ac4f32430aa3dfe6c55f0`;
        const result = await got(url);
        return {
            status: "success",
            data: JSON.parse(result.body)
        }
    } catch (error) {
        // console.log("getHolders", error);
    }

    return {
        status: "error"
    }
}

const handleUpdatePairToken = async (provider, data, index) => {
    try {
        const map = data.map(async item => {
            const { _id, pairAddress, addressTokenA, poolAmountA, poolAmountB, namePair, decimals, symbol } = item;
            const result = await Promise.all([provider.getInfoPair(pairAddress), getHolders(addressTokenA)]);
            const [infoPair, holders] = result;
            const { items, pagination } = holders.data.data;
            const { tokenA, getReserves } = infoPair;
            if (!infoPair) {
                console.log(symbol)
                return {};
            }

            let poolRemainingA = 0;
            let poolRemainingB = 0;

            if (addressTokenA === tokenA.toLowerCase()) {
                poolRemainingA = ethers.utils.formatUnits(getReserves[0], decimals);
                poolRemainingB = ethers.utils.formatUnits(getReserves[1], 18);
            } else {
                poolRemainingA = ethers.utils.formatUnits(getReserves[1], decimals);
                poolRemainingB = ethers.utils.formatUnits(getReserves[0], 18);
            }

            if (parseFloat(poolAmountA) !== parseFloat(poolRemainingA) || parseFloat(poolAmountB) !== parseFloat(poolRemainingB)) {

                let price = parseFloat(poolRemainingB / poolRemainingA);
                let LP = parseFloat(poolAmountB) * 2;
                if (namePair.indexOf("BNB") !== -1) {
                    const resultPriceTokenB = await provider.getPriceBNB();
                    price = parseFloat(poolRemainingB) * resultPriceTokenB / parseFloat(poolRemainingA);
                    LP = parseFloat(poolAmountB) * resultPriceTokenB * 2;
                }

                const update = {
                    price: price || 0,
                    lp: LP || 0,
                    poolRemainingA,
                    poolRemainingB,
                }

                const resultPromise = await Promise.all([updatePairToken({ _id }, update), updateToken({ tokenAddress: addressTokenA }, {
                    price: price || 0,
                    lp: LP || 0,
                    poolRemaining: poolRemainingB,
                    totalHolder: pagination.total_count,
                    listHolder: items.length > 0 ? JSON.stringify(items) : JSON.stringify([])
                })])

                // console.log(resultPromise)  
                // console.log(`***********${symbol}************`);
                // console.log(symbol)

            }
            return {};
        });
        await Promise.all(map);
        console.log(`success-${index}`);

    } catch (error) { 
        console.log(`error-${index}`);
    }
}

const run = async (data, index) => {
    const infuraWSS = URL[Math.floor(Math.random()*URL.length)];  
    const provider = initProvider(infuraWSS); 
    return handleUpdatePairToken(provider, data, index);
}

const main = async () => {
    while (true) {
        const LIMIT = 100;
        const SKIP = 100;
        console.time("answer time");
        const result = await getListPairTokenLimit(SKIP, LIMIT*10); 
        const totalFunc = Math.ceil(result.data.length / LIMIT); 
        const arr = []; 

        for(let i = 1; i <= totalFunc; i++) { 
            arr.push(run([...result.data].splice((i - 1)*LIMIT, LIMIT) ,i - 1));
        }
        
        await Promise.all(arr);  
        console.timeEnd("answer time");
        console.log("\n*************restart*************\n");
    }
    
}   

main();