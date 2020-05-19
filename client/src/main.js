import Vue from 'vue'
import App from './App.vue'
import VueWorker from 'vue-worker'
import vuetify from './plugins/vuetify';

Vue.config.productionTip = false

Vue.use(VueWorker)
new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')
