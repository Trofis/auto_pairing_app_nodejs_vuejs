const {execSync} = require('child_process')
const global = require('../../modules/global_vars')

const fs = require('fs')



const getResult = (file_name) => {
  const cmd = `grep ${global.logs_dir}/all/${file_name} ${global.logs_dir}/result.log`

  const data = execSync(cmd).toString().replace('\r\n','')
  // This line below can cause trouble to logstash
  // fs.unlink(`${global.logs_dir}/all/${file_name}.log`, (err) => console.log(err))
  return (/no error|error pattern 3/g).exec(data)[0].toString()
}

const checkResult = (file_name) =>{
  const cmd = `grep ${global.logs_dir}/all/${file_name} ${global.logs_dir}/status.log | grep "Done"`
  try{
    const isResultExist = execSync(cmd).toString()
    return isResultExist
  }catch(err){
    return false
  }
}


const analyseFile = async(file_name) => {
  return await new Promise(resolve => {
    const interval = setInterval(() => {
      if (checkResult(file_name)){
        clearInterval(interval)
        resolve(getResult(file_name))
      }
    }, 6000)
  })
}

module.exports = {
  analyseFile
}