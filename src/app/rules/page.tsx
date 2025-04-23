// app/rules/page.tsx
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
} from '@mui/material';
import { 
  CheckCircleOutlined, 
  ErrorOutlined, 
  FlashOn, 
  Assignment,
  GroupWork,
  EmojiEvents,
  Handshake
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

export default function RulesPage() {
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
          Clan Rules
        </Typography>
        <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          Follow these guidelines to maintain your membership and help our clan thrive
        </Typography>
      </MotionBox>

      <Grid container spacing={8}>
        {/* Requirements Section */}
        <Grid item xs={12} md={6}>
          <MotionPaper
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Assignment sx={{ mr: 1, color: '#a855f7' }} />
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700, color: 'white' }}>
                Requirements
              </Typography>
            </Box>
            <List disablePadding>
              {[
                'Minimum 6000 trophies to join',
                'King Level 12+',
                'Path Of Legends Best Season Master 3',
                '2000+ Battles Won'
              ].map((item, index) => (
                <ListItem key={index} sx={{ py: 0.75 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircleOutlined sx={{ color: '#86efac' }} />
                  </ListItemIcon>
                  <ListItemText primary={item} primaryTypographyProps={{ sx: { color: 'white' } }} />
                </ListItem>
              ))}
            </List>
          </MotionPaper>
        </Grid>

        {/* Earn Your Keep Section */}
        <Grid item xs={12} md={6}>
          <MotionPaper
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EmojiEvents sx={{ mr: 1, color: '#facc15' }} />
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700, color: 'white' }}>
                Earn Your Keep
              </Typography>
            </Box>
            <List disablePadding>
              {[
                'Participate in War. Add boat defense, attack, duel!',
                'Donate cards to clanmates',
                'Be active in clan chat',
                'Participate in clan events and tournaments',
              ].map((item, index) => (
                <ListItem key={index} sx={{ py: 0.75 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <FlashOn sx={{ color: '#fde047' }} />
                  </ListItemIcon>
                  <ListItemText primary={item} primaryTypographyProps={{ sx: { color: 'white' } }} />
                </ListItem>
              ))}
            </List>
          </MotionPaper>
        </Grid>

        {/* Don't Get Kicked Section */}
        <Grid item xs={12} md={6}>
          <MotionPaper
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ErrorOutlined sx={{ mr: 1, color: '#f87171' }} />
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700, color: 'white' }}>
                Don&apos;t Get Kicked
              </Typography>
            </Box>
            <List disablePadding>
              {[
                'Missing more than 2 war weeks in a row',
                'Inactive for 1 month',
                'Toxic behavior or harassment of clan members',
                'Promoting other clans in chat'
              ].map((item, index) => (
                <ListItem key={index} sx={{ py: 0.75 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <ErrorOutlined sx={{ color: '#f87171' }} />
                  </ListItemIcon>
                  <ListItemText primary={item} primaryTypographyProps={{ sx: { color: 'white' } }} />
                </ListItem>
              ))}
            </List>
          </MotionPaper>
        </Grid>

        {/* Soft Rules Section */}
        <Grid item xs={12} md={6}>
          <MotionPaper
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Handshake sx={{ mr: 1, color: '#93c5fd' }} />
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700, color: 'white' }}>
                Soft Rules
              </Typography>
            </Box>
            <List disablePadding>
              {[
                'Adult language is allowed, but no hate speech',
                'Help newer members with deck advice',
                'Participate in friendly battles to practice',
                'Notify leadership if you\'ll be inactive',
                'Vote on important clan decisions'
              ].map((item, index) => (
                <ListItem key={index} sx={{ py: 0.75 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <GroupWork sx={{ color: '#93c5fd' }} />
                  </ListItemIcon>
                  <ListItemText primary={item} primaryTypographyProps={{ sx: { color: 'white' } }} />
                </ListItem>
              ))}
            </List>
          </MotionPaper>
        </Grid>
      </Grid>

      <MotionBox
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        sx={{ mt: 10, textAlign: 'center' }}
      >
        <Typography variant="h6" sx={{ mb: 3, color: 'white' }}>
          Ready for battle? Follow these rules and help us climb to the top!
        </Typography>

      </MotionBox>
    </Container>
  );
}