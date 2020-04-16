const { parentPort } = require('worker_threads')
const { execSync } = require('child_process')

const ResStatusEmun = Object.freeze({"In progress": 1, "Done": 2})
let script_win
let platform

parentPort.on('message', (task) => {
    script_win = task.script_win
    platform = task.platformUsed
    
    let filename
    task.file === undefined ? filename = task.filename : filename = task.file

    process = setInterval(async() => {
        const resStatus = await checkStatus(filename, task.logsDir, task.logstash_dir)
        if (resStatus == 1)
            console.log("In progress")
        if (resStatus==2) 
        {
            getResult(filename,task.logsDir)
            clearInterval(process)
        }
        console.log("Wait 6s ..")
    }, 6000);
    
})

const checkStatus = async(filename,logsDir) => {
    let cmd
    if (platform == "win")
        cmd = "python "+script_win+" 6 "+logsDir+"/"+filename+" "+logsDir+"/status.log"
    else
        cmd = "grep "+logsDir+filename+" "+logsDir+"/status.log | grep 'Done'"

    const res = await execSync(cmd).toString()
    if (res === '')
        return ResStatusEmun['In progress']
    return ResStatusEmun['Done']
    
}


const getResult = async(filename,logsDir) => {
    let cmd
    if (platform == "win32" || platform == "win64")
        cmd = "python "+script_win+" 7 "+logsDir+"/"+filename+" "+logsDir+"/result.log "
    else
        cmd = "grep "+logsDir+filename+" "+logsDir+"/result.log "
    
    const res = await execSync(cmd).toString()
    
    // Clear data
    if (platform != "win")
        res = reg.exec(/log - (.*)/g)[1]
    
    parentPort.postMessage(res)
}   