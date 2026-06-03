import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Container, Card, CardContent, TextField, Button, 
  Typography, Link, Alert, CircularProgress, InputAdornment, IconButton, useTheme
} from '@mui/material';
import { FiEye as Visibility, FiEyeOff as VisibilityOff, FiMail as AlternateEmail, FiLock as LockOpen, FiUser as Person } from 'react-icons/fi';
import axios from 'axios';

export default function Login() {
  const theme = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleToggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Register API View
        await axios.post('/api/v1/accounts/register/', {
          username,
          email,
          password,
          full_name: fullName
        });
        
        // Auto login on successful registration
        setIsRegister(false);
        setPassword('');
        setError('Account created successfully! Please log in.');
      } else {
        // DRF Token Obtain Pair API
        const response = await axios.post('/api/v1/auth/token/', {
          username,
          password
        });
        
        localStorage.setItem('accessToken', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);
        
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        err.response?.data?.message || 
        'An error occurred. Please verify your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #030712 0%, #0b0f19 100%)' 
          : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        p: 2
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" color="primary" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>
            Woxi
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
            Modern WhatsApp Shared Inbox & CRM
          </Typography>
        </Box>

        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.05)' }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Typography variant="h5" align="center" sx={{ mb: 3, fontWeight: 700 }}>
              {isRegister ? 'Create your Account' : 'Sign In'}
            </Typography>

            {error && (
              <Alert severity={error.includes('successfully') ? 'success' : 'error'} sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                
                {isRegister && (
                  <TextField
                    fullWidth
                    label="Full Name"
                    variant="outlined"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}

                <TextField
                  fullWidth
                  label="Username"
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOpen color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                {isRegister && (
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    variant="outlined"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AlternateEmail color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ py: 1.5, mt: 1 }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : isRegister ? (
                    'Register Account'
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </Box>
            </form>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                <Link
                  component="button"
                  variant="body2"
                  onClick={handleToggleMode}
                  sx={{ fontWeight: 600, textDecoration: 'none' }}
                >
                  {isRegister ? 'Sign In instead' : 'Register one here'}
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
