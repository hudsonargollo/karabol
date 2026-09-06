import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { BoardPage } from './pages/BoardPage';
import './theme.css';

// /board is the only unauthenticated route — a bar's own TV/tablet has no
// staff login, so it's routed here before the App's login gate rather than
// through it. No router lib in this app; a plain pathname check is enough
// for one extra public page.
const isBoard = window.location.pathname.replace(/\/+$/, '') === '/board';
const root = isBoard ? (
  <BoardPage venueId={new URLSearchParams(window.location.search).get('venue') ?? ''} />
) : (
  <App />
);

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode>{root}</React.StrictMode>);
