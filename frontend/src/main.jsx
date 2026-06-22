import 'react-toastify/dist/ReactToastify.css';
import './styles/theme.css';
import './styles/global.css';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter , BrowserRouter } from 'react-router-dom';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <BrowserRouter>
    <App />
  </BrowserRouter>
  </StrictMode>
)
