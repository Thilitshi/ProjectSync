import React, { useState, useEffect } from 'react';
import CreateProject from './components/CreateProject';
import Feed from './components/Feed';
import CelebrationWall from './components/CelebrationWall';
import MyProjects from './components/MyProjects';

// API Base URL - uses environment variable or defaults to localhost
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  // ALL HOOKS AT TOP LEVEL
  const [page, setPage] = useState('home');
  const [resetToken, setResetToken] = useState(null);
  
  // Register form state
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  
  // Reset password state
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  // Check for reset token in URL on load
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/reset-password/')) {
      const token = path.split('/reset-password/')[1];
      if (token) {
        setResetToken(token);
        setPage('reset-password');
        window.history.replaceState({}, '', '/');
      }
    }
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      fetch(`${API}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data._id) {
            setUser(data);
            setPage('dashboard');
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
  }, []);

  // HANDLER FUNCTIONS
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setLoginData({ email: '', password: '' });
      setPage('dashboard');
      
    } catch (err) {
      setError('Cannot connect to server');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }
      
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setFormData({ username: '', email: '', password: '', confirmPassword: '' });
      setPage('dashboard');
      
    } catch (err) {
      setError('Cannot connect to server');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setPage('home');
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      
      const data = await res.json();
      setForgotMessage(data.message || data.error);
      
      if (res.ok) {
        setForgotEmail('');
      }
    } catch (err) {
      setForgotMessage('Failed to send reset email');
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    
    if (resetPassword !== resetConfirm) {
      setError('Passwords do not match');
      return;
    }
    if (resetPassword.length < 6) {
      setError('Password must be 6+ characters');
      return;
    }

    try {
      const res = await fetch(`${API}/auth/reset-password/${resetToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPassword })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('Password reset successful! Please login with your new password.');
        setResetToken(null);
        setResetPassword('');
        setResetConfirm('');
        setError('');
        setPage('login');
      } else {
        setError(data.error || 'Reset failed');
      }
    } catch (err) {
      setError('Failed to reset password');
    }
  };

  //DASHBOARD PAGE (Main) 
  if (page === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black text-white">
        {/* Navigation */}
        <nav className="bg-gray-800/50 border-b border-gray-700 p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo-transparent.png" alt="ProjectSync" className="w-8 h-8 object-contain bg-black/40 rounded p-1" />
              <span className="font-bold text-green-400 text-xl">ProjectSync</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setPage('feed')}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Live Feed
              </button>
              <button 
                onClick={() => setPage('my-projects')}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                My Projects
              </button>
              <button 
                onClick={() => setPage('celebration')}
                className="px-4 py-2 text-yellow-400 hover:text-yellow-300"
              >
                🎉 Wall
              </button>
              <button 
                onClick={() => setPage('create-project')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + New Project
              </button>
              <span className="text-gray-400">|</span>
              <span className="text-gray-300">{user?.username}</span>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Welcome back, {user?.username}! 👋</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div 
                onClick={() => setPage('feed')}
                className="bg-gray-800 p-6 rounded-2xl cursor-pointer hover:bg-gray-700 transition border border-gray-700"
              >
                <div className="text-3xl mb-3">📡</div>
                <h3 className="font-bold text-lg">Live Feed</h3>
                <p className="text-gray-400 text-sm">See what others are building</p>
              </div>
              
              <div 
                onClick={() => setPage('my-projects')}
                className="bg-gray-800 p-6 rounded-2xl cursor-pointer hover:bg-gray-700 transition border border-gray-700"
              >
                <div className="text-3xl mb-3">📁</div>
                <h3 className="font-bold text-lg">My Projects</h3>
                <p className="text-gray-400 text-sm">Manage your builds</p>
              </div>
              
              <div 
                onClick={() => setPage('celebration')}
                className="bg-gradient-to-br from-yellow-600/20 to-green-600/20 p-6 rounded-2xl cursor-pointer hover:from-yellow-600/30 hover:to-green-600/30 transition border border-yellow-500/30"
              >
                <div className="text-3xl mb-3">🏆</div>
                <h3 className="font-bold text-lg text-yellow-400">Celebration Wall</h3>
                <p className="text-gray-400 text-sm">Completed projects</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  //FEED PAGE
  if (page === 'feed') {
    return (
      <>
        <nav className="bg-gray-800/50 border-b border-gray-700 p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <button 
              onClick={() => setPage('dashboard')}
              className="text-green-400 font-bold hover:text-green-300 transition flex items-center gap-1"
            >
              ← Back to Dashboard
            </button>
            <div className="flex gap-3">
              <span className="text-gray-300">Live Feed</span>
              <button 
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
        <Feed />
      </>
    );
  }

  //MY PROJECTS PAGE
  if (page === 'my-projects') {
    return (
      <>
        <nav className="bg-gray-800/50 border-b border-gray-700 p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <button 
              onClick={() => setPage('dashboard')}
              className="text-green-400 font-bold hover:text-green-300 transition flex items-center gap-1"
            >
              ← Back to Dashboard
            </button>
            <div className="flex gap-3">
              <span className="text-gray-300">My Projects</span>
              <button 
                onClick={() => setPage('create-project')}
                className="bg-green-600 px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                + New Project
              </button>
            </div>
          </div>
        </nav>
        <MyProjects />
      </>
    );
  }

  //CREATE PROJECT PAGE
  if (page === 'create-project') {
    return (
      <>
        <nav className="bg-gray-800/50 border-b border-gray-700 p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <button 
              onClick={() => setPage('my-projects')}
              className="text-green-400 font-bold hover:text-green-300 transition flex items-center gap-1"
            >
              ← Back to My Projects
            </button>
            <span className="text-gray-300">Create New Project</span>
          </div>
        </nav>
        <CreateProject onSuccess={() => setPage('my-projects')} onCancel={() => setPage('my-projects')} />
      </>
    );
  }

  //CELEBRATION WALL PAGE
  if (page === 'celebration') {
    return (
      <>
        <nav className="bg-gray-800/50 border-b border-gray-700 p-4">
          <div className="max-w-6xl mx-auto">
            <button 
              onClick={() => setPage('dashboard')}
              className="text-green-400 font-bold hover:text-green-300 transition flex items-center gap-1"
            >
              ← Back to Dashboard
            </button>
          </div>
        </nav>
        <CelebrationWall />
      </>
    );
  }

  //RESET PASSWORD PAGE
  if (page === 'reset-password' && resetToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black flex items-center justify-center p-5">
        <div className="bg-gray-800 p-10 rounded-2xl w-full max-w-md">
          <h2 className="text-3xl font-bold text-green-400 mb-6 text-center">Reset Password</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleResetSubmit}>
            <div className="mb-4">
              <label className="block mb-2 text-gray-400">New Password</label>
              <input
                type="password"
                value={resetPassword}
                onChange={e => setResetPassword(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block mb-2 text-gray-400">Confirm New Password</label>
              <input
                type="password"
                value={resetConfirm}
                onChange={e => setResetConfirm(e.target.value)}
                className={`w-full p-3 bg-gray-700 border rounded-lg text-white focus:outline-none ${
                  resetConfirm && resetPassword !== resetConfirm
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-600 focus:border-green-500'
                }`}
                placeholder="••••••••"
                required
              />
              {resetConfirm && resetPassword === resetConfirm && (
                <p className="mt-1 text-green-400 text-xs">✓ Passwords match</p>
              )}
            </div>
            
            <button 
              type="submit" 
              className="w-full p-3 bg-green-600 text-white rounded-lg font-bold mb-3 hover:bg-green-700 transition"
            >
              Reset Password
            </button>
          </form>
        </div>
      </div>
    );
  }

  //FORGOT PASSWORD PAGE
  if (page === 'forgot-password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black flex items-center justify-center p-5">
        <div className="bg-gray-800 p-10 rounded-2xl w-full max-w-md">
          <h2 className="text-3xl font-bold text-green-400 mb-6 text-center">Forgot Password</h2>
          
          {forgotMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${forgotMessage.includes('sent') ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
              {forgotMessage}
            </div>
          )}

          <form onSubmit={handleForgotSubmit}>
            <div className="mb-6">
              <label className="block mb-2 text-gray-400">Enter your email</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                placeholder="developer@example.com"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full p-3 bg-green-600 text-white rounded-lg font-bold mb-3 hover:bg-green-700 transition"
            >
              Send Reset Link
            </button>
            <button 
              type="button" 
              onClick={() => {
                setForgotEmail('');
                setForgotMessage('');
                setPage('login');
              }}
              className="w-full p-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  //LOGIN PAGE
  if (page === 'login') {
    return (
      <div className="min-h-screen bg-gray-900 flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-900 via-gray-900 to-black items-center justify-center p-12 relative overflow-hidden">
          <div className="text-center relative z-10">
            <div className="w-48 h-48 mx-auto mb-6 bg-black/40 rounded-2xl flex items-center justify-center border border-green-500/30 backdrop-blur-sm">
              <img 
                src="/logo-transparent.png" 
                alt="ProjectSync" 
                className="w-40 h-40 object-contain drop-shadow-2xl"
              />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">ProjectSync</h1>
            <p className="text-xl text-gray-300 mb-8 font-light">Work Smarter, Together.</p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-5 bg-gradient-to-br from-gray-900 to-black">
          <div className="bg-gray-800/80 backdrop-blur-sm p-10 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="lg:hidden text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-4 bg-black/40 rounded-xl flex items-center justify-center">
                <img 
                  src="/logo-transparent.png" 
                  alt="ProjectSync" 
                  className="w-20 h-20 object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-white">ProjectSync</h1>
            </div>

            <h2 className="text-3xl font-bold text-green-400 mb-2 text-center">Welcome Back</h2>
            <p className="text-gray-400 text-center mb-8 text-sm">Sign in to continue to ProjectSync</p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 text-gray-400 text-sm font-medium">Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                  placeholder="developer@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-2 text-gray-400 text-sm font-medium">Password</label>
                <input
                  name="password"
                  type="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                  placeholder="••••••••"
                  required
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginData({ email: '', password: '' });
                      setError('');
                      setPage('forgot-password');
                    }}
                    className="text-sm text-green-400 hover:text-green-300 transition"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full p-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition"
              >
                Sign In
              </button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                Don't have an account?{' '}
                <button 
                  onClick={() => {
                    setLoginData({ email: '', password: '' });
                    setPage('register');
                  }}
                  className="text-green-400 hover:text-green-300 font-semibold transition"
                >
                  Get Started →
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  //REGISTER PAGE 
  if (page === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black flex items-center justify-center p-5">
        <div className="bg-gray-800 p-10 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-3 bg-black/40 rounded-xl flex items-center justify-center">
              <img 
                src="/logo-transparent.png" 
                alt="ProjectSync" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold text-green-400">Create Account</h2>
            <p className="text-gray-400 text-sm mt-1">Join ProjectSync today</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit}>
            <div className="mb-4">
              <label className="block mb-2 text-gray-400 text-sm">Username</label>
              <input
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                placeholder="cool_dev_123"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-gray-400 text-sm">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                placeholder="developer@example.com"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-gray-400 text-sm">Password</label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-gray-400 text-sm">Re-enter Password</label>
              <input
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full p-3 bg-gray-700 border rounded-lg text-white focus:outline-none ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-600 focus:border-green-500'
                }`}
                placeholder="••••••••"
                required
              />
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-1 text-green-400 text-xs">✓ Passwords match</p>
              )}
            </div>

            <button 
              type="submit" 
              className="w-full p-3 bg-green-600 text-white rounded-lg font-bold mb-3 hover:bg-green-700 transition"
            >
              Create Account
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <button 
                onClick={() => setPage('login')}
                className="text-green-400 hover:text-green-300 font-semibold"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // HOME PAGE
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black flex items-center justify-center text-white p-5">
      <div className="text-center max-w-2xl">
        <div className="w-40 h-40 mx-auto mb-6 bg-black/40 rounded-2xl flex items-center justify-center border border-green-500/30">
          <img 
            src="/logo-transparent.png" 
            alt="ProjectSync" 
            className="w-32 h-32 object-contain drop-shadow-2xl animate-pulse"
          />
        </div>
        <h1 className="text-6xl font-bold text-green-400 mb-4">ProjectSync</h1>
        <p className="text-xl text-gray-300 mb-2">Work Smarter, Together.</p>
        
        <div className="space-x-4 mt-8">
          <button 
            onClick={() => setPage('login')} 
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition text-lg"
          >
            Sign In
          </button>
          <button 
            onClick={() => setPage('register')} 
            className="px-8 py-3 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600 transition text-lg"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;