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
            <v-btn rounded color="primary" @click="openDialogLocalZip"> Select directory</v-btn>
          </v-col>
        </v-row>
      </div>
      <v-bottom-sheet v-model="sheet">
        <v-sheet v-if="message != ''" class="text-center" height="200px" >
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
    message : '',
    messageload : "",
    color: "error"
  }),
  methods: {
    openDialogLocal(){
      this.color = "error"
      this.message = ''
      ipcRenderer.send("openDialogLocal")
      this.sheet = true
      ipcRenderer.on("openDialogLocal", (event,arg) =>{
        console.log(arg)
        this.message = arg
      })
    },
    openDialogLocalZip(){
      this.color = "error"
      this.message = ''
      this.messageload = 'Please wait, it could take some time ...'
      ipcRenderer.send("openDialogLocalZip")
      this.sheet = true
      ipcRenderer.on("openDialogLocalZip", (event,arg) =>{
        console.log(arg)
        this.message = arg
        this.messageload = ''
      })
    }
  },
  beforeMount() {
    this.message = ''
    this.messageload = 'Looking for logstash on your computer ...'
    ipcRenderer.send("lookingForLogstash")
    this.sheet = true
    ipcRenderer.on("lookingForLogstash", (event,arg) =>{
      console.log(arg)
      this.message = arg
      this.messageload = ''
      this.color = "success"
    })
  }
  
};
</script>