import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const LoginPage = ({ onLogin }) => {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState(''); // Can be username or email
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!identifier || !password) {
            setError('Please enter your username and password.');
            return;
        }
    
        try {
            const response = await axios.post(
		`${process.env.REACT_APP_API_URL}/api/login`, 
		{ identifier, password},
		{ withCredentials: true}
	    );

            if (response.data.token) {
                localStorage.setItem("authUsername", response.data.username);
                onLogin(response.data.token);
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-logo-container">
                    <img src="/anat security logo.png" alt="ANAT Security Logo" className="login-logo-image" />
                </div>
                {error && <p className="login-error-message">{error}</p>}
                <div className="login-input-container">
                    <label className="login-input-label" htmlFor="identifier">Username</label>
                    <input
                        className="login-input-field"
                        id="identifier"
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                    />
                </div>
                <div className="login-input-container">
                    <label className="login-input-label" htmlFor="password">Password</label>
                    <input
                        className="login-input-field"
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div className="login-button-container">
                    <button className="login-btn" onClick={handleLogin}>Login</button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
