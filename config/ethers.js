const { ethers, utils, BigNumber } = require("ethers");
const infuraWSS = "https://bsc-dataseed.binance.org";
// const infuraWSS = "wss://speedy-nodes-nyc.moralis.io/94500a279310e4291fc04732/bsc/mainnet/archive/ws";

const config = {
  factory: "0xca143ce32fe78f1f7019d7d551a6402fc5350c73", //uniswap v2 factory
  router: "0x10ED43C718714eb63d5aA57B78B54704E256024E", //uniswap v2 router
};

const provider = new ethers.providers.JsonRpcProvider(infuraWSS);
// const provider = new ethers.providers.WebSocketProvider(infuraWSS);
const factory = new ethers.Contract(
  config.factory,
  [
    "event PairCreated(address indexed token0, address indexed token1, address pair, uint)",
    "function allPairsLength() external view returns (uint)",
    "function allPairs(uint) external view returns (address pair)",
  ],
  provider
);

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
  } catch (error) {}

  return false;
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
    // console.log(error.message)
    return false;
  }
};

module.exports = {
  provider,
  getInfoToken,
  getInfoPair,
  getPriceBNB,
  factory,
  ethers,
  utils,
  BigNumber, 
};
