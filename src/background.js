'use strict'

import { app, protocol, BrowserWindow, dialog, ipcMain } from 'electron'
import {
  createProtocol,
  /* installVueDevtools */
} from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'
const shell = require('shelljs')
const shellExec = require('shell-exec')
const {Worker} = require('worker_threads')
const { exec } = require('child_process')


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win


var logstash_dir;
var logsDir;


//const logstash_dir = "C:/Utilisateurs/A766646/Desktop/autoPairing"
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{scheme: 'app', privileges: { secure: true, standard: true } }])

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ width: 800, height: 600, webPreferences: {
    nodeIntegration: true
  } })
  console.log('Seeking for logstash')
  logstashSynchronize().then(console.log)
  console.log('logstash found')

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  if (process.platform === "win32" || process.platform === "win64")
    logsDir = "C:/users"
  else 
    logsDir = "/var"

  win.on('closed', () => {
    win = null
  })

}

//LOCAL LOG FILE EVENT
ipcMain.on('openDialogLocal', (event) => {
  try
  {
    logstash_dir = shell.find('~').filter(function(folder) { return folder.match(/autoPairing$/); });
    if (logstash_dir == "") throw new Error("Application not found")
  }catch(err)
  {
    event.reply('openDialogLocal', err.message)
    return;
  }


  dialog.showOpenDialog(win, {
    properties: ["openFile"], filters : [
        {name : "log", extensions: ['log']}
      ]
  }).then(result =>{
    if (result.filePaths == '') throw Error("Error : No file selected")

    const file = result.filePaths[0]
    const filename = file.match(/(\/[^/]*)$/g)
    logsDir +="/logs_modem_files"
    var count = 0
    var res = ''

    shell.mkdir(logsDir)
    shell.cp(file, logsDir)

    while (count < 10 && (res == '' || res == '\n'))
    {
      res = shell.grep(logsDir+filename,logstash_dir+"/result.log")
      count ++
      if (res == '\n' || res == '') setTimeout(() => console.log("File not found, retry in 1s, launched "+count+" time(s)"),20)
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

function _useWorkerTreatFiles(files){
  var result = {}
  files.forEach((file) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData:[file], argv : [result]
      });
      worker.on('online', () => {
        const filename = file.match(/(\/[^/]*)$/g)
        var count = 0
        var res = ''

        while (count < 10 && (res == '' || res == '\n'))
        {
          res = shell.grep(logsDir+filename,logstash_dir+"/result.log")
          count ++
          if (res == '\n' || res == '') setTimeout(() => console.log("File not found, retry in 1s, launched "+count+" time(s)"),20)
        }

        if (count == 10) throw Error("Error : No result found")
        
        if (res != '')
        {
          let reg = /log - (.*)/g
          res = reg.exec(res)[1]
        }
        result.file = res
      })
      worker.on('message', messageFromWorker => {
        console.log(messageFromWorker)
        return resolve
      })
      worker.on('error', reject)
      worker.on('exit', code => {
        if (code !== 0){
          reject(new Error('Worker stopped with exit code ${code}'))
        }
      })
    })


  })
}

async function logstashSynchronize(){
  try
  {
    logstash_dir = 
    logstash_dir = shell.find('~').filter(function(folder) { return folder.match(/autoPairing$/); });
    if (logstash_dir == "") throw new Error("Error : logstash not found")
  }catch(err)
  {
    console.log(err)
  }
}

//LOCAL ZIP FILES EVENT
ipcMain.on('openDialogLocalZip', (event) => {
  //Finding where is autoPairing
  if (logstash_dir == '')
    logstashSynchronize()
    if (logstash_dir == '') {event.reply('openDialogLocalZip', 'Error : logstash not found'); return}

  //Select zip logs' directory
  dialog.showOpenDialog(win, {
    properties: ["openDirectory"]
  }).then(result =>{
    if (result.filePaths == '') throw Error("Error : No directory selected")

    const directory = result.filePaths[0]
    const files = shell.find(directory).filter(function(folder) { return folder.match(/.*.tar.gz/g); });
    console.log('Directory : '+directory)
    console.log('Files : '+files)
    console.log('Logstash dir : '+logstash_dir)
    //Copy code to logstah logs' directory
    if (process.platform === "win32" || process.platform === "win64")
    {
      exec(logstash_dir+"/bash_code/code_windows "+directory, (err, stdout, stderr) => {
        if (err)
          console.log(err)
        else{
          console.log('stdout : '+stdout)
          console.log('stderr : '+stderr)

        }
      })
      //shellExec(logstash_dir+"/bash_code/code_windows", directory).then(console.log).catch(console.log)
    }
    else
    {
      exec(logstash_dir+"/bash_code/code_linux "+directory, (err, stdout, stderr) => {
        if (err)
          console.log(err)
        else{
          console.log('stdout : '+stdout)
          console.log('stderr : '+stderr)

        }
      })
      //shellExec(logstash_dir+"/bash_code/code_linux", directory).then(console.log).catch(console.log)
    }

    //Asynchronously dispatch the work between several thread in order to treat and check result for each log
    var workerResult = []
    workerResult = _useWorkerTreatFiles(files)
    console.log(workerResult)

    //Write result in csv file
    const createCsvWrite = require('csv-writer').createArrayCsvWriter
    shell.touch('~/Desktop/result.csv')
    const csvWriter = createCsvWrite({
      path: directory+'/result.csv',
      header : ["FILE", "RESULT"]
    })
    var records = [] 
    let msg = ""
    console.log(workerResult)
    if (workerResult.length == 0)
    {
      records.push(['',''])
      console.log(records)
      msg = "No results found - check out if your logstash actually working"
    } 
    else{
      msg = "Results in : "+directory
      console.log(records)
  
      csvWriter.writeRecords(records).then(() => {
        console.log('CSV Writer : done')
      }).catch(err => {
        console.log(err)
        throw new Error(err)
      })
    } 
    
    
    event.reply('openDialogLocalZip', msg)
  }).catch(err => {
    console.log(err)
    event.reply('openDialogLocalZip', err.message)
  })
})

//M2M EVENT
ipcMain.on('openDialogM2M', (event) => {
  dialog.showOpenDialog(win, {
    properties: ["openFile"], filters : [
        {name : "csv", extensions: ['csv']}
      ]
  }).then(result =>{
    event.reply('openDialogM2M', result.filePaths)
  }).catch(err => {
    console.log(err)
  })
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
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
