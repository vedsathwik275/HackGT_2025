import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import apiClient from '../services/apiClient';

const StatsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getStats();
      setStats(response);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchStats();
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const formatAge = (ageMinutes) => {
    if (ageMinutes === null) return 'Never';
    if (ageMinutes < 1) return '<1 min';
    if (ageMinutes < 60) return `${Math.floor(ageMinutes)} min`;
    const hours = Math.floor(ageMinutes / 60);
    const mins = Math.floor(ageMinutes % 60);
    return `${hours}h ${mins}m`;
  };

  const getCacheFreshness = (freshGames, totalGames) => {
    if (totalGames === 0) return 0;
    return Math.round((freshGames / totalGames) * 100);
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 4 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h3" sx={{ fontWeight: 600 }}>
            System Statistics
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
              control={<Switch checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />}
              label="Auto-refresh"
            />
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchStats} disabled={isLoading}>
              Refresh
            </Button>
          </Stack>
        </Box>

        {lastUpdate && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {isLoading && !stats && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }} color="text.secondary">
              Loading statistics...
            </Typography>
          </Box>
        )}

        {stats && (
          <Stack spacing={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {stats.cache.combined.total_games_cached}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Games Cached
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {stats.cache.combined.fresh_games}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fresh Games (&lt;2 min)
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {stats.cache.combined.total_players_tracked}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Players Tracked
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {stats.cache.combined.total_teams_tracked}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Teams Tracked
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                    College Football Cache
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Games Cached
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {stats.cache.college.individual_games_cached}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Fresh Games
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {stats.cache.college.fresh_games}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Cache Freshness</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {getCacheFreshness(stats.cache.college.fresh_games, stats.cache.college.individual_games_cached)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={getCacheFreshness(stats.cache.college.fresh_games, stats.cache.college.individual_games_cached)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Dataset Age
                      </Typography>
                      <Chip
                        label={formatAge(stats.cache.college.full_dataset_age_minutes)}
                        size="small"
                        color={stats.cache.college.full_dataset_fresh ? 'success' : 'default'}
                      />
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                    NFL Cache
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Games Cached
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {stats.cache.nfl.individual_games_cached}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Fresh Games
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {stats.cache.nfl.fresh_games}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Cache Freshness</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {getCacheFreshness(stats.cache.nfl.fresh_games, stats.cache.nfl.individual_games_cached)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={getCacheFreshness(stats.cache.nfl.fresh_games, stats.cache.nfl.individual_games_cached)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Dataset Age
                      </Typography>
                      <Chip
                        label={formatAge(stats.cache.nfl.full_dataset_age_minutes)}
                        size="small"
                        color={stats.cache.nfl.full_dataset_fresh ? 'success' : 'default'}
                      />
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default StatsDashboard;
