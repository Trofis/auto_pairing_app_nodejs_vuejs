<template>
    <div class="d-flex align-center justify-center fill-height fluid">
      <div class="flex-column">
        <v-row>
          <v-col class="fluid" md="auto"> 
            <p class="mt-1">Local - log file: </p>
          </v-col>
          <v-col class="d-flex justify-end">
            <v-btn rounded color="primary" vdark @click="openDialogLocal"> Select log</v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-col class="fluid" md="auto"> 
            <p class="mt-1">Local - zip files: </p>
          </v-col>
          <v-col class="d-flex justify-end">
            <v-btn rounded color="primary" @click="syncFiles"> Select directory</v-btn>
          </v-col>
        </v-row>
      </div>
      <v-overlay :value="overlay">
        <v-progress-circular indeterminate size="64">{{actualSize}}</v-progress-circular>
      </v-overlay>
      <v-bottom-sheet v-model="sheet">
        <v-sheet v-if="message == 'files'" class="text-center" height="50%" >
            <v-data-table
              :headers="headers"
              :items="files"
              :items-per-page="5"
              class="elevation-1"
            >
              
                <template v-slot:item.result='{item}'>
                  <v-skeleton-loader
                    :loading="loading[files.indexOf(item)]"
                    class='d-flex align-center'
                    height="100%"
                    type="text"
                  >
                    <v-ship dark> {{item.result}}</v-ship>
                  </v-skeleton-loader>

                </template>
              

            </v-data-table>
        </v-sheet>
        <v-sheet v-else-if="message != ''" class="text-center" height="200px" >
            <v-btn
                class="mt-6"
                flat
                color="color"
                @click="sheet = !sheet"
            >
                Close
            </v-btn>
            <div class="py-3">{{message}}</div>
        </v-sheet>
        <v-sheet v-else class="text-center" height="100px" >
            <div class="py-3">{{messageload}}</div>
            <v-progress-circular
              indeterminate
              rotate= "180"
              size= "100"
              color = "primary"
              class="mt-2"
            >
            
            </v-progress-circular>
        </v-sheet>
    </v-bottom-sheet>
    </div>
    
  
    
</template>

<script>
const {ipcRenderer} = require('electron')
export default {
  name: 'Home',
  data: () => ({
    sheet : false,
    headers : [
      { text : 'Files', align:"start", sortable:false, value:'file'},
      { text : 'Result', value:'result'},
    ],
    message : '',
    messageload : "",
    color: "error",
    size: 0,
    loading:[],
    actualSize:0,
    valueCircular:0,
    files: [],
    overlay:false,
  }),
  watch:{
    actualSize (val)  {
      console.log("update")
      if (val == this.size)
      {
        this.message = 'files'
        this.sheet = true
        this.overlay=false
      }
    }
  },
  methods: {
    syncFiles(){
      ipcRenderer.send("syncFiles")
      this.files = []
      this.actualSize = 0
      this.valueCircular=0
      console.log("sync files")
      
    },
    openDialogLocal(){
      this.color = "error"
      this.message = ''
      ipcRenderer.send("openDialogLocal")
      this.sheet = true
      
    }
  },
  beforeMount() {
    this.message = ''
    this.messageload = 'Looking for logstash on your computer & launching it ...'
    ipcRenderer.send("lookingForLogstash")
    this.sheet = true
    this.color = "success"
    ipcRenderer.once("lookingForLogstash", (event,arg) =>{
      console.log(arg)
      this.message = arg
      this.messageload = ''
      
    })
    console.log("azdk")
    ipcRenderer.on("syncFiles", (event,arg) =>{
      console.log(arg)
      this.overlay=true
      if (typeof arg == "number" )
        this.size = arg
      else
      {
        this.files.push({ file : arg, result: ''})
        this.loading.push(true)
        this.message = 'files'
        setTimeout(() => {
          console.log("increment actual size")
          this.actualSize++
          this.valueCircular = this.actualSize/this.size*100
        }, 500)
      }
    })
    ipcRenderer.on('syncFilesResult', (event, arg) => {
      console.log('Incoming results')
      this.files.forEach((elem, i) => { 
        if (elem['file'] == arg[0]) 
        {
          elem['result']= arg[1]
          console.log(this.loading[i])
          this.loading[i] = false
        }
      })
    })

    ipcRenderer.once("openDialogLocal", (event,arg) =>{
      console.log(arg)
      this.message = arg
    })
  
  }
  
};
</script>