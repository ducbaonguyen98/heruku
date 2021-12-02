const express = require('express');
const apiRouter = require('./apiRouter.js');

const rootRouter = express.Router();

rootRouter.get("/", (req, res) => {
    res.send("Private API");
});   

rootRouter.use('/api', apiRouter);

module.exports = rootRouter;
