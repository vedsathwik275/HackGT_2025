import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  Divider,
  ThemeProvider,
  CssBaseline,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Chat as ChatIcon,
  Sports as SportsIcon,
  BarChart as BarChartIcon,
  Storage as StorageIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import ChatInterface from './components/ChatInterface';
import DefensiveCoach from './components/DefensiveCoach';
import StatsDashboard from './components/StatsDashboard';
import CacheManager from './components/CacheManager';
import apiClient from './services/apiClient';
import theme from './theme';

const drawerWidth = 280;

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [isHealthy, setIsHealthy] = useState(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      await apiClient.healthCheck();
      setIsHealthy(true);
    } catch (error) {
      setIsHealthy(false);
      console.error('Health check failed:', error);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDesktopDrawerToggle = () => {
    setDesktopOpen(!desktopOpen);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  const menuItems = [
    { id: 'chat', label: 'Chat', icon: <ChatIcon /> },
    { id: 'coach', label: 'Defensive Coach', icon: <SportsIcon /> },
    { id: 'stats', label: 'Statistics', icon: <BarChartIcon /> },
    { id: 'cache', label: 'Cache Management', icon: <StorageIcon /> },
  ];

  const drawer = (isMobile = false) => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Header */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            NextGen Stats
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Live Football Analytics
          </Typography>
        </Box>
        <IconButton
          onClick={isMobile ? handleDrawerToggle : handleDesktopDrawerToggle}
          sx={{ display: isMobile ? { sm: 'none' } : 'block' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.id}
              selected={activeTab === item.id}
              onClick={() => handleTabChange(item.id)}
            >
              <ListItemIcon sx={{ color: activeTab === item.id ? 'secondary.main' : 'text.secondary', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.9375rem',
                  fontWeight: activeTab === item.id ? 600 : 400,
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Divider />

      {/* Health Status */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            API Status
          </Typography>
          {isCheckingHealth ? (
            <Chip label="Checking..." size="small" color="default" />
          ) : isHealthy ? (
            <Chip label="Online" size="small" color="success" />
          ) : (
            <Chip
              label="Offline"
              size="small"
              color="error"
              onClick={checkHealth}
              sx={{ cursor: 'pointer' }}
            />
          )}
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          v1.0.0
        </Typography>
      </Box>
    </Box>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatInterface />;
      case 'coach':
        return <DefensiveCoach />;
      case 'stats':
        return <StatsDashboard />;
      case 'cache':
        return <CacheManager />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Mobile App Bar */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            display: { sm: 'none' },
            backgroundColor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, color: 'text.primary', fontWeight: 600, ml: 2 }}>
              NextGen Stats
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Desktop hamburger button when drawer is closed */}
        {!desktopOpen && (
          <IconButton
            onClick={handleDesktopDrawerToggle}
            sx={{
              position: 'fixed',
              top: 16,
              left: 16,
              zIndex: 1200,
              display: { xs: 'none', sm: 'block' },
              backgroundColor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Sidebar Drawer */}
        <Box
          component="nav"
          sx={{
            width: { sm: desktopOpen ? drawerWidth : 0 },
            flexShrink: { sm: 0 },
            transition: 'width 0.3s ease',
          }}
        >
          {/* Mobile drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer(true)}
          </Drawer>

          {/* Desktop drawer */}
          <Drawer
            variant="persistent"
            open={desktopOpen}
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                transition: 'width 0.3s ease',
              },
            }}
          >
            {drawer(false)}
          </Drawer>
        </Box>

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            height: '100vh',
            overflow: 'hidden',
            backgroundColor: 'background.default',
            pt: { xs: '56px', sm: 0 },
            transition: 'margin 0.3s ease',
          }}
        >
          {renderContent()}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
