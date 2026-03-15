import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const style = document.createElement('style');
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; background: #1e1e2e; color: #cdd6f4; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #181825; }
  ::-webkit-scrollbar-thumb { background: #313244; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #45475a; }
  textarea { scrollbar-width: thin; scrollbar-color: #313244 #181825; }
  input::placeholder, textarea::placeholder { color: #45475a !important; }
  select option { background: #1e1e2e; color: #cdd6f4; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
