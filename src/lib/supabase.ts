import axios from 'axios';
import { API_URL, FEATURES, DEMO_USER } from '../config';

// Set this to false to force using the real API, true to use mock data
const isMockClient = FEATURES.useMockData;
const enableLogging = FEATURES.enableLogging;

const log = (message: string, data?: any) => {
  if (enableLogging) {
    console.log(`[CAPTCHA-SHIELD] ${message}`, data || '');
  }
};

const logError = (message: string, error?: any) => {
  if (enableLogging) {
    console.error(`[CAPTCHA-SHIELD] ${message}`, error || '');
  }
};

export async function getCurrentUser() {
  if (isMockClient) {
    // Return a mock user for development
    return {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: DEMO_USER.email,
      user_metadata: {
        name: 'Demo User'
      }
    };
  }
  
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    
    log(`Fetching current user with token: ${token.substring(0, 15)}...`);
    
    const response = await axios.get(`${API_URL}/api/user`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    log('Current user:', response.data);
    return response.data.user;
  } catch (error) {
    logError('Error getting current user:', error);
    localStorage.removeItem('auth_token');
    return null;
  }
}

export async function signIn(email: string, password: string) {
  if (isMockClient && email === DEMO_USER.email && password === DEMO_USER.password) {
    // Mock successful login for demo account
    localStorage.setItem('auth_token', 'mock_token');
    return { 
      data: { 
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: DEMO_USER.email
        }
      }, 
      error: null 
    };
  }
  
  try {
    log('Attempting login for:', email);
    
    // Create a login request
    const loginData = { email, password };
    log('Login request to:', `${API_URL}/api/auth/login`);
    
    // Make the request with CORS headers
    const response = await axios.post(
      `${API_URL}/api/auth/login`, 
      loginData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    log('Login response:', response.data);
    
    if (response.data && response.data.token) {
      // Save the token
      localStorage.setItem('auth_token', response.data.token);
      
      // Dispatch event for auth state change
      window.dispatchEvent(new Event('auth-state-change'));
      
      return { 
        data: { user: response.data.user }, 
        error: null 
      };
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    logError('Login error:', error);
    
    // Try to get the specific error message, with fallbacks
    let errorMessage = 'Authentication failed';
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { 
      data: null, 
      error: { message: errorMessage }
    };
  }
}

export async function signUp(email: string, password: string) {
  if (isMockClient) {
    // Mock successful registration
    localStorage.setItem('auth_token', 'mock_token');
    
    // Dispatch event for auth state change
    window.dispatchEvent(new Event('auth-state-change'));
    
    return { 
      data: { 
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email
        }
      }, 
      error: null 
    };
  }
  
  try {
    log('Attempting registration for:', email);
    
    const response = await axios.post(
      `${API_URL}/api/auth/register`, 
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    log('Registration response:', response.data);
    
    localStorage.setItem('auth_token', response.data.token);
    
    // Dispatch event for auth state change
    window.dispatchEvent(new Event('auth-state-change'));
    
    return { 
      data: { user: response.data.user }, 
      error: null 
    };
  } catch (error) {
    logError('Registration error:', error);
    
    let errorMessage = 'Registration failed';
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { 
      data: null, 
      error: { message: errorMessage }
    };
  }
}

export async function signOut() {
  localStorage.removeItem('auth_token');
  
  // Dispatch event for auth state change
  window.dispatchEvent(new Event('auth-state-change'));
  
  return { error: null };
}

// API functions for challenge content
export async function uploadChallengeContent(challengeType: string, contentData: any, metadata?: any) {
  if (isMockClient) {
    return {
      success: true,
      data: {
        id: uuidv4(),
        challenge_type: challengeType,
        content_data: contentData,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      }
    };
  }
  
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');
    
    const response = await axios.post(
      `${API_URL}/api/challenge-content`,
      {
        challenge_type: challengeType,
        content_data: contentData,
        metadata
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    logError('Error uploading challenge content:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to upload challenge content'
    };
  }
}

export async function getChallengeContent(challengeType?: string, limit = 10, offset = 0) {
  if (isMockClient) {
    return {
      success: true,
      data: [
        {
          id: '1',
          challenge_type: 'image_selection',
          content_data: {
            category: 'animals',
            images: [
              'https://images.unsplash.com/photo-1530595467517-49740742c05f?w=150&h=150&fit=crop&auto=format',
              'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=150&h=150&fit=crop&auto=format'
            ]
          },
          metadata: { difficulty: 'easy' },
          created_at: new Date().toISOString()
        }
      ]
    };
  }
  
  try {
    let url = `${API_URL}/api/challenge-content?limit=${limit}&offset=${offset}`;
    if (challengeType) {
      url += `&challenge_type=${challengeType}`;
    }
    
    const response = await axios.get(url);
    log('Challenge content fetched:', response.data.length);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    logError('Error fetching challenge content:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch challenge content',
      data: []
    };
  }
}

// Helper function
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}