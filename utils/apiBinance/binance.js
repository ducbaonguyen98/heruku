const got = require("got");

const getPriceToken = async (symbol = "BNBUSDT") => {
    try {
        const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
        const result = await got(url);
        return JSON.parse(result.body);
    } catch (error) {
        console.log(error.message);
    }
    
    return false;
}

module.exports = {
    getPriceToken
}