//Electron import
const app = require('electron').app
const protocol = require('electron').protocol
const BrowserWindow = require('electron').BrowserWindow
const dialog = require('electron').dialog
const ipcMain = require('electron').ipcMain

//const createProtocol = require('vue-cli-plugin-electron-builder/lib')
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'

const isDevelopment = process.env.NODE_ENV !== 'production'
console.log(process.cwd())
//General import
const execSync = require('child_process').execSync
const exec = require('child_process').exec
const spawn = require('child_process').spawn
const process_zip_files = require('./scripts_js/GetResultZipFiles.js')
const loc = require('./modules/locations')
const global = require('./modules/global_vars')
const logstashSynchronize = require('./scripts_js/LogstashSynchronize.js')
const getResultLocal = require('./scripts_js/GetResultLocal.js')
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
    global.logsDir = "C:/logs_modem_files"
  else 
    global.logsDir = "/tmp/logs_modem_files"

  win.on('closed', () => {
    win = null
    try{
      global.logstash_process.kill("SIGKILL")
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
    logstashSynchronize(event)
  }catch(err){
    event.reply('lookingForLogstash', 'Logstash not found')
    console.log('lookingForLogstash : ', err)
  }
})

//Zip files part
ipcMain.on('syncFiles', (event) => {

  //Select zip files' directory
  let files = []
  let directory
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

    //Send directory selected to vue
    event.reply('syncFilesResult', ['dir_zip', directory])

    try{
      if(process.platform === "win32" || process.platform === "win64")
      {
        console.log("Get zip files")
        console.log(loc.script_windows)

        const getZipFiles = spawn('python',[loc.script_windows, '3', directory]);
        getZipFiles.stdout.on('data', (data) => {
          files = data.toString().match(/CONTI_[0-9]*_[0-9]*_LOG.tar.gz/g)
          try{
            if (files == null || files.length == 0)
              throw Error('No zip files found')
            else{
              console.log('call process zip files')
              process_zip_files(files,event, directory)

            }
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
        files.forEach((item) => {item = (item.match(/(\/[^/]*)$/g)).toString().replace(/\/|\\n/g, '')})
        console.log(files)

        if (continueProcess)
          process_zip_files(files,event, directory)
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
    global.log_name_dir =  file.split('/').join('_')+'-folder'
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
        cmd1 = "python "+loc.script_windows+" 6 "+global.logsDir+'/log_modemD_'+log_name_dir.replace(/[\\:]/g,'-')+" "+global.logsDir+"/status.log"
        cmd2 = "python "+loc.script_windows+" 7 "+global.logsDir+'/log_modemD_'+log_name_dir.replace(/[\\:]/g,'-')+" "+global.logsDir+"/result.log "
      }
      else {
        cmd1 = "grep '"+global.logsDir+'/log_modemD_'+global.log_name_dir+filename+"' "+global.logsDir+"/status.log | grep 'Done'"
        cmd2 = "grep '"+global.logsDir+'/log_modemD_'+global.log_name_dir+filename+"' "+global.logsDir+"/result.log"
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
          getResultLocal(cmd2, event)

        }
      }catch(err){
        console.log(err)
      }
      if (continueProcess){
        const timestamp = Date.now()
        console.log('mkdir '+global.logsDir.replace(/\//g,'\\')+'\\log_modemD_'+global.log_name_dir.replace(/[\\:]/g,'-'))
        if (process.platform == "win32" || process.platform == "win64"){
          exec('mkdir '+global.logsDir.replace(/\//g,'\\')+'\\log_modemD_'+global.log_name_dir.replace(/[\\:]/g,'-'))

          exec('xcopy '+file+' '+global.logsDir.replace(/\//g,'\\')+'\\log_modemD_'+global.log_name_dir.replace(/[\\:]/g,'-'))
        }
        else{
          exec('mkdir '+global.logsDir+'/log_modemD_'+global.log_name_dir)

          exec('cp '+file+' '+global.logsDir+'/log_modemD_'+global.log_name_dir)
        }

        console.log('cmd2 ', cmd2)
        setInterval(() => {
          if (getResultLocal(cmd2, event))
            clearInterval(process)
      }, 3000);

      }
    }
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
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
        try
        {
          global.logstash_process.kill("8092")

        }catch(err){console.log('None logstash program to kill')}

      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
      try{
        global.logstash_process.kill("SIGKILL")
      }catch(err){console.log('None logstash program to kill')}

    })
  }
}
