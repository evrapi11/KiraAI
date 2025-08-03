import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    zen: {
      stone: string;
      bamboo: string;
      cherry: string;
      mist: string;
      ink: string;
      paper: string;
    };
  }

  interface PaletteOptions {
    zen?: {
      stone?: string;
      bamboo?: string;
      cherry?: string;
      mist?: string;
      ink?: string;
      paper?: string;
    };
  }
}

const zenColors = {
  stone: '#6B7280',     // Zen stone gray
  bamboo: '#059669',    // Bamboo green
  cherry: '#F87171',    // Cherry blossom pink
  mist: '#F3F4F6',      // Morning mist
  ink: '#1F2937',       // Ink black
  paper: '#FEFEFE',     // Rice paper white
  sand: '#FEF3C7',      // Sand beige
  water: '#3B82F6'      // Water blue
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: zenColors.stone,
      light: '#9CA3AF',
      dark: '#4B5563',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: zenColors.bamboo,
      light: '#10B981',
      dark: '#047857',
      contrastText: '#FFFFFF',
    },
    background: {
      default: zenColors.mist,
      paper: zenColors.paper,
    },
    text: {
      primary: zenColors.ink,
      secondary: zenColors.stone,
    },
    zen: zenColors,
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans JP", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Noto Sans JP", "Inter", sans-serif',
      fontWeight: 700,
      fontSize: '3rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Noto Sans JP", "Inter", sans-serif',
      fontWeight: 600,
      fontSize: '2.25rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Noto Sans JP", "Inter", sans-serif',
      fontWeight: 600,
      fontSize: '1.875rem',
      lineHeight: 1.4,
    },
    h4: {
      fontFamily: '"Noto Sans JP", "Inter", sans-serif',
      fontWeight: 500,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontFamily: '"Noto Sans JP", "Inter", sans-serif',
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: 1.5,
    },
    h6: {
      fontFamily: '"Noto Sans JP", "Inter", sans-serif',
      fontWeight: 500,
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      letterSpacing: '0.01071em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '1rem',
          padding: '12px 24px',
          borderRadius: 12,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${zenColors.stone} 0%, ${zenColors.bamboo} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${zenColors.bamboo} 0%, ${zenColors.stone} 100%)`,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '& fieldset': {
              borderColor: '#E5E7EB',
            },
            '&:hover fieldset': {
              borderColor: zenColors.stone,
            },
            '&.Mui-focused fieldset': {
              borderColor: zenColors.bamboo,
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #F3F4F6',
        },
      },
    },
  },
});