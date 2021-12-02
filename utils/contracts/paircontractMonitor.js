const BigNumber = require('bignumber.js');
const MySQLClass = require('../MySQLClass');
const swapABI = require('../../abis/autoSwap.json');
const Web3 = require('web3');

const mysql_2021_bot_trader_config = require('../../cert/mysql_2021_bot_trader');
var mysql_2021_bot_trader = new MySQLClass();
mysql_2021_bot_trader.setConfig(mysql_2021_bot_trader_config);

async function paircontractMonitor() {
    let processing = false;
    let key = null;
    let tokenA = null;
    let tokenA_Address = null;
    let tokenB = null;
    let tokenB_Address = null;
    let routerA = null;
    let routerB = null;
    let amount0 = null;
    let currency_1 = null;
    let currency_2 = null;

    let PROFIT_EXPECT = 0;
    let swapContract = null;

    async function _init() {
        console.log(`* Init createContractMonitor`); 
    }

    async function setData(_data) {
        PROFIT_EXPECT = await new BigNumber(PROFIT_EXPECT);
        PROFIT_EXPECT = await new BigNumber(PROFIT_EXPECT).shiftedBy(18);

        if (_data.key) key = _data.key; 
        if (_data.tokenA) tokenA = _data.tokenA; 
        if (_data.tokenA_Address) tokenA_Address = _data.tokenA_Address; 

        if (_data.tokenB) tokenB = _data.tokenB; 
        if (_data.tokenB_Address) tokenB_Address = _data.tokenB_Address; 
        
        if (_data.routerA) routerA = _data.routerA; 
        if (_data.routerA_Address) routerA_Address = _data.routerA_Address; 

        if (_data.routerB) routerB = _data.routerB; 
        if (_data.routerB_Address) routerB_Address = _data.routerB_Address; 

        
        if (_data.swapContract) swapContract = _data.swapContract; 
    }


    async function calProfitPair(block_number,inputSymbol) {



        var inputTradeAmount = '80000000000000000000' ;//0.01 USDT
        var result = await doCheckProfit(tokenA_Address,tokenB_Address,inputTradeAmount,routerA_Address,routerB_Address);
        input_A = await new BigNumber(inputTradeAmount);
        outputAmount = await new BigNumber(result);
        var profit = await new BigNumber(outputAmount).minus(input_A);

      
        /*
        console.log(`*** Block # ${key} 
        PROFIT: ${profit.toFixed(2)} 
        TokenA: ${tokenA}
        TokenA_Address: ${tokenA_Address}
        TokenB: ${tokenB}
        TokenB_Address: ${tokenB_Address}
        RouterA: ${routerA} 
        RouterA_Address: ${routerA_Address}
        RouterB: ${routerB}
        RouterB_Address: ${routerB_Address}
        input_A ${input_A}
        output_A: ${outputAmount} `);
        */
        if (profit.isGreaterThanOrEqualTo(PROFIT_EXPECT)){

            console.log(`*** Block # ${block_number} ${inputSymbol} PROFIT: ${profit}: ${tokenA} - ${tokenB} - ${routerA} ${routerB}`);

            var date = new Date(); 
            var isoDateTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
            var insertTime = isoDateTime.replace(/T/, ' ').replace(/\..+/, '')
            mysql_2021_bot_trader.insert("dex_arbitrages", {data: `block: ${block_number}, dex: ${routerA} -> ${routerB}, symbol: ${tokenA} <-> ${tokenB}, tokenIn: ${amount0}, tokenOut: ${outputAmount}, profit: ${profit.toFixed(8)}`});

            
            //profit2 = await new BigNumber(profit2).shiftedBy(-currency_1.decimal);
            console.log(`*** Block # ${block_number}: Arbitrage opportunity found!`);

            
            const resultTxt = await doSwap(tokenA_Address,tokenB_Address,inputTradeAmount,routerA_Address,routerB_Address);
            var resultTxt_1 = JSON.stringify(resultTxt)
            mysql_2021_bot_trader.insert("dex_arbitrages_log", {tokenA: `${tokenA}`,tokenA_Address: `${tokenA_Address}`,tokenB: `${tokenB}`,tokenB_Address: `${tokenB_Address}`, inputAmount: `${input_A.shiftedBy(-18)}`, outputAmount: `${outputAmount.shiftedBy(-18)}`,profit: `${profit.shiftedBy(-18)}`,routerA_Name:`${routerA}`,routerA_Address:`${routerA_Address}`,routerB_Name:`${routerB}`,routerB_Address:`${routerB_Address}`,resultTxt:`${resultTxt_1}`, insertTime:`${insertTime}`});
            
        }else{
            
        }

    }

    async function doCheckProfit(tokenA,tokenB,inputAmount,router_1,router_2){
        try {
            
            const amounts = await swapContract.methods.checkProfit(tokenA, tokenB,inputAmount,router_1,router_2).call();
            return amounts;
        } catch (error) {
            return 0;
            //console.log(tokenA, tokenB,inputAmount,router_1,router_2);
            //console.error(error);
            //return [amounts, 0];
        }
    
    }


    async function doSwap(tokenA,tokenB,inputAmount,router_1,router_2){
        const swapContract = '0xe212e83b5aC1d9B0Be095bb4cB99f66Aaa973ED1';

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
        calProfitPair(blockNumber);
        
    }

    async function startTask(blockNumber,symbol) {
        try {
            //calProfit(blockNumber);
            //console.log(blockNumber, symbol)
           calProfitPair(blockNumber,symbol);
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
  
  exports.paircontractMonitor = paircontractMonitor;