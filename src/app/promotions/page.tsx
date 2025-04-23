// app/promotions/page.tsx
'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Container,
  Grid,
  Divider
} from '@mui/material';
import { 
  StarBorder,
  StarHalf,
  Star,
  ArrowUpward,
  AssignmentTurnedIn,
  SupervisedUserCircle,
  EmojiEvents
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

// Custom styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  height: '100%'
}));

const MotionBox = motion(Box);
const MotionPaper = motion(StyledPaper);

export default function PromotionsPage() {
  const promotionSteps = [
    {
      title: 'Member',
      icon: <StarBorder sx={{ color: '#60a5fa', fontSize: 40 }} />,
      responsibilities: [
        'Meet minimum clan war medal requirements',
        'Active participation in clan activities',
        'Regular donations',
        'Positive attitude in clan chat'
      ]
    },
    {
      title: 'Elder',
      icon: <StarHalf sx={{ color: '#fbbf24', fontSize: 40 }} />,
      responsibilities: [
        'Recruit new members',
        'Encourage lower-level members',
        'Maintain clan communication'
      ],
      promotionRequirements: [
        'Active for 2+ months',
        '2000+ clan war medals for 4 consecutive weeks',
        'Active in clan chat',
        'Recommended by current Co-Leader or Leader',
      ]
    },
    {
      title: 'Co-Leader',
      icon: <Star sx={{ color: '#10b981', fontSize: 40 }} />,
      responsibilities: [
        'Clan management rights',
        'Kick/Promote members',
        'Set clan war strategies',
        'Resolve conflicts',
      ],
      promotionRequirements: [
        'Active for 6+ months',
        'Consistently 2000+ clan war medals per war',
        'Proven track record of clan support',
        'Trust and recommendation from Leader',
        'Exceptional communication skills'
      ]
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        sx={{ mb: 6, textAlign: 'center' }}
      >
        <Typography variant="h2" component="h1" sx={{ 
          fontWeight: 800, 
          color: 'white',
          mb: 2
        }}>
          Clan Progression Tiers
        </Typography>
        <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          Your path to leadership starts here
        </Typography>
      </MotionBox>

      <Grid container spacing={4} rowSpacing={6}>
        {promotionSteps.map((tier, index) => (
          <Grid item xs={12} md={4} key={tier.title}>
            <MotionPaper
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: 0.2 * (index + 1), 
                duration: 0.5 
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                mb: 2 
              }}>
                {tier.icon}
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700, 
                    color: 'white', 
                    mt: 2 
                  }}
                >
                  {tier.title}
                </Typography>
              </Box>

              <Divider sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                my: 2 
              }} />

              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'white', 
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <AssignmentTurnedIn sx={{ mr: 1, color: '#38bdf8' }} />
                  Responsibilities
                </Typography>
                <List>
                  {tier.responsibilities.map((resp, i) => (
                    <ListItem key={i} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <ArrowUpward sx={{ color: '#4ade80' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={resp} 
                        primaryTypographyProps={{ 
                          sx: { color: 'white' } 
                        }} 
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Divider sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                my: 2 
              }} />

              <Box>
               { tier.promotionRequirements && <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'white', 
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <EmojiEvents sx={{ mr: 1, color: '#f472b6' }} />
                  Promotion Requirements
                </Typography>}
                <List>
                  {tier.promotionRequirements?.map((req, i) => (
                    <ListItem key={i} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <SupervisedUserCircle sx={{ color: '#a78bfa' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={req} 
                        primaryTypographyProps={{ 
                          sx: { color: 'white' } 
                        }} 
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </MotionPaper>
          </Grid>
        ))}
      </Grid>

      <MotionBox
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        sx={{ 
          mt: 6, 
          textAlign: 'center',
          p: 3,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 2
        }}
      >
        <Typography variant="h5" sx={{ mb: 2, color: 'white' }}>
          Leadership is Earned, Not Given
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 3 }}>
          Demonstrate consistent dedication, skill, and positive attitude to progress through our ranks.
        </Typography>
      </MotionBox>
    </Container>
  );
}