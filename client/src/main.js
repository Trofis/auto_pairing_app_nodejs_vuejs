import Vue from 'vue'
import App from './App.vue'
import VueWorker from 'vue-worker'
import vuetify from './plugins/vuetify';
import JsonCSV from 'vue-json-csv'
 
export const eventBus = new Vue({
  methods:{
    addResult(data){
      this.$emit('resultsWasEdited', data)
    }
  }
})

Vue.config.productionTip = false

Vue.component('downloadCsv', JsonCSV)
Vue.use(VueWorker)
new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')
