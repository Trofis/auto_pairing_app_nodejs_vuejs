/** Logstash controller
 * @module utils/js/controllerLogstash
 * @requires locations,global_vars,exec,execSync,spawn
 */

// Intern imports
const global = require('../../modules/global_vars')
const loc = require('../../modules/locations')

// Global imports
const {exec, spawn, execSync} = require('child_process')


/**
 * It aims to start & manage logstash thread
 * @name controller_logstash
 * @function
 * @memberof module:utils/js/controllerLogstash
 * @inner
 */
function controller_logstash(){
    const isExecutedCmd = 'python3 '+loc.environment+' 1 127.0.0.1 9600'
    const isExecuted = execSync(isExecutedCmd).toString().match(/False/g) != null ? false : true

    // Is logstash is runned from outside
    if (!isExecuted){
        const child = spawn('sh', [global.logstash_dir+"/bin/logstash", "-f", loc.__auto_pairing_app+"/configLogstash/"+global.config_logstash_name, "-w", 1])

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