/**
 * Request logging middleware
 */

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log the request
  console.log(`📝 ${req.method} ${req.originalUrl} - ${req.ip} - ${new Date().toISOString()}`);
  
  // Log request body for POST/PUT requests (but limit size)
  if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
    const bodyStr = JSON.stringify(req.body);
    const truncatedBody = bodyStr.length > 500 ? bodyStr.substring(0, 500) + '...[truncated]' : bodyStr;
    console.log(`📦 Request body: ${truncatedBody}`);
  }
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    const duration = Date.now() - startTime;
    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
    
    console.log(`${statusColor} ${res.statusCode} ${req.method} ${req.originalUrl} - ${duration}ms`);
    
    if (res.statusCode >= 400) {
      console.log(`❌ Error response: ${JSON.stringify(body, null, 2)}`);
    }
    
    return originalJson.call(this, body);
  };
  
  next();
};

module.exports = requestLogger; 