require("dotenv").config();
const mongoose = require("mongoose");

const URL = process.env.URL_MONGODB;

mongoose.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true,  socketTimeoutMS: 1000 }).then(() => {
    console.log("Connected to DB");
}).catch(err => {
    console.log("err", err);
})


const insertMany = async (model, array = []) => {

    try {
        const result = await model.insertMany(array, { ordered: false });
        if (result.length !== 0) {
            return {
                status: "success",
                data: result
            };
        }
    } catch (error) {
        console.log("insertMany", error.message);
    }
    return {
        status: "error",
    };
}

const insertOne = async (model, obj = {}) => {

    try {
        const result = new model(obj);
        result.save();

        return {
            status: "success",
            data: result._id
        };
    } catch (error) {
        console.log("insertOne", error.message);
    }


    return {
        status: "error"
    };
}

const updateOne = async (model, filter, obj = {}) => {

    try {

        await model.updateOne(filter, obj)

        return {
            status: "success"
        };
    } catch (error) {
        console.log("updateOne", error.message);
    }
}

const getByQuery = async (model, query) => {
    try {
        const result = await model.find(query).lean();;
        return {
            status: "success",
            data: result
        };
    } catch (error) {
        return {
            status: "error",
            msg: error.message
        };
    }
}

const getByLimit = async (model, query, skip = 0, limit = 20) => {

    try {
        const result = await model.find(query).lean().skip(skip).limit(limit).sort({ createdAt: "desc" });
        return {
            status: "success",
            data: result
        };
    } catch (error) {
        return {
            status: "error",
            msg: error.message
        };
    }
}




const getOne = async (model, filter = {}) => {
    try {

        const result = await model.findOne(filter);
        if (result) {
            return {
                status: "success",
                data: result
            };
        }
    } catch (error) {

    }

    return {
        status: "error"
    };
}

const getAll = async (model, filter = {}) => {
    try {
        const result = await model.find(filter).sort({ createdAt: "desc" });
        return {
            status: "success",
            data: result
        };
    } catch (error) {
        return {
            status: "error",
            msg: error.message
        };
    }
}

const count = async (model, filter = {}) => {
    try {
        const result = await model.count(filter);
        return {
            status: "success",
            data: result
        };
    } catch (error) {
        return {
            status: "error",
            msg: error.message
        };
    }
}

module.exports = {
    insertOne,
    insertMany,
    updateOne,
    getOne,
    getAll,
    getByQuery,
    getByLimit,
    count
}