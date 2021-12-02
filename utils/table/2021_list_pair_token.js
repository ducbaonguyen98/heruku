const { existsMySQL, insertMySQL, updateMySQL, getAllMySQL, getAllLimitMySQL } = require("../../config/sql");

const table = "2021_list_pair_token";

const insertPairToken = async (data) => insertMySQL(table, data); 

const updatePairToken = async (data, id) => updateMySQL(table, data, id);

const existsPairToken = async (strWhere) => existsMySQL(table, strWhere);

const getListPairToken = async () => getAllMySQL(table);

const getListPairTokenLimit = async (limit, offset) => getAllLimitMySQL(table, limit, offset);

const getPairToken = async (strWhere) => existsMySQL(table, strWhere);


module.exports = {
    existsPairToken,
    insertPairToken,
    updatePairToken,
    getListPairToken,
    getListPairTokenLimit,
    getPairToken
}