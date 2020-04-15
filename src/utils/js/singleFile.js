const execSync = require('child_process').execSync
const global = require('../../modules/global_vars')

const getResultLocal = async(cmd) => {
  let data = exec(cmd).toString().replace('\r\n','')

  if (data != 'False'){
    if (global.os == "win")
      data = (/log - (.*)/g).exec(data)[1]
    return data
  }
  return false
}

const checkResultLocal = async(cmd) =>{
  let isResultExist = await exec(cmd).toString()

  if (global.os == "win")
    return isResultExist.match(/False/g) != null ? false : true
  return isResultExist
}

const setUpForLogstash = (file) => {
  if (global.os == "win"){
    exec('mkdir '+global.logsDir.replace(/\//g,'\\')+'\\log_modemD_'+global.log_name_dir.replace(/[\\:]/g,'-'))

    exec('xcopy '+file+' '+global.logsDir.replace(/\//g,'\\')+'\\log_modemD_'+global.log_name_dir.replace(/[\\:]/g,'-'))
  }
  else{
    exec('mkdir '+global.logsDir+'/log_modemD_'+global.log_name_dir)

    exec('cp '+file+' '+global.logsDir+'/log_modemD_'+global.log_name_dir)
  }
}

const sendFileToLogstash = async(file) => {
  let filename
  let cmd1 
  let cmd2
  if (global.os = "win"){
    filename = file.match(/(\\[^\\]*)$/g)[0]
    cmd1 = "python "+loc.script_windows+" 6 "+global.logsDir+'/log_modemD_'+log_name_dir.replace(/[\\:]/g,'-')+" "+global.logsDir+"/status.log"
    cmd2 = "python "+loc.script_windows+" 7 "+global.logsDir+'/log_modemD_'+log_name_dir.replace(/[\\:]/g,'-')+" "+global.logsDir+"/result.log "
  }
  else{
    filename = file.match(/(\/[^/]*)$/g)[0]
    cmd1 = "grep '"+global.logsDir+'/log_modemD_'+global.log_name_dir+filename+"' "+global.logsDir+"/status.log | grep 'Done'"
    cmd2 = "grep '"+global.logsDir+'/log_modemD_'+global.log_name_dir+filename+"' "+global.logsDir+"/result.log"
  }

  if (filename != '/ModemD_00000000.log' && filename != '\\ModemD_00000000.log')
    throw Error()

  if (checkResultLocal(cmd1))
    return getResultLocal(cmd2)
  else{
    setUpForLogstash(file)
    return await setInterval(async() => {
      if (checkResultLocal(cmd1)){
        clearInterval(process)
        return getResultLocal(cmd2)
      }
    }, 6000);
  }

  
}

module.exports = {
  getResultLocal, 
  checkResultLocal,
  sendFileToLogstash
}