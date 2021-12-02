const mongoose = require("mongoose");

const schema = mongoose.Schema({
    pairAddress: {
        type: String,
        required: true,
        index: true
    },
    namePair: {
        type: String,
        required: true
    },
    addressTokenA: {
        type: String,
        required: true
    },
    addressTokenB: {
        type: String,
        required: true
    },
    walletAddress: {
        type: String,
        required: true
    },
    priceToken: {
        type: String,
        required: true
    },
    txHash: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    amountTokenA: {
        type: Number,
        required: true
    },
    amountTokenB: {
        type: Number,
        required: true
    },
    type: {
        type: Number,
        required: true
    },
    timeTransaction: {
        type: Date,
        required: true,
        index: true
    },
}, { timestamps: true });

const trade_history = mongoose.model("2021_list_trade_history", schema);

module.exports = trade_history;