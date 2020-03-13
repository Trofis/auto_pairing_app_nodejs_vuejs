const { parentPort } = require('worker_threads')
const { execSync } = require('child_process')

const ResStatusEmun = Object.freeze({"In progress": 1, "Done": 2})
var res 

parentPort.on('message', (task) => {
    const filename = task.file.match(/(\/[^/]*)$/g)
    let resStatus
    getResult(filename,task.logsDir, task.logstash_dir, task.file)
    if (res == null || res == ''){
        process = setInterval(() => {
            resStatus = checkStatus(filename, task.logsDir, task.logstash_dir)
            if (resStatus == 1)
                console.log("In progress")
            if (resStatus==2) 
            {
                getResult(filename,task.logsDir, task.logstash_dir, task.file)
                clearInterval(process)
            }
            console.log("Wait 3s ..")
        }, 3000);
    }
    
})

function checkStatus(filename,logsDir, logstash_dir){
    const cmd2 = "grep "+logsDir+filename+" "+logsDir+"/status.log | grep 'Done'"
    let res2
    try{
        res2 = execSync(cmd2, (err, stdout, stderr) => {
            if (err)
              console.log(err)
            console.log("stdout ",stdout)
            console.log("stdout ",stderr)
          }).toString('utf-8')
    }catch(err){
        console.log(err)
        return ResStatusEmun['In progress']
    }
    console.log(res2)
    if (res2 === '')
        return ResStatusEmun['In progress']
    return ResStatusEmun['Done']
}


function getResult(filename,logsDir, logstash_dir, file){
    //Looking for the file's result 
    const cmd = "grep "+logsDir+filename+" "+logsDir+"/result.log "
    try{
        res = execSync(cmd, (err, stdout, stderr) => {
            if (err)
                console.log(err)
            console.log("stdout ",stdout)
            console.log("stdout ",stderr)
            }).toString('utf-8')
    }catch(err){
        console.log(err)
    }
    
    
    //If count equals to 10 then no result found
    //if (count == 10) throw Error("Error : No result found")
    
    //If result contains something then extract the file's result
    console.log("res ", res)
    try{
        let reg = /log - (.*)/g
        res = reg.exec(res)[1]
        parentPort.postMessage(res)
    }catch(err){
        console.log("1st check : not found in result log")
        res = null
    }

}   