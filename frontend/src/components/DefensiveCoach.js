import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import { Sports as SportsIcon, FileCopy as FileCopyIcon, Delete as DeleteIcon } from '@mui/icons-material';
import apiClient from '../services/apiClient';

const DefensiveCoach = () => {
  const [message, setMessage] = useState('');
  const [coordinatesInput, setCoordinatesInput] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let coordinates;
      try {
        coordinates = JSON.parse(coordinatesInput);
      } catch (parseError) {
        throw new Error('Invalid JSON format for coordinates');
      }

      const response = await apiClient.getDefensiveCoachingAnalysis(message, coordinates);
      setAnalysis(response);
    } catch (err) {
      setError(err.message);
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExampleData = () => {
    setMessage('Analyze this defensive formation and identify the coverage scheme');
    setCoordinatesInput(JSON.stringify({
      players: [
        { position: "CB", coordinates: { xYards: 8.5, yYards: -20.2 } },
        { position: "CB", coordinates: { xYards: 8.3, yYards: 20.5 } },
        { position: "S", coordinates: { xYards: 12.5, yYards: -10.5 } },
        { position: "S", coordinates: { xYards: 12.8, yYards: 10.2 } },
        { position: "LB", coordinates: { xYards: 4.2, yYards: -5.5 } },
        { position: "LB", coordinates: { xYards: 4.5, yYards: 0.0 } },
        { position: "LB", coordinates: { xYards: 4.3, yYards: 5.5 } },
        { position: "DE", coordinates: { xYards: 0.5, yYards: -15.0 } },
        { position: "DT", coordinates: { xYards: 0.2, yYards: -3.0 } },
        { position: "DT", coordinates: { xYards: 0.3, yYards: 3.0 } },
        { position: "DE", coordinates: { xYards: 0.6, yYards: 15.0 } }
      ]
    }, null, 2));
  };

  const clearForm = () => {
    setMessage('');
    setCoordinatesInput('');
    setAnalysis(null);
    setError(null);
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 4 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 600, mb: 1 }}>
            Defensive Coach AI
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Get expert defensive coaching insights based on player coordinates
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider', mb: 3 }}>
          <Box component="form" onSubmit={handleAnalyze}>
            <Stack spacing={3}>
              <TextField
                label="Coaching Question"
                multiline
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="E.g., Analyze this defensive formation and identify coverage scheme..."
                required
                disabled={isLoading}
                fullWidth
              />

              <TextField
                label="Player Coordinates (JSON)"
                multiline
                rows={12}
                value={coordinatesInput}
                onChange={(e) => setCoordinatesInput(e.target.value)}
                placeholder='{"players": [...]}'
                required
                disabled={isLoading}
                fullWidth
                sx={{
                  '& textarea': {
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                  },
                }}
              />

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<FileCopyIcon />}
                  onClick={loadExampleData}
                  disabled={isLoading}
                >
                  Load Example
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={clearForm}
                  disabled={isLoading}
                >
                  Clear
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={isLoading || !message.trim() || !coordinatesInput.trim()}
                  startIcon={<SportsIcon />}
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Formation'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {isLoading && (
          <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider', textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography color="text.secondary">Analyzing defensive formation with AI...</Typography>
          </Paper>
        )}

        {analysis && !isLoading && (
          <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              Analysis Results
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, mb: 3 }}>
              {analysis.response}
            </Typography>
            {analysis.stats && (
              <Box sx={{ p: 2, backgroundColor: 'background.default', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Players analyzed: {analysis.stats.coordinates_processed} • Processing time: {analysis.stats.timing.total_duration}s
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default DefensiveCoach;
