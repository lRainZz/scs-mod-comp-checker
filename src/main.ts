import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app').$nextTick(() => {
    // Use contextBridge
    window.ipcRenderer.on('main-process-message', (_event, message) => {
        console.log(message)
    })
})
