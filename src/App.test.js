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
  test('renders the empty dashboard when auth is stored without client data', () => {
    localStorage.setItem('ca_auth', JSON.stringify({ id: '1', email: 'test@example.com' }));
    localStorage.setItem('ca_billing', JSON.stringify({ trialStart: new Date().toISOString() }));
    render(<App />);
    // A new account with no saved clients should see the onboarding state.
    expect(screen.getByText('Welcome to CAPortal')).toBeInTheDocument();
    expect(screen.getByText('+ Add first client')).toBeInTheDocument();
    localStorage.clear();
  });
});
