const express = require('express');
const { body, param, validationResult } = require('express-validator');
const supabase = require('../services/SupabaseClient');

const router = express.Router();

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

// POST /api/plays/save
router.post('/save',
  [
    body('play_id').isString().notEmpty().withMessage('play_id is required'),
    body('data').isObject().withMessage('data must be a JSON object')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { play_id, data } = req.body;

      if (!process.env.SUPABASE_URL || !(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      const { error } = await supabase
        .from('plays')
        .upsert({ play_id, data }, { onConflict: 'play_id' });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json(true);
    } catch (err) {
      console.error('Save play error:', err);
      return res.status(500).json({ error: 'Failed to save play' });
    }
  }
);

// GET /api/plays
router.get('/', async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { data, error } = await supabase
      .from('plays')
      .select('play_id');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const ids = (data || []).map(row => row.play_id);
    return res.json(ids);
  } catch (err) {
    console.error('List plays error:', err);
    return res.status(500).json({ error: 'Failed to get plays' });
  }
});

// GET /api/plays/:play_id
router.get('/:play_id',
  [
    param('play_id').isString().notEmpty().withMessage('play_id is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { play_id } = req.params;

      if (!process.env.SUPABASE_URL || !(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      const { data, error } = await supabase
        .from('plays')
        .select('data')
        .eq('play_id', play_id)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.message?.toLowerCase().includes('no rows')) {
          return res.status(404).json({ error: 'Play not found' });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.json(data?.data ?? null);
    } catch (err) {
      console.error('Get play error:', err);
      return res.status(500).json({ error: 'Failed to get play data' });
    }
  }
);

module.exports = router; 