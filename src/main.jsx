import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { loadDemoProfile } from './data/demoProfile.js';

const urlParams = new URLSearchParams(window.location.search);
const bootDemoKey = urlParams.get('demo');
if (bootDemoKey && ['alex', 'maya', 'james'].includes(bootDemoKey)) {
  loadDemoProfile(bootDemoKey);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
