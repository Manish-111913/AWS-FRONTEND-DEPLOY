import React, { useEffect, useRef, useState } from 'react';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { StandardCard } from '../styles/standardStyles';
import UnitMappingService from '../services/unitMappingService';

const BackArrowIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;

const UnitMappingComplete = ({ goTo }) => {
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  // Complete the setup when component mounts
  useEffect(() => {
    completeSetup();
  }, []);

  const completeSetup = async () => {
    try {
      setCompleting(true);
      setError(null);
      const businessId = UnitMappingService.getBusinessId();
      const result = await UnitMappingService.completeSetup(businessId);
      console.log('Setup completed:', result);
    } catch (error) {
      console.error('Failed to complete setup:', error);
      setError('Failed to complete setup. You can still proceed to the dashboard.');
    } finally {
      setCompleting(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let confetti = [];
    const colors = ['#ffcc00', '#ff6666', '#66ccff', '#99ff99'];
    let animationFrameId;
    let confettiVisible = true;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confettiCount = 150;

    for (let i = 0; i < confettiCount; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        density: Math.random() * confettiCount,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngle: Math.random() * Math.PI,
        tiltAngleIncrement: (Math.random() * 0.07) + 0.05
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      confetti.forEach(c => {
        ctx.beginPath();
        ctx.lineWidth = c.r / 2;
        ctx.strokeStyle = c.color;
        ctx.moveTo(c.x + c.tilt + c.r / 4, c.y);
        ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r / 4);
        ctx.stroke();
      });
      update();
    };

    const update = () => {
      let anyVisible = false;

      confetti.forEach(c => {
        c.tiltAngle += c.tiltAngleIncrement;
        c.y += (Math.cos(c.density) + 3 + c.r / 2) / 2;
        c.x += Math.sin(c.tiltAngle) * 2;
        c.tilt = Math.sin(c.tiltAngle) * 15;

        // If still on screen, mark as visible
        if (c.y < canvas.height + 50) {
          anyVisible = true;
        }
      });

      // If none are visible, stop animation
      if (!anyVisible && confettiVisible) {
        confettiVisible = false;
        cancelAnimationFrame(animationFrameId);
        canvas.style.display = 'none';
      }
    };

    const animate = () => {
      draw();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      padding: '10px',
      textAlign: 'center',
      overflow: 'hidden'
    }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ 
        textAlign: 'center', 
        marginTop: '20px',
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
        zIndex: 1
      }}>
        <button
          onClick={() => goTo('map2')}
          style={{
            position: 'absolute',
            left: '0px',
            top: '2px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            color: '#000',
            padding: '8px',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            fontWeight: 'normal',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          <BackArrowIcon />
        </button>
        
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          margin: '0',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          Unit Mapping
        </h2>
        
        <p style={{ 
          color: 'green', 
          fontWeight: 'bold', 
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          Setup Complete!
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          minHeight: '50vh',
          width: '100%',
        }}>
          <StandardCard style={{
            width: '100vw',
            maxWidth: '600px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '3rem'
          }}>
          {completing ? (
            <>
              <div style={{ fontSize: '40px', color: '#666', marginBottom: '20px' }}>⏳</div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
                Completing Setup...
              </h3>
              <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>
                We're finalizing your unit mappings and preparing your system.
              </p>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center' }}>
                <FontAwesomeIcon icon={faCheck} style={{ fontSize: '40px', color: error ? '#ff9800' : 'green', marginBottom: '20px' }} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
                {error ? 'Setup Complete!' : 'You\'re All Set!'}
              </h3>
              <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>
                {error ? (
                  <>
                    Your unit mappings have been configured. {error}
                  </>
                ) : (
                  'Your unique unit mappings have been saved. Invexis will now use these to keep your inventory, recipes, and costs perfectly accurate.'
                )}
              </p>

              <button
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'black',
                  color: 'white',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'background 0.3s, transform 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
                onClick={() => goTo('owner-dashboard')}
              >
                Continue to Owner Dashboard
              </button>
            </>
          )}
  </StandardCard>
  </div>
      </div>
    </div>
  );
};

export default UnitMappingComplete;
