//Electron import
const app = require('electron').app
const protocol = require('electron').protocol
const BrowserWindow = require('electron').BrowserWindow
const dialog = require('electron').dialog
const ipcMain = require('electron').ipcMain

import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'

const isDevelopment = process.env.NODE_ENV !== 'production'

//General import
const {sendFilesToLogstash, _useWorkerTreatFiles, getZipFilesLin, getZipFilesWin}= require('./utils/js/multipleFiles')
const global = require('./modules/global_vars')
const {synchronize_with_logstash} = require('./utils/js/synchronyseWithLogstash.js')
const {sendFileToLogstash} = require('./utils/js/singleFile')

//Window
let win

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{scheme: 'app', privileges: { secure: true, standard: true } }])

//------------------------------------------------//
//----------------- Init Window ------------------//
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
  {
    global.logsDir = "C:/logs_modem_files"
    global.os = "win"
  }
  else {
    global.logsDir = "/tmp/logs_modem_files"
    global.os = "linux"
  }

  // Window controller on close
  win.on('closed', () => {
    win = null
    try{
      if (global.os == "win")
        process.kill(global.logstash_process,"8092")
      else
        process.kill(global.logstash_process,"SIGKILL")
    }
    catch(err){console.log("Logstash not launched")}
  })

}


//------------------------------------------------//
//----------------- CONTROLLERS ------------------//
//------------------------------------------------//


//Looking for logstash on your computer
ipcMain.on('lookingForLogstash', (event) => {
  try{
    synchronize_with_logstash(event)
  }catch(err){
    event.reply('lookingForLogstash', 'Logstash not found')
    console.log('lookingForLogstash : ', err)
  }
})

//Zip files part
ipcMain.on('multipleFiles', (event) => {
  //Select zip files' directory
  const resultDialog = dialog.showOpenDialogSync(win, {properties: ["openDirectory"]})

  //Check if a directory has been selected
  if (resultDialog == null || resultDialog == '')
    return event.reply('multipleFiles', 'No directory selected')

  //Set the directory selected
  const directory = resultDialog[0]

  //Send directory selected to vue
  event.reply('multipleFilesResult', ['dir_zip', directory])
  let files
  try{
    if(global.os === "win")
      files = getZipFilesWin(directory)
    else
      files = getZipFilesLin(directory)
  }catch(err){
    return event.reply('multipleFiles', 'No zip files found')
  }
  // Clear data
  if (global.os === "win")
    files = files[0].toString().split('\n').filter((elem) => elem!='')
  const sizeFiles = files.length
  
  //Reply to the server the size & the different box name
  event.reply('multipleFiles', sizeFiles)
  files.forEach((item) => {event.reply('multipleFiles', item)})
  
  // Send files to logstash's folder
  sendFilesToLogstash(directory)

  // Treat files async with workers
  _useWorkerTreatFiles(files,directory, event)
    
  
})






//LOCAL LOG FILE EVENT
ipcMain.on('openDialogLocal', async(event) => {
  //Finding autoPairing app
  let resultDialog = dialog.showOpenDialogSync(win, {
    properties: ["openFile"], filters : [
        {name : "log", extensions: ['log']}
      ]
  })

  if (resultDialog == undefined)
    return event.reply('openDialogLocal', 'No file selected')

  const file = resultDialog[0]
  global.log_name_dir = file.split('/').join('_')+'-folder'

  try{
    sendFileToLogstash(file, event)
  }catch(e){
    console.log(e)

    return event.reply('openDialogLocal', 'Bad file')
  }
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
        global.logstash_process.kill('SIGKILL')
      
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
  if (global.os === 'win') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
        try
        {
          process.kill(global.logstash_process,"8092")

        }catch(err){console.log('None logstash program to kill')}

      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
      try{
        process.kill(global.logstash_process,"SIGKILL")
      }catch(err){console.log('None logstash program to kill')}

    })
  }
}
