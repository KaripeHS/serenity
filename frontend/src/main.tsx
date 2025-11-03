import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App-simple.tsx' // Using working version
import './App.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)