import { render, screen } from '@testing-library/react';
import App from './App.js';

test('renders Zoho Tasks Todo List title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Zoho Tasks Todo List/i);
  expect(titleElement).toBeTruthy();
});
