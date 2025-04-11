import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueKonva from 'vue-konva'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(VueKonva, {
  globalKonva: {
    initDelay: 50,
    debug: false
  }
})

app.mount('#app')
