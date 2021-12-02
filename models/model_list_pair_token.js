const mongoose = require("mongoose");

const schema = mongoose.Schema({
    chain: {
        type: String,
        default: "BSC",
        index: true
    },
    exchange: {
        type: String,
        default: "PancakeSwap",
        index: true
    },
    pairAddress: {
        type: String,
        unique: true,
        index: true
    },
    namePair: {
        type: String,
        required: true
    },
    symbol: {
        type: String,
        required: true
    }, 
    txHash: {
        type: String,
        required: true
    },
    token0: {
        type: String,
        required: true
    },
    addressTokenA: {
        type: String,
        required: true,
        index: true
    },
    addressTokenB: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        default: 0
    },
    lp: {
        type: Number,
        required: true
    },
    poolAmountA: {
        type: Number,
        default: 0
    }, 
    poolAmountB: {
        type: Number,
        default: 0
    },
    poolRemainingA: {
        type: Number,
        default: 0
    },
    poolRemainingB: {
        type: Number,
        default: 0
    },
    status: {
        type: Number,
        default: 0
    },
    timeInitPool: {
        type: Date,
        required: true
    }
}, { timestamps: true });

const list_pair_token = mongoose.model("2021_list_pair_token", schema);

module.exports = list_pair_token;