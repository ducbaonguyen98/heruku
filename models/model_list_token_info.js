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
    tokenAddress: {
        type: String,
        unique: true,
        index: true
    },
    name: {
        type: String,
        require: true,
        index: true
    },
    symbol: {
        type: String,
        required: true
    }, 
    type: {
        type: String,
        default: "",
        index: true
    },
    decimals: {
        type: Number,
        required: true 
    },
    price: {
        type: Number,
        required: true
    },
    lp: {
        type: Number,
        required: true
    },
    poolRemaining: {
        type: Number,
        required: true
    },
    totalSupply: {
        type: Number,
        required: true
    },
    totalHolder: {
        type: Number,
        default: 0
    }, 
    listHolder: {
        type: String,
        default: `${JSON.stringify([])}`
    },
    favodefi: {
        totalView: {
            type: Number,
            default: 0
        },
        totalVote: {
            type: Number,
            default: 0
        },
        totalLike: {
            type: Number,
            default: 0
        },
        totalComment: {
            type: Number,
            default: 0
        },
        totalFavorite: {
            type: Number,
            default: 0
        }
    },
    community: {
        coinmarketcap: {
            type: Boolean,
            default: false
        },
        twitter: {
            type: Number,
            default: 0
        },
        facebook: {
            type: Number,
            default: 0
        },
        medium: {
            type: Boolean,
            default: false
        },
        website: {
            type: Boolean,
            default: false 
        },
        followedByCelebrities: {
            type: Boolean,
            default: false 
        },
        votingCommunity: {
            type: Boolean,
            default: false 
        },
        runAds: {
            type: Boolean,
            default: false 
        },
        urlRunAds: {
            type: String,
            default: `${JSON.stringify([])}`
        },
        teamInfo: {
            type: Boolean,
            default: false 
        },
        urlTeamInfo: {
            type: String,
            default: `${JSON.stringify([])}`
        },
        listingOnDex: {
            type: Boolean,
            default: false 
        },
        urlDex: {
            type: String,
            default: `${JSON.stringify([])}`
        }
    },
    status: {
        type: Number,
        default: 0
    },
    timeInitPool: {
        type: Date,
        required: true
    }, 
}, { timestamps: true });

const list_pair_token = mongoose.model("2021_list_token_info", schema);

module.exports = list_pair_token;