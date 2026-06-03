import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import AppRoutes from './Routing/AppRoutes.jsx';

// Create context for theme toggle
export const ThemeContext = createContext();

export const useThemeToggle = () => useContext(ThemeContext);

export default function App() {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode: mode,
        primary: {
          main: '#10b981', 
          light: '#34d399',
          dark: '#059669',
          contrastText: mode === 'dark' ? '#0f172a' : '#ffffff',
        },
        secondary: {
          main: '#2563eb',
        },
        background: {
          default: mode === 'dark' ? '#030712' : '#f8fafc',
          paper: mode === 'dark' ? '#0b0f19' : '#ffffff',
        },
        text: {
          primary: mode === 'dark' ? '#f8fafc' : '#0f172a',
          secondary: mode === 'dark' ? '#94a3b8' : '#475569',
        },
        divider: mode === 'dark' ? '#1e293b' : '#e2e8f0',
      },
      typography: {
        fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
        h1: { fontWeight: 800 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 700 },
        h4: { fontWeight: 700 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 500 },
        button: { textTransform: 'none', fontWeight: 600 },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: mode === 'dark' ? '#030712' : '#f8fafc',
              color: mode === 'dark' ? '#f8fafc' : '#0f172a',
              scrollbarColor: mode === 'dark' ? '#1e293b #0b0f19' : '#e2e8f0 #ffffff',
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: mode === 'dark' ? '#0b0f19' : '#ffffff',
              },
              '&::-webkit-scrollbar-thumb': {
                background: mode === 'dark' ? '#1e293b' : '#e2e8f0',
                borderRadius: '4px',
              },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              boxShadow: 'none',
              border: `1px solid ${mode === 'dark' ? '#1e293b' : '#e2e8f0'}`,
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: mode === 'dark' ? '#0b0f19' : '#ffffff',
              backgroundImage: 'none',
              borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#e2e8f0'}`,
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: mode === 'dark' ? '#0b0f19' : '#ffffff',
              borderRight: `1px solid ${mode === 'dark' ? '#1e293b' : '#e2e8f0'}`,
            },
          },
        },
      },
    });
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppRoutes />
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

