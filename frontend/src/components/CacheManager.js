import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import apiClient from '../services/apiClient';

const CacheManager = () => {
  const [isClearing, setIsClearing] = useState(false);
  const [clearResult, setClearResult] = useState(null);
  const [error, setError] = useState(null);

  const handleClearCache = async () => {
    if (!window.confirm('Are you sure you want to clear all cache data? This will force fresh data to be fetched from ESPN on the next request.')) {
      return;
    }

    setIsClearing(true);
    setError(null);
    setClearResult(null);

    try {
      const response = await apiClient.clearCache();
      setClearResult({
        success: true,
        message: response.message,
        timestamp: response.timestamp,
      });
    } catch (err) {
      setError(err.message);
      setClearResult({
        success: false,
        message: err.message,
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 4 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 600, mb: 1 }}>
            Cache Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage the smart cache system for NFL and College Football data
          </Typography>
        </Box>

        <Stack spacing={3}>
          <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              About Smart Caching
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <List>
              <ListItem>
                <ListItemText
                  primary="Individual Game Cache"
                  secondary="Each game's data is cached for 2 minutes"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Full Dataset Cache"
                  secondary="Complete dataset refreshed every 10 minutes"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Smart Updates"
                  secondary="Only stale games are re-scraped from ESPN"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Dual Sport Support"
                  secondary="Separate caching for NFL and College Football"
                />
              </ListItem>
            </List>
          </Paper>

          <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Actions
            </Typography>
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={isClearing ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
                onClick={handleClearCache}
                disabled={isClearing}
                sx={{ minWidth: 200 }}
              >
                {isClearing ? 'Clearing...' : 'Clear All Cache'}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                This will remove all cached data for both NFL and College Football
              </Typography>
            </Box>
          </Paper>

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {clearResult && (
            <Alert severity={clearResult.success ? 'success' : 'error'}>
              {clearResult.message}
              {clearResult.timestamp && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  Completed at: {new Date(clearResult.timestamp).toLocaleString()}
                </Typography>
              )}
            </Alert>
          )}

          <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider', backgroundColor: 'background.default' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Cache Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              To view current cache statistics including fresh games, total players tracked, and cache freshness,
              visit the <strong>Statistics</strong> page.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center', mt: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>2 min</Typography>
                <Typography variant="caption" color="text.secondary">Individual game cache</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>10 min</Typography>
                <Typography variant="caption" color="text.secondary">Full dataset refresh</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>2 Sports</Typography>
                <Typography variant="caption" color="text.secondary">NFL + College</Typography>
              </Box>
            </Box>
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
};

export default CacheManager;
