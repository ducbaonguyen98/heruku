const BigNumber = require('bignumber.js');
const MySQLClass = require('../MySQLClass');
const swapABI = require('../../abis/swap_v2.json');
const Web3 = require('web3');

const mysql_2021_bot_trader_config = require('../../cert/mysql_2021_bot_trader');
var mysql_2021_bot_trader = new MySQLClass();
mysql_2021_bot_trader.setConfig(mysql_2021_bot_trader_config);

let PROFIT_PROCESS = {};

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
    function checkAllowToDo(key,block_number){
        for(var k in PROFIT_PROCESS){
            if (k == key){
                var block = PROFIT_PROCESS[k];
                if (block_number - block > 300) return true;
                else return false;
            }
          }
          return true;
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
       // console.log(`${block_number}, amount0: ${amount0},token1 : ${currency_1.addr}, token1: ${currency_2.addr}, dex_1: ${dex_1.address}, dex_2: ${dex_2.address}, profit_o: ${profit.toFixed(8)}`);
        var key = currency_1.symbol + "-" + currency_2.symbol + "-" + dex_1.symbol + "-" + dex_2.symbol;
        if (profit > 0) {
            var inputTradeAmount = '10000000000000000000' ;//10 USDT
            var result = await doCheckProfit(currency_1.addr,currency_2.addr,inputTradeAmount,dex_1.address,dex_2.address);
            var input_A = await new BigNumber(inputTradeAmount);
            var output_A = await new BigNumber(result);
            var realProfit = await new BigNumber(output_A).minus(input_A);
            if (realProfit.isGreaterThanOrEqualTo(PROFIT_EXPECT)){

           
            console.log(`realProfit: ${realProfit.shiftedBy(-18).toFixed(8).toString()} KEY:${key}`)
            if (checkAllowToDo(key,block_number)){
                PROFIT_PROCESS[key] = block_number;
                
                profit = await new BigNumber(profit).shiftedBy(-currency_1.decimal);
                let amount0_org = await new BigNumber(amount0).shiftedBy(-currency_1.decimal);
                amount2 = await new BigNumber(amount2).shiftedBy(-currency_1.decimal);
                console.log(`
                    # block: ${block_number}
                        dex: ${dex_1.symbol} -> ${dex_2.symbol}
                        dex: ${dex_1.address} -> ${dex_2.address}
                        symbol: ${currency_1.symbol} <-> ${currency_2.symbol}
                        Token: ${currency_1.addr} <-> ${currency_2.addr}
                        tokenIn: ${amount0_org}
                        tokenOut: ${amount2}
                        profit: ${profit.toFixed(8)}`);
        
                    var date = new Date(); 
                    var isoDateTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
                    var insertTime = isoDateTime.replace(/T/, ' ').replace(/\..+/, '')
                    mysql_2021_bot_trader.insert("dex_arbitrages", {data: `block: ${block_number}, dex: ${dex_1.symbol} -> ${dex_2.symbol}, symbol: ${currency_1.symbol} <-> ${currency_2.symbol}, tokenIn: ${amount0}, tokenOut: ${amount2}, profit: ${profit.toFixed(8)}`});

                    
                    //profit2 = await new BigNumber(profit2).shiftedBy(-currency_1.decimal);
                    console.log(`*** Block # ${block_number}: Arbitrage opportunity found!`);

                    
                    //const resultTxt = await doSwap(currency_1.addr,currency_2.addr,inputTradeAmount,dex_1.address,dex_2.address);
                    //var resultTxt_1 = JSON.stringify(resultTxt)
					
					console.log("dex_arbitrages_log", {key:`${key}`, tokenA: `${currency_1.symbol}`,tokenA_Address: `${currency_1.addr}`,tokenB: `${currency_2.symbol}`,tokenB_Address: `${currency_2.addr}`, inputAmount: `${amount0_org}`,outputAmount: `${amount2}`, profit: `${profit.toFixed(8)}`,routerA_Name:`${dex_1.symbol}`,routerA_Address:`${dex_1.address}`,routerB_Name:`${dex_2.symbol}`,routerB_Address:`${dex_2.address}`,resultTxt:`${resultTxt_1}`, insertTime:`${insertTime}`});
                    
                    mysql_2021_bot_trader.insert("dex_arbitrages_log", {key:`${key}`, tokenA: `${currency_1.symbol}`,tokenA_Address: `${currency_1.addr}`,tokenB: `${currency_2.symbol}`,tokenB_Address: `${currency_2.addr}`, inputAmount: `${amount0_org}`,outputAmount: `${amount2}`, profit: `${profit.toFixed(8)}`,routerA_Name:`${dex_1.symbol}`,routerA_Address:`${dex_1.address}`,routerB_Name:`${dex_2.symbol}`,routerB_Address:`${dex_2.address}`,resultTxt:`${resultTxt_1}`, insertTime:`${insertTime}`});
                    
                    
                
            }
        }

            
    
        }
    }


    async function doCheckProfit(tokenA,tokenB,inputAmount,router_1,router_2){

        const swapContract = '0x4f51F5dD4FA4643Db19C521c7ab6B56568Dd5264';

        const web3 = new Web3(
            new Web3.providers.HttpProvider(
                "https://http-mainnet.hecochain.com"
            )
        ); 
        
        const swap = new web3.eth.Contract(swapABI, swapContract);

        try {
            
            const amounts = await swap.methods.checkProfit(tokenA, tokenB,inputAmount,router_1,router_2).call();
            return amounts;
        } catch (error) {
            //console.log(tokenA, tokenB,inputAmount,router_1,router_2);
            //console.error(error);
            //return [amounts, 0];
        }
    
    }


    async function doSwap(tokenA,tokenB,inputAmount,router_1,router_2){
        const swapContract = '0x4f51F5dD4FA4643Db19C521c7ab6B56568Dd5264';

        const web3 = new Web3(
            new Web3.providers.HttpProvider(
                "https://http-mainnet.hecochain.com"
            )
        ); 
        
        const swap = new web3.eth.Contract(swapABI, swapContract);

        const address = "0xcAF5727619D04bcEF4B0faaFB661C3607F368027";
        const privateKeyAddress = "12b5cc895be99f860d579c90bdc20e78111b683e143180ce98fb4b59d2782801";


         const nonce = await web3.eth.getTransactionCount(address);
        const gasPriceWei = await web3.eth.getGasPrice();
		
		const data = swapV2.methods.swapV2(inputData,tokenA, tokenB,router).encodeABI()
		let gas = await web3.eth.estimateGas({
			from: address,
			data: data,
			to: swapContract
		})

        const signedTx = await web3.eth.accounts.signTransaction({
            to: swapContract,
            gas: (gas+150000).toString(),
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