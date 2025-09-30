import axios from 'axios';

// API Base URL - Update this to your deployed Render URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://nextgen-live-data-api.onrender.com';

class LiveDataApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
      }, 
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🔵 API Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.config.url}`, response.status);
        return response;
      },
      (error) => {
        console.error('❌ Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Health check endpoint
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/api/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Health check failed');
    }
  }

  /**
   * Send chat message to AI for football analysis
   * @param {string} message - User's question
   * @param {string} sport - 'nfl', 'college', or null for both
   */
  async sendChatMessage(message, sport = null) {
    try {
      const response = await this.client.post('/api/chat', {
        message,
        sport,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Chat request failed');
    }
  }

  /**
   * Get defensive coaching analysis with player coordinates
   * @param {string} message - Coaching question
   * @param {object} coordinates - Player coordinate data
   */
  async getDefensiveCoachingAnalysis(message, coordinates) {
    try {
      const response = await this.client.post('/api/defensive-coach', {
        message,
        coordinates,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Defensive coaching analysis failed');
    }
  }

  /**
   * Get system statistics and cache status
   */
  async getStats() {
    try {
      const response = await this.client.get('/api/stats');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Stats request failed');
    }
  }

  /**
   * Clear cache for both NFL and College Football
   */
  async clearCache() {
    try {
      const response = await this.client.post('/api/cache/clear');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Cache clear failed');
    }
  }

  /**
   * Error handler
   */
  handleError(error, defaultMessage) {
    if (error.response) {
      // Server responded with error status
      return new Error(
        error.response.data?.error ||
        error.response.data?.message ||
        `${defaultMessage}: ${error.response.status}`
      );
    } else if (error.request) {
      // Request was made but no response received
      return new Error(`${defaultMessage}: No response from server`);
    } else {
      // Something else happened
      return new Error(`${defaultMessage}: ${error.message}`);
    }
  }
}

export default new LiveDataApiClient();
