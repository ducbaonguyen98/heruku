const moment = require('moment');
const { getOne, getAll, insertOne, updateOne } = require("../config/mongo"); 
const list_token_info = require("../models/model_list_token_info");  

const getTokenInformation = async (req, res) => {
    try { 
        const addressTokenA = req.params.addressTokenA;
        const result = await getOne(list_token_info, { tokenAddress: addressTokenA });
        return res.status(200).json(result);
    } catch (error) {
        console.log("getPairToken", error.message);
    }

    res.status(500).json({
        status: "error"
    });
}

module.exports = { 
    getTokenInformation
}