/** Logstash controller
 * @description Launch logstash controller & start the server (process.env.port or 3000)
 * @module index
 * @requires app,controller_logstash
 */

const app = require('./app')
const controller_logstash = require('./utils/js/controllerLogstash')

// Launch & manage logstash
controller_logstash()

// App's port
/**
 * App's port
 * @name PORT
 * @const
 * @memberof module:index
 * @inner
 * @type {number}
 */
const port = process.env.port || 3000

/**
 * Route serving analyse single zip file
 * @function
 * @memberof module:index
 * @inner
 * @param {string} port - process.env.port || 3000
 */
app.listen(port, () => {
    console.log("Server up on port ",port)
})

