const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = express();
const httpServer = createServer(app);
const socket = new Server(httpServer, {
    cors: {
        origin: "*",
    }
});


httpServer.listen(3130);
const rootRouter = require("./routers/rootRouter");
const { checkTimeUpdatedAt, updatePairToken, getListPairToken, getAllPairByStatus } = require("./utils/collections/2021_list_pair_token");


const soketFindNewPair = require("./soketFindNewPair"); 
require("./client/myClient");

let isCheck = false;

global.historyTxt = [];

socket.on("connection", async (client) => {
    const result = await getListPairToken();
    const data = result.status === "success" ? result.data : [];
    if (!isCheck) {
        soketFindNewPair(socket, data); 
        isCheck = true;
    }
    socket.to(`${client.id}`).emit("getListPairToken", data);
});

app.set('trust proxy', false);
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(rootRouter);





