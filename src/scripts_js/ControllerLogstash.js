const global = require('../modules/global_vars')

function controller_logstash(){
    global.logstash_process.on('close', (code,signal) => {
      console.log('child killed ',code, signal)
    })
    global.logstash_process.stdout.on('data', (data) => {
      console.log(data.toString())
    })
    global.logstash_process.stderr.on('data', (data) => {
      console.log(data.toString())
    })
  }

  module.exports = controller_logstash