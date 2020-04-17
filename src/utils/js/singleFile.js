const {execSync, exec} = require('child_process')
const global = require('../../modules/global_vars')
const loc = require('../../modules/locations')


const getResultLocal = (cmd, file) => {
  const data = execSync(cmd).toString().replace('\r\n','')
  // if (global.os == "win")
  //   data = (/log - (.*)/g).exec(data)[1]
  return {file, result:(/no error|error pattern 3/g).exec(data)[0].toString()}
}

const checkResultLocal = (cmd) =>{
  try{
    let isResultExist = execSync(cmd).toString()
  
    if (global.os == "win")
      return isResultExist.match(/False/g) != null ? false : true
    return isResultExist
  }catch(error){
    console.log('error')
    return false
  }
}

const setUpForLogstash = async(file) => {
  await exec('python '+loc.logstashApp+' 9')

  if (global.os == "win"){
    exec('mkdir '+global.logsDir.replace(/\//g,'\\')+'\\log_modemD_'+global.log_name_dir.replace(/[\\:]/g,'-'))

    exec('xcopy '+file+' '+global.logsDir.replace(/\//g,'\\')+'\\log_modemD_'+global.log_name_dir.replace(/[\\:]/g,'-'))
  }
  else{
    exec('mkdir '+global.logsDir+'/log_modemD_'+global.log_name_dir)

    exec('cp '+file+' '+global.logsDir+'/log_modemD_'+global.log_name_dir)
  }
}

const sendFileToLogstash = async(file, event) => {
  let filename
  let cmd1 
  let cmd2
  
  if (global.os == "win"){
    filename = file.match(/(\\[^\\]*)$/g)[0]
    cmd1 = "python "+loc.logstashApp+" 6 "+global.logsDir+'/log_modemD_'+global.log_name_dir.replace(/[\\:]/g,'-')+" "+global.logsDir+"/status.log"
    cmd2 = "python "+loc.logstashApp+" 7 "+global.logsDir+'/log_modemD_'+global.log_name_dir.replace(/[\\:]/g,'-')+" "+global.logsDir+"/result.log "
  }
  else{
    filename = file.match(/(\/[^/]*)$/g)[0]
    cmd1 = "grep '"+global.logsDir+'/log_modemD_'+global.log_name_dir+filename+"' "+global.logsDir+"/status.log | grep 'Done'"
    cmd2 = "grep '"+global.logsDir+'/log_modemD_'+global.log_name_dir+filename+"' "+global.logsDir+"/result.log"
  }
  
  
  if (filename != '/ModemD_00000000.log' && filename != '\\ModemD_00000000.log')
    throw Error()

  if (checkResultLocal(cmd1))
    event.reply('openDialogLocal', getResultLocal(cmd2,file))
  else{
    await setUpForLogstash(file)
    process =setInterval(() => {
      if (checkResultLocal(cmd1)){
        clearInterval(process)
        return event.reply('openDialogLocal', getResultLocal(cmd2,file))
      }
    }, 6000);
  }

  
}

module.exports = {
  getResultLocal, 
  checkResultLocal,
  sendFileToLogstash
}