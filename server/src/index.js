const app = require('./app')
const controller_logstash = require('./utils/js/controllerLogstash')

// Launch & manage logstash
controller_logstash()

// App's port
const port = process.env.port || 3000


app.listen(port, () => {
    console.log("Server up on port ",port)
})

