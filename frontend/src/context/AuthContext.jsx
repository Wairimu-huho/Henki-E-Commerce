// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Configure axios defaults - update this to properly point to your backend server
axios.defaults.baseURL = 'http://localhost:5000'; // Use your actual backend URL
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Create the context
const AuthContext = createContext();

// Export the context so it can be imported directly if needed
export { AuthContext };

export const useAuth = () => {
  return useContext(AuthContext);
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Make sure this endpoint matches your backend
        const response = await axios.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/auth/login', { email, password });
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      
      // Set user data in state
      setUser(response.data);
      
      // Set authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      // Ensure this endpoint matches your backend API
      const response = await axios.post('/api/auth/register', userData);
      const { token, user: newUser } = response.data;
      localStorage.setItem('token', token);
      setUser(newUser);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error.response?.data?.message || 'Failed to register');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (userData) => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      // Check if this endpoint matches your backend API
      const response = await axios.put('/api/user/profile', userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      return true;
    } catch (error) {
      console.error('Profile update failed:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
      return false;
    }
  };

  const uploadProfilePicture = async (file) => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profilePicture', file);

      // Check if this endpoint matches your backend API
      const response = await axios.post('/api/user/profile/upload-picture', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setUser(response.data);
      return true;
    } catch (error) {
      console.error('Profile picture upload failed:', error);
      setError(error.response?.data?.message || 'Failed to upload profile picture');
      return false;
    }
  };

  const deleteProfilePicture = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      // Check if this endpoint matches your backend API
      const response = await axios.delete('/api/user/profile/delete-picture', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      return true;
    } catch (error) {
      console.error('Profile picture deletion failed:', error);
      setError(error.response?.data?.message || 'Failed to delete profile picture');
      return false;
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      setError(null);
      // Check if this endpoint matches your backend API
      await axios.post('/api/user/reset-password', { email });
      return true;
    } catch (error) {
      console.error('Password reset request failed:', error);
      setError(error.response?.data?.message || 'Failed to request password reset');
      return false;
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      setError(null);
      // Check if this endpoint matches your backend API
      await axios.put(`/api/user/reset-password/${token}`, { password: newPassword });
      return true;
    } catch (error) {
      console.error('Password reset failed:', error);
      setError(error.response?.data?.message || 'Failed to reset password');
      return false;
    }
  };

  // Add axios interceptor for handling token
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          setUser(null);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    uploadProfilePicture,
    deleteProfilePicture,
    requestPasswordReset,
    resetPassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;