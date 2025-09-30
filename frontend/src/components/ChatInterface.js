import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Button,
  ButtonGroup,
  Fade,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import apiClient from '../services/apiClient';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sport, setSport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.sendChatMessage(inputMessage, sport);

      const aiMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
        stats: response.stats,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message);
      const errorMessage = {
        role: 'error',
        content: `Error: ${err.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    const refreshMessage = {
      role: 'user',
      content: 'refresh',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, refreshMessage]);
    setIsLoading(true);

    try {
      const response = await apiClient.sendChatMessage('refresh', sport);
      const aiMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  const getSportLabel = () => {
    if (sport === 'nfl') return 'NFL';
    if (sport === 'college') return 'College';
    return 'Both';
  };

  const exampleQueries = [
    'What are the current scores?',
    'How did Patrick Mahomes perform?',
    'Show me top rushing stats',
    'Who is leading in passing yards?',
  ];

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default',
      }}
    >
      {/* Top Bar */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={handleRefresh} disabled={isLoading} size="small">
            <RefreshIcon />
          </IconButton>
          <IconButton onClick={handleClearChat} size="small">
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Messages Area */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'divider',
            borderRadius: '3px',
          },
        }}
      >
        {messages.length === 0 && (
          <Fade in timeout={500}>
            <Box
              sx={{
                maxWidth: 700,
                mx: 'auto',
                textAlign: 'center',
                py: 8,
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #000 0%, #666 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                What can I help you with?
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                Currently tracking <strong>{getSportLabel()}</strong> games
              </Typography>

              <Stack spacing={1.5} sx={{ maxWidth: 500, mx: 'auto' }}>
                {exampleQueries.map((query, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: 1,
                      borderColor: 'divider',
                      '&:hover': {
                        borderColor: 'secondary.main',
                        backgroundColor: 'rgba(0, 113, 227, 0.02)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => setInputMessage(query)}
                  >
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {query}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Fade>
        )}

        {messages.map((message, index) => (
          <Fade in key={index} timeout={300}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  maxWidth: '75%',
                  p: 2,
                  backgroundColor:
                    message.role === 'user'
                      ? 'primary.main'
                      : message.role === 'error'
                      ? 'error.light'
                      : 'background.paper',
                  color: message.role === 'user' ? 'white' : 'text.primary',
                  border: message.role !== 'user' ? 1 : 0,
                  borderColor: message.role === 'error' ? 'error.main' : 'divider',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.6,
                  }}
                >
                  {message.content}
                </Typography>

                {message.stats && (
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      {message.stats.games_tracked} games • {message.stats.fresh_games} fresh •{' '}
                      {message.stats.total_players} players • {message.stats.timing.total_duration}s
                    </Typography>
                  </Box>
                )}

                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 1,
                    opacity: 0.7,
                    fontSize: '0.7rem',
                  }}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
                </Typography>
              </Paper>
            </Box>
          </Fade>
        ))}

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Analyzing live data...
              </Typography>
            </Paper>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Error Alert */}
      {error && (
        <Box sx={{ px: 3, pb: 1 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Input Area */}
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          p: 3,
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box
          sx={{
            maxWidth: 900,
            mx: 'auto',
            display: 'flex',
            gap: 1,
            alignItems: 'flex-end',
          }}
        >
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <Select
              value={sport === null ? 'both' : sport}
              onChange={(e) => setSport(e.target.value === 'both' ? null : e.target.value)}
              IconComponent={ArrowDownIcon}
              sx={{
                borderRadius: 980,
                height: 48,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'divider',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'secondary.main',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'secondary.main',
                },
              }}
            >
              <MenuItem value="both">Both</MenuItem>
              <MenuItem value="nfl">NFL</MenuItem>
              <MenuItem value="college">College</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask about ${getSportLabel()} games...`}
            disabled={isLoading}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.default',
              },
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <IconButton
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            color="primary"
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              width: 48,
              height: 48,
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '&.Mui-disabled': {
                backgroundColor: 'action.disabledBackground',
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatInterface;
