/** Bunch of file analyse functions 
 * @module utils/js/analyseFile
 * @requires execSync,global_vars,fs
 */

// Intern imports
const global = require('../../modules/global_vars')

// Global imports
const {execSync} = require('child_process')
const fs = require('fs')


/**
 * It aims to grep the logstash result log file and find the attach origin file's result  
 * @name getResult
 * @function
 * @memberof module:utils/js/analyseFile
 * @inner
 * @param {string} file_name - Result's file name 
 * @return {string} return either 'no error' or 'error pattern 3'
 */
const getResult = (file_name) => {
  const cmd = `grep ${global.logs_dir}/all/${file_name} ${global.logs_dir}/result.log`

  const data = execSync(cmd).toString().replace('\r\n','')
  // This line below can cause trouble to logstash
  // fs.unlink(`${global.logs_dir}/all/${file_name}.log`, (err) => console.log(err))
  return (/no error|error pattern 3/g).exec(data)[0].toString()
}

/**
 * It aims to grep the logstash status log file and find the attach origin file's status  
 * @name checkResult
 * @function
 * @memberof module:utils/js/analyseFile
 * @inner
 * @param {string} file_name - Status' file name
 * @return {boolean} boolean
 */
const checkResult = (file_name) =>{
  const cmd = `grep ${global.logs_dir}/all/${file_name} ${global.logs_dir}/status.log | grep "Done"`
  try{
    const isResultExist = execSync(cmd).toString()
    return isResultExist
  }catch(err){
    return false
  }
}

/**
 * It aims to check each 6 seconds the file's process status
 * then call the method getResult
 * @name analyseFile
 * @function
 * @memberof module:utils/js/analyseFile
 * @inner
 * @param {string} file_name - Status' file name
 */
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
  analyseFile,
  checkResult,
  analyseFile
}