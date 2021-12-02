const { existsMySQL, insertMySQL, updateMySQL, getAllMySQL } = require("../../config/sql");

const table = "2021_trade_history";

const insertHistoryTrade = async (data) => insertMySQL(table, data); 

const updateHistoryTrade = async (data, id) => updateMySQL(table, data, id);

const existsHistoryTrade = async (strWhere) => existsMySQL(table, strWhere);

const getListHistoryTrade = async () => getAllMySQL(table);

module.exports = {
    existsHistoryTrade,
    insertHistoryTrade,
    updateHistoryTrade,
    getListHistoryTrade,
}