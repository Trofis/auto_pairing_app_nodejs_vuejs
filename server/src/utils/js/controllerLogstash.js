const global = require('../../modules/global_vars')
const loc = require('../../modules/locations')
const {exec, spawn, execSync} = require('child_process')

function controller_logstash(){
    const isExecuted = execSync(global.isExecutedCmd).toString().match(/False/g) != null ? false : true
    console.log(isExecuted)
    console.log(global.logstash_dir)
    console.log(global.config_logstash_name)


    // Is logstash is runned from outside
    if (!isExecuted){
        const child = spawn('sh', [global.logstash_dir+"/logstash/bin/logstash", "-f", global.logstash_dir+"/config/"+global.config_logstash_name, "-w", 1])

        child.stdout.on('data', (data) => {
            console.log(data.toString())
        })

        child.stderr.on('data', (data) => {
            console.log(data.toString())
        })
    
        global.logstash_process_pid = child.pid
        process.on( 'SIGTERM', function () {
            process.kill(global.logstash_process_pid, 'SIGTERM')
        })
    }


    exec('python '+loc.environment+' 2')

    
  }

  module.exports = controller_logstash