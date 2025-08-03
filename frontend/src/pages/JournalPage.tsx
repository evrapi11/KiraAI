import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Fab,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  Search,
  Tag,
  Mood,
  Save,
  Cancel,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { JournalEntry, JournalEntryCreate, JournalEntryUpdate } from '../types';
import { journalAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const JournalPage: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; entryId: string } | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood_rating: 5,
    tags: [] as string[],
    newTag: '',
  });

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await journalAPI.getEntries();
      setEntries(data);
    } catch (err: any) {
      setError('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (entry?: JournalEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        title: entry.title,
        content: entry.content,
        mood_rating: entry.mood_rating || 5,
        tags: entry.tags,
        newTag: '',
      });
    } else {
      setEditingEntry(null);
      setFormData({
        title: '',
        content: '',
        mood_rating: 5,
        tags: [],
        newTag: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEntry(null);
    setError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddTag = () => {
    if (formData.newTag && !formData.tags.includes(formData.newTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.newTag],
        newTag: '',
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      setError('Please fill in title and content');
      return;
    }

    try {
      const entryData = {
        title: formData.title,
        content: formData.content,
        mood_rating: formData.mood_rating,
        tags: formData.tags,
      };

      if (editingEntry) {
        const updated = await journalAPI.updateEntry(editingEntry.id, entryData);
        setEntries(entries.map(entry => 
          entry.id === editingEntry.id ? updated : entry
        ));
      } else {
        const newEntry = await journalAPI.createEntry(entryData);
        setEntries([newEntry, ...entries]);
      }

      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save entry');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await journalAPI.deleteEntry(entryId);
      setEntries(entries.filter(entry => entry.id !== entryId));
      setMenuAnchor(null);
    } catch (err: any) {
      setError('Failed to delete entry');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, entryId: string) => {
    setMenuAnchor({ element: event.currentTarget, entryId });
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getMoodColor = (rating?: number) => {
    if (!rating) return '#6B7280';
    if (rating <= 3) return '#F87171';
    if (rating <= 6) return '#FBBF24';
    return '#10B981';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LoadingSpinner message="Loading your journal..." />
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
          Journal
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Capture your thoughts, experiences, and insights
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ whiteSpace: 'nowrap' }}
          >
            New Entry
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {filteredEntries.map((entry) => (
          <Grid item xs={12} md={6} lg={4} key={entry.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  boxShadow: 2,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                    {entry.title}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, entry.id)}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {entry.content}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Mood sx={{ fontSize: 16, color: getMoodColor(entry.mood_rating) }} />
                  <Rating
                    value={entry.mood_rating || 5}
                    max={10}
                    size="small"
                    readOnly
                    sx={{ 
                      '& .MuiRating-iconFilled': {
                        color: getMoodColor(entry.mood_rating),
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {entry.mood_rating}/10
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {entry.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>

                <Divider sx={{ my: 1 }} />

                <Typography variant="caption" color="text.secondary">
                  {format(new Date(entry.created_at), 'MMM dd, yyyy • h:mm a')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredEntries.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm ? 'No entries found' : 'No journal entries yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm ? 'Try adjusting your search term' : 'Start your mindful journey by creating your first entry'}
          </Typography>
          {!searchTerm && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Create First Entry
            </Button>
          )}
        </Box>
      )}

      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            const entry = entries.find(e => e.id === menuAnchor?.entryId);
            if (entry) {
              handleOpenDialog(entry);
            }
            handleMenuClose();
          }}
        >
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuAnchor?.entryId) {
              handleDeleteEntry(menuAnchor.entryId);
            }
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          {editingEntry ? 'Edit Entry' : 'New Journal Entry'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            margin="normal"
            multiline
            rows={8}
            required
            placeholder="What's on your mind today?"
          />

          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Mood Rating (1-10)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Rating
                value={formData.mood_rating}
                onChange={(_, newValue) => {
                  setFormData({ ...formData, mood_rating: newValue || 5 });
                }}
                max={10}
                sx={{
                  '& .MuiRating-iconFilled': {
                    color: getMoodColor(formData.mood_rating),
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {formData.mood_rating}/10
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              {formData.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  size="small"
                />
              ))}
            </Box>
            <TextField
              fullWidth
              label="Add tag"
              value={formData.newTag}
              onChange={(e) => setFormData({ ...formData, newTag: e.target.value })}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleAddTag} edge="end">
                      <Tag />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={handleCloseDialog} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<Save />}
          >
            {editingEntry ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', md: 'none' },
        }}
        onClick={() => handleOpenDialog()}
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default JournalPage;