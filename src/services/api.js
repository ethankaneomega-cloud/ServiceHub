// services/api.js
const API_URL = import.meta.env.VITE_API_URL;

export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return await response.json();
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const fetchWorkers = async () => {
  try {
    const response = await fetch(`${API_URL}/workers`);
    return await response.json();
  } catch (error) {
    console.error('Fetch workers error:', error);
    throw error;
  }
};

export const createBooking = async (bookingData) => {
  try {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    return await response.json();
  } catch (error) {
    console.error('Booking error:', error);
    throw error;
  }
};

// Default export for all existing imports
export default { loginUser, fetchWorkers, createBooking };