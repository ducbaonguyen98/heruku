const { ethers, utils, BigNumber } = require('ethers');

// const infuraWSS = 'wss://speedy-nodes-nyc.moralis.io/94500a279310e4291fc04732/bsc/mainnet/archive/ws'
const infuraWSS = 'wss://apis.ankr.com/wss/d5ea5729c918444a9bcd17657e656358/1748471b8f672d64187c1923f634dcfb/binance/full/main'

const config = {
    factory: '0xca143ce32fe78f1f7019d7d551a6402fc5350c73', //uniswap v2 factory
    router: '0x10ED43C718714eb63d5aA57B78B54704E256024E', //uniswap v2 router
}


const provider = new ethers.providers.WebSocketProvider(infuraWSS);


const factorySocket = new ethers.Contract(
    config.factory,
    [
        'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
        'function allPairsLength() external view returns (uint)',
        'function allPairs(uint) external view returns (address pair)'
    ],
    provider
);

const getInfoToken = async (addressToken) => {
    try {
        const token = new ethers.Contract(
            addressToken,
            [
                'function totalSupply() external view returns (uint256)',
                'function decimals() external view returns (uint8)',
                'function symbol() external view returns (string memory)',
                'function name() external view returns (string memory)'
            ],
            provider
        );

        const result = await Promise.all([token.name(), token.symbol(), token.decimals(), token.totalSupply()]);
        const [name, symbol, decimals, totalSupply] = result;

        return {
            name,
            symbol,
            decimals,
            totalSupply
            // totalSupply: ethers.utils.formatEther(totalSupply)
        };
    } catch (error) {
    }

    return false;
}

const getInfoPair = async (addressPair) => {
    try {
        const pair = new ethers.Contract(
            addressPair,
            ['function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'],
            provider
        );
        return await pair.getReserves();

    } catch (error) {
        return false;
    }
}



const startConnection = () => {

    const provider = new ethers.providers.WebSocketProvider(infuraWSS)

    provider._websocket.on('open', () => {

    })

    provider._websocket.on('close', () => {
        console.log('socket close =============================');
        startConnection();
    })

    provider._websocket.on('error', (err) => {
        console.log(err, 'socket error =============================');
    })

    return provider;
}
const _startConnection = () => {
    return new Promise((resolve, reject) => {
        const EXPECTED_PONG_BACK = 15000
        const KEEP_ALIVE_CHECK_INTERVAL = 7500
        const provider = new ethers.providers.WebSocketProvider(infuraWSS)

        let pingTimeout = null
        let keepAliveInterval = null

        provider._websocket.on('open', () => {
            resolve(provider)

            //     keepAliveInterval = setInterval(() => {
            //         console.log('Checking if the connection is alive, sending a ping')

            //         provider._websocket.ping()

            //         // Use `WebSocket#terminate()`, which immediately destroys the connection,
            //         // instead of `WebSocket#close()`, which waits for the close timer.
            //         // Delay should be equal to the interval at which your server
            //         // sends out pings plus a conservative assumption of the latency.
            //         pingTimeout = setTimeout(() => {
            //             provider._websocket.terminate()
            //         }, EXPECTED_PONG_BACK)
            //     }, KEEP_ALIVE_CHECK_INTERVAL)

            //     // TODO: handle contract listeners setup + indexing
        })

        provider._websocket.on('close', () => {
            console.log('socket close =============================');
            // console.log('The websocket connection was closed')
            // clearInterval(keepAliveInterval)
            // clearTimeout(pingTimeout)
            // startConnection()
        })


        provider._websocket.on('error', (err) => {
            console.log(err, 'socket error =============================');
            // setTimeout(() => {
            // startConnection(run)
            // }, 3000);
            reject(err)
        })

    })

    //   return run(provider)

    // provider._websocket.on('pong', () => {
    //     console.log('Received pong, so connection is alive, clearing the timeout')
    //     clearInterval(pingTimeout)
    // })
    // return provider;
}
module.exports = {
    ethers,
    factorySocket,
    getInfoToken,
    getInfoPair,
    startConnection
}