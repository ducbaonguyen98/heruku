const { io } = require("socket.io-client"); 
const socketClient = io("http://localhost:3000/");

socketClient.on("connect", () => {
    console.log(`My client ${socketClient.id}`); // x8WIv7-mJelg7on_ALbx
});