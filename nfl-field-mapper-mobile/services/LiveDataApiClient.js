import { Platform } from 'react-native';

/**
 * LiveDataApiClient.js
 * React Native API client for live football data service
 * Handles all communication with the NextGen Live Football Stats API
 */

class LiveDataApiClient {
  constructor(baseURL = null) {
    // Use the deployed API URL
    this.baseURL = this.normalizeBaseURL(baseURL || this.getDefaultBaseURL());
    this.chatURL = `${this.baseURL}/chat`;
    this.healthURL = `${this.baseURL}/health`;
    this.statsURL = `${this.baseURL}/stats`;
    this.cacheURL = `${this.baseURL}/cache/clear`;
    this.timeout = 30000; // 30 seconds timeout
    
    console.log(`🏈 LiveDataApiClient initialized with baseURL: ${this.baseURL}`);
    this.logSystemInfo();
  }

  /**
   * Log system information for debugging
   */
  logSystemInfo() {
    console.log('📱 System Info:', {
      platform: Platform.OS,
      version: Platform.Version,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Normalize base URL by trimming trailing slashes
   */
  normalizeBaseURL(url) {
    return (url || '').replace(/\/+$/, '');
  }

  /**
   * Get the default base URL for the Live Data API
   */
  getDefaultBaseURL() {
    return 'https://nextgen-live-data-api.onrender.com/api';
  }

  /**
   * Create request configuration with timeout and headers
   */
  createRequestConfig(method = 'GET', body = null) {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    console.log(`🔗 Request Config:`, {
      method,
      url: this.baseURL,
      headers: config.headers,
      body: body ? JSON.stringify(body, null, 2) : null,
      timestamp: new Date().toISOString()
    });

    return config;
  }

  /**
   * Generic fetch with timeout and error handling
   */
  async fetchWithTimeout(url, config) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      console.log(`📤 API Request:`, {
        url,
        method: config.method,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`📥 API Response:`, {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`❌ API Request Failed:`, {
        url,
        error: error.message,
        name: error.name,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Send a chat message to the AI
   * @param {string} message - The user's message
   * @param {string|null} sport - Optional sport context ('nfl', 'college', or null for both)
   * @returns {Promise<Object>} AI response data
   */
  async sendChatMessage(message, sport = null) {
    console.log(`💬 Sending Chat Message:`, {
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      sport,
      messageLength: message.length,
      timestamp: new Date().toISOString()
    });

    try {
      const requestBody = { message: message.trim() };
      
      if (sport) {
        requestBody.sport = sport;
      }

      const config = this.createRequestConfig('POST', requestBody);
      const response = await this.fetchWithTimeout(this.chatURL, config);
      const data = await response.json();

      console.log(`🤖 AI Response Received:`, {
        success: data.success,
        responseLength: data.response ? data.response.length : 0,
        sportContext: data.sport_context,
        dataFreshness: data.data_freshness,
        hasError: !!data.error,
        timestamp: new Date().toISOString()
      });

      if (data.response && data.response.length > 500) {
        console.log(`📝 AI Response Preview:`, data.response.substring(0, 200) + '...');
      } else if (data.response) {
        console.log(`📝 AI Response:`, data.response);
      }

      return data;
    } catch (error) {
      console.error(`❌ Chat Message Failed:`, {
        message: message.substring(0, 50),
        sport,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Check API health status
   * @returns {Promise<Object>} Health status data
   */
  async checkHealth() {
    console.log(`🩺 Checking API Health:`, {
      url: this.healthURL,
      timestamp: new Date().toISOString()
    });

    try {
      const config = this.createRequestConfig('GET');
      const response = await this.fetchWithTimeout(this.healthURL, config);
      const data = await response.json();

      console.log(`✅ Health Check Result:`, {
        status: data.status,
        uptime: data.uptime,
        cacheStatus: data.cache_status,
        aiStatus: data.ai_status,
        timestamp: new Date().toISOString()
      });

      return data;
    } catch (error) {
      console.error(`❌ Health Check Failed:`, {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Get system statistics
   * @returns {Promise<Object>} Stats data
   */
  async getStats() {
    console.log(`📊 Getting System Stats:`, {
      url: this.statsURL,
      timestamp: new Date().toISOString()
    });

    try {
      const config = this.createRequestConfig('GET');
      const response = await this.fetchWithTimeout(this.statsURL, config);
      const data = await response.json();

      console.log(`📈 Stats Retrieved:`, {
        totalRequests: data.system_stats?.total_requests,
        aiRequests: data.system_stats?.ai_requests,
        uptime: data.system_stats?.uptime,
        cacheStats: data.cache_stats,
        timestamp: new Date().toISOString()
      });

      return data;
    } catch (error) {
      console.error(`❌ Stats Request Failed:`, {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Clear the API cache
   * @returns {Promise<Object>} Cache clear result
   */
  async clearCache() {
    console.log(`🗑️ Clearing API Cache:`, {
      url: this.cacheURL,
      timestamp: new Date().toISOString()
    });

    try {
      const config = this.createRequestConfig('POST');
      const response = await this.fetchWithTimeout(this.cacheURL, config);
      const data = await response.json();

      console.log(`🧹 Cache Cleared:`, {
        success: data.success,
        cleared: data.cleared,
        timestamp: new Date().toISOString()
      });

      return data;
    } catch (error) {
      console.error(`❌ Cache Clear Failed:`, {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Test connectivity to the API
   * @returns {Promise<boolean>} Connection status
   */
  async testConnectivity() {
    console.log(`🔌 Testing API Connectivity:`, {
      timestamp: new Date().toISOString()
    });

    try {
      await this.checkHealth();
      console.log(`✅ Connectivity Test: SUCCESS`);
      return true;
    } catch (error) {
      console.log(`❌ Connectivity Test: FAILED -`, error.message);
      return false;
    }
  }

  /**
   * Get current configuration
   * @returns {Object} Current client configuration
   */
  getConfig() {
    const config = {
      baseURL: this.baseURL,
      chatURL: this.chatURL,
      healthURL: this.healthURL,
      statsURL: this.statsURL,
      cacheURL: this.cacheURL,
      timeout: this.timeout,
      platform: Platform.OS,
      timestamp: new Date().toISOString()
    };

    console.log(`⚙️ Current Config:`, config);
    return config;
  }
}

// Create and export a singleton instance
const liveDataApiClient = new LiveDataApiClient();

export default liveDataApiClient;
export { LiveDataApiClient }; 