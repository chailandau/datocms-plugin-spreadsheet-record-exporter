import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
const root = container ? createRoot(container) : null;

export const render = (component: React.ReactNode): void => {
  root && root.render(<StrictMode>{component}</StrictMode>);
};
