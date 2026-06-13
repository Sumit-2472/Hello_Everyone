import React, { useState } from 'react';
import { loginUser } from '../services/api';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await loginUser({ email, password });
      console.log("Success:", response.data);
      alert("Login Success!");
    } catch (err: any) {
      // Catch specific errors from the backend
      const errorMessage = err.response?.data?.detail || "Connection failed";
      console.error("Login Error:", errorMessage);
      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
      <button type="submit">Sign In</button>
    </form>
  );
};