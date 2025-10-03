import React, { useState } from 'react';
import AuthService from '../services/authService';

export default function SignUpScreen({ onBack }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      await AuthService.signup({ name, email, password, confirmPassword });
      alert("Signup successful! Check your email for verification.");
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <>
      <div className="center-wrapper">
        <div className="container-2">
          <span className="logo">🛒</span>
          <span className="title">INVEXIS</span>
          <div className="form">
            <div className="header">Sign Up</div>
            <div className="instructions">Create your Invexis account to get started.</div>
            <input
              className="input"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoCapitalize="none"
            />
            <input
              className="input"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              className="input"
              placeholder="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <span className="caution">
              Caution: For personal devices only. Do not use on shared terminals.
            </span>
            <button
              className="signUpButton"
              onClick={handleSignUp}
            >
              Sign Up
            </button>
            <button className="backText" onClick={onBack}>
              Already have an account? Sign In
            </button>
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
          .container-2 {
            // max-width: 600px;
            width: 100vw;
            height: 100vh !important;
            min-height: unset !important;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: url('/assets/Landingpageimage.png') no-repeat center center;
            background-size: cover;
            background-blend-mode: lighten;
            // border-radius: 16px;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          .logo {
            font-size: 48px;
            margin-bottom: 8px;
          }

          .title {
            color: black;
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 2px;
            margin-bottom: 32px;
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
            height: 48px;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 16px;
            padding: 0 12px;
            background-color: rgba(0, 0, 0, 0.1);
            font-size: 16px;
            color: black;
          }

          .input::placeholder {
            color: #black;
          }

          .caution {
            color: #E2B400;
            font-size: 12px;
            margin-bottom: 16px;
            text-align:left;
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
          }

          .signUpButton:hover {
            background-color: #c0392b;
          }

          .backText {
            color: #222;
            text-align: center;
            margin-top: 8px;
            text-decoration: underline;
            font-size: 15px;
            background: none;
            border: none;
            cursor: pointer;
          }
        `}
      </style>
    </>
  );
}