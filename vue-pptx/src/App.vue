<script>
import PresentationEditor from './components/PresentationEditor.vue'

export default {
  name: 'App',
  components: {
    PresentationEditor
  }
}
</script>

<template>
  <div id="app">
    <presentation-editor />
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: #333;
  overflow-x: hidden;
  width: 100%;
  height: 100%;
}

html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
