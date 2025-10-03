import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import authService from '../services/authService';

export default function LoginScreen({ onLogin, onForgotPassword, onSignUp }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    // Clear previous error
    setErrorMessage('');

    // Basic validation
    if (!email.trim() || !password) {
      setErrorMessage('Email and password are required');
      return;
    }

    setLoading(true);

    try {
      const credentials = {
        email: email.trim().toLowerCase(),
        password
      };

      const response = await authService.signin(credentials);

      if (response.success) {
        // Call parent callback with user data
        if (onLogin) {
          onLogin(response.user);
        }
      }
    } catch (error) {
      if (error.message.includes('verify your email')) {
        setErrorMessage('Please verify your email address before signing in. Check your inbox for the verification link.');
      } else {
        setErrorMessage(error.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="center-wrapper">
        <div className="container-1">
          <span className="logo">🛒</span>
          <span className="title">INVEXIS</span>
          <div className="form">
            <div className="header">Sign In</div>
            <div className="instructions">Sign in to your Invexis account to continue.</div>
            <input
              className="input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoCapitalize="none"
            />
            <div className="password-wrapper">
              <input
                className="input password-input"
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            <div className="rememberRow">
              <button className="checkbox" onClick={() => setRememberMe(!rememberMe)}>
                <div className={`checkboxBox ${rememberMe ? 'checkboxChecked' : ''}`}>
                  {rememberMe && <span className="tickMark">&#10003;</span>}
                </div>
                <span className="rememberText">Remember me</span>
              </button>
            </div>
            <span className="caution">
              Caution: For personal devices only. Do not use on shared terminals.
            </span>
            
            {errorMessage && (
              <span className="errorText">{errorMessage}</span>
            )}
            
            <button 
              className="signInButton" 
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            <button className="forgotText" onClick={onForgotPassword}>
              Forgot password?
            </button>
            <span className="orText">or</span>
            <button className="signUpButton" onClick={onSignUp}>
              Sign Up
            </button>
          </div>
          <div className="bottomLinks">
            <a href="#" className="link">Terms of Service</a>
            <a href="#" className="link">Privacy Policy</a>
          </div>
        </div>
      </div>
      <style>
        {`
          .center-wrapper {
            height: 100vh !important;
            min-height: unset !important;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f7f7f7;
          }
          .container-1 {
            // max-width: 600px;
            width: 100vw;
            height: 100vh !important;
            min-height: unset !important;
            padding: 25px;
            font-family: Arial, sans-serif;
            background: url('/assets/Landingpageimage.png') no-repeat center center;
            background-size: cover;
            background-blend-mode: lighten;
            // box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(4px);
          }
          .logo {
            font-size: 48px;
            display: block;
            margin: 0 auto 8px auto;
            text-align: center;
          }
          .title {
            color: black;
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 2px;
            margin-bottom: 32px;
            display: block;
            text-align: center;
          }
          .header {
            font-size: 22px;
            font-weight: bold;
            color: #222;
            margin-bottom: 8px;
            text-align: left;
          }
          .instructions {
            color: #555;
            font-size: 15px;
            margin-bottom: 16px;
            text-align: left;
          }
          .form {
            background-color: transparent;
            padding: 30px;
            border-radius: 16px;
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          }
          .input {
            color: black;
            height: 48px;
            border: 2px solid #e74c3c;
            border-radius: 8px;
            margin-bottom: 16px;
            padding: 0 12px;
            background-color: rgba(0, 0, 0, 0.1);
            font-size: 16px;
            width: 100%;
            box-sizing: border-box;
            outline: 1px solid #000 !important;
            outline-offset: 0px;
            transition: border-color 0.2s, outline-color 0.2s;
          }
          .input:focus {
            border-color: #c0392b;
            outline: 1px solid #000 !important;
          }
          .input::placeholder {
            color: #black;
          }
          .password-wrapper {
            position: relative;
            width: 100%;
          }
          .password-input {
            padding-right: 40px; /* Space for the toggle button */
          }
          .toggle-password {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            font-size: 18px;
            color: #888;
            padding: 0;
            line-height: 1;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding-bottom: 17px;
          }
          .toggle-password:hover {
            color: #000;
          }
          .rememberRow {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
          }
          .checkbox {
            display: flex;
            align-items: center;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
          }
          .checkboxBox {
            width: 18px;
            height: 18px;
            border: 1px solid #fff;
            border-radius: 3px;
            margin-right: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            background: none;
          }
          .checkboxChecked {
            border-color: #fff;
          }
          .tickMark {
            color: #fff;
            font-size: 14px;
            line-height: 1;
            position: absolute;
            left: 2px;
            top: 1px;
            pointer-events: none;
          }
          .rememberText {
            color: #fff;
            font-size: 15px;
          }
          .caution {
            text-align:left;
            color: #E2B400;
            font-size: 12px;
            margin-bottom: 16px;
          }
          .signInButton {
            background-color: #222;
            color: #fff;
            padding: 14px 0;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 8px;
            cursor: pointer;
            border: none;
            width: 100%;
            transition: background-color 0.3s ease;
          }
          .signInButton:hover:not(:disabled) {
            background-color: #000;
          }
          .signInButton:disabled {
            background-color: #666;
            cursor: not-allowed;
          }
          .forgotText {
            color: #222;
            text-align: center;
            margin-top: 8px;
            text-decoration: underline;
            font-size: 15px;
            background: none;
            border: none;
            cursor: pointer;
          }
          .orText {
            color: #888;
            text-align: center;
            margin: 8px 0;
            font-size: 15px;
            font-weight: bold;
          }
          .signUpButton {
            background-color: #e74c3c;
            color: #fff;
            padding: 14px 0;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 8px;
            cursor: pointer;
            border: none;
            width: 100%;
          }
          .signUpButton:hover {
            background-color: #c0392b;
          }
          .bottomLinks {
            display: flex;
            justify-content: space-between;
            width: 80%;
            position: absolute;
            bottom: 24px;
          }
          .link {
            color: #fff;
            font-size: 13px;
            text-decoration: underline;
          }
          .errorText {
            color: #e74c3c;
            font-size: 13px;
            margin-bottom: 8px;
            text-align: center;
          }
        `}
      </style>
    </>
  );
}