const moment = require('moment');
const { getOne, getAll, insertOne, updateOne } = require("../../config/mongo"); 
const list_token_info = require("../../models/model_list_token_info"); 

const getTokenInformation = async (filter) => getOne(list_token_info, filter); 

const insertToken = async (obj) => {
    const result = await getOne(list_token_info, { tokenAddress: obj.tokenAddress});
    if(result.status === "error")
        return insertOne(list_token_info, obj)
    
    return result;
};

const updateToken = async (filter, obj) => updateOne(list_token_info, filter, obj); 


module.exports = {
    getTokenInformation, 
    insertToken,
    updateToken
}