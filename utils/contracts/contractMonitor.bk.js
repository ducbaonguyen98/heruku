const BigNumber = require('bignumber.js');
const MySQLClass = require('../MySQLClass');
const swapABI = require('../../abis/autoSwap.json');
const Web3 = require('web3');

const mysql_2021_bot_trader_config = require('../../cert/mysql_2021_bot_trader');
var mysql_2021_bot_trader = new MySQLClass();
mysql_2021_bot_trader.setConfig(mysql_2021_bot_trader_config);

async function createContractMonitor() {
    let processing = false;
    let dexs = null;
    let amount0 = null;
    let currency_1 = null;
    let currency_2 = null;

    let PROFIT_EXPECT = 0.03;

    let stop = false;

    async function _init() {
        console.log(`* Init createContractMonitor`); 
    }

    async function setData(_data) {
        if(_data.dexs) dexs = _data.dexs;
        if(_data.amount0) amount0 = _data.amount0;
        if(_data.currency_1) {
            currency_1 = _data.currency_1;
            PROFIT_EXPECT = await new BigNumber(PROFIT_EXPECT);
            PROFIT_EXPECT = await new BigNumber(PROFIT_EXPECT).shiftedBy(currency_1.decimal);
        }
        if(_data.currency_2) currency_2 = _data.currency_2;
    }

    async function pairRouter(swapRouter, amountIn, path) {
        try {
            const amounts = await swapRouter.methods.getAmountsOut(amountIn, path).call();
            return amounts;
        } catch (error) {
            //console.error(error);
            return [amountIn, 0];
        }
    }

    async function calProfitPair(block_number, dex_1, dex_2) {
        //console.log(`${block_number}, symbol: ${currency_2.symbol}, dex_1: ${dex_1.symbol}, dex_2: ${dex_2.symbol}`);
        let amount1 = await pairRouter(dex_1.router, amount0, [currency_1.addr, currency_2.addr]);
        amount1 = amount1[amount1.length - 1];
        
        if(amount1 <=  0) return;
        amount1 = await new BigNumber(amount1);

        let amount2 = await pairRouter(dex_2.router, amount1, [currency_2.addr, currency_1.addr]);
        amount2 = amount2[amount2.length - 1];
        if(amount2 <=  0) return;
        amount2 = await new BigNumber(amount2);

        //console.log({amount0: amount0.toString(), amount1: amount1.toString(),  amount2: amount2.toString()});

        let profit = await new BigNumber(amount2).minus(amount0);
        let profit2 = await new BigNumber(profit).minus(PROFIT_EXPECT);

        //let profit_o = await new BigNumber(profit).shiftedBy(-currency_1.decimal);
        //let profit2_o = await new BigNumber(profit2).shiftedBy(-currency_1.decimal);
        //console.log(`${block_number}, amount0: ${amount0}, symbol: ${currency_2.symbol}, dex_1: ${dex_1.symbol}, dex_2: ${dex_2.symbol}, profit_o: ${profit_o.toFixed(8)}`);

        if (profit > 0) {
            profit = await new BigNumber(profit).shiftedBy(-currency_1.decimal);
            let amount0_org = await new BigNumber(amount0).shiftedBy(-currency_1.decimal);
            amount2 = await new BigNumber(amount2).shiftedBy(-currency_1.decimal);

            console.log(dex_1.address);
            console.log(`
  # block: ${block_number}
    dex: ${dex_1.symbol} -> ${dex_2.symbol}
    symbol: ${currency_1.symbol} <-> ${currency_2.symbol}
    tokenIn: ${amount0_org}
    tokenOut: ${amount2}
    profit: ${profit.toFixed(8)}`);
            if(profit2 > 0) {
                var date = new Date(); 
                var isoDateTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
                var insertTime = isoDateTime.replace(/T/, ' ').replace(/\..+/, '')
                mysql_2021_bot_trader.insert("dex_arbitrages", {data: `block: ${block_number}, dex: ${dex_1.symbol} -> ${dex_2.symbol}, symbol: ${currency_1.symbol} <-> ${currency_2.symbol}, tokenIn: ${amount0}, tokenOut: ${amount2}, profit: ${profit.toFixed(8)}`});

                
                //profit2 = await new BigNumber(profit2).shiftedBy(-currency_1.decimal);
                console.log(`*** Block # ${block_number}: Arbitrage opportunity found!`);

                var inputTradeAmount = '10000000000000000000' ;//10 USDT
                const resultTxt = await doSwap(currency_1.addr,currency_2.addr,inputTradeAmount,dex_1.address,dex_2.address);
                var resultTxt_1 = JSON.stringify(resultTxt)
                mysql_2021_bot_trader.insert("dex_arbitrages_log", {tokenA: `${currency_1.symbol}`,tokenA_Address: `${currency_1.addr}`,tokenB: `${currency_2.symbol}`,tokenB_Address: `${currency_2.addr}`, inputAmount: `${amount0_org}`,profit: `${profit.toFixed(8)}`,rounterA_Name:`${dex_1.symbol}`,rounterA_Address:`${dex_1.address}`,rounterB_Name:`${dex_2.symbol}`,rounterB_Address:`${dex_2.address}`,resultTxt:`${resultTxt_1}`, insertTime:`${insertTime}`});
                
                
            }
        }
    }


    async function doSwap(tokenA,tokenB,inputAmount,router_1,router_2){
        const swapContract = '0xE824A45E52F3F649C405AD716aB436F1FEF836c9';

        const web3 = new Web3(
            new Web3.providers.HttpProvider(
                "https://http-mainnet.hecochain.com"
            )
        ); 
        
        const swap = new web3.eth.Contract(swapABI, swapContract);

        const address = "0x786E9A87617BcC3369e0fc6f32e9F34aEE78C3A7";
        const privateKeyAddress = "b3e849b7c4df724adf4aad0d26c1a88476efe5be798abd85646a6d656f1907f2";


        const nonce = await web3.eth.getTransactionCount(address);
        const gasPriceWei = await web3.eth.getGasPrice();
        const data = swap.methods.swapTokenAToB(tokenA,tokenB,inputAmount,router_1,router_2).encodeABI()
        const signedTx = await web3.eth.accounts.signTransaction({
            to: swapContract,
            gas: 500000,
            data: data,
            gasPrice: gasPriceWei,
            nonce: nonce,
            chainId: 128
        }, privateKeyAddress)
    
        return await web3.eth.sendSignedTransaction(signedTx.rawTransaction || signedTx.rawTransaction).then(result => {
            return {
                status: 'success',
                data: result,
            }
        }).catch(error => {
            return {
                status: 'error',
                data: error,
            }
        });

    }
    async function calProfit(blockNumber) {
        dexs.forEach(async dex_1 => {
            dexs.forEach(async dex_2 => {
                if(dex_1.symbol != dex_2.symbol) {
                    calProfitPair(blockNumber, dex_1, dex_2);
                }
            });
        });
    }

    async function startTask(blockNumber) {
        try {
            calProfit(blockNumber);
        } catch (error) {
            console.log(`* ERROR block: ${blockNumber}, symbol: ${currency_1.symbol} <-> ${currency_2.symbol}`, error); 
        }
    }
    async function stopTask() {
        try {
            stop = true;
            dexs = null;
            amount0 = null;
            currency_1 = null;
            currency_2 = null;
        } catch (error) {
            console.log(error); 
        }
    }

    return {
        setData,
        startTask,
        stopTask,
    };
  }
  
  exports.createContractMonitor = createContractMonitor;