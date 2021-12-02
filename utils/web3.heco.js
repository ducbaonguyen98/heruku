require('dotenv').config();
const Web3 = require('web3');

const provider_url ="wss://ws-mainnet.hecochain.com";
let provider = null;
if (provider_url.startsWith('wss://') || provider_url.startsWith('ws://')) {
  provider = new Web3.providers.WebsocketProvider(provider_url, {
    // Enable keepalive
    clientConfig: {
      keepalive: true,
      keepaliveInterval: 60000  // ms
    },

    // Enable auto reconnection
    reconnect: {
      auto: true,
      delay: 5000, // ms
      maxAttempts: 5,
      onTimeout: false
    }
  })

  provider.on("connect", () => {
    console.log("*** WebSocket Connected ***")
  })
  provider.on("error", (e) => {
    console.log("*** WebSocket Error ***")
  })
  provider.on("end", (e) => {
    console.log("*** WebSocket Ended ***")
  })
  provider.on("close", (e) => {
    console.log("*** WebSocket Closed ***")
  })
  provider.on("timeout", (e) => {
    console.log("*** WebSocket Timeout ***")
  })
  provider.on("exit", (e) => {
    console.log("*** WebSocket Exit ***")
  })
  provider.on("ready", (e) => {
    console.log('*** WebSocket Ready ***')
  })
} else {
  provider = new Web3.providers.HttpProvider(provider_url)
}

const web3 = new Web3(provider);

module.exports = web3;