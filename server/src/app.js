/** Bunch of file analyse functions 
 * @module app
 * @requires express,cors,fileUpload,addRequestId,bodyParser,main
 */
// Global imports
const express = require('express')
var cors = require('cors')
const fileUpload = require('express-fileupload')
const addRequestId = require('express-request-id')();
const bodyParser = require('body-parser')
const main = require('./router/main')

// Const vars
/**
     * App's var
     * @name app
     * @const
     * @memberof module:app
     * @inner
     * @type {Express}
     */
const app = express()

// Middlewares 
if (process.env.NODE_ENV != "production")
    /**
     * Middleware file upload
     * @name cors
     * @function
     * @memberof module:app
     * @inner
     * @param {object} middleware - cors middleware
     */
    app.use(cors())
/**
 * Middleware file upload
 * @name fileUpload
 * @function
 * @memberof module:app
 * @inner
 * @param {object} middleware - fileUpload middleware
 */
app.use(fileUpload({
    createParentPath:true
}))
/**
 * Middleware addRequestId
 * @name addRequestId
 * @function
 * @memberof module:app
 * @inner
 * @param {object} middleware - addRequestId middleware
 */
app.use(addRequestId);
/**
 * Middleware bodyParser
 * @name addRequestId
 * @function
 * @memberof module:app
 * @inner
 * @param {object} middleware - bodyParser middleware
 */
app.use(bodyParser.json())
/**
 * Middleware main
 * @name addRequestId
 * @function
 * @memberof module:app
 * @inner
 * @param {object} middleware - main middleware
 */
app.use(main)



module.exports = app