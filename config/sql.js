const MySQLClass = require('../utils/MySQLClass');
const mysql_config = require('../cert/mysql_amazon');
const moment = require('moment');
const mysql = new MySQLClass();
mysql.setConfig(mysql_config);

const insertMySQL = async (table, data) => { 
    try {
        const result = await mysql.insert(table, data);  
        if(result) {
            return {
                status: "success",
                data: result
            }
        }
        
    } catch (error) {
        console.log(error.message)
    } 

    return {
        status: "error"
    }
} 

const updateMySQL = async (table, data, id) => { 
    try {
        const result = await mysql.updateId(table, data, id);
        if(result) {
            return {
                status: "success"
            }
        }
        
    } catch (error) {
        console.log(error.message)
    } 

    return {
        status: "error"
    }
} 

const existsMySQL = async (table, strWhere) => {
    try {
        
        const result = await mysql.exists(`SELECT * FROM ${table} WHERE ${strWhere}`); 
        if(result) {
            return {
                status: "success",
                data: result
            }
        }
       
    } catch (error) {
        console.log(error.message)
    } 

    return {
        status: "error"
    }
}



const getAllMySQL = async (table) => {
    try {
        //  
        const beforeDay = moment().subtract(1, 'days').format("YYYY-MM-DD HH:mm:ss");
        const currentDay = moment().format("YYYY-MM-DD HH:mm:ss");
        const result = await mysql.query(`SELECT * FROM ${table} WHERE createdTime BETWEEN '${beforeDay}' AND '${currentDay}' ORDER BY createdTime DESC `);
        // const result = await mysql.query(`SELECT * FROM ${table} ORDER BY createdTime DESC `);
        if(result) {
            return {
                status: "success",
                data: result
            }
        }
    } catch (error) {
        console.log(error.message)
    }

    return {
        status: "error"
    }
}

const getAllLimitMySQL = async (table, limit, offset) => {
    try {
        //  
        const beforeDay = moment().subtract(1, 'days').format("YYYY-MM-DD HH:mm:ss");
        const currentDay = moment().format("YYYY-MM-DD HH:mm:ss");
        const result = await mysql.query(`SELECT * FROM ${table} WHERE createdTime BETWEEN '${beforeDay}' AND '${currentDay}' ORDER BY createdTime DESC LIMIT ${limit} OFFSET ${offset}`);
        // const result = await mysql.query(`SELECT * FROM ${table} ORDER BY createdTime DESC `);
        if(result) {
            return {
                status: "success",
                data: result
            }
        }
    } catch (error) {
        console.log(error.message)
    }

    return {
        status: "error"
    }
}





module.exports = {
    insertMySQL,
    updateMySQL,
    existsMySQL,
    getAllMySQL,
    getAllLimitMySQL
}