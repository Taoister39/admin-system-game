import React from 'react';
import ReactDOM from 'react-dom/client';
import Application from './layout/Application';
import { HashRouter } from 'react-router-dom';
import './index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <HashRouter>
        <Application />
      </HashRouter>
    </React.StrictMode>,
  );
}
