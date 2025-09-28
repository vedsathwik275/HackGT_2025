import { Platform } from 'react-native';

/**
 * PlaysApiClient.js
 * React Native API client for backend plays service
 * Handles all communication with the Supabase plays endpoints
 */

class PlaysApiClient {
  constructor(baseURL = null) {
    // Auto-detect the best URL for the current platform
    this.baseURL = this.normalizeBaseURL(baseURL || this.getDefaultBaseURL());
    this.apiURL = `${this.baseURL}/api/plays`;
    this.timeout = 30000; // 30 seconds timeout
    
    console.log(`🎬 Plays API Client initialized with baseURL: ${this.baseURL}`);
  }

  /**
   * Normalize base URL by trimming trailing slashes
   */
  normalizeBaseURL(url) {
    return (url || '').replace(/\/+$/, '');
  }

  /**
   * Get the default base URL based on the platform
   */
  getDefaultBaseURL() {
    return 'https://football-next-gen-backend.vercel.app';
  }

  /**
   * Get alternative URLs to try if the primary fails
   */
  getAlternativeURLs() {
    return [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://10.0.2.2:3000', // Android emulator
    ];
  }

  /**
   * Make HTTP request with error handling
   */
  async makeRequest(url, options = {}) {
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: this.timeout,
    };

    const config = { ...defaultOptions, ...options };

    try {
      console.log(`🔄 Making Plays API request to: ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Plays API request successful to: ${url}`);
      return data;
    } catch (error) {
      console.error(`❌ Plays API Request failed for ${url}:`, error);
      throw new Error(`Unable to connect to plays service at ${this.baseURL}. ${error.message}`);
    }
  }

  /**
   * Save play data to Supabase
   * @param {string} playId - Unique identifier for the play
   * @param {object} data - JSON data to store for the play
   * @returns {Promise<boolean>} - Returns true if successful
   */
  async savePlay(playId, data) {
    if (!playId || typeof playId !== 'string') {
      throw new Error('playId must be a non-empty string');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('data must be a valid object');
    }

    const url = `${this.apiURL}/save`;
    const options = {
      method: 'POST',
      body: JSON.stringify({
        play_id: playId,
        data: data
      })
    };

    try {
      const result = await this.makeRequest(url, options);
      return result === true;
    } catch (error) {
      console.error('Save play error:', error);
      throw new Error(`Failed to save play: ${error.message}`);
    }
  }

  /**
   * Get list of all play IDs
   * @returns {Promise<string[]>} - Array of play ID strings
   */
  async getPlays() {
    const url = this.apiURL;

    try {
      const result = await this.makeRequest(url);
      if (!Array.isArray(result)) {
        throw new Error('Expected array of play IDs');
      }
      return result;
    } catch (error) {
      console.error('Get plays error:', error);
      throw new Error(`Failed to get plays: ${error.message}`);
    }
  }

  /**
   * Get play data by ID
   * @param {string} playId - Unique identifier for the play
   * @returns {Promise<object|null>} - Play data object or null if not found
   */
  async getPlayData(playId) {
    if (!playId || typeof playId !== 'string') {
      throw new Error('playId must be a non-empty string');
    }

    const url = `${this.apiURL}/${encodeURIComponent(playId)}`;

    try {
      const result = await this.makeRequest(url);
      return result;
    } catch (error) {
      if (error.message.includes('404') || error.message.includes('Play not found')) {
        return null;
      }
      console.error('Get play data error:', error);
      throw new Error(`Failed to get play data: ${error.message}`);
    }
  }

  /**
   * Check if the plays service is available
   * @returns {Promise<boolean>} - True if service is available
   */
  async checkHealth() {
    try {
      const url = `${this.baseURL}/health`;
      const result = await this.makeRequest(url);
      return result && result.status === 'OK';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Update the base URL (useful for switching between local and production)
   * @param {string} newBaseURL - New base URL to use
   */
  updateBaseURL(newBaseURL) {
    this.baseURL = this.normalizeBaseURL(newBaseURL);
    this.apiURL = `${this.baseURL}/api/plays`;
    console.log(`🔄 Plays API Client baseURL updated to: ${this.baseURL}`);
  }
}

export default PlaysApiClient; 