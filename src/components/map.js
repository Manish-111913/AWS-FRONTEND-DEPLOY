import React, { useState } from 'react';
import { StandardCard } from '../styles/standardStyles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScaleBalanced } from '@fortawesome/free-solid-svg-icons';


const MapStep1 = ({ goTo }) => {
  const [isCardHovered, setCardHovered] = useState(false);

  const styles = {
    container: {
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '4.8rem 20px',
      fontFamily: 'Segoe UI, sans-serif',
      backgroundColor: '#ffffff',
      justifyContent: 'center',
    },
    heading: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '4px',
      color: '#000',
    },
    subheading: {
      fontSize: '16px',
      color: '#666',
      marginBottom: '20px',
    },
    icon: {
      fontSize: '48px',
      color: '#f97316',
      marginBottom: '20px',
    },
    title: {
      fontSize: '20px',
      fontWeight: 600,
      marginBottom: '16px',
      color: '#222',
    },
    description: {
      fontSize: '15px',
      color: '#444',
      marginBottom: '24px',
      lineHeight: '1.5',
    },
    button: {
      backgroundColor: 'black',
      color: '#fff',
      fontSize: '16px',
      fontWeight: 'bold',
      padding: '12px 24px',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Unit Mapping</h2>
      <p style={styles.subheading}>Step 1 of 3</p>

      <StandardCard
        className="unit-mapping-card"
        onMouseEnter={() => setCardHovered(true)}
        onMouseLeave={() => setCardHovered(false)}
        style={{
          maxWidth: '550px',
          textAlign: 'center',
          transform: isCardHovered ? 'scale(1.02)' : 'scale(1)',
          transition: 'transform 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '3rem'
        }}
      >
        <FontAwesomeIcon icon={faScaleBalanced} style={styles.icon} />
        <h3 style={styles.title}>Master Your Kitchen's Units</h3>
        <p style={styles.description}>
          Every kitchen is unique. Here, we'll teach Invexis how you measure things so your inventory,
          recipes, and costs are always perfectly accurate.
        </p>
        <button
          style={styles.button}
          onClick={() => goTo('map1')}
        >
          Let's Get Started
        </button>
      </StandardCard>
    </div>
  );
};

export default MapStep1;