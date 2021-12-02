const moment = require("moment");
const ethers = require("ethers");
const { getListPairToken, insertPairToken } = require("./utils/collections/2021_list_pair_token");
const { insertToken } = require("./utils/collections/2021_list_token_info"); 

const listenPair = [];
const listenLog = [];

let socket_ = null;
let resultData = [];


const InputDataDecoder = require("ethereum-input-data-decoder");
const decoder = new InputDataDecoder("./abis/pancakeRouter.json");
const web3 = require("web3");

function decodeEvent(logs, fragment) {
  try {
    const Interface = new ethers.utils.Interface([
      "event PairCreated(address indexed token0, address indexed token1, address pair, uint)",
    ]);
    const result = Interface.decodeEventLog(fragment, logs.data, logs.topics);
    return result;
  } catch (error) {
    console.log(error);
    return false;
  }
}
const findToken = (token) => {
  const addressToken = [
    {
      symbol: "BNB",
      address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      decimals: 18,
    },
    {
      symbol: "BUSD",
      address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
      decimals: 18,
    },
    {
      symbol: "USDT",
      address: "0x55d398326f99059fF775485246999027B3197955",
      decimals: 18,
    },
  ];

  return addressToken.find(
    (val) => val.address.toLowerCase() === token.toLowerCase()
  );
};

const getPoolAmount = (txData, decimalsTokenA, tokenB) => {

  const { value } = txData;
  const _dataDecode = decoder.decodeData(txData.data);
  const { inputs } = _dataDecode;

  if (
    Array.isArray(inputs) &&
    web3.utils.isBN(inputs[2]) &&
    web3.utils.isBN(inputs[3])
  ) {
    const BN = web3.utils.BN;
    if (tokenB.symbol === "BNB") {
      const poolAmountA = parseFloat(ethers.utils.formatUnits(new BN(inputs[1]).toString(), decimalsTokenA));
      const poolAmountB = parseFloat(ethers.utils.formatUnits(value, 18));
      return {
        poolAmountA,
        poolAmountB,
        poolRemainingA: poolAmountA,
        poolRemainingB: poolAmountB,
      }
    }

    let poolAmountA = tokenB.address.toLowerCase() === (`0x${inputs[0]}`).toLowerCase() ? inputs[3] : inputs[2];
    let poolAmountB = tokenB.address.toLowerCase() === (`0x${inputs[0]}`).toLowerCase() ? inputs[2] : inputs[3];

    poolAmountA = parseFloat(ethers.utils.formatUnits(new BN(poolAmountA).toString(), decimalsTokenA));
    poolAmountB = parseFloat(ethers.utils.formatUnits(new BN(poolAmountB).toString(), 18));

    return {
      poolAmountA,
      poolAmountB,
      poolRemainingA: poolAmountA,
      poolRemainingB: poolAmountB,
    }
  }


  return {
    poolAmountA: 0,
    poolAmountB: 0,
    poolRemainingA: 0,
    poolRemainingB: 0,
  };


};



const URL = "wss://bsc-ws-node.nariox.org:443";
// const URL = "wss://speedy-nodes-nyc.moralis.io/e8890f89975b72fa4e3938e0/bsc/mainnet/ws";
// const URL = "wss://apis.ankr.com/wss/eece48af206648db8a60e8cb637765e9/7a1264ae9674b8b01d782c9fd63ed867/binance/full/main";

