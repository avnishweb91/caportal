import { render, screen } from '@testing-library/react';
import App from './App';

// App requires Supabase and Razorpay — mock them
jest.mock('./lib/supabase',  () => ({ supabase: null }));
jest.mock('./lib/razorpay',  () => ({ openPayment: jest.fn() }));

describe('App', () => {
  test('renders the landing page by default (unauthenticated)', () => {
    localStorage.clear();
    render(<App />);
    // Landing-specific element: "Start free trial" button only appears on landing
    expect(screen.getAllByText(/Start free trial/i).length).toBeGreaterThan(0);
  });
  test('renders dashboard when auth is stored', () => {
    localStorage.setItem('ca_auth', JSON.stringify({ id: '1', email: 'test@example.com' }));
    localStorage.setItem('ca_billing', JSON.stringify({ trialStart: new Date().toISOString() }));
    render(<App />);
    // Dashboard renders a metrics strip; look for the unique "Total clients" label
    expect(screen.getByText('Total clients')).toBeInTheDocument();
    localStorage.clear();
  });
});
