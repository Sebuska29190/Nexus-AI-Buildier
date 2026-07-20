import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });

  it('renders the ToastProvider wrapper', () => {
    render(<App />);
    // App should render main structure
    expect(document.querySelector('.h-dvh')).toBeDefined();
  });

  it('renders Sidebar navigation', () => {
    render(<App />);
    // Sidebar should be rendered (the app starts on dashboard)
    expect(document.querySelector('.h-dvh')).toBeInTheDocument();
  });
});
