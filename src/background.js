const app = require('electron').app
const protocol = require('electron').protocol
const BrowserWindow = require('electron').BrowserWindow
const dialog = require('electron').dialog
const ipcMain = require('electron').ipcMain

const createProtocol = require('vue-cli-plugin-electron-builder/lib')

//import { resolve } from 'dns'
//const spawn = require('child_process').spawnSync
const isDevelopment = process.env.NODE_ENV !== 'production'
//const shell = require('shelljs')
const os = require('os')
const WorkerPool = require('./model')
const execSync = require('child_process').execSync
const exec = require('child_process').exec
const spawn = require('child_process').spawn
//const shellExec = require('shell-exec')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
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
    logsDir = "C:/users/logs_modem_files"
  else 
    logsDir = "/var/logs_modem_files"

  win.on('closed', () => {
    win = null
  })

}

 
function _useWorkerTreatFiles(files, directory, event){
  // Init lets
  let result = []
  let msg = ""
  let i = 0
  console.log("Use worker")
  const pool = new WorkerPool(os.cpus().length)
  console.log(pool)

  // Launch worker for each file
  files.forEach((file) => {
    console.log(file)
    pool.runTask({file, logsDir, logstash_dir}, (err, res) => {
      console.log("Run thread for : "+file)
      if (err)
      {
        console.log(err)
        const itemError = [file, err]
        event.reply('syncFilesResult', itemError)
        return;
      }
      const item = [file, res]
      console.log("Item pushed : ",file, res)
      event.reply('syncFilesResult', item)
      result.push(item)
      // If all files treated then write down all the results in result.log
      if (++i === files.length)
      {
        // Close pool workers
        pool.close()
        console.log("pool closed")
        // Init csv's lets for writing
        const createCsvWrite = require('csv-writer').createArrayCsvWriter
        const timestamp = new Date().getTime().toString()
        const csvWriter = createCsvWrite({
          path: directory+'/'+timestamp+'result.csv',
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
    })
  })


}

function logstashSynchronize(){
  try
  {
    //logstash_dir = shell.find('~').filter(function(folder) { return folder.match(/autoPairing$/); });
    logstash_dir = execSync("find ~ -name 'autoPairing'", (err, stdout, stderr) => {
      if (err)
        console.log(err)
      console.log("stdout ",stdout)
      console.log("stdout ",stderr)
    }).toString('utf-8').replace(/\n/g, '')
    console.log("logstash_dir ",logstash_dir)
    if (logstash_dir == "") throw new Error("Error : logstash not found")

    if (process.platform === "win32" || process.platform === "win64")
    {
      codeDirName = "code_windows"
      configName = "logstash-config-windows.conf"
    }
    else{
      codeDirName = "code_linux"
      configName = "logstash-config-linux.conf"
    } 
    isExecuted = execSync("ps -aux | grep "+logstash_dir+"/logstash-7.6.0/bin/logstash", (err, stdout, stderr) => {
      if (err)
        console.log(err)
      console.log("stdout ",stdout)
      console.log("stdout ",stderr)
    }).toString('utf-8').replace(/\n/g, '').match(/grep/g).length > 2
    console.log(isExecuted)
    codeDir = logstash_dir+"/bash_code/"+codeDirName
    if (!isExecuted){
      const cmdLogst = logstash_dir+"/logstash-7.6.0/bin/logstash -f "+logstash_dir+"/config/"+configName+" -w 1"
      logstash_process = spawn('sh', [logstash_dir+"/logstash-7.6.0/bin/logstash", "-f", logstash_dir+"/config/"+configName, "-w", 1])
      logstash_process.on('close', (code,signal) => {
        console.log('child killed ',code, signal)
      })
    }
    
    //exec('sh '+logstash_dir+"/logstash-7.6.0/bin/logstash -f "+logstash_dir+"/config/"+configName+" -w 1")
    

  }catch(err)
  {
    console.log("logstash synchronize : ",err)
    throw Error(err)
  }
}

//------------------------------------------------//
//----------------- CONTROLLERS ------------------//
//------------------------------------------------//


//Looking for logstash on your computer
ipcMain.on('lookingForLogstash', (event) => {
  console.log('Seeking for logstash')
  try{

    logstashSynchronize()
    event.reply('lookingForLogstash', 'Logstash found')
  }catch(err){
    event.reply('lookingForLogstash', 'Logstash not found')
    console.log('logstash not found')
  }
  
})

//Zip files part
ipcMain.on('syncFiles', (event) => {

  //Select zip files' directory
  let directory
  let result = dialog.showOpenDialogSync(win, {
    properties: ["openDirectory"]
  })
  try{
    console.log(result)
    console.log(result == null)

    if (result == null || result.filePaths == '') throw Error("Error : No directory selected")

  }catch(err) { event.reply('syncFiles', 'Error : No directory selected'), console.log(err); return;}

  console.log(result)
  directory = result[0]

  let files = []
  //let findFiles = spawn('find', [directory, '*.tar.gz'], ['-name'])
  //files = findFiles.stdout.toString()
  files.push(execSync("find "+directory+" -name '*.tar.gz' | grep 'CONTI.*_LOG.tar.gz'", (err, stdout, stderr) => {
    if (err)
      console.log(err)
    files += stdout
    console.log("stdout ",stdout)
    console.log("stdout ",stderr)
  }).toString('utf-8'))

  files = files[0].toString().split('\n').filter((elem) => elem!='')
  let size = files.length
  
  //Reply to the server the size & the different box name
  event.reply('syncFiles', size)
  files.forEach((elem) => { event.reply('syncFiles', elem)})

  //Exec code to extract log files from zip & send them to the logsDir
  console.log("sh "+codeDir+" "+directory)
  execSync("sh "+codeDir+" "+directory)

  //Starting treating files
  _useWorkerTreatFiles(files, directory, event)
})



//LOCAL LOG FILE EVENT
ipcMain.on('openDialogLocal', (event) => {
  //Finding autoPairing app
  dialog.showOpenDialog(win, {
    properties: ["openFile"], filters : [
        {name : "log", extensions: ['log']}
      ]
  }).then(result =>{
    if (result.filePaths == '') throw Error("Error : No file selected")

    try{
      const file = result.filePaths[0]
    }catch(err){
      throw Error("Error : No file selected")
    }
    const filename = file.match(/(\/[^/]*)$/g)
    let count = 0
    let res = ''

    exec("mkdir "+logsDir)
    exec('cp '+file+' '+logsDir)

    //Old version using shelljs (too slow)
    //shell.mkdir(logsDir)
    //shell.cp(file, logsDir)
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
    while (count < 10 && (res == '' || res == '\n'))
    {
      const cmd = "grep '"+logsDir+filename+"' "+logstash_dir+"/result.log"
      console.log("cmd ",cmd)
      //if (!found) setTimeout(() => console.log("retry in 1s, launched "+count+" time(s)"),1000)
      sleep(1000).then(() => {
        
        try{
          res = execSync(cmd, (err, stdout, stderr) => {
            if (err)
              console.log(err)
            console.log("stdout ",stdout)
            console.log("stdout ",stderr)
          }).toString('utf-8')
          console.log("res ",res)
        }catch(err)
        {
          console.log("File not found")
        }
        
        //res = shell.grep(logsDir+filename,logstash_dir+"/result.log")
        
      })
      count ++
      console.log(count)
    }

    if (count == 10) throw Error("Error : No result found")
    
    if (res != '')
    {
      let reg = /log - (.*)/g
      res = reg.exec(res)[1]
    }
    event.reply('openDialogLocal', res)
  }).catch(err => {
    console.log(err)
    event.reply('openDialogLocal', err.message)
  })
})


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
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
