const WorkerPool = require('../../model/WorkerPool')
const os = require('os')
const loc = require('../../modules/locations.js')
const global = require('../../modules/global_vars.js')
const { exec, execSync } = require('child_process')


const csvWriter = async(directory, data) => {
  const createCsvWrite = require('csv-writer').createArrayCsvWriter
  const timestamp = new Date().getTime().toString()
  const csv = createCsvWrite({
    path: directory+'/'+timestamp+'_result.csv',
    header : ["FILE", "RESULT"]
  })
  
  csv.writeRecords(data)
}

const sendFilesToLogstash = async(directory) => {
  if (global.os == "win")
    {
      const cmd = 'python '+loc.logstashApp+" 5 "+directory
      exec(cmd)
    }
    else
      exec(loc.code_linux+" "+directory)
}

const getZipFilesWin = (directory) => {
  const cmd = 'python '+loc.logstashApp+" 3 "+directory
  const data = execSync(cmd).toString()
  
  const files = data.toString().match(/CONTI_[0-9]*_[0-9]*_LOG.tar.gz/g)

  if (files === null || files.length === 0)
    throw Error()
  return files
}

const getZipFilesLin = (directory) => {
  const cmd = "find "+directory+" -name '*.tar.gz' | grep 'CONTI.*_LOG.tar.gz'"
  const data = execSync(cmd)
  let files = data.toString()

  files = files.split(' ').map(item => item.match(/(\/[^/]*)$/g).toString().replace(/\/|\n/g, ''))

  if (files === null || files.length === 0 || files === undefined)
    throw Error()
  return files
}


const _useWorkerTreatFiles = (files,directory, event) => {
  // Init lets
  let resultProcess = []
  let i = 0
  const pool = new WorkerPool(os.cpus().length)
  // Launch worker for each file
  files.forEach((file) => {
    let filename
    // Clear data
    if (global.os === "win")
      filename = file.match(/CONTI_.*_LOG.tar.gz/g)[0]
    else
      filename = file
    pool.runTask({filename, logsDir:global.logsDir, logstash_dir:global.logstash_dir, script_win:loc.logstashApp, platformUsed:global.os}, (err, res) => {
      if (err)
        return event.reply('multipleFilesResult', [file, err])
      const item = [file, res]
      event.reply('multipleFilesResult', item)
      resultProcess.push(item)
      
      // If all files treated then write down all the results in result.log
      if (++i === files.length)
      {
        // Close pool workers
        pool.close()
        // Write results in csv
        csvWriter(directory, resultProcess)
      } 
    })
  })
}



module.exports = {
  _useWorkerTreatFiles,
  getZipFilesLin,
  getZipFilesWin,
  sendFilesToLogstash
}  