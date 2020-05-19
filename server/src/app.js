
const express = require('express')
var cors = require('cors')
const fileUpload = require('express-fileupload')
const addRequestId = require('express-request-id')();
const bodyParser = require('body-parser')
const main = require('./router/main')

// Const vars
const app = express()
// Middlewares 
app.use(cors())
app.use(fileUpload({
    createParentPath:true
}))
app.use(addRequestId);
app.use(bodyParser.json())
app.use(main)



module.exports = app