"use strict";
const loc = require('./locations')


// Global vars used in code
const global = {
    logstash_dir: process.env.logstash || "/home/trofis/Workspace/Worldline/autoPairing",
    logs_dir:"/tmp/logs_modem_files",
    config_logstash_name:'logstash-config.conf',
    logstash_process_pid:undefined,
    log_name_dir:'',
    // cmd
    isExecutedCmd:'python '+loc.environment+' 1 127.0.0.1 9600',
}

module.exports=global