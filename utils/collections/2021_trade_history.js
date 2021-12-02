const { query } = require("express");
const { getAll, insertMany, getByLimit, updateOne, getOne, getByQuery,insertOne } = require("../../config/mongo");
const trade_history = require("../../models/model_list_trade_history");
const list_pair_token = require("../../models/model_list_pair_token");

const insertHistoryTrade = (async (array = []) => {
    const result = await insertMany(trade_history, array);
    return result;
})

const insertOneHistoryTrade = (async (obj ={} ) => {
    const result = await insertOne(trade_history,obj);
    return result;
})

const getHistoryByQuery = (async (query) => {
    const result = await getByQuery(trade_history, query);
    return result;
})

const getHistoryByLimit = (async (query, skip, limit) => {
    const result = await getByLimit(trade_history, query, skip, limit);
    return result;
})


const getPairById = async (idPair) => {
    const filter = {
        idPair
    }
    const result = await getOne(list_pair_token, filter);
    return result;

}

module.exports = {
    insertHistoryTrade,
    getHistoryByQuery,
    getHistoryByLimit,
    getPairById,
    insertOneHistoryTrade

}