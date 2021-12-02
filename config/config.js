const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    hosts: [ "http://elastic:XlkK0VQB0YXs@elastic.fff.com.vn:19200"]
}); 

module.exports = client;