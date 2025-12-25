import React from 'react'
import '@mantine/dates/styles.css'; // <--- AJOUTER CETTE LIGNE
import 'leaflet/dist/leaflet.css'; // <--- AJOUTER CETTE LIGNE
import ReactDOM from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

// Import des styles de base de Mantine (Obligatoire)
import '@mantine/core/styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>,
)