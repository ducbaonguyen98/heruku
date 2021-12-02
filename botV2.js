
const { ethers, BigNumber } = require('ethers');
const moment = require('moment');
const MySQLClass = require('./utils/MySQLClass');
const mysql_2021_bot_trader_config = require('./cert/mysql_amazon');
var mysql_2021_bot_trader = new MySQLClass();
mysql_2021_bot_trader.setConfig(mysql_2021_bot_trader_config);


const infuraWSS = 'wss://speedy-nodes-nyc.moralis.io/c7eea3644b5212d5f15eea04/bsc/mainnet/archive/ws'
// const infuraWSS = 'wss://bsc-ws-node.nariox.org:443'

// SETUP
const addresses = {
    WETH: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    factory: '0xca143ce32fe78f1f7019d7d551a6402fc5350c73', //uniswap v2 factory
    router: '0x10ED43C718714eb63d5aA57B78B54704E256024E', //uniswap v2 router
    recipient: '0xd9863d68Fb56dBcAd399541748f2cd0217238372' //this address receives the tokens (currently my main test account)
}

const mnemonic = '92dfc24992dc73263d176ed7051c7c8c53a1698d63498e050dc8042ddfdb70c7';

const provider = new ethers.providers.WebSocketProvider(infuraWSS);

const wallet = new ethers.Wallet(mnemonic);
const account = wallet.connect(provider);

const factory = new ethers.Contract(
    addresses.factory,
    ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'
    ],
    account
);

const getInfoToken = async (addressToken) => {
    try {
        const token = new ethers.Contract(
            addressToken,
            ['function totalSupply() external view returns (uint256)',
                'function decimals() external view returns (uint8)',
                'function symbol() external view returns (string memory)',
                'function name() external view returns (string memory)'
            ],
            account
        );
        const name = await token.name();
        const symbol = await token.symbol();
        const decimals = await token.decimals();
        const totalSupply = await token.totalSupply();
        return { name, symbol, decimals, totalSupply };
    } catch (error) {
        return false;

    }



}

const getInfoPair = async (addressPair) => {
    try {
        const pair = new ethers.Contract(
            addressPair,
            ['function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'],
            account
        );
        const getReserves = await pair.getReserves();
        return getReserves;

    } catch (error) {
        return false;
    }
}

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
// const router = new ethers.Contract(
//     addresses.router,
//     [
//       'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
//       'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin,address[] calldata path,address to,uint deadline) external payable'
//     ],
//     accoun
//   );
const init = async () => {
    console.log("oke");
    factory.on('PairCreated', async (token0, token1, pairAddress) => {

        const _token0 = (token0).toUpperCase();
        const _token1 = (token1).toUpperCase();
        let _bnb = addresses.WETH.toUpperCase();

        console.log(`** New Pair Detected **`, pairAddress);
        if (_token0 === _bnb || _token1 === _bnb) {

            let tokenMain = _token0 === _bnb ? _token1 : token0;

            const tokenInfo = await getInfoToken(tokenMain);
            const getReserves = await getInfoPair(pairAddress);

            if (tokenInfo && getReserves) {

                const totalSupply = ethers.utils.formatEther(tokenInfo.totalSupply);


                let reservesMain = _token0 === _bnb ? getReserves[1] : getReserves[0];
                let reservesBNB = _token0 === _bnb ? getReserves[0] : getReserves[1];


                const reserve0 = ethers.utils.formatEther(reservesMain);
                const reserve1 = ethers.utils.formatEther(reservesBNB);

                console.log(tokenInfo, getReserves);
                console.log(totalSupply, reserve0, reserve1);


                    // const obj = {
                    //     token: tokenMain,
                    //     name: tokenInfo.name,
                    //     totalSupply: tokenInfo.totalSupply,
                    //     decimals: tokenInfo.decimals,
                    //     symbol: tokenInfo.symbol,
                    //     reservesToken: reservesMain,
                    //     reservesBNB: reservesBNB,
                    //     holder: '',
                    //     fee: '',
                    //     telegram: '',
                    //     telegramMember: '',
                    //     twitter: '',
                    //     twitterMember: '',
                    //     // pairSTT: lengthPairs,
                    //     update_time: '',
                    //     create_time: moment(),
                    // // }

                    
                    // await saveToken(pair, obj);
            }


        }
    })
}

init();

