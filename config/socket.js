const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = express();
const httpServer = createServer(app);
const socket = new Server(httpServer, { 
    cors: {
        origin: "*",
      }
}); 

httpServer.listen(3000);

module.exports = {
  app,
  socket, 
  httpServer
};