const WorkerPool = require('../model/WorkerPool')
const os = require('os')
const loc = require('../modules/locations.js')
const global = require('../modules/global_vars.js')
const spawn = require('child_process').spawn
const execSync = require('child_process').execSync



function process_zip_files(files,event, directory){
  console.log('process_zip_files')
  if (process.platform != 'win32' && process.platform != 'win64')
    files = files[0].toString().split('\n').filter((elem) => elem!='')
  let sizeFiles = files.length
  
  //Reply to the server the size & the different box name
  event.reply('syncFiles', sizeFiles)
  files.forEach((elem) => { event.reply('syncFiles', elem)})
  
  //Exec code to extract log files from zip & send them to the logsDir
  if (process.platform=="win32" || process.platform=="win64")
  {
    const executeCode = spawn('python',[loc.script_windows, '5', directory ]);
    executeCode.stdout.on('data', (data) => {
      console.log('data')
    })
  }
  else
    execSync(loc.code_linux+" "+directory)


  //Starting treating files
  _useWorkerTreatFiles(files,directory, event)
}


function _useWorkerTreatFiles(files,directory, event){
    // Init lets
    let resultProcess = []
    let i = 0
    let platformUsed = process.platform
    const pool = new WorkerPool(os.cpus().length)
    let script_win = loc.script_windows
    let logsDir = global.logsDir
    let logstash_dir = global.logstash_dir
    console.log(logstash_dir)
    console.log(logsDir)
    console.log(script_win)


    // Launch worker for each file
    files.forEach((file) => {
      let filename
      if (platformUsed != "win32" && platformUsed != "win64")
        filename = "/"+file.match(/CONTI_.*_LOG.tar.gz/g)[0]
      console.log(filename)
      pool.runTask({filename, logsDir, logstash_dir, script_win, platformUsed}, (err, res) => {
      let item
      let continueProcess = true
      console.log("run task")


      if (err)
      {
        console.log("error")
        console.log(err)
        item = [file, err]
        continueProcess = false
        event.reply('syncFilesResult', item)
      }

      if (continueProcess)
      {
        item = [file, res]
        event.reply('syncFilesResult', item)
        resultProcess.push(item)
        
        console.log("i : ",i)
        console.log("files : ",files.length)
        // If all files treated then write down all the results in result.log
        if (++i === files.length)
        {
          // Close pool workers
          pool.close()
          // Init csv's lets for writing
          const createCsvWrite = require('csv-writer').createArrayCsvWriter
          const timestamp = new Date().getTime().toString()
          const csvWriter = createCsvWrite({
            path: directory+'/'+timestamp+'_result.csv',
            header : ["FILE", "RESULT"]
          })
          
          // If no result then probably something goes wrong with logstash
          // If not then write results in a csv
          if (resultProcess.length == 0)
          {
            msg = "No results found - check out if your logstash actually working"
          } 
          else{
            msg = "Results in : "+directory
        
            csvWriter.writeRecords(resultProcess).then(() => {
              console.log('CSV Writer : done')
            }).catch(err => {
              console.log(err)
            })
          } 
        } 
      }
    })
  })
}

module.exports = process_zip_files