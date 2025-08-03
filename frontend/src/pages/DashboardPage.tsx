import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  Divider,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  Psychology,
  Book,
  AutoAwesome,
  Mood,
  ChevronRight,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { JournalEntry, BigFiveTraits } from '../types';
import { journalAPI, traitsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [traits, setTraits] = useState<BigFiveTraits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [entriesData, traitsData] = await Promise.all([
        journalAPI.getEntries(0, 5),
        traitsAPI.getTraits(),
      ]);
      setRecentEntries(entriesData);
      setTraits(traitsData);
    } catch (err: any) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getTraitLabel = (key: string): string => {
    const labels: { [key: string]: string } = {
      openness: 'Openness',
      conscientiousness: 'Conscientiousness',
      extraversion: 'Extraversion',
      agreeableness: 'Agreeableness',
      neuroticism: 'Emotional Sensitivity',
    };
    return labels[key] || key;
  };

  const getTraitColor = (value: number): string => {
    if (value < 4) return '#F87171';
    if (value < 7) return '#FBBF24';
    return '#10B981';
  };

  const getWelcomeMessage = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getRecentMoodAverage = (): number | null => {
    const entriesWithMood = recentEntries.filter(entry => entry.mood_rating);
    if (entriesWithMood.length === 0) return null;
    
    const sum = entriesWithMood.reduce((acc, entry) => acc + (entry.mood_rating || 0), 0);
    return sum / entriesWithMood.length;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LoadingSpinner message="Loading your dashboard..." />
      </Container>
    );
  }

  const recentMoodAvg = getRecentMoodAverage();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontFamily: 'Noto Sans JP',
            fontWeight: 700,
            mb: 1,
          }}
        >
          {getWelcomeMessage()}, {user?.username}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to your mindful space for growth and reflection
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Quick Stats */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Card sx={{ textAlign: 'center', p: 2 }}>
                <Book sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  {recentEntries.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Recent Entries
                </Typography>
              </Card>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Card sx={{ textAlign: 'center', p: 2 }}>
                <Mood sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  {recentMoodAvg ? `${recentMoodAvg.toFixed(1)}/10` : 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg Mood
                </Typography>
              </Card>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Card sx={{ textAlign: 'center', p: 2 }}>
                <TrendingUp sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  {recentEntries.length > 0 ? 'Active' : 'Getting Started'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Journey Status
                </Typography>
              </Card>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Card sx={{ textAlign: 'center', p: 2 }}>
                <AutoAwesome sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  AI Ready
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Strategic Plan
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Book />}
                  onClick={() => navigate('/journal')}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  New Journal Entry
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Psychology />}
                  onClick={() => navigate('/strategic-plan')}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Generate Strategic Plan
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Personality Traits */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Your Personality Traits
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                These adapt based on your journal entries
              </Typography>
              
              {traits && (
                <Box sx={{ space: 2 }}>
                  {Object.entries(traits).map(([key, value]) => (
                    <Box key={key} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {getTraitLabel(key)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {value.toFixed(1)}/10
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(value / 10) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'action.hover',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            backgroundColor: getTraitColor(value),
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Journal Entries */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Recent Entries
                </Typography>
                <Button
                  size="small"
                  endIcon={<ChevronRight />}
                  onClick={() => navigate('/journal')}
                >
                  View All
                </Button>
              </Box>
              
              {recentEntries.length > 0 ? (
                <Box sx={{ space: 2 }}>
                  {recentEntries.slice(0, 3).map((entry, index) => (
                    <Box key={entry.id}>
                      <Box sx={{ display: 'flex', gap: 2, py: 1 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: 'primary.light',
                            fontSize: '0.875rem',
                          }}
                        >
                          {entry.title.charAt(0)}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {entry.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                            }}
                          >
                            {entry.content.slice(0, 60)}...
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(entry.created_at), 'MMM dd')}
                            </Typography>
                            {entry.mood_rating && (
                              <Chip
                                label={`${entry.mood_rating}/10`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.6rem', height: 16 }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                      {index < 2 && <Divider sx={{ my: 1 }} />}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    No entries yet
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/journal')}
                  >
                    Start Writing
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Zen Quote */}
        <Grid item xs={12}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'Noto Sans JP',
                  fontStyle: 'italic',
                  color: 'text.secondary',
                  mb: 1,
                }}
              >
                "The present moment is the only time over which we have dominion."
              </Typography>
              <Typography variant="caption" color="text.secondary">
                — Thích Nhất Hạnh
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;