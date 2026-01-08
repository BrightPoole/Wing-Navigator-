import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("Wing Navigator Application Initializing...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Critical Error: Could not find root element to mount to");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("Wing Navigator Application Mounted successfully.");
} catch (err) {
  console.error("Wing Navigator Mounting Failure:", err);
}