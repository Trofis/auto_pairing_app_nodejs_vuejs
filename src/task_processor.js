const { parentPort } = require('worker_threads')
const { execSync } = require('child_process')

const ResStatusEmun = Object.freeze({"In progress": 1, "Done": 2})
var process
parentPort.on('message', (task) => {
    const filename = task.file.match(/(\/[^/]*)$/g)
    let resStatus
    process = setInterval(() => {
        resStatus = checkStatus(filename, task.logsDir, task.logstash_dir)
        /*if (resStatus == 1)
            stopProcessFail()*/
        if (resStatus == 1)
            console.log("In progress")
        if (resStatus==2) 
            stopProcessSuccess(filename, task.logsDir, task.logstash_dir, task.file)
        console.log("Wait 3s ..")
    }, 3000);
})

function stopProcessSuccess(filename,logsDir, logstash_dir, file){
    clearInterval(process)
    getResult(filename,logsDir, logstash_dir, file)
}
/*
function stopProcessFail(){
    clearInterval(process)
    parentPort.postMessage('Logstash not functional')

}*/

function checkStatus(filename,logsDir, logstash_dir){
    /*const cmd1 = "grep "+logsDir+filename+" "+logstash_dir+"/status.log | grep 'In progress'"
    let res1
    try{
        res1 = execSync(cmd1, (err, stdout, stderr) => {
            if (err)
              console.log(err)
            console.log("stdout ",stdout)
            console.log("stdout ",stderr)
          }).toString('utf-8')
    }catch(err){
        console.log(err)
        return ResStatusEmun['Not found']
    }
    if (res1 == '')
        return ResStatusEmun['Not found']*/
    const cmd2 = "grep "+logsDir+filename+" "+logstash_dir+"/status.log | grep 'Done'"
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
    let res
    //Looking for the file's result 
    const cmd = "grep "+logsDir+filename+" "+logstash_dir+"/result.log "
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
    
    console.log('result status for '+file+" : "+res)
    
    //If count equals to 10 then no result found
    //if (count == 10) throw Error("Error : No result found")
    
    //If result contains something then extract the file's result
    if (res != '')
    {
        let reg = /log - (.*)/g
        res = reg.exec(res)[1]
    }else{
        res = "not found in result log"
    }

    parentPort.postMessage(res)
}