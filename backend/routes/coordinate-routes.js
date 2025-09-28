const express = require('express');
const { body, param, validationResult } = require('express-validator');
const CoordinateMapperService = require('../services/CoordinateMapperService');

const router = express.Router();
const coordinateMapper = new CoordinateMapperService();

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * POST /api/coordinates/process
 * Process detection data and map coordinates
 */
router.post('/process',
  [
    body('predictions').isArray().withMessage('predictions must be an array'),
    body('predictions.*.x').isNumeric().withMessage('x coordinate must be numeric'),
    body('predictions.*.y').isNumeric().withMessage('y coordinate must be numeric'),
    body('predictions.*.class').notEmpty().withMessage('class is required'),
    body('predictions.*.confidence').optional().isFloat({ min: 0, max: 1 }).withMessage('confidence must be between 0 and 1'),
    body('predictions.*.detection_id').optional().notEmpty().withMessage('detection_id cannot be empty'),
    body('predictions.*.width').optional().isNumeric().withMessage('width must be numeric'),
    body('predictions.*.height').optional().isNumeric().withMessage('height must be numeric')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const detectionData = req.body;
      
      // Validate that we have some detections
      if (!detectionData.predictions || detectionData.predictions.length === 0) {
        return res.status(400).json({
          error: 'No predictions provided',
          message: 'Detection data must contain at least one prediction'
        });
      }

      // Process the detections
      const result = coordinateMapper.processDetections(detectionData);
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).json({
        error: 'Processing failed',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/coordinates/map
 * Map coordinates with custom line of scrimmage
 */
router.post('/map',
  [
    body('detectionData.predictions').isArray().withMessage('predictions must be an array'),
    body('lineOfScrimmageX').isNumeric().withMessage('lineOfScrimmageX must be numeric'),
    body('fieldDims.pixelsPerYard').optional().isNumeric().withMessage('pixelsPerYard must be numeric'),
    body('fieldDims.fieldCenterY').optional().isNumeric().withMessage('fieldCenterY must be numeric')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { detectionData, lineOfScrimmageX, fieldDims } = req.body;
      
      let calculatedFieldDims = fieldDims;
      if (!fieldDims) {
        const allDetections = detectionData.predictions;
        const players = allDetections.filter(d => coordinateMapper.isPlayer(d));
        calculatedFieldDims = coordinateMapper.calculateFieldDimensions(allDetections, lineOfScrimmageX, players);
      }
      
      const mappedData = coordinateMapper.mapCoordinates(detectionData, lineOfScrimmageX, calculatedFieldDims);
      
      res.json({
        success: true,
        data: {
          mappedData,
          lineOfScrimmageX,
          fieldDims: calculatedFieldDims
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Mapping error:', error);
      res.status(500).json({
        error: 'Mapping failed',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/coordinates/export
 * Export mapped coordinates to JSON file
 */
router.post('/export',
  [
    body('mappedData').isObject().withMessage('mappedData must be an object'),
    body('filename').optional().isString().withMessage('filename must be a string')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { mappedData, filename } = req.body;
      
      const result = await coordinateMapper.exportToJSON(mappedData, filename);
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({
        error: 'Export failed',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/coordinates/download/:filename
 * Download exported file
 */
router.get('/download/:filename',
  [
    param('filename').matches(/^[\w\-. ]+\.(json)$/i).withMessage('Invalid filename format')
  ],
  handleValidationErrors,
  (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = require('path').join(coordinateMapper.exportDir, filename);
      
      // Check if file exists
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: 'File not found',
          filename: filename
        });
      }
      
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).json({
            error: 'Download failed',
            message: err.message
          });
        }
      });
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({
        error: 'Download failed',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/coordinates/estimate-line
 * Estimate line of scrimmage for given player data
 */
router.post('/estimate-line',
  [
    body('players').isArray().withMessage('players must be an array'),
    body('players.*.x').isNumeric().withMessage('x coordinate must be numeric'),
    body('players.*.class').notEmpty().withMessage('class is required')
  ],
  handleValidationErrors,
  (req, res) => {
    try {
      const { players } = req.body;
      
      const lineOfScrimmageX = coordinateMapper.estimateLineOfScrimmage(players);
      
      res.json({
        success: true,
        data: {
          lineOfScrimmageX: lineOfScrimmageX,
          playerCount: players.length,
          validPlayers: players.filter(p => coordinateMapper.isPlayer(p)).length
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Line estimation error:', error);
      res.status(500).json({
        error: 'Line estimation failed',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/coordinates/classify-teams
 * Classify players into offense/defense based on line of scrimmage
 */
router.post('/classify-teams',
  [
    body('players').isArray().withMessage('players must be an array'),
    body('lineOfScrimmageX').isNumeric().withMessage('lineOfScrimmageX must be numeric')
  ],
  handleValidationErrors,
  (req, res) => {
    try {
      const { players, lineOfScrimmageX } = req.body;
      
      const classification = coordinateMapper.classifyOffenseDefense(players, lineOfScrimmageX);
      
      res.json({
        success: true,
        data: {
          ...classification,
          lineOfScrimmageX: lineOfScrimmageX,
          totalPlayers: players.length
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Team classification error:', error);
      res.status(500).json({
        error: 'Team classification failed',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/coordinates/positions
 * Get available football positions
 */
router.get('/positions', (req, res) => {
  try {
    const positions = coordinateMapper.getAvailablePositions();
    
    res.json({
      success: true,
      data: positions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Positions error:', error);
    res.status(500).json({
      error: 'Failed to get positions',
      message: error.message
    });
  }
});

/**
 * POST /api/coordinates/field-dimensions
 * Calculate field dimensions from detections
 */
router.post('/field-dimensions',
  [
    body('detections').isArray().withMessage('detections must be an array'),
    body('lineOfScrimmageX').optional().isNumeric().withMessage('lineOfScrimmageX must be numeric'),
    body('players').optional().isArray().withMessage('players must be an array')
  ],
  handleValidationErrors,
  (req, res) => {
    try {
      const { detections, lineOfScrimmageX, players } = req.body;
      
      const fieldDims = coordinateMapper.calculateFieldDimensions(detections, lineOfScrimmageX, players);
      
      res.json({
        success: true,
        data: fieldDims,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Field dimensions error:', error);
      res.status(500).json({
        error: 'Field dimensions calculation failed',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/coordinates/health
 * Health check for coordinate mapping service
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Coordinate Mapping Service',
    status: 'OK',
    features: [
      'detection processing',
      'coordinate mapping',
      'team classification',
      'field dimension calculation',
      'JSON export'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 