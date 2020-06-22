<template>
     <v-bottom-sheet v-model="sheet" persistent>
        <v-sheet v-if="action == 'multipleFiles'" class="text-center"  >
        <div v-if="error !== '' && error !== null"  >
                <v-btn rounded class="mt-3 mb-3" color="error" @click="close(); isOver=false" dark>Close</v-btn>
                <div class="d-flex justify-center " >
                
                    <v-alert  type="error" dark class="mt-3" style="border-radius:100px;width:50%;marge-left:auto;marge-right:auto;">
                        {{error}}
                    </v-alert>
                </div>
        </div>
        <div v-else>
            <transition
                enter-active-class="animate__animated animate__backInLeft" 
                leave-active-class="animate__animated animate__backOutRight" 
                appear
            >
                <div v-if="isOver" key="result">
                    <div class="d-flex justify-center " >
                        <v-btn rounded class="mt-3 mb-3" color="error" @click="close(); isOver=false" dark>Close</v-btn>
                    </div>
                    <div class="d-flex justify-center " >
                        <v-btn color="primary" rounded >
                            <download-csv
                                :data   = "results"
                                >
                                <v-icon dark>mdi-cloud-download</v-icon>
                                {{this.message}}
                            </download-csv>
                        </v-btn>
                    </div>

                </div>
                <div v-else class="d-flex justify-center " key="in progress">
                    <v-alert  type="warning" dark class="mt-3" style="border-radius:100px;width:50%;marge-left:auto;marge-right:auto;">
                        In progress, please wait ...
                    </v-alert>
                </div>
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
        </div>
        </v-sheet>

        <v-sheet v-else class="text-center" height="200px" >
            
            <transition
                enter-active-class="animate__animated animate__backInLeft" 
                leave-active-class="animate__animated animate__backOutRight" 
                appear
            >
                <div v-if="message.length > 0 || error.length > 0" key="result">
                    <v-btn rounded class="mt-3 mb-1" color="error" @click="isOver=false;close()" dark>Close</v-btn>
                   
                    <div v-if="error === '' || error === none" class="py-3" >
                        {{message}}
                    </div>
                    <div class="d-flex justify-center " v-else>
                         <v-alert  type="error" dark class="mt-3" style="border-radius:100px;width:50%;marge-left:auto;marge-right:auto;">
                            {{error}}
                        </v-alert>
                    </div>
                   

                </div>
                <div v-else key="in progress">
                    <div class="d-flex justify-center " >
                        <v-alert  type="warning" dark class="mt-3" style="border-radius:100px;width:50%;marge-left:auto;marge-right:auto;">
                            In progress, please wait ...
                        </v-alert>

                    </div>
                    <v-progress-circular
                        indeterminate
                        color="green"
                        class="mt-6"
                    ></v-progress-circular>
                </div>
            </transition>
        </v-sheet>
    </v-bottom-sheet>
</template>

<script>
  import {eventBus} from '../main'

/**
 * @vue-prop {Object} file - singleFile's object
 * @vue-prop {Array} files - multipleFiles' array
 * @vue-prop {Array} results - multipleFiles' analyse results
 * @vue-prop {string} [message=''] - keep infos or single result
 * @vue-prop {string} action - keep which action the user performed : singleFile or multipleFiles
 * @vue-prop {boolean}  [sheet=true] - show or not the popUp
 * @vue-prop {Function} close - Popup's close process
 * @vue-prop {string} [error=''] - error message
 * @vue-data {Array}  [headers=[{text: 'Files', align:'start', sortable:false, value:'file'}, {text: 'Result', value:'result'}]] - Data table's header
 * @vue-data {boolean} [isOver=false] - True or False if the file(s) treatment is over
*/ 
export default {
    /**
         * Called when PopUp is displayed
         * It aims to refresh the data table results and then called the method 'checkResults'
         */
    created(){
        eventBus.$on('resultsWasEdited', (data) => {
            this.results.forEach(result => {if (result.file == data.file) result.result = data.result})
            this.checkResults()
        })
    },
    data: () => ({
        headers : [
            { text : 'Files', align:"start", sortable:false, value:'file'},
            { text : 'Result', value:'result'},
        ],
        isOver : false
    }), 
    props: ['file', 'files', 'results', 'action', 'message', 'sheet', 'close', 'error'],
    methods: {
        /**
         * It is triggered by an event bus called 'resultsWasEdited'
         * It aims to display a csv button to download the results after all files has been analysed 
         */
        checkResults(){
            this.isOver = true
            this.results.forEach((file) =>{ if (file.result == null) {this.isOver = false;}})
            if (this.isOver)
                this.message = "Click to download the attached csv file"
        }   
    },
    
}
</script>