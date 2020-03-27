const execSync = require('child_process').execSync


function getResultLocal(cmd, event){
    try {
      console.log("get result")
      let resProcess = execSync(cmd, (err, stdout, stderr) => {
        if (err)
            console.log(err)
          console.log("stdout ",stdout)
          console.log("stdout ",stderr)
      }).toString('utf-8')

      if (resProcess != '' && resProcess != 'False\r\n' && resProcess != 'False')
      {
        if (process.platform != "win32" && process.platform != "win64"){
          let reg = /log - (.*)/g
          resProcess = reg.exec(resProcess)[1]
        }
        event.reply('openDialogLocal', resProcess)
        return true
      }
      else{
        console.log("Wait 3s ..")
      }
    }catch(err){
      console.log(err)
      console.log("Wait 3s ..")
    }
    return false
  }

  module.exports = getResultLocal