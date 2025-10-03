import React from 'react';
import trucknewVideo from './trucknew.mp4';

// Simple, self-contained truck loading animation using video
// The component unmounts automatically when data loads
const TruckLoader = ({ message = 'Delivering fresh stock…' }) => {
  return (
    <div className="truck-loading">
      <div className="truck-scene" aria-label="Loading">
        {/* Video-based truck animation */}
        <div className="truck-video-container">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="truck-video"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              maxWidth: '500px',
              maxHeight: '350px'
            }}
          >
            <source src={trucknewVideo} type="video/mp4" />
            {/* Fallback message if video doesn't load */}
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
      <p className="truck-loading-text">{message}</p>
    </div>
  );
};

export default TruckLoader;
