import React from 'react';
import { StandardCard } from '../styles/standardStyles';
import './InventoryCalculator.css';

const InventoryCalculator = ({ goTo }) => {
  const logoUrl = process.env.PUBLIC_URL + '/logo192.png';
  return (
    <div className="ic-page">
      <div className="ic-title-wrapper">
        <h2 className="ic-title">Inventory Calculator</h2>
      </div>

      <StandardCard className="ic-card">
        <div className="ic-card-inner">
          <div className="ic-logo-circle">
            <img src={logoUrl} alt="Invexis logo" className="ic-logo" />
          </div>

          <h3 className="ic-heading">
            Calculate Your Starting
            <br />
            Inventory
          </h3>

          <p className="ic-desc">
            Instantly calculate your starting inventory with zero effort using two past purchase bills.
            Our system cross-references the data to set accurate stock levels automatically, skipping hours of
            manual counting.
          </p>

          <button className="ic-cta" onClick={() => goTo && goTo('stock-in-scan')}>
            Let's Get Started
          </button>
        </div>
      </StandardCard>

      <div className="ic-footnote">Get an immediate forecast of ingredient needs</div>
    </div>
  );
};

export default InventoryCalculator;
