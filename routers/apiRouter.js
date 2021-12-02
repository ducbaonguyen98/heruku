const express = require('express');
const { getPairToken } = require("../controllers/controller_list_pair_token");
const { getTokenInformation } = require("../controllers/controller_list_token_info");
const { getSumTrade, getLastTrade, updatePairNoTransaction, callGetHistoryTrade } = require("../controllers/controller_get_history_trade");


const apiRouter = express.Router();

apiRouter.get('/getPairToken/:pairAddress', getPairToken);

apiRouter.get('/getTokenInformation/:addressTokenA', getTokenInformation);

apiRouter.get('/getSumTrade', getSumTrade);

apiRouter.get('/getLastTrade', getLastTrade);

apiRouter.post('/callGetHistoryTrade', callGetHistoryTrade)

apiRouter.get('/updatePairNoTransaction', updatePairNoTransaction);





module.exports = apiRouter;