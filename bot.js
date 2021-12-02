
// const Web3 = require('web3');
const web3 = require('./utils/web3.js');
const moment = require('moment');
const cors = require('cors');



const pancakeRouterABI = require('./abis/pancakeRouter.json').pancakeRouter;
const pancakeFactoryABI = require('./abis/pancakeFactory.json').pancakeFactory;
const pancakePairABI = require('./abis/pancakePair.json')
const Api = require('./api.js');
const express = require('express');
var bodyParser = require('body-parser');


////
const MySQLClass = require('./utils/MySQLClass');
const mysql_2021_bot_trader_config = require('./cert/mysql_amazon');
var mysql_2021_bot_trader = new MySQLClass();
mysql_2021_bot_trader.setConfig(mysql_2021_bot_trader_config);

let subscription;

const app = express();
const PORT = process.env.PORT || 4000;
app.set('trust proxy', false);
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

//MAINNET
const BNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
//pancake
const factoryAddress = '0xca143ce32fe78f1f7019d7d551a6402fc5350c73';
const routerAddress = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
const chainId = 56;


// const RPC = 'https://bsc-dataseed1.defibit.io/';
// var web3 = new Web3(RPC);

// The minimum ABI to get ERC20 Token balance
const minABI = [
    // balanceOf
    {
        "constant": true,
        "inputs": [{ "name": "_owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "balance", "type": "uint256" }],
        "type": "function"
    },
    // decimals
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{ "name": "", "type": "uint8" }],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
        ],
        "name": "totalSupply",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },

    {
        "constant": true,
        "inputs": [
        ],
        "name": "name",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
        ],
        "name": "symbol",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
];

const getLastLengthPair = () => {
    return mysql_2021_bot_trader.query("SELECT * FROM `2021_list_pair_token` ORDER BY id DESC LIMIT 1").then(dexs => {
        return dexs[0];
    });
}

// const getTokenList = () => {
// 	let TOKEN = [];
//     return mysql_2021_bot_trader.query("SELECT * FROM `2021_list_pair_token` WHERE chain ='BSC' AND amoutBNBDEX > 1").then(dexs => {
//         dexs.forEach(element => {
//             let token = {};
//             token.name = element.tokenName;
//             token.address = element.tokenAddress;
//             token.decimals = element.decimals;
//             token.chainId = 128;

//             TOKEN.push(token)
//         });
//         return TOKEN;
//     });
// }

async function saveToken(pairAddress, resultExtract) {
    let lastUpdateTime = moment().format("YYYY-MM-DD HH:mm:ss");

    let checker = await mysql_2021_bot_trader.query("SELECT * FROM 2021_list_pair_token WHERE idPair='" + pairAddress + "'");
    if (checker && checker[0]) {
        console.log("DUP");
    } else {
        await mysql_2021_bot_trader.query(`INSERT INTO 2021_list_pair_token (idPair,token,name,totalSupply,decimals,symbol,reservesToken,reservesBNB,holder,fee,telegram,telegramMember,twitter,twitterMember,pairSTT,update_time,create_time)
	VALUES (
        '${pairAddress}',
        '${resultExtract.token}',
        '${resultExtract.name}',
        '${resultExtract.totalSupply}',
        '${resultExtract.decimals}',
        '${resultExtract.symbol}',
        '${resultExtract.reservesToken}',
        '${resultExtract.reservesBNB}',
        '${resultExtract.holder}',
        '${resultExtract.fee}',
        '${resultExtract.telegram}',
        '${resultExtract.telegramMember}',
        '${resultExtract.twitter}',
        '${resultExtract.twitterMember}',
        '${resultExtract.pairSTT}',
        '${resultExtract.update_time}',
        '${resultExtract.create_time}'
		)
	`);
    }
}


async function getPairFromFactory(lengthPairs) {
    try {
        const factoryContract = new web3.eth.Contract(pancakeFactoryABI, factoryAddress);
        const pair = await factoryContract.methods.allPairs(lengthPairs).call();
        return pair;
    } catch (error) {
        return false;
    }
}

async function getPairInformation(pairAddress) {
    try {
        const pairContract = new web3.eth.Contract(pancakePairABI, pairAddress);
        const token0 = await pairContract.methods.token0().call();
        const token1 = await pairContract.methods.token1().call();
        const getReserves = await pairContract.methods.getReserves().call();
        return { token0, token1, getReserves }
    } catch (error) {
        return false;

    }
}

async function getTokenInformation(tokenAddress) {
    try {
        const pairContract = new web3.eth.Contract(minABI, tokenAddress);
        const name = await pairContract.methods.name().call();
        const symbol = await pairContract.methods.symbol().call();
        const totalSupply = await pairContract.methods.totalSupply().call();
        const decimals = await pairContract.methods.decimals().call();
        return { name, decimals, symbol, totalSupply }
    } catch (error) {
        return false;
    }

}

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
})
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


const logTxt = [];




async function run() {
    let lastToken = await getLastLengthPair();
    let lastLength = lastToken.pairSTT;
    while (true) {
        await sleep(3000);
        let lengthPairs = lastLength + 1;
        console.log(lengthPairs, 'length');
        const pair = await getPairFromFactory(lengthPairs);
        if (pair) {
            // console.log(pair,'pair');
            const pairInfo = await getPairInformation(pair);
            // console.log(pairInfo,'pairInfo');
            const token0 = (pairInfo.token0).toUpperCase();
            const token1 = (pairInfo.token1).toUpperCase();
            let _bnb = BNB.toUpperCase();

            if (token0 === _bnb || token1 === _bnb) {

                let tokenMain = token0 === _bnb ? token1 : token0;
                let reservesMain = token0 === _bnb ? pairInfo.getReserves[1] : pairInfo.getReserves[0];
                let reservesBNB = token0 === _bnb ? pairInfo.getReserves[0] : pairInfo.getReserves[1];

                const tokenInfo = await getTokenInformation(tokenMain);

                if (tokenInfo) {

                    console.log(moment().format('DD/MM/YYYY hh:mm:ss a'), {
                        tokenMain: tokenMain,
                        pair: pair,
                        reservesMain: reservesMain / tokenInfo.decimals,
                        reservesBNB: reservesBNB / 1e18,
                        tokenInfo
                    });

                    /// insert

                    const obj = {
                        token: tokenMain,
                        name: tokenInfo.name,
                        totalSupply: tokenInfo.totalSupply,
                        decimals: tokenInfo.decimals,
                        symbol: tokenInfo.symbol,
                        reservesToken: reservesMain,
                        reservesBNB: reservesBNB,
                        holder: '',
                        fee: '',
                        telegram: '',
                        telegramMember: '',
                        twitter: '',
                        twitterMember: '',
                        pairSTT: lengthPairs,
                        update_time: '',
                        create_time: moment(),
                    }
                    await saveToken(pair, obj);
                }
                lastLength = lengthPairs;
                //   console.log(a);
            } else {
                lastLength = lengthPairs;
            }
        }
    }
    //
}
