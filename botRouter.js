
const { ethers, BigNumber } = require('ethers');
const moment = require('moment');
const MySQLClass = require('./utils/MySQLClass');
const mysql_2021_bot_trader_config = require('./cert/mysql_amazon');
var mysql_2021_bot_trader = new MySQLClass();
mysql_2021_bot_trader.setConfig(mysql_2021_bot_trader_config);
const got = require('got');
const { request, gql ,GraphQLClient} = require('graphql-request');

const infuraWSS = 'wss://speedy-nodes-nyc.moralis.io/7f591e78d83b332dae8981dd/bsc/mainnet/archive/ws'
// const infuraWSS = 'wss://bsc-ws-node.nariox.org:443'

// SETUP
const addresses = {
    WETH: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    factory: '0xca143ce32fe78f1f7019d7d551a6402fc5350c73', //uniswap v2 factory
    router: '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0', //uniswap v2 router
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


const router = new ethers.Contract(
    addresses.router,
    ['event Swap(address indexed sender,uint amount0In,uint amount1In, uint amount0Out,uint amount1Out,address indexed to)'
    ],
    account
);


async function getWebsiteContent() {
    try {
        const endpoint = 'https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2';

        const graphQLClient = new GraphQLClient(endpoint, {
            headers: {
                'origin': 'https://pancakeswap.finance',
				'referer': 'https://pancakeswap.finance/',            },
          })
        
        const abc = (await graphQLClient.request(
            gql`
            query poolTransactions($address: Bytes!){ swaps(first:5, orderBy: timestamp, orderDirection: desc, where: { pair: $address }) { id timestamp pair { token0 { id symbol } token1 { id symbol } } from amount0In amount1In amount0Out amount1Out amountUSD } }
        `,
            {
                "address": "0x58c34146316a9a60bfa5da1d7f451e46bdd51215"
            }

        ))
        console.log(abc, 'abc');


    } catch (error) {
        console.log(error);
        return false;
    }

}

// const router = new ethers.Contract(
//     addresses.router,
//     [
//       'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
//       'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin,address[] calldata path,address to,uint deadline) external payable'
//     ],
//     account
//   );

const init = async () => {
    router.on('Swap', async (sender, amount0In, amount1In, amount0Out, amount1Out, to) => {
        console.log(sender, 'sss');
    }
    )
}

// init(); 
getWebsiteContent();

