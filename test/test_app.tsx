import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../src/App';

console.log('Rendering App...');
try {
  const html = renderToString(<App />);
  console.log('App render SUCCESS! Length:', html.length);
} catch (e: any) {
  console.error('App render THREW ERROR:', e);
}
