const moment = require('moment');
const { getOne, getAll, insertOne, updateOne } = require("../config/mongo"); 
const list_pair_token = require("../models/model_list_pair_token"); 

const getPairToken = async (req, res) => {
    try { 
        const pairAddress = req.params.pairAddress;
        const result = await getOne(list_pair_token, { pairAddress });
        return res.status(200).json(result);
    } catch (error) {
        console.log("getPairToken", error.message);
    }

    res.status(500).json({
        status: "error"
    });
}

const getTokenInformation = async (req, res) => {
    try { 
        const addressTokenA = req.params.addressTokenA;
        const result = await getOne(list_pair_token, { addressTokenA });
        return res.status(200).json(result);
    } catch (error) {
        console.log("getPairToken", error.message);
    }

    res.status(500).json({
        status: "error"
    });
}

module.exports = {
    getPairToken,
    getTokenInformation
}