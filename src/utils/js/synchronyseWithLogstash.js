const execSync = require('child_process').execSync
const exec = require('child_process').exec
const spawn = require('child_process').spawn
const controller_logstash = require('./controllerLogstash.js')
const loc = require('../../modules/locations')
const global = require('../../modules/global_vars')



const synchronize_with_logstash = (event) => {
  try{
    global.os == "win" ? windows_synchronyse(event) : linux_synchronize(event) 
  }catch(e){throw Error()}
}

const linux_synchronize = async(event) => {
  const cmdFindLogstash = "find ~ -name 'autoPairing'"
  const isExecutedCmd = 'python '+loc.logstashApp+' 8 127.0.0.1 9600'
  
  global.logstash_dir = await execSync(cmdFindLogstash).toString('utf-8').replace(/\n/g, '')
  if (global.logstash_dir == "") throw new Error("logstash not found")

  event.reply('lookingForLogstash', 'Logstash found')

  global.configName = "logstash-config-linux.conf"
  const isExecuted = execSync(isExecutedCmd).toString().match(/False/g) != null ? false : true
  // Launch Logstash is not processing
  if (!isExecuted){
      global.logstash_process = spawn('sh', [global.logstash_dir+"/logstash-7.6.1/bin/logstash", "-f", global.logstash_dir+"/config/"+global.configName, "-w", 1])
      controller_logstash()
  }


}
 

  const windows_synchronyse = async(event) =>{
    const user = await execSync("quser").toString('utf-8').match(/>([A-Z,a-z]+)/g)[0].replace(/>/g, '')

    global.configName = "logstash-config-windows.conf"

    // Find logstash
    const cmdFindLogstash = 'python '+loc.logstashApp+' 2 '+'C:\\Users\\'+user
    const data = await execSync(cmdFindLogstash)
    data.toString('utf-8') == 'False\r\n'||data.toString('utf-8') == 'False' ? global.logstash_dir= false : global.logstash_dir= data.toString('utf-8')

    if (global.logstash_dir == '') throw Error()

    event.reply('lookingForLogstash', 'Logstash found')
    // Check if logstash's already running
    const isExecutedCmd ='python '+loc.logstashApp+' 8 127.0.0.1 9600'
    const isExecuted = execSync(isExecutedCmd).toString().match(/False/g) != null ? false : true

    // Is logstash is runned from outside
    if (!isExecuted){
      global.logstash_process = execSync('python '+loc.logstashApp+' 1 '+global.logstash_dir+' '+global.configName)
      controller_logstash()
    }
  }


module.exports = {
  synchronize_with_logstash
}