<template>
    <div class="d-flex align-center justify-center fill-height fluid">
      <div class="flex-column">
        <v-row>
          <v-col class="fluid" md="auto"> 
            <p class="mt-1">Single log file: </p>
          </v-col>
          <template>
            <v-file-input  accept=".log" v-model="file" label="File input"></v-file-input>
          </template>
          <v-col class="d-flex justify-end">
            <v-btn rounded color="primary" vdark @click="singleFile">Confirm</v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-col class="fluid" md="auto"> 
            <p class="mt-1">Multiple zip files: </p>
          </v-col>
          <template>
            <v-file-input multiple accept=".zip" v-model="files" label="Files input"></v-file-input>
          </template>
          <v-col class="d-flex justify-end">
            <v-btn rounded color="primary" vdark @click="multipleFiles">Confirm</v-btn>
          </v-col>
        </v-row>
      </div>


      <v-bottom-sheet v-model="sheet" persistent>
        <v-sheet v-if="action == 'multipleFiles'" class="text-center" height="50%" >
          <div class ="text-center">
            <v-btn rounded class="mt-3" color="error" @click="sheet = !sheet" dark>Close</v-btn>
          </div>
           
           <transition
              xenter-active-class="animated bounce" 
              leave-active-class="animated shake" 
              appear
           >
              <v-chip v-if="files.length == results.length" dark style="border-radius:100px;" class="pa-3 ma-2 green darken-2 text-center white--text"> {{message}}</v-chip>
              <v-alert v-else-if="message.length > 0 && files.length != results.length" type="warning" dark style="border-radius:100px;">
                In progress, please wait ...
              </v-alert>
              <v-alert v-else type="warning" dark style="border-radius:100px;">
                In progress, please wait ...
              </v-alert>
           </transition>
            <v-data-table
              :headers="headers"
              :items="results"
              :items-per-page="5"
              class="elevation-1"
            >
              
                <template v-slot:item.result='{item}'>
                  <v-skeleton-loader
                    :loading="results[results.indexOf(item)].result == null"
                    class='d-flex align-center'
                    height="100%"
                    type="text"
                  >
                    <v-chip dark> {{item.result}}</v-chip>
                  </v-skeleton-loader>

                </template>
            </v-data-table>
        </v-sheet>

        <v-sheet v-else class="text-center" height="200px" >
            <div class ="text-center ">
              <v-btn rounded class="mt-3" color="error" :disabled="message.length > 0" @click="sheet = !sheet" dark>Close</v-btn>
            </div>
            <transition
              enter-active-class="animated bounce" 
              leave-active-class="animated shake" 
              appear
            >
              <div class="py-3" v-if="message.length > 0">{{message}}</div>
              <v-progress-circular
                indeterminate
                color="green"
                v-else
              ></v-progress-circular>
            </transition>
        </v-sheet>
    </v-bottom-sheet>
    </div>
    
  
    
</template>

<script>
  const axios = require('axios')
  
export default {
  name: 'Home',
  data: () => ({
    headers : [
      { text : 'Files', align:"start", sortable:false, value:'file'},
      { text : 'Result', value:'result'},
    ],
    file: {},
    files: [],
    results: [],
    message : '',
    action:'',
    sheet:false,
    worker: null
  }),
  watch:{
    results(){
      if (this.results.length == this.files.length)
        this.message = "Process done with success"
      this.files = []
    }
  },
  methods: {
    multipleFiles(){
      this.files.forEach((file) => {
        console.log(this.results)
        this.results.push({file:file.name,result:null})
        this.analyseLogZip(file)
      })
      this.sheet = true
      this.action = 'multipleFiles'
    },
    singleFile(){
      this.sheet = true
      this.action = 'singleFile'
      const formData = new FormData();
      formData.append("log", this.file)
      axios.post("http://127.0.0.1:3000/analyseLog", formData)
        .then(response => {
          this.message = response.data
        })
        .catch(error => {
          console.log(error)
        })
    },
    async analyseLogZip(file){
      const formData = new FormData();
      formData.append("log", file)

      axios.post("http://127.0.0.1:3000/analyseLogZip", formData)
        .then(response => {
          console.log(response)
          this.results.forEach(result => {if (result.file == response.data.file) result.result = response.data.result; return;})
          console.log(this.results)
        })
        .catch(error => {
          this.message = 'Unable to communicate with the server, please contact the administrator'
          console.log(error)
        })
    }
  }
  
};
</script>