import React from 'react';
import './standardCards.css';

// Inject global styles to prevent autocomplete yellow highlighting
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    /* Prevent autocomplete yellow highlighting globally */
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 1000px white inset !important;
      -webkit-text-fill-color: #000 !important;
      box-shadow: 0 0 0 1000px white inset !important;
      transition: background-color 5000s ease-in-out 0s !important;
    }
    
    /* Remove autocomplete dropdown arrow */
    input::-webkit-calendar-picker-indicator {
      display: none !important;
    }
    
    /* Ensure consistent search input styling */
    input[type="search"] {
      -webkit-appearance: none;
      appearance: none;
    }
    
    /* Remove all borders and outlines for inputs globally */
    input[type="text"],
    input[type="search"],
    input {
      outline: none !important;
      border: none !important;
      box-shadow: none !important;
      background-color: transparent !important;
    }
    
    /* Specific override for inputs within StandardSearch component */
    div[style*="borderRadius"] input,
    .search-container input,
    .search-input {
      outline: none !important;
      border: none !important;
      box-shadow: none !important;
      background-color: transparent !important;
    }
  `;
  if (!document.head.querySelector('[data-autocomplete-fix]')) {
    styleSheet.setAttribute('data-autocomplete-fix', 'true');
    document.head.appendChild(styleSheet);
  }
}

// Standardized Search Component (based on abc.js implementation)
export const StandardSearch = ({ 
  value,
  onChange, 
  onClear, 
  placeholder = "Search...", 
  style = {}, 
  inputRef = null,
  showClearButton = true,
  onKeyDown = null,
  // Legacy prop support
  searchTerm,
  onSearchChange,
  onClearSearch
}) => {
  // Support both new and legacy prop names
  const searchValue = value !== undefined ? value : searchTerm;
  const handleChange = onChange || onSearchChange;
  const handleClear = onClear || onClearSearch;

  return (
    <div 
      style={{
        display: "flex",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: "10px",
        padding: "12px 20px",
        marginBottom: "20px",
        border: "none",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.06)",
        cursor: "text",
        ...style
      }}
      onClick={() => {
        if (inputRef && inputRef.current) {
          inputRef.current.focus();
        }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)";
      }}
    >
      {/* Search Icon */}
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="#999" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{ marginRight: "12px" }}
      >
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={searchValue || ''}
        onChange={(e) => {
          if (handleChange) {
            if (onChange) {
              // New API: pass value directly
              handleChange(e.target.value);
            } else {
              // Legacy API: pass event
              handleChange(e);
            }
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && handleClear) {
            handleClear();
          }
          if (onKeyDown) {
            onKeyDown(e);
          }
        }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        data-form-type="other"
        style={{
          flex: 1,
          border: "none",
          background: "transparent",
          fontSize: "16px",
          outline: "none",
          boxShadow: "none",
          color: "#000",
          fontFamily: "inherit",
          lineHeight: "1.4",
          // Prevent autocomplete yellow highlighting
          WebkitBoxShadow: "0 0 0 1000px white inset",
          WebkitTextFillColor: "#000",
          transition: "none"
        }}
      />
      
      {showClearButton && searchValue && (
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#999" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          onClick={handleClear}
          style={{
            marginLeft: "8px",
            cursor: "pointer",
            padding: "6px",
            borderRadius: "50%",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#f5f5f5";
            e.target.style.stroke = "#000";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent";
            e.target.style.stroke = "#999";
          }}
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      )}
    </div>
  );
};

// Standardized Scrollbar Styles Component (System Default with Arrows)
export const StandardScrollStyles = () => (
  <style>{`
    /* Global: thin, light scrollbars (matches report screens) */
    * {
      scrollbar-width: thin; /* Firefox */
      scrollbar-color: #cfd8dc #f0f2f5; /* thumb, track */
    }

    *::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    *::-webkit-scrollbar-track {
      background: #f0f2f5;
    }

    *::-webkit-scrollbar-thumb {
      background-color: #cfd8dc;
      border-radius: 8px;
    }

    *::-webkit-scrollbar-thumb:hover {
      background-color: #b0bec5;
    }

    /* Standard scrollbar utility for scrollable containers */
    .standard-scrollbar {
      overflow: auto;
      scrollbar-width: thin;
      scrollbar-color: #cfd8dc #f0f2f5;
    }

    /* Invisible scrollbars when explicitly desired */
    .hidden-scrollbar {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .hidden-scrollbar::-webkit-scrollbar {
      display: none;
    }

    /* Alternative darker theme (kept for opt-in use) */
    .dark-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #6b7280 #374151;
    }

    .dark-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    .dark-scrollbar::-webkit-scrollbar-track {
      background: #374151;
      border-radius: 3px;
    }

    .dark-scrollbar::-webkit-scrollbar-thumb {
      background-color: #6b7280;
      border-radius: 3px;
      transition: background-color 0.2s ease;
    }

    .dark-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: #9ca3af;
    }
  `}</style>
);

// Highlight matching text utility function (global style)
export const highlightMatch = (text, searchTerm) => {
  const baseStyle = { fontWeight: 500, fontSize: '15px', lineHeight: 1.4, color: 'inherit' };
  // Strong but clean highlight that's visible on white and colored cards
  const matchStyle = {
    fontWeight: 'bold',
    color: '#111',
    fontSize: '1.03rem',
  };

  const str = `${text ?? ''}`;
  if (!searchTerm || !searchTerm.trim()) {
    return <span style={baseStyle}>{str}</span>;
  }

  // Escape regex special chars in searchTerm for safe matching
  const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = str.split(regex);

  // Using index parity: odd indices are matches due to capturing group
  return parts.map((part, index) => (
    <span key={index} style={index % 2 === 1 ? { ...baseStyle, ...matchStyle } : baseStyle}>
      {part}
    </span>
  ));
};

// Smart search function (priority-based filtering)
export const smartSearch = (items, searchTerm, searchFields = ['name']) => {
  if (!searchTerm.trim()) return items;
  
  const searchLower = searchTerm.toLowerCase();
  const results = [];
  
  // Priority 1: Items starting with search term in primary field
  const startsWithMatches = items.filter(item => {
    const primaryField = item[searchFields[0]] || '';
    return primaryField.toLowerCase().startsWith(searchLower);
  });
  
  // Priority 2: Items containing search term in primary field (but not starting with it)
  const containsMatches = items.filter(item => {
    const primaryField = item[searchFields[0]] || '';
    return primaryField.toLowerCase().includes(searchLower) &&
           !primaryField.toLowerCase().startsWith(searchLower);
  });
  
  // Priority 3: Items matching other fields
  const otherMatches = items.filter(item => {
    const primaryField = item[searchFields[0]] || '';
    if (primaryField.toLowerCase().includes(searchLower)) return false;
    
    return searchFields.slice(1).some(field => {
      const fieldValue = item[field] || '';
      return fieldValue.toLowerCase().includes(searchLower);
    });
  });
  
  return [...startsWithMatches, ...containsMatches, ...otherMatches];
};

// Smart search function (priority-based filtering) - keeping both names for compatibility
export const performSmartSearch = (items, searchTerm, searchFields = ['name']) => {
  return smartSearch(items, searchTerm, searchFields);
};

// Standard line height utilities
export const standardLineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8
};

// Standard text sizing with proper line heights
export const standardTextSizes = {
  xs: { fontSize: '12px', lineHeight: standardLineHeights.normal },
  sm: { fontSize: '14px', lineHeight: standardLineHeights.normal },
  base: { fontSize: '16px', lineHeight: standardLineHeights.normal },
  lg: { fontSize: '18px', lineHeight: standardLineHeights.normal },
  xl: { fontSize: '20px', lineHeight: standardLineHeights.tight },
  '2xl': { fontSize: '24px', lineHeight: standardLineHeights.tight },
  '3xl': { fontSize: '30px', lineHeight: standardLineHeights.tight }
};

// Default text sizes (alias for base size)
export const defaultTextSizes = standardTextSizes.base;

// Inline scrollbar styles for direct use in style objects (System Default with Arrows)
export const standardScrollStyles = {
  overflowY: 'auto',
  overflowX: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: '#cfd8dc #f0f2f5'
};

// Export card components
export { StandardCard, ActionCard, InfoCard, DataCard } from './standardCards.js';

export default { 
  StandardSearch, 
  StandardScrollStyles, 
  highlightMatch, 
  smartSearch,
  performSmartSearch, 
  standardLineHeights, 
  standardTextSizes,
  defaultTextSizes,
  standardScrollStyles
};