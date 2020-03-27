function controller_logstash(){
    logstash_process.on('close', (code,signal) => {
      console.log('child killed ',code, signal)
    })
    logstash_process.stdout.on('data', (data) => {
      console.log(data.toString())
    })
    logstash_process.stderr.on('data', (data) => {
      console.log(data.toString())
    })
  }

  module.exports = controller_logstash