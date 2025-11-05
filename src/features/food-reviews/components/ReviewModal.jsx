import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  Rating,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  Checkbox,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const ReviewModal = ({ open, onClose, order, onSubmit }) => {
  const [ratings, setRatings] = useState({
    food: { taste: 0, freshness: 0, presentation: 0 },
    service: { staff: 0, speed: 0, ambiance: 0 },
    overall: 0
  });
  const [feedback, setFeedback] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);

  // Handle rating changes
  const handleRatingChange = (category, subCategory, newValue) => {
    setRatings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subCategory]: newValue
      }
    }));
  };

  // Handle overall rating calculation
  const calculateOverallRating = () => {
    const foodAvg = (ratings.food.taste + ratings.food.freshness + ratings.food.presentation) / 3;
    const serviceAvg = (ratings.service.staff + ratings.service.speed + ratings.service.ambiance) / 3;
    const overall = (foodAvg + serviceAvg) / 2;
    return Math.round(overall * 2) / 2; // Round to nearest 0.5
  };

  // Handle photo uploads
  const onDrop = (acceptedFiles) => {
    // In a real implementation, you would upload these files to a server
    // For now, we'll just store them in state
    setPhotos(prev => [...prev, ...acceptedFiles.map(file => URL.createObjectURL(file))]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: 'image/*',
    maxFiles: 3
  });

  // Handle form submission
  const handleSubmit = async () => {
    if (!order) return;

    // Validate required ratings
    const hasFoodRatings = ratings.food.taste > 0 && ratings.food.freshness > 0 && ratings.food.presentation > 0;
    const hasServiceRatings = ratings.service.staff > 0 && ratings.service.speed > 0 && ratings.service.ambiance > 0;
    
    if (!hasFoodRatings || !hasServiceRatings) {
      setSnackbar({
        open: true,
        message: 'Please provide ratings for all categories',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    
    try {
      const reviewData = {
        orderId: order._id,
        orderType: order.orderType,
        ratings: {
          ...ratings,
          overall: calculateOverallRating()
        },
        feedback,
        isAnonymous,
        photos: [], // In a real implementation, you would send actual photo URLs
        ...(order.bookingId && { bookingId: order.bookingId })
      };

      const res = await axios.post('/api/food-reviews/submit', reviewData);
      
      setSnackbar({
        open: true,
        message: 'Review submitted successfully!',
        severity: 'success'
      });
      
      if (onSubmit) onSubmit(res.data.data);
      setTimeout(onClose, 2000);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || 'Error submitting review',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Render service rating section based on order type
  const renderServiceRatings = () => {
    if (order.orderType === 'takeaway') {
      return (
        <>
          <Typography variant="h6" gutterBottom>
            Service Ratings
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography component="legend">Order Accuracy</Typography>
            <Rating
              value={ratings.service.staff}
              onChange={(event, newValue) => handleRatingChange('service', 'staff', newValue)}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography component="legend">Pickup Time</Typography>
            <Rating
              value={ratings.service.speed}
              onChange={(event, newValue) => handleRatingChange('service', 'speed', newValue)}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography component="legend">Packaging Quality</Typography>
            <Rating
              value={ratings.service.ambiance}
              onChange={(event, newValue) => handleRatingChange('service', 'ambiance', newValue)}
            />
          </Box>
        </>
      );
    } else {
      return (
        <>
          <Typography variant="h6" gutterBottom>
            Service Ratings
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography component="legend">Staff Friendliness</Typography>
            <Rating
              value={ratings.service.staff}
              onChange={(event, newValue) => handleRatingChange('service', 'staff', newValue)}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography component="legend">Service Speed</Typography>
            <Rating
              value={ratings.service.speed}
              onChange={(event, newValue) => handleRatingChange('service', 'speed', newValue)}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography component="legend">Ambiance</Typography>
            <Rating
              value={ratings.service.ambiance}
              onChange={(event, newValue) => handleRatingChange('service', 'ambiance', newValue)}
            />
          </Box>
        </>
      );
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: 600 },
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        
        <Typography variant="h5" component="h2" gutterBottom>
          Rate Your Experience
        </Typography>
        
        <Typography variant="body1" gutterBottom>
          Order #{order?._id?.substr(-6)}
        </Typography>
        
        {/* Food Ratings */}
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Food Ratings
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography component="legend">Taste</Typography>
          <Rating
            value={ratings.food.taste}
            onChange={(event, newValue) => handleRatingChange('food', 'taste', newValue)}
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography component="legend">Freshness</Typography>
          <Rating
            value={ratings.food.freshness}
            onChange={(event, newValue) => handleRatingChange('food', 'freshness', newValue)}
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography component="legend">Presentation</Typography>
          <Rating
            value={ratings.food.presentation}
            onChange={(event, newValue) => handleRatingChange('food', 'presentation', newValue)}
          />
        </Box>
        
        {/* Service Ratings */}
        {renderServiceRatings()}
        
        {/* Overall Rating */}
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Overall Rating
          </Typography>
          <Rating
            value={calculateOverallRating()}
            readOnly
            precision={0.5}
          />
          <Typography component="legend">
            {calculateOverallRating()} out of 5 stars
          </Typography>
        </Box>
        
        {/* Feedback */}
        <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
          <TextField
            label="Additional Feedback (Optional)"
            multiline
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText={`${feedback.length}/500 characters`}
          />
        </FormControl>
        
        {/* Photo Upload */}
        <div {...getRootProps()} style={{
          border: '2px dashed #ccc',
          borderRadius: '4px',
          padding: '20px',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: '20px'
        }}>
          <input {...getInputProps()} />
          <p>Drag & drop photos here, or click to select files (Max 3)</p>
          <em>(Only image files will be accepted)</em>
        </div>
        
        {photos.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Uploaded Photos:</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {photos.map((photo, index) => (
                <img 
                  key={index} 
                  src={photo} 
                  alt={`Review ${index}`} 
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }} 
                />
              ))}
            </Box>
          </Box>
        )}
        
        {/* Anonymous Option */}
        <FormControlLabel
          control={
            <Checkbox
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
          }
          label="Submit anonymously"
        />
        
        {/* Submit Button */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </Button>
        </Box>
        
        {/* Snackbar for messages */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Modal>
  );
};

export default ReviewModal;