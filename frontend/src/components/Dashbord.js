import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import Feed from './Feed';
import MyProjects from './MyProjects';
import ProjectForm from './ProjectForm';

function Dashboard({ token, setToken }) {
  const [activeTab, setActiveTab] = useState('feed');
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    
    try {
      const userId = JSON.parse(atob(token.split('.')[1])).id;
      newSocket.emit('join-feed', userId);
    } catch(e) {
      console.log('Socket connection established');
    }
    
    newSocket.on('feedUpdate', (data) => {
      const messages = {
        'NEW_PROJECT': `🚀 New project started!`,
        'MILESTONE': `✅ Someone achieved a milestone!`,
        'COMMENT': `💬 New comment added!`,
        'COLLAB_REQUEST': `🤝 Someone wants to collaborate!`,
        'COMPLETED': `🎉 A project was completed!`
      };
      toast(messages[data.type] || 'New update!', { duration: 3000 });
    });
    
    setSocket(newSocket);
    return () => newSocket.close();
  }, [token]);
  
  const handleLogout = () => {
    if (socket) socket.close();
    setToken(null);
    toast.success('Logged out successfully');
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-green-500/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🚀</div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                Build in Public
              </h1>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/celebration')}
                className="px-4 py-2 bg-yellow-600 rounded-lg hover:bg-yellow-700 transition"
              >
                🏆 Celebration Wall
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === 'feed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              📡 Live Feed
            </button>
            <button
              onClick={() => setActiveTab('myProjects')}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === 'myProjects'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              📁 My Projects
            </button>
            <button
              onClick={() => setActiveTab('newProject')}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === 'newProject'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              ✨ New Project
            </button>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="card">
          {activeTab === 'feed' && <Feed token={token} />}
          {activeTab === 'myProjects' && <MyProjects token={token} />}
          {activeTab === 'newProject' && <ProjectForm token={token} onSuccess={() => setActiveTab('myProjects')} />}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;