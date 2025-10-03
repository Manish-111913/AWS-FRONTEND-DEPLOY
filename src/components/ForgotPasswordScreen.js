import React, { useState } from 'react';

export default function ForgotPasswordScreen({ onBack, onSendReset }) {
  const [email, setEmail] = useState('');

  return (
    <>
      <div className="center-wrapper">
        <div className="container-3">
          <span className="logo">🛒</span>
          <span className="title">INVEXIS</span>
          <div className="form">
            <div className="header">Forgot Password</div>
            <div className="instructions">Enter your email to receive a password reset link.</div>
            <input
              className="input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoCapitalize="none"
            />
            <button
              className="resetButton"
              onClick={() => onSendReset(email)}
            >
              Send Reset Link
            </button>
            <button className="backText" onClick={onBack}>
              Back to Sign In
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
          .container-3 {
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
            color: black;
            height: 48px;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 16px;
            padding: 0 12px;
            background-color: rgba(0, 0, 0, 0.1);
            font-size: 16px;
            width: 100%;
            box-sizing: border-box;
          }

          .input::placeholder {
            color: #black;
          }

          .resetButton {
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
          }

          .resetButton:hover {
            background-color: #000;
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
        `}
      </style>
    </>
  );
}