const client = require('./config/config.js');

function getBlogPoster(status) {
    return new Promise((resolve, reject) => {

        queryParam = {
            function_score: {
                query: {
                    match: { status: status }
                }
            }
        }

        client.search({
            index: '2021_botListNewCoin',
            body: {
                size: 1,
                query: queryParam
            }

        }, (err, body) => {
            if (body) {
                let arr = [];
                body.hits.hits.forEach(element => {
                    arr.push({
                        _id: element._id,
                        _source: element._source,
                    })

                });
                resolve(arr);
            } else { reject(err); }
        })
    })
}
async function insertToken(id, object) {
    const objectUpdate = {
        "index": '2021_bot_list_coin',
        "id": id,
        "body": object
    };
    
    return new Promise((resolve, reject) => {
        client.create((objectUpdate), (err, body) => {
            if (body) {
                resolve(body);
            } else { reject(err); }
        })
    })
}
async function updateBlogPoster(id, object) {
    const objectUpdate = {
        "index": '2021_ai_writer_blog_poster',
        "id": id,
        "body": {
            "doc": object
        }
    };
    
    return new Promise((resolve, reject) => {
        client.update((objectUpdate), (err, body) => {
            if (body) {
                resolve(body);
            } else { reject(err); }
        })
    })
}
module.exports = {
    getBlogPoster: getBlogPoster,
    updateBlogPoster: updateBlogPoster,
    insertToken:insertToken
}