const initSocketFindNewPair = async (socket) => { 
  const provider = new ethers.providers.WebSocketProvider(URL);

  const config = {
    factory: "0xca143ce32fe78f1f7019d7d551a6402fc5350c73", //uniswap v2 factory
    router: "0x10ED43C718714eb63d5aA57B78B54704E256024E", //uniswap v2 router
  };

  const router = new ethers.Contract(
    config.router,
    [
      "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
    ],
    provider
  );

  const getInfoToken = async (addressToken) => {
    try {
      const token = new ethers.Contract(
        addressToken,
        [
          "function totalSupply() external view returns (uint256)",
          "function decimals() external view returns (uint8)",
          "function symbol() external view returns (string memory)",
          "function name() external view returns (string memory)",
        ],
        provider
      );

      const result = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.totalSupply(),
      ]);
      const [name, symbol, decimals, totalSupply] = result;

      return {
        name,
        symbol,
        decimals,
        totalSupply,
        // totalSupply: ethers.utils.formatEther(totalSupply)
      };
    } catch (error) {
      console.log("getInfoToken", error.message);
    }

    return false;
  };

  const getInfoPair = async (addressPair) => {
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

      const [tokenA, tokenB, getReserves] = await Promise.all([
        pair.token0(),
        pair.token1(),
        pair.getReserves(),
      ]);

      return {
        tokenA,
        tokenB,
        getReserves,
      };
    } catch (error) {
      // console.log(error.message)
      return false;
    }
  };

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

  provider._websocket.on("error", async (ep) => {
    console.log(`Unable to connect to ${ep.subdomain} retrying in 3s...`);
    // setTimeout(() => soketFindNewPair(socket_), 3000);
  });

  provider._websocket.on("close", async (code) => {
    console.log(
      `Connection lost with code ${code}! Attempting reconnect in 3s...`
    );
    provider._websocket.terminate();
    setTimeout(() => soketFindNewPair(socket_), 3000);
  });

  const filter = {
    address: "0xca143ce32fe78f1f7019d7d551a6402fc5350c73",
    topics: ["0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9"]
  };

  provider.on(filter, async (log) => {
    if (listenLog.includes(log.transactionHash)) return;
    else listenLog.push(listenLog);
    console.log("************************");

    const data = decodeEvent(log, "PairCreated");
    const token0 = data["token0"];
    const token1 = data["token1"];
    const pairAddress = data["pair"];
    if (listenPair.includes(pairAddress)) return;
    else listenPair.push(pairAddress);

    if (findToken(token0) !== undefined || findToken(token1) !== undefined) {
      try {
        const tokenA = findToken(token0) === undefined ? token0 : token1;
        const tokenB = findToken(token0) === undefined ? token1 : token0;

        const resultFindTokenB = findToken(tokenB);

        const [txData, InfoToken, block] = await Promise.all([
          provider.getTransaction(log.transactionHash),
          getInfoToken(tokenA),
          provider.getBlock(log.blockNumber)
        ]);

        const { name, totalSupply, decimals, symbol } = InfoToken;
        if(!InfoToken) return;  
        const { timestamp } =  block;
        const { poolAmountA, poolAmountB, poolRemainingA, poolRemainingB } = getPoolAmount(txData, decimals, resultFindTokenB);

        let LP = poolAmountB*2;
        let price = poolAmountB / poolAmountA;
        if (resultFindTokenB.symbol === "BNB") {
          const resultPriceTokenB = await getPriceBNB();
          price = poolAmountB * resultPriceTokenB / poolAmountA;
          LP = poolAmountB*resultPriceTokenB*2;
        }

        const post = {
          pairAddress: pairAddress.toLowerCase(),
          namePair: `${symbol}/${resultFindTokenB.symbol}`,
          symbol,
          txHash: log.transactionHash,
          price: price || 0,
          lp: LP || 0,
          addressTokenA: tokenA.toLowerCase(),
          token0: token0.toLowerCase(),
          addressTokenB: tokenB.toLowerCase(),
          poolAmountA,
          poolAmountB,
          poolRemainingA,
          poolRemainingB,
          timeInitPool: moment.unix(timestamp).utc()
        };

        socket.emit("getListPairToken", resultData);
        console.log(`${symbol}/${resultFindTokenB.symbol}`);

        const [resultPairToken, resultToken] = await Promise.all([insertPairToken(post), insertToken({
          tokenAddress: tokenA.toLowerCase(),
          lp: LP || 0,
          poolRemaining: poolRemainingB,
          name,
          symbol,
          decimals,
          price: price || 0,
          totalSupply: ethers.utils.formatUnits(totalSupply, decimals),
          timeInitPool:  moment.unix(timestamp).utc()
        })]) 

        resultData = [
          { ...post, _id: resultPairToken.data, createdAt: moment().utc() },
          ...resultData,
        ];

        return;
      } catch (error) {
        // console.log(error);
      }
    }

  });
};

const soketFindNewPair = (socket, data) => {
  socket_ = socket;
  resultData = data;
  initSocketFindNewPair(socket);
  setInterval(async () => {
    const result = await getListPairToken();
    resultData = result.data;
    socket.emit("getListPairToken", resultData);
  }, 2 * 1000);
}

module.exports = soketFindNewPair;