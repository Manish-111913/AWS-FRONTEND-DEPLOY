import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faUsers, faSignal, faCashRegister, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FaChevronDown } from 'react-icons/fa';

const OnboardingPage = ({ onContinue }) => {
  const [businessType, setBusinessType] = useState('');
  const [numWorkers, setNumWorkers] = useState(1);
  const [machineType, setMachineType] = useState('');
  const [progress, setProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  
  // Custom dropdown states (from map1.js)
  const [dropdowns, setDropdowns] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  
  // Dropdown options data
  const businessTypeOptions = [
    { value: 'Restaurant', label: 'Restaurant' },
    { value: 'Cafe', label: 'Cafe' },
    { value: 'Hotel', label: 'Hotel' },
    { value: 'Bar', label: 'Bar' }
  ];
  
  const machineTypeOptions = [
    { value: 'Terminal', label: 'Terminal (Computer)' },
    { value: 'POS', label: 'POS (Point of Sale)' },
    { value: 'QR', label: 'QR' }
  ];

  useEffect(() => {
    const totalFields = 3;
    let completedFields = 0;
    if (businessType) completedFields++;
    if (numWorkers > 0) completedFields++;
    if (machineType) completedFields++;

    setProgress((completedFields / totalFields) * 100);
    setCompletedCount(completedFields);
  }, [businessType, numWorkers, machineType]);

  const businessSizeName = useMemo(() => {
    if (numWorkers <= 10) return 'Small';
    if (numWorkers <= 50) return 'Medium';
    return 'Large';
  }, [numWorkers]);

  // Dropdown functions (from map1.js)
  const toggleDropdown = (type) => {
    setDropdowns(prev => ({
      ...prev,
      [type]: prev[type] === type ? null : type,
    }));
  };

  const handleSelect = (type, value) => {
    if (type === 'businessType') {
      setBusinessType(value);
    } else if (type === 'machineType') {
      setMachineType(value);
    }
    setDropdowns(prev => ({ ...prev, [type]: null }));
  };

  const handleSearchChange = (type, value) => {
    setSearchTerms(prev => ({ ...prev, [type]: value }));
  };

  const filteredOptions = (type, search) => {
    const options = type === 'businessType' ? businessTypeOptions : machineTypeOptions;
    return options.filter(option => 
      option.label.toLowerCase().includes((search || '').toLowerCase())
    );
  };

  // Get dropdown position
  const getDropdownPosition = (element) => {
    if (!element) return {};
    const rect = element.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width
    };
  };

  // Close dropdown when clicking outside (from map1.js)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-dropdown-wrapper')) {
        setDropdowns({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleContinue = () => {
    if (businessType && machineType && numWorkers > 0) {
      // Optionally persist selection, then proceed
      try {
        const data = { businessType, numWorkers, machineType, businessSizeName };
        localStorage.setItem('invexis:onboarding', JSON.stringify({ ...data, completedAt: Date.now() }));
      } catch (e) {
        // no-op if storage fails
      }
      if (onContinue) {
        onContinue({ businessType, numWorkers, machineType, businessSizeName });
      }
    } else {
      alert('Please select all options');
    }
  };

  const handleIncrement = () => setNumWorkers(prev => prev + 1);
  const handleDecrement = () => setNumWorkers(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <>
      <div className="onboarding-container-1">
        <div className="header-content">
          <h1 className="main-heading">Invexis</h1>
          <p className="sub-heading">Help us customize Invexis for your specific needs</p>
        </div>

        <div className="centered-content">
          <div className="progress-bar-container">
            <div className="progress-bar-filled" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="progress-text">{completedCount} out of 3 completed</p>

          <div className="form-content">
            <div className="form-card">
              <div className="form-group">
                <h2 className="onboarding-heading">
                  <FontAwesomeIcon icon={faStore} className="heading-icon" />
                  Business Type
                </h2>
                <div className="custom-dropdown-wrapper">
                  <div
                    onClick={() => toggleDropdown('businessType')}
                    className="custom-dropdown-trigger"
                    onMouseEnter={e => e.currentTarget.style.border = '1px solid black'}
                    onMouseLeave={e => e.currentTarget.style.border = '1px solid #ddd'}
                  >
                    <span>{businessType || 'Select business type'}</span>
                    <FaChevronDown />
                  </div>

                  {dropdowns.businessType && (
                    <div 
                      className="custom-dropdown-content"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 9999
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Search business type..."
                        value={searchTerms.businessType || ''}
                        onChange={(e) => handleSearchChange('businessType', e.target.value)}
                        className="dropdown-search-input"
                      />
                      <div className="dropdown-options-container">
                        {filteredOptions('businessType', searchTerms.businessType).length === 0 ? (
                          <div className="no-options-message">
                            No business types match your search
                          </div>
                        ) : (
                          filteredOptions('businessType', searchTerms.businessType).map((option, i) => (
                            <div
                              key={i}
                              onClick={() => handleSelect('businessType', option.value)}
                              className="dropdown-option-item"
                              style={{
                                backgroundColor: businessType === option.value ? 'whitesmoke' : 'white',
                                color: businessType === option.value ? 'black' : '#000'
                              }}
                            >
                              <div>{option.label}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <h2 className="onboarding-heading">
                  <FontAwesomeIcon icon={faUsers} className="heading-icon" />
                  Number of workers
                </h2>
                <div className="worker-counter">
                  <button onClick={handleDecrement} className="counter-btn">−</button>
                  <input
                    className="worker-count-input"
                    type="number"
                    min="1"
                    value={numWorkers}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      setNumWorkers(isNaN(val) || val < 1 ? 1 : val);
                    }}
                    style={{ width: 60, textAlign: 'center', fontWeight: 'bold', fontSize: 18, border: '2px solid white', background: 'transparent' }}
                  />
                  <button onClick={handleIncrement} className="counter-btn">+</button>
                </div>
              </div>

              <div className="form-group">
                <h2 className="onboarding-heading">
                  <FontAwesomeIcon icon={faSignal} className="heading-icon" />
                  Size of Business
                </h2>
                <div className="business-size-display">{businessSizeName}</div>
              </div>

              <div className="form-group">
                <h2 className="onboarding-heading">
                  <FontAwesomeIcon icon={faCashRegister} className="heading-icon" />
                  Billing Machine Type
                </h2>
                <div className="custom-dropdown-wrapper">
                  <div
                    onClick={() => toggleDropdown('machineType')}
                    className="custom-dropdown-trigger"
                    onMouseEnter={e => e.currentTarget.style.border = '1px solid black'}
                    onMouseLeave={e => e.currentTarget.style.border = '1px solid #ddd'}
                  >
                    <span>{machineType ? machineTypeOptions.find(opt => opt.value === machineType)?.label : 'Select machine type'}</span>
                    <FaChevronDown />
                  </div>

                  {dropdowns.machineType && (
                    <div 
                      className="custom-dropdown-content"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 9999
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Search machine type..."
                        value={searchTerms.machineType || ''}
                        onChange={(e) => handleSearchChange('machineType', e.target.value)}
                        className="dropdown-search-input"
                      />
                      <div className="dropdown-options-container">
                        {filteredOptions('machineType', searchTerms.machineType).length === 0 ? (
                          <div className="no-options-message">
                            No machine types match your search
                          </div>
                        ) : (
                          filteredOptions('machineType', searchTerms.machineType).map((option, i) => (
                            <div
                              key={i}
                              onClick={() => handleSelect('machineType', option.value)}
                              className="dropdown-option-item"
                              style={{
                                backgroundColor: machineType === option.value ? 'whitesmoke' : 'white',
                                color: machineType === option.value ? 'black' : '#000'
                              }}
                            >
                              <div>{option.label}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="button-container-fixed">
          <button onClick={handleContinue}>Continue</button>
        </div>
      </div>

      <style>
        {`
          .onboarding-container-1 {
            max-width: 600px;
            width: 100vw;
            margin: auto;
            padding: 40px 30px 20px 30px;
            font-family: Arial, sans-serif;
            background-color: #fff;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            box-sizing: border-box;
            position: relative;
          }

          .header-content {
            text-align: center;
            margin-bottom: 20px;
          }

          .main-heading {
            font-size: 2.5rem;
            margin: 0;
            font-family: Montserrat;
          }

          .sub-heading {
            color: #666;
            margin: 10px 0 20px 0;
          }

          .progress-bar-container {
            width: 100%;
            max-width: 500px;
            height: 8px;
            background-color: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
            margin: 0 auto;
          }

          .progress-bar-filled {
            height: 100%;
            background-color: #000;
            border-radius: 4px;
            transition: width 0.4s ease-in-out;
          }
          
          .progress-text {
            text-align: center;
            color: #666;
            font-size: 0.9rem;
            margin: 8px 0 30px 0;
          }

          .centered-content {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            /* No scrolling here */
          }

          .form-content {
            width: 100%;
            text-align: left;
            padding: 0;
            border-radius: 0;
          }
        .form-card {
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 4px 24px 0 rgba(0,0,0,0.10), 0 1.5px 4px 0 rgba(0,0,0,0.08);
          padding: 0;
          margin-bottom: 24px;
          width: 100%;
          box-sizing: border-box;
          overflow: visible;
        }
            .form-card .form-group {
              padding-left: 0;
              padding-right: 0;
            }
            .form-card .onboarding-heading {
              margin-left: 0;
              padding-left: 0;
            }

          .form-group {
            margin-bottom: 25px;
          }
          .form-group:last-child {
             margin-bottom: 0;
          }

          .onboarding-heading {
            color: #000000ff;
            margin-bottom: 10px;
            font-size: 1.4rem;
            line-height: 24px;
            padding: 1rem 0 0.2rem 0;
            display: flex;
            align-items: center;
          }
          
          .heading-icon {
            margin-right: 12px;
            color: #000000ff;
            font-size: 1.25rem;
          }

          /* Custom Dropdown Styles - Exact copy from map1.js */
          .custom-dropdown-wrapper {
            position: relative;
            width: 100%;
            margin-bottom: 10px;
          }

          .custom-dropdown-trigger {
            border: 1px solid #ddd;
            cursor: pointer;
            backgroundColor: #fff;
            color: black;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-radius: 8px;
            transition: border 0.2s ease-in-out;
            width: 100%;
            height: 44px;
            box-sizing: border-box;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }

          .custom-dropdown-content {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            z-index: 9999;
            background-color: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            padding: 10px;
            max-height: 240px;
            overflow: hidden;
          }

          .dropdown-search-input {
            width: 100%;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid #ddd;
            margin-bottom: 8px;
            box-sizing: border-box;
          }

          .dropdown-options-container {
            max-height: 150px;
            overflow-y: auto;
          }

          .dropdown-option-item {
            padding: 10px;
            border-radius: 8px;
            cursor: pointer;
          }

          .dropdown-option-item:hover {
            background-color: #f5f5f5 !important;
          }

          .no-options-message {
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
          }

          .worker-counter, .business-size-display {
            width: 100%;
            padding: 15px;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 16px;
            box-sizing: border-box;
          }

          .worker-counter {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 10px;
            padding-bottom: 10px;
            border: 1px solid #272727ff;
          }

          .worker-count {
            font-size: 18px;
            font-weight: bold;
          }

          .business-size-display {
            font-weight: bold;
            background-color: #ffffffff;
            color: #000;
            border: 1px solid #000000ff;
          }
          
          .counter-btn {
            background-color: #f0f0f0;
            border: 1px solid #ccc;
            width: 32px;
            height: 32px;
            font-size: 24px;
            font-weight: bold;
            color: #000;
            cursor: pointer;
            line-height: 28px;
            text-align: center;
            padding: 1px 0 0 0;
          }

          .counter-btn:hover {
            background-color: #e0e0e0;
          }


          .button-container-fixed {
            width: 100%;
            display: flex;
            justify-content: center;
            background: transparent;
            box-shadow: none;
            padding: 32px 0 0 0;
          }
          .button-container-fixed button {
            width: 100%;
            max-width: 700px;
            font-size: 18px;
            padding: 18px 0;
            border-radius: 12px;
          }

          button {
            width: 100%;
            padding: 15px;
            background-color: #000;
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
          }

          button:hover {
            background-color: #000;
          }
          /* Thin scrollbar for form-content */
          .form-content::-webkit-scrollbar {
            width: 7px;
            background: #f0f0f0;
            border-radius: 8px;
          }
          .form-content::-webkit-scrollbar-thumb {
            background: #bbb;
            border-radius: 8px;
          }
          .form-content::-webkit-scrollbar-thumb:hover {
            background: #888;
          }
          .form-content {
            scrollbar-width: thin;
            scrollbar-color: #bbb #f0f0f0;
          }
          .worker-count-input::-webkit-inner-spin-button,
          .worker-count-input::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          .worker-count-input {
            -moz-appearance: textfield;
            appearance: textfield;
            outline: none !important;
            box-shadow: none !important;
          }
          .worker-count-input::-webkit-inner-spin-button,
          .worker-count-input::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        
          }
          .worker-count-input {
            -moz-appearance: textfield;
            appearance: textfield;
            outline: none !important;
          }
          .form-card {
            background: #fff;
             border-radius: 18px;
            box-shadow: 0 4px 24px 0 rgba(0,0,0,0.10), 0 1.5px 4px 0 rgba(0,0,0,0.08);
            padding: 32px 24px 24px 24px;
            margin-bottom: 24px;
          }
          body {
            background: #F7F8FA !important;
          }
        `}
      </style>
    </>
  );
};

export default OnboardingPage;