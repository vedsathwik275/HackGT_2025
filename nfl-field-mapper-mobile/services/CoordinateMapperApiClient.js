import { Platform } from 'react-native';

/**
 * CoordinateMapperApiClient.js
 * React Native API client for backend coordinate mapping service
 * Handles all communication with the Express.js backend
 */

class CoordinateMapperApiClient {
  constructor(baseURL = null) {
    // Auto-detect the best URL for the current platform
    this.baseURL = baseURL || this.getDefaultBaseURL();
    this.apiURL = `${this.baseURL}/api/coordinates`;
    this.timeout = 30000; // 30 seconds timeout
    
    console.log(`🔗 API Client initialized with baseURL: ${this.baseURL}`);
  }

  /**
   * Get the default base URL based on the platform
   */
  getDefaultBaseURL() {
    if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to reach host machine
      return 'http://10.0.2.2:3000';
    } else {
      // iOS simulator and web can use localhost
      return 'http://localhost:3000';
    }
  }

  /**
   * Get alternative URLs to try if the primary fails
   */
  getAlternativeURLs() {
    return [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://10.0.2.2:3000', // Android emulator
      // Add your machine's IP here if testing on physical devices
      // 'http://192.168.1.XXX:3000', 
    ];
  }

  /**
   * Make HTTP request with error handling and automatic fallback URLs
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

    // First try with the configured URL
    try {
      console.log(`🔄 Making API request to: ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      console.log(`✅ API request successful to: ${url}`);
      return data.data;
    } catch (error) {
      console.error(`❌ API Request failed for ${url}:`, error);
      
      // If it's a network error and we're making a health check, try alternative URLs
      if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
        if (url.includes('/health')) {
          return await this.tryAlternativeURLs(url, config);
        }
        
        throw new Error(`Unable to connect to backend server at ${this.baseURL}. Platform: ${Platform.OS}\n\nTroubleshooting:\n- Ensure backend server is running on port 3000\n- Check network connectivity\n- For Android emulator, backend should be accessible at 10.0.2.2:3000\n- For physical devices, use your computer's IP address`);
      }
      
      throw error;
    }
  }

  /**
   * Try alternative URLs if the primary URL fails
   */
  async tryAlternativeURLs(originalUrl, config) {
    const endpoint = originalUrl.replace(this.apiURL, '');
    const alternativeURLs = this.getAlternativeURLs();
    
    console.log(`🔄 Trying alternative URLs for health check...`);
    
    for (const baseURL of alternativeURLs) {
      if (baseURL === this.baseURL) continue; // Skip the one we already tried
      
      const alternativeURL = `${baseURL}/api/coordinates${endpoint}`;
      
      try {
        console.log(`🔄 Trying: ${alternativeURL}`);
        const response = await fetch(alternativeURL, config);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            console.log(`✅ Alternative URL successful: ${alternativeURL}`);
            // Update our base URL to the working one
            this.setBaseURL(baseURL);
            return data.data;
          }
        }
      } catch (error) {
        console.log(`❌ Alternative URL failed: ${alternativeURL} - ${error.message}`);
        continue;
      }
    }
    
    throw new Error(`Unable to connect to backend server. Tried multiple URLs:\n${alternativeURLs.join('\n')}\n\nPlease ensure the backend is running and accessible.`);
  }

  /**
   * Process detection data (main endpoint)
   */
  async processDetections(detectionData) {
    const url = `${this.apiURL}/process`;
    
    const result = await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(detectionData),
    });

    return result;
  }

  /**
   * Map coordinates with custom parameters
   */
  async mapCoordinates(detectionData, lineOfScrimmageX, fieldDims = null) {
    const url = `${this.apiURL}/map`;
    
    const requestBody = {
      detectionData,
      lineOfScrimmageX,
      ...(fieldDims && { fieldDims })
    };

    const result = await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    return result;
  }

  /**
   * Export mapped data to JSON file on backend
   */
  async exportToJSON(mappedData, filename = null) {
    const url = `${this.apiURL}/export`;
    
    const requestBody = {
      mappedData,
      ...(filename && { filename })
    };

    const result = await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    return result;
  }

  /**
   * Download exported file
   */
  async downloadFile(filename) {
    const url = `${this.apiURL}/download/${encodeURIComponent(filename)}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return response.blob();
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  /**
   * Get file URL for sharing
   */
  getDownloadUrl(filename) {
    return `${this.apiURL}/download/${encodeURIComponent(filename)}`;
  }

  /**
   * Estimate line of scrimmage
   */
  async estimateLineOfScrimmage(players) {
    const url = `${this.apiURL}/estimate-line`;
    
    const result = await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify({ players }),
    });

    return result;
  }

  /**
   * Classify teams based on line of scrimmage
   */
  async classifyTeams(players, lineOfScrimmageX) {
    const url = `${this.apiURL}/classify-teams`;
    
    const result = await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify({ players, lineOfScrimmageX }),
    });

    return result;
  }

  /**
   * Get available football positions
   */
  async getAvailablePositions() {
    const url = `${this.apiURL}/positions`;
    
    const result = await this.makeRequest(url);
    return result;
  }

  /**
   * Calculate field dimensions
   */
  async calculateFieldDimensions(detections, lineOfScrimmageX = null, players = null) {
    const url = `${this.apiURL}/field-dimensions`;
    
    const requestBody = {
      detections,
      ...(lineOfScrimmageX && { lineOfScrimmageX }),
      ...(players && { players })
    };

    const result = await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    return result;
  }

  /**
   * Health check for backend service
   */
  async healthCheck() {
    const url = `${this.apiURL}/health`;
    
    try {
      const result = await this.makeRequest(url);
      return result;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return { status: 'OFFLINE', error: error.message };
    }
  }

  /**
   * Test backend connectivity with detailed debugging
   */
  async testConnection() {
    try {
      console.log(`🔍 Testing connection to: ${this.baseURL}`);
      console.log(`📱 Platform: ${Platform.OS}`);
      
      const healthData = await this.healthCheck();
      
      console.log(`✅ Backend connection successful!`);
      return {
        connected: true,
        status: healthData.status,
        service: healthData.service,
        url: this.baseURL
      };
    } catch (error) {
      console.error(`❌ Backend connection failed:`, error);
      return {
        connected: false,
        error: error.message,
        url: this.baseURL,
        platform: Platform.OS
      };
    }
  }

  /**
   * Configure backend URL (for different environments)
   */
  setBaseURL(newBaseURL) {
    this.baseURL = newBaseURL;
    this.apiURL = `${newBaseURL}/api/coordinates`;
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      baseURL: this.baseURL,
      apiURL: this.apiURL,
      timeout: this.timeout
    };
  }
}

export default CoordinateMapperApiClient; 