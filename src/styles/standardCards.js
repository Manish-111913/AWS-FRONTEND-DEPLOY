import React from 'react';
import './standardCards.css';

// Standard Card Component
export const StandardCard = ({ 
  children, 
  className = '', 
  onClick, 
  variant = 'default', // 'default', 'action', 'info', 'data'
  hover = true,
  goTo, // Extract goTo to prevent it from spreading to DOM
  screen, // Extract screen to prevent it from spreading to DOM
  ...props 
}) => {
  const cardClasses = [
    'standard-card',
    `standard-card--${variant}`,
    hover ? 'standard-card--hover' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

// Action Card Component (for dashboard-style action cards)
export const ActionCard = ({ 
  title, 
  icon, 
  onClick, 
  className = '',
  goTo, // Extract goTo to prevent it from spreading to DOM
  screen, // Extract screen to prevent it from spreading to DOM
  ...props 
}) => {
  return (
    <StandardCard 
      variant="action" 
      onClick={onClick} 
      className={`standard-action-card ${className}`}
      {...props}
    >
      <div className="standard-action-card__icon">
        {icon}
      </div>
      <p className="standard-action-card__title">
        {title}
      </p>
    </StandardCard>
  );
};

// Info Card Component (for data display cards)
export const InfoCard = ({ 
  title, 
  subtitle, 
  value, 
  trend, 
  onClick, 
  className = '',
  ...props 
}) => {
  return (
    <StandardCard 
      variant="info" 
      onClick={onClick} 
      className={`standard-info-card ${className}`}
      {...props}
    >
      {subtitle && <p className="standard-info-card__subtitle">{subtitle}</p>}
      {value && <p className="standard-info-card__value">{value}</p>}
      {trend && <div className="standard-info-card__trend">{trend}</div>}
      {title && <h3 className="standard-info-card__title">{title}</h3>}
    </StandardCard>
  );
};

// Data Card Component (for content-heavy cards)
export const DataCard = ({ 
  title, 
  children, 
  className = '',
  headerActions,
  ...props 
}) => {
  return (
    <StandardCard 
      variant="data" 
      className={`standard-data-card ${className}`}
      {...props}
    >
      {(title || headerActions) && (
        <div className="standard-data-card__header">
          {title && <h3 className="standard-data-card__title">{title}</h3>}
          {headerActions && <div className="standard-data-card__actions">{headerActions}</div>}
        </div>
      )}
      <div className="standard-data-card__content">
        {children}
      </div>
    </StandardCard>
  );
};

export default { StandardCard, ActionCard, InfoCard, DataCard };
