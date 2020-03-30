const execSync = require('child_process').execSync
const exec = require('child_process').exec
const spawn = require('child_process').spawn
const controller_logstash = require('../scripts_js/ControllerLogstash.js')
const loc = require('../modules/locations')
const global = require('../modules/global_vars')
 module.exports = function(event){
    let isExecutedCmd
    try
    {
      exec("mkdir "+global.logsDir)
      exec("mkdir "+global.logsDir+"/all")
  
  
      if (process.platform === "win32" || process.platform === "win64")
      {
        windows_synchronyse(event)
      }
      //Looking for autoPairing app 
      else{
        linux_synchronize()
      }
    }
    catch(err)
    {
        console.log("logstashSynchronize : ",err)
        throw Error(err)
    }
  }

function linux_synchronize(){
    logstash_dir = execSync("find ~ -name 'autoPairing'", (err, stdout, stderr) => {
    if (err)
        console.log(err)
    console.log("stdout ",stdout)
    console.log("stdout ",stderr)
    }).toString('utf-8').replace(/\n/g, '')
    isExecutedCmd = 'ps -aux | grep logstash'
    event.reply('lookingForLogstash', 'Logstash found')

    global.codeDirName = "code_linux"
    global.configName = "logstash-config-linux.conf"
    global.codeDir = global.logstash_dir+"/bash_code/"+global.codeDirName

    try {
    isExecuted = execSync(isExecutedCmd , (err, stdout, stderr) => {
    if (err)
    console.log(err)
        console.log("stdout ",stdout)
        console.log("stdout ",stderr)
    }).toString('utf-8').replace(/\n/g, '').match(/grep/g).length > 2
    }
    catch(err){console.log(err); isExecuted = false}


    //Launch Logstash is not processing
    if (!isExecuted){
        global.logstash_process = spawn('sh', [global.logstash_dir+"/logstash-7.6.0/bin/logstash", "-f", global.logstash_dir+"/config/"+global.configName, "-w", 1])
        controller_logstash()
    }

    if (global.logstash_dir == "") throw new Error("logstash not found")

}
 

  function windows_synchronyse(event){
    let user = execSync("quser", (err, stdout, stderr) => {
        if (err)
          console.log(err)
        console.log("stdout ",stdout) 
        console.log("stdout ",stderr)
      }).toString('utf-8').match(/>([A-Z,a-z]+)/g)[0].replace(/>/g, '')

      global.codeDirName = "code_windows"
      global.configName = "logstash-config-windows.conf"

      const getLogstashProcess = spawn('python',[loc.script_windows, '2', 'C:\\Users\\'+user]);
      console.log('C:\\Users\\'+user)
      getLogstashProcess.stderr.on('data', (data) => {event.reply('infos', data.toString())})
      getLogstashProcess.stdout.on('data', (data) => {
        console.log(data.toString())
        data.toString('utf-8') == 'False\r\n'||data.toString('utf-8') == 'False' ? global.logstash_dir= false : global.logstash_dir= data.toString('utf-8')
        console.log(global.logstash_dir)

        if (!global.logstash_dir){
          console.log('None logstash')
          event.reply('lookingForLogstash', 'Logstash not found')
        }else{
          const logstashIsRunningProcess = spawn('python',[loc.script_windows, '8', '127.0.0.1', 9600]);
          event.reply('lookingForLogstash', 'Logstash found')

          logstashIsRunningProcess.stdout.on('data', (data) => {
            // console.log(data.toString('utf-8'))
            console.log(data.toString())
            let isExecuted
            console.log(data.toString('utf-8').match(/False/g))

            data.toString('utf-8').match(/False/g) != null ? isExecuted=false : isExecuted=true
            
            console.log(isExecuted)
            if (!isExecuted){
              console.log("launch logstash")
              console.log(global.logstash_dir)
              global.logstash_process = spawn('python',[loc.script_windows, '1', global.logstash_dir, global.configName]);
              
              controller_logstash()
            }
          })
        }

      })
  }


