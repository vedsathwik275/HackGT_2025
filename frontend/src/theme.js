import { createTheme } from '@mui/material/styles';

// Apple.com inspired minimalistic theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#000000',
      light: '#1d1d1f',
      dark: '#000000',
    },
    secondary: {
      main: '#0071e3',
      light: '#0077ed',
      dark: '#006edb',
    },
    background: {
      default: '#ffffff',
      paper: '#fbfbfd',
    },
    text: {
      primary: '#1d1d1f',
      secondary: '#6e6e73',
    },
    divider: '#d2d2d7',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 600,
      letterSpacing: '-0.015em',
      lineHeight: 1.1,
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 600,
      letterSpacing: '-0.015em',
      lineHeight: 1.1,
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.2,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '-0.005em',
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      letterSpacing: '-0.005em',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1.0625rem',
      lineHeight: 1.47,
      letterSpacing: '-0.022em',
    },
    body2: {
      fontSize: '0.9375rem',
      lineHeight: 1.5,
      letterSpacing: '-0.016em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 400,
      letterSpacing: '-0.022em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 980,
          padding: '8px 20px',
          fontSize: '1rem',
          fontWeight: 400,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          backgroundColor: '#0071e3',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#0077ed',
          },
        },
        outlined: {
          borderColor: '#0071e3',
          color: '#0071e3',
          '&:hover': {
            backgroundColor: 'rgba(0, 113, 227, 0.04)',
            borderColor: '#0077ed',
          },
        },
        text: {
          color: '#0071e3',
          '&:hover': {
            backgroundColor: 'rgba(0, 113, 227, 0.04)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '& fieldset': {
              borderColor: '#d2d2d7',
            },
            '&:hover fieldset': {
              borderColor: '#86868b',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0071e3',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          backgroundColor: '#fbfbfd',
          borderRight: '1px solid #d2d2d7',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          marginBottom: 4,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 113, 227, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(0, 113, 227, 0.12)',
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
  },
});

export default theme;
