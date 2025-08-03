import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Psychology,
  AutoAwesome,
  LightbulbOutlined,
  ExpandMore,
  Timeline,
  CheckCircle,
  Refresh,
  History,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { StrategicPlan } from '../types';
import { strategicPlanAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const StrategicPlanPage: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<StrategicPlan | null>(null);
  const [planHistory, setPlanHistory] = useState<StrategicPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  useEffect(() => {
    loadPlanHistory();
  }, []);

  const loadPlanHistory = async () => {
    try {
      setLoading(true);
      const history = await strategicPlanAPI.getPlanHistory();
      setPlanHistory(history);
      if (history.length > 0) {
        setCurrentPlan(history[0]);
      }
    } catch (err: any) {
      setError('Failed to load strategic plans');
    } finally {
      setLoading(false);
    }
  };

  const generateNewPlan = async () => {
    try {
      setGenerating(true);
      setError('');
      const newPlan = await strategicPlanAPI.generatePlan();
      setCurrentPlan(newPlan);
      setPlanHistory([newPlan, ...planHistory]);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate strategic plan. Make sure you have recent journal entries.');
    } finally {
      setGenerating(false);
    }
  };

  const selectPlan = (plan: StrategicPlan) => {
    setCurrentPlan(plan);
    setHistoryDialogOpen(false);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LoadingSpinner message="Loading your strategic plans..." />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
          Strategic Plan
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          AI-powered insights and recommendations for your personal growth journey
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={generating ? <LinearProgress sx={{ width: 20 }} /> : <AutoAwesome />}
            onClick={generateNewPlan}
            disabled={generating}
            sx={{ minWidth: 200 }}
          >
            {generating ? 'Generating...' : 'Generate New Plan'}
          </Button>
          
          {planHistory.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<History />}
              onClick={() => setHistoryDialogOpen(true)}
            >
              View History ({planHistory.length})
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {generating && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Psychology sx={{ color: 'primary.main', fontSize: 32 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Kira is analyzing your journey...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Reviewing your journal entries and personality traits to create personalized insights
                </Typography>
              </Box>
            </Box>
            <LinearProgress sx={{ mt: 2 }} />
          </CardContent>
        </Card>
      )}

      {currentPlan && (
        <Box sx={{ space: 3 }}>
          {/* Plan Header */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography
                    variant="h4"
                    component="h2"
                    sx={{
                      fontFamily: 'Noto Sans JP',
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    {currentPlan.title}
                  </Typography>
                  <Chip
                    label={`Generated ${format(new Date(currentPlan.generated_at), 'MMM dd, yyyy')}`}
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                </Box>
                <Button
                  startIcon={<Refresh />}
                  onClick={generateNewPlan}
                  disabled={generating}
                  size="small"
                >
                  Refresh
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Analysis Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Timeline sx={{ color: 'primary.main' }} />
                <Typography variant="h5" fontWeight={600}>
                  Current Life Analysis
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{
                  lineHeight: 1.7,
                  color: 'text.primary',
                }}
              >
                {currentPlan.analysis}
              </Typography>
            </CardContent>
          </Card>

          {/* Recommendations Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <CheckCircle sx={{ color: 'success.main' }} />
                <Typography variant="h5" fontWeight={600}>
                  Actionable Recommendations
                </Typography>
              </Box>
              <List>
                {currentPlan.recommendations.map((recommendation, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 1 }}>
                    <ListItemIcon>
                      <LightbulbOutlined sx={{ color: 'warning.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={recommendation}
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontSize: '1rem',
                          lineHeight: 1.6,
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Zen Insight Section */}
          {currentPlan.zen_insight && (
            <Card
              sx={{
                background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <AutoAwesome
                  sx={{
                    fontSize: 48,
                    color: 'primary.main',
                    mb: 2,
                    opacity: 0.8,
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: 'Noto Sans JP',
                    fontStyle: 'italic',
                    color: 'text.primary',
                    mb: 2,
                    lineHeight: 1.6,
                  }}
                >
                  "{currentPlan.zen_insight}"
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Zen Insight for Mindful Living
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {!currentPlan && !generating && !loading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Psychology
              sx={{
                fontSize: 64,
                color: 'action.disabled',
                mb: 2,
              }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Strategic Plan Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              Create your first strategic plan to receive AI-powered insights and recommendations 
              based on your journal entries and personality traits.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AutoAwesome />}
              onClick={generateNewPlan}
              size="large"
            >
              Generate Your First Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>Strategic Plan History</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Review your past strategic plans and track your growth journey.
          </Typography>
          
          {planHistory.map((plan, index) => (
            <Accordion key={plan.id} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                  <Typography variant="subtitle1" fontWeight={500}>
                    {plan.title}
                  </Typography>
                  <Chip
                    label={format(new Date(plan.generated_at), 'MMM dd, yyyy')}
                    size="small"
                    variant={index === 0 ? 'filled' : 'outlined'}
                    color={index === 0 ? 'primary' : 'default'}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {plan.analysis.slice(0, 200)}...
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {plan.recommendations.length} recommendations
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => selectPlan(plan)}
                    variant={currentPlan?.id === plan.id ? 'contained' : 'outlined'}
                  >
                    {currentPlan?.id === plan.id ? 'Current' : 'View Plan'}
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StrategicPlanPage;