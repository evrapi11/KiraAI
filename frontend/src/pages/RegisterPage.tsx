import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Container,
  Divider,
  Slider,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BigFiveTraits } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const traitDescriptions = {
  openness: {
    name: 'Openness to Experience',
    description: 'How open you are to new experiences, creativity, and ideas',
    low: 'Prefer routine and familiar',
    high: 'Love novelty and creativity'
  },
  conscientiousness: {
    name: 'Conscientiousness', 
    description: 'How organized, disciplined, and goal-oriented you are',
    low: 'Flexible and spontaneous',
    high: 'Organized and disciplined'
  },
  extraversion: {
    name: 'Extraversion',
    description: 'How outgoing and social vs. reserved you tend to be',
    low: 'Prefer solitude and reflection',
    high: 'Energized by social interaction'
  },
  agreeableness: {
    name: 'Agreeableness',
    description: 'How cooperative, trusting, and empathetic you are',
    low: 'Direct and competitive',
    high: 'Cooperative and trusting'
  },
  neuroticism: {
    name: 'Emotional Sensitivity',
    description: 'How sensitive you are to stress and negative emotions',
    low: 'Calm and emotionally stable',
    high: 'Sensitive and emotionally reactive'
  }
};

const RegisterPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [traits, setTraits] = useState<BigFiveTraits>({
    openness: 5,
    conscientiousness: 5,
    extraversion: 5,
    agreeableness: 5,
    neuroticism: 5,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleTraitChange = (trait: keyof BigFiveTraits) => (
    _event: Event,
    newValue: number | number[]
  ) => {
    setTraits({
      ...traits,
      [trait]: newValue as number,
    });
  };

  const validateStep1 = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateStep1()) {
      return;
    }
    setError('');
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        traits,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <LoadingSpinner message="Creating your account..." />
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Card
          elevation={2}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontFamily: 'Noto Sans JP',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6B7280 0%, #059669 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}
              >
                Join KiraAI
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontFamily: 'Noto Sans JP' }}
              >
                Begin your journey of mindful self-discovery
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Stepper activeStep={activeStep} orientation="vertical">
              <Step>
                <StepLabel>Account Information</StepLabel>
                <StepContent>
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      label="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      margin="normal"
                      required
                      autoFocus
                    />
                    
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      margin="normal"
                      required
                    />
                    
                    <TextField
                      fullWidth
                      label="Password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      margin="normal"
                      required
                    />
                    
                    <TextField
                      fullWidth
                      label="Confirm Password"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      margin="normal"
                      required
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{ mr: 1 }}
                    >
                      Continue
                    </Button>
                    <Button
                      onClick={() => navigate('/login')}
                      sx={{ mr: 1 }}
                    >
                      Back to Login
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              <Step>
                <StepLabel>Personality Assessment</StepLabel>
                <StepContent>
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    Help us understand your personality to provide better insights. 
                    Rate yourself on each trait from 1-10:
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    {Object.entries(traitDescriptions).map(([key, trait]) => (
                      <Box key={key} sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom>
                          {trait.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {trait.description}
                        </Typography>
                        
                        <Box sx={{ px: 2 }}>
                          <Slider
                            value={traits[key as keyof BigFiveTraits]}
                            onChange={handleTraitChange(key as keyof BigFiveTraits)}
                            min={1}
                            max={10}
                            step={1}
                            marks
                            valueLabelDisplay="on"
                            sx={{
                              '& .MuiSlider-thumb': {
                                width: 20,
                                height: 20,
                              },
                            }}
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {trait.low}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {trait.high}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                  
                  <FormHelperText sx={{ mb: 2 }}>
                    Don't worry - these traits will adapt over time based on your journal entries!
                  </FormHelperText>
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      sx={{ mr: 1 }}
                    >
                      Create Account
                    </Button>
                    <Button
                      onClick={handleBack}
                      sx={{ mr: 1 }}
                    >
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            </Stepper>
          </CardContent>
        </Card>

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/login')}
              sx={{
                fontWeight: 600,
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default RegisterPage;