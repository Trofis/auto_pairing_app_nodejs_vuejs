const app = require('electron').app
const protocol = require('electron').protocol
const BrowserWindow = require('electron').BrowserWindow
const dialog = require('electron').dialog
const ipcMain = require('electron').ipcMain

//const createProtocol = require('vue-cli-plugin-electron-builder/lib')
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import { get } from 'http'
import {PythonShell} from 'python-shell'
import { isString } from 'util'

const isDevelopment = process.env.NODE_ENV === 'development';


const os = require('os')
const WorkerPool = require('./model')
const execSync = require('child_process').execSync
const exec = require('child_process').exec
const spawn = require('child_process').spawn
const shell = require('shelljs')
const staticPath = require('./config')
const script_win = require('path').resolve(staticPath, 'scripts/script_windows.py')

let win

let logstash_dir
let logsDir
let codeDir
let codeDirName
let configName
//const pool = new WorkerPool(os.cpus().length)
var logstash_process
var isExecuted
//const logstash_dir = "C:/Utilisateurs/A766646/Desktop/autoPairing"
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{scheme: 'app', privileges: { secure: true, standard: true } }])

//------------------------------------------------//
//------------------ Functions -------------------//
//------------------------------------------------//

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ width: 800, height: 600, webPreferences: {
    nodeIntegration: true
  } })
  
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
  
  //Set logs directory depends on os
  if (process.platform === "win32" || process.platform === "win64")
    logsDir = "C:/logs_modem_files"
  else 
    logsDir = "/var/logs_modem_files"

  win.on('closed', () => {
    win = null
    logstash_process.kill("SIGKILL")
  })

   //script_win = __dirname+"\\scripts\\script_windows.py"

}

 
function _useWorkerTreatFiles(files, directory, event){
  // Init lets
  let result = []
  let msg = ""
  let i = 0
  let platformUsed = process.platform
  const pool = new WorkerPool(os.cpus().length)
  event.reply('syncFilesResult', ['dir_zip', directory])
  // Launch worker for each file
  files.forEach((file) => {
    pool.runTask({file, logsDir, logstash_dir, script_win, platformUsed}, (err, res) => {
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
        result.push(item)
        
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
          if (result.length == 0)
          {
            msg = "No results found - check out if your logstash actually working"
          } 
          else{
            msg = "Results in : "+directory
        
            csvWriter.writeRecords(result).then(() => {
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

function logstashSynchronize(event){
  let isExecutedCmd
  try
  {
    exec("mkdir "+logsDir)
    exec("mkdir "+logsDir+"/all")

    event.reply('infos', __dirname)
    event.reply('infos',process.cwd())
    event.reply('infos',__static)
    event.reply('infos',process.env.BASE_URL)


    if (process.platform === "win32" || process.platform === "win64")
    {
      let user = execSync("quser", (err, stdout, stderr) => {
        if (err)
          console.log(err)
        console.log("stdout ",stdout) 
        console.log("stdout ",stderr)
      }).toString('utf-8').match(/>([A-Z,a-z]+)/g)[0].replace(/>/g, '')

      codeDirName = "code_windows"
      configName = "logstash-config-windows.conf"

      const getLogstashProcess = spawn('python',[script_win, '2', 'C:\\Users\\'+user]);
      console.log('C:\\Users\\'+user)
      getLogstashProcess.stderr.on('data', (data) => {event.reply('infos', data.toString())})
      getLogstashProcess.stdout.on('data', (data) => {
        console.log(data.toString())
        data.toString('utf-8') == 'False\r\n'||data.toString('utf-8') == 'False' ? logstash_dir= false : logstash_dir= data.toString('utf-8')
        console.log(logstash_dir)

        if (!logstash_dir){
          console.log('None logstash')
          event.reply('lookingForLogstash', 'Logstash not found')
        }else{
          const logstashIsRunningProcess = spawn('python',[script_win, '8', 'logstash']);
          event.reply('lookingForLogstash', 'Logstash found')

          logstashIsRunningProcess.stdout.on('data', (data) => {
            // console.log(data.toString('utf-8'))
            console.log(data.toString())
            data.toString('utf-8') == 'False' ? isExecuted=false : true

            
            if (!isExecuted){
              console.log("launch logstash")
              console.log(logstash_dir)
              logstash_process = spawn('python',[script_win, '1', logstash_dir, configName]);
              
              controller_logstash()
            }
          })
        }

      })
      
    }
    //Looking for autoPairing app 
    else{
      logstash_dir = execSync("find ~ -name 'autoPairing'", (err, stdout, stderr) => {
        if (err)
          console.log(err)
        console.log("stdout ",stdout)
        console.log("stdout ",stderr)
      }).toString('utf-8').replace(/\n/g, '')
      isExecutedCmd = 'ps -aux | grep logstash'
      event.reply('lookingForLogstash', 'Logstash found')

      codeDirName = "code_linux"
      configName = "logstash-config-linux.conf"
      codeDir = logstash_dir+"/bash_code/"+codeDirName

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
        logstash_process = spawn('sh', [logstash_dir+"/logstash-7.6.0/bin/logstash", "-f", logstash_dir+"/config/"+configName, "-w", 1])
        controller_logstash()
      }
    }
    if (logstash_dir == "") throw new Error("logstash not found")

  }
  catch(err)
  {
    console.log("logstashSynchronize : ",err)
    throw Error(err)
  }
}

function controller_logstash(){
  logstash_process.on('close', (code,signal) => {
    console.log('child killed ',code, signal)
  })
  logstash_process.stdout.on('data', (data) => {
    console.log(data.toString())
  })
  logstash_process.stderr.on('data', (data) => {
    console.log(data.toString())
  })
}

function continue_sync_files(files,event, directory){
    if (process.platform != 'win32' && process.platform != 'win64')
      files = files[0].toString().split('\n').filter((elem) => elem!='')
    let sizeFiles = files.length
    
    //Reply to the server the size & the different box name
    event.reply('syncFiles', sizeFiles)
    files.forEach((elem) => { event.reply('syncFiles', elem)})
    
    //Exec code to extract log files from zip & send them to the logsDir
    if (process.platform=="win32" || process.platform=="win64")
    {
      const executeCode = spawn('python',[script_win, '5', directory ]);
      executeCode.stdout.on('data', (data) => {
        console.log('data')
      })
    }
    else
      execSync(codeDir+" "+directory)


  
    //Starting treating files
    _useWorkerTreatFiles(files, directory, event)
}

//------------------------------------------------//

//----------------- CONTROLLERS ------------------//
//------------------------------------------------//


//Looking for logstash on your computer
ipcMain.on('lookingForLogstash', (event) => {
  let message
  try{
    logstashSynchronize(event)
    
  }catch(err){
    event.reply('lookingForLogstash', 'Logstash not found')
    console.log('lookingForLogstash : ', err)
  }

})

//Zip files part
ipcMain.on('syncFiles', (event) => {

  //Select zip files' directory
  let directory
  let sizeFiles 
  let files = []
  let continueProcess = true

  let resultDialog = dialog.showOpenDialogSync(win, {
    properties: ["openDirectory"]
  })
  //Check if a directory has been selected
  if (resultDialog == null || resultDialog == ''){
    event.reply('syncFiles', 'No directory selected')
    continueProcess = false
  }

  if (continueProcess)
  {
    //Set the directory selected
    directory = resultDialog[0]
    console.log(directory)
    try{
      if(process.platform === "win32" || process.platform === "win64")
      {
        console.log("Get zip files")
        const getZipFiles = spawn('python',[script_win, '3', directory]);
        getZipFiles.stdout.on('data', (data) => {
          files = data.toString().match(/CONTI_[0-9]*_[0-9]*_LOG.tar.gz/g)
          try{
            if (files == null || files.length == 0)
              throw Error('No zip files found')

            else
            continue_sync_files(files,event,directory)
          }catch(err){console.log(err)
            event.reply('syncFiles', 'No zip files found')}
          

        })

      }
      else{
        files.push(execSync("find "+directory+" -name '*.tar.gz' | grep 'CONTI.*_LOG.tar.gz'", (err, stdout, stderr) => {
          if (err)
            console.log(err)
          files += stdout
          console.log("stdout ",stdout)
          console.log("stdout ",stderr)
        }).toString('utf-8'))
        files.forEach((item) => {item = item.match(/(\/[^/]*)$/g).replace(/\//g, '')})
        if (continueProcess)
         continue_sync_files(files,event,directory)
      } 
    }catch(err){
      continueProcess = false
      console.log(err)
      event.reply('syncFiles', 'No zip files found')
    }
  }
})



//LOCAL LOG FILE EVENT
ipcMain.on('openDialogLocal', (event) => {
  let cmd
  let continueProcess = true
  let file
  let filename
  //Finding autoPairing app
  let resultDialog = dialog.showOpenDialogSync(win, {
    properties: ["openFile"], filters : [
        {name : "log", extensions: ['log']}
      ]
  })
  if (resultDialog == undefined){
    event.reply('openDialogLocal', 'No file selected')
    continueProcess=false
  }
  if (continueProcess){
    let resProcess
    let reg 
    
    file = resultDialog[0]
    console.log(file)
    const log_name_dir =  file.split('/').join('_')+'-folder'
    console.log(file.match(/(\\[^\\]*)$/g))
    if (process.platform == "win32" || process.platform == "win64")
      filename = file.match(/(\\[^\\]*)$/g)[0]
    else
      filename = file.match(/(\/[^/]*)$/g)[0]
    if (filename != '/ModemD_00000000.log' && filename != '\\ModemD_00000000.log')
    {
      event.reply('openDialogLocal', 'Bad file')
    }else{
      filename = '/ModemD_00000000.log'
      let cmd1
      let cmd2
      if (process.platform == "win32" || process.platform=="win64"){
        cmd1 = "python "+script_win+" 6 "+logsDir+'/log_modemD_'+log_name_dir.replace(/[\\:]/g,'-')+" "+logsDir+"/status.log"
        cmd2 = "python "+script_win+" 7 "+logsDir+'/log_modemD_'+log_name_dir.replace(/[\\:]/g,'-')+" "+logsDir+"/result.log "
      }
      else {
        cmd1 = "grep '"+logsDir+'/log_modemD_'+log_name_dir+filename+"' "+logsDir+"/status.log | grep 'Done'"
        cmd2 = "grep '"+logsDir+'/log_modemD_'+log_name_dir+filename+"' "+logsDir+"/result.log"
      }
      console.log(cmd1)
      console.log(cmd2)

      try{
        resProcess = execSync(cmd1, (err, stdout, stderr) => {
          if (err)
              console.log(err)
            console.log("stdout ",stdout)
            console.log("stdout ",stderr)
        }).toString('utf-8')
        console.log(resProcess.match(/False/g))
        console.log(resProcess)
        if (process.platform == "win32" || process.platform == "win64")
          resProcess.match(/False/g) != null ? resProcess=false : resProcess=true
        console.log(resProcess)
        
        if (resProcess){
          continueProcess = false
          console.log("result exists")
          getResult(cmd2, event)

        }
      }catch(err){
        console.log(err)
      }
      if (continueProcess){
        const timestamp = Date.now()
        console.log('mkdir '+logsDir.replace(/\//g,'\\')+'\\log_modemD_'+log_name_dir.replace(/[\\:]/g,'-'))
        exec('mkdir '+logsDir.replace(/\//g,'\\')+'\\log_modemD_'+log_name_dir.replace(/[\\:]/g,'-'))
        if (process.platform == "win32" || process.platform == "win64")
          exec('xcopy '+file+' '+logsDir.replace(/\//g,'\\')+'\\log_modemD_'+log_name_dir.replace(/[\\:]/g,'-'))
        else
          exec('cp '+file+' '+logsDir+'/log_modemD_'+log_name_dir)

        console.log('cmd2 ', cmd2)
        setInterval(() => {
          if (getResult(cmd2, event))
            clearInterval(process)
      }, 3000);

      }
    }
  }
})

function getResult(cmd, event){
  try {
    console.log("get result")
    let resProcess = execSync(cmd, (err, stdout, stderr) => {
      if (err)
          console.log(err)
        console.log("stdout ",stdout)
        console.log("stdout ",stderr)
    }).toString('utf-8')
    console.log("after process")
    console.log(resProcess)
    if (resProcess != '' && resProcess != 'False\r\n' && resProcess != 'False')
    {
      if (process.platform != "win32" && process.platform != "win64"){
        let reg = /log - (.*)/g
        resProcess = reg.exec(resProcess)[1]

      }
      console.log(resProcess)
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
// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
    try{
      console.log('Window closed')
      if (!isExecuted)
        logstash_process.kill('SIGKILL')
      
    }catch(err){
      console.log("Logstash is not running OK")
    }
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    // try {
    //   await installVueDevtools()
    // } catch (e) {
    //   console.error('Vue Devtools failed to install:', e.toString())
    // }

  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
        try
        {
          logstash_process.kill("8092")

        }catch(err){console.log('None logstash program to kill')}

      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
      try{
        logstash_process.kill("SIGKILL")
      }catch(err){console.log('None logstash program to kill')}

    })
  }
}
