const express = require('express');
const app = express();
var server = require('http').Server(app);

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.set('views', './views');



app.use('/', async function (req, res){
    res.render("./index");


});


// <!-- <% blogs.forEach(blog => { %> -->
//     <!--  -->


server.listen(3000);

