const moment = require('moment');
const { getOne, getAll, insertOne, updateOne } = require("../config/mongo");
const list_pair_token = require("../models/model_list_pair_token");
const { getHistoryByQuery, getHistoryByLimit } = require("../utils/collections/2021_trade_history");
const { checkTimeUpdatedAt, updatePairToken } = require("../utils/collections/2021_list_pair_token");
const { getListTranstionTrade } = require("../getHistoryTrade");


const calculateTrade = (async (query) => {
    const data = await getHistoryByQuery(query);

    if (data.status === 'success') {

        const listData = data.data;
        const listWalletTrade = [];

        if (listData.length > 0) {

            listData.forEach(element => {
                const indexWallet = listWalletTrade.findIndex(item => item.walletAddress === element.walletAddress);
                const amountValue = element.amountTokenA;
                if (indexWallet !== -1) {
                    listWalletTrade[indexWallet] = {
                        walletAddress: listWalletTrade[indexWallet].walletAddress,
                        amountValue: listWalletTrade[indexWallet].amountValue + amountValue,
                        count: listWalletTrade[indexWallet].count + 1
                    }
                } else {
                    listWalletTrade.push({
                        walletAddress: element.walletAddress,
                        amountValue: amountValue,
                        count: 1
                    })
                }
            });

            const tokenInfo = listData[0];



            const finalResult = listWalletTrade.sort((a, b) => parseFloat(b.amountValue) - parseFloat(a.amountValue));
            return {
                status: 'success',
                tokenInfo: {
                    pairAddress: tokenInfo.idPair,
                    symbol: tokenInfo.namePair,
                    addressToken: tokenInfo.addressToken,
                    totalTransaction: listData.length,
                    timeStart: moment().subtract(3, 'month').format('DD-MM-YYYY hh:mm:ss'),
                    timeEnd: moment().format('DD-MM-YYYY hh:mm:ss')
                },
                data: finalResult.splice(0, 100),
            }
        } else {
            return {
                status: 'success',
                tokenInfo: null,
                data: null
            }

        }

    }
})

const getLastTradeLimit = async (query) => {

    const data = await getHistoryByLimit(query);
    if (data.status === 'success') {
        const listData = data.data;
        if (listData.length > 0) {
            return {
                status: 'success',
                data: listData,
            }

        } else {
            return {
                status: 'success', data: null
            }
        }
    }



}

const getSumTrade = async (req, res) => {
    try {
        const pairAddress = (req.query.pairAddress).toLowerCase();
        const type = req.query.type;

        const query = {
            pairAddress,
            type,
            timeTransaction: {
                $gte: moment().subtract(3, 'month').toDate(),
                $lt: moment().toDate()
            }
        }

        const result = await calculateTrade(query);
        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        console.log("getSumTrade", error.message);
    }
}

const getLastTrade = async (req, res) => {
    try {
        const pairAddress = (req.query.pairAddress).toLowerCase();
        const query = {
            pairAddress
        }

        const result = await getLastTradeLimit(query);
        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        console.log("getLastTradeLimit", error.message);
    }

    res.status(500).json({
        status: "error"
    });
}

const updatePairNoTransaction = async (req, res) => {
    try {
        const result = await checkTimeUpdatedAt();
        if (result.status == 'success') {
            const listData = result.data;
            await Promise.all(listData.map(async (item) => {
                try {
                    const filter = {
                        pairAddress: (item.pairAddress).toLowerCase()
                    }
                    const obj = { status: 0 };
                    await updatePairToken(filter, obj)

                } catch (error) {

                }
            }))
        }
        return res.status(200).json({ status: "success" });
    } catch (error) {
        console.log(error);
        console.log("getSumTrade", error.message);
    }

    res.status(500).json({
        status: "error"
    });
}

const callGetHistoryTrade = (req, res) => {
    try {
        console.log(req.body);
        
        // const result = await getListTranstionTrade();
        // if (result.status == 'success') {
        //     const listData = result.data;
         
        // }
        return res.status(200).json({ status: "success" });
    } catch (error) {
        console.log(error);
        console.log("getSumTrade", error.message);
    }

    res.status(500).json({
        status: "error"
    });
}





module.exports = {
    getSumTrade,
    getLastTrade,
    updatePairNoTransaction,
    callGetHistoryTrade
}