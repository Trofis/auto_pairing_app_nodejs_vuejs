<template>
  <v-app>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.7.2/animate.min.css">

    <v-app-bar
      app
      color="light-blue darken-4"
      dark
    >
      <div class="d-flex align-center">
        <h1 class=".display-2">Auto-pairing</h1>
      </div>

      <v-spacer></v-spacer>

      
    </v-app-bar>

    <v-content>
      <Home/>
    </v-content>
  </v-app>
</template>

<script>
import Home from './components/Home';

export default {
  name: 'App',

  components: {
    //HelloWorld,
    Home
  }
}
</script>
