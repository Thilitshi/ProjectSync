import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function Feed() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  
  const socket = useSocket();

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Socket.io real-time updates
  useEffect(() => {
    if (!socket) return;
    
    socket.emit('join-feed');
    
    socket.on('project-created', (newProject) => {
      console.log('New project created:', newProject);
      setProjects(prev => [newProject, ...prev]);
    });
    
    socket.on('project-updated', (update) => {
      setProjects(prev => prev.map(p => 
        p._id === update._id ? { ...p, ...update } : p
      ));
    });
    
    socket.on('project-completed', (completed) => {
      console.log('🎉 Project completed:', completed.title);
      fetchProjects();
    });
    
    socket.on('new-comment', (data) => {
      console.log('New comment on:', data.projectId);
      if (selectedProject?._id === data.projectId) {
        fetchComments(selectedProject._id);
      }
    });
    
    return () => {
      socket.off('project-created');
      socket.off('project-updated');
      socket.off('project-completed');
      socket.off('new-comment');
    };
  }, [socket, selectedProject]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API}/projects/feed`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          console.log('Token invalid, redirecting to login...');
          window.location.href = '/login';
        }
        throw new Error('Failed to fetch projects');
      }
      
      const data = await res.json();
      setProjects(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setLoading(false);
    }
  };

  const fetchComments = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API}/comments/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to fetch comments');
      
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    fetchComments(project._id);
  };

  const submitComment = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to comment');
      return;
    }
    
    if (!newComment.trim()) return;
    
    try {
      const res = await fetch(`${API}/comments/project/${selectedProject._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newComment })
      });
      
      if (res.ok) {
        setNewComment('');
        fetchComments(selectedProject._id);
        
        if (socket) {
          socket.emit('new-comment', {
            projectId: selectedProject._id,
            text: newComment
          });
        }
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      alert('Failed to post comment');
    }
  };

  const requestCollaboration = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to request collaboration');
      return;
    }
    
    const message = prompt('Why do you want to collaborate? (optional)');
    
    try {
      const res = await fetch(`${API}/projects/${selectedProject._id}/collaborate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: message || 'I would like to collaborate on this project!' })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('✅ Collaboration request sent!');
        if (socket) {
          socket.emit('collaboration-request', {
            projectId: selectedProject._id,
            message: message
          });
        }
      } else {
        alert(data.error || 'Failed to send request');
      }
    } catch (err) {
      console.error('Error requesting collaboration:', err);
      alert('Failed to send collaboration request');
    }
  };

  const getStageEmoji = (stage) => {
    const emojis = {
      'Ideation': '💡', 
      'MVP': '📋', 
      'Development': '🔨',
      'Testing': '🧪', 
      'Launch': '🚀', 
      'Completed': '🎉'
    };
    return emojis[stage] || '💡';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-green-400 mb-8">📡 Live Feed</h2>
        
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/50 rounded-xl">
            <div className="text-6xl mb-4">🚀</div>
            <p className="text-gray-400 text-lg">No projects yet.</p>
            <p className="text-gray-500">Be the first to sync your project!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <div
                key={project._id}
                onClick={() => handleProjectClick(project)}
                className="bg-gray-800/50 p-6 rounded-2xl cursor-pointer hover:bg-gray-700 transition-all duration-300 border border-gray-700 hover:border-green-500 hover:scale-105"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-3xl">{getStageEmoji(project.stage)}</span>
                  <span className="text-sm text-gray-400 bg-gray-900 px-2 py-1 rounded-full">
                    {project.ownerName || project.owner?.username}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold mb-2 text-white">{project.title}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>
                
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies.slice(0, 3).map(tech => (
                      <span key={tech} className="px-2 py-1 bg-gray-900 rounded text-xs text-green-400">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="mb-4">
                  <span className="px-2 py-1 bg-yellow-900/30 border border-yellow-500/30 rounded text-xs text-yellow-300">
                    🆘 {project.supportRequired}
                  </span>
                </div>
                
                {project.progress > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-green-400">{Math.round(project.progress)}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {project.milestones && project.milestones.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-green-400">✅ Latest: {project.milestones[project.milestones.length-1]?.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-green-400">{selectedProject.title}</h2>
                <p className="text-gray-400">by {selectedProject.ownerName || selectedProject.owner?.username}</p>
              </div>
              <button 
                onClick={() => setSelectedProject(null)}
                className="text-gray-400 hover:text-white text-3xl leading-none transition"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-300 mb-6 leading-relaxed">{selectedProject.description}</p>
              
              <div className="mb-4">
                <h4 className="font-semibold text-green-400 mb-2">Current Stage</h4>
                <span className="inline-block px-3 py-1 bg-green-600 rounded-full text-sm">
                  {getStageEmoji(selectedProject.stage)} {selectedProject.stage}
                </span>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-yellow-400 mb-2">Support Needed</h4>
                <p className="text-gray-300 bg-gray-700/50 p-3 rounded-lg">{selectedProject.supportRequired}</p>
              </div>
              
              <div className="flex gap-3 mb-6">
                <button
                  onClick={requestCollaboration}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                >
                  🤝 Raise Hand to Collaborate
                </button>
              </div>
              
              {/* Comments Section */}
              <div className="border-t border-gray-700 pt-6">
                <h3 className="font-bold mb-4 text-green-400">💬 Comments & Collaboration Requests</h3>
                
                <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment._id} className="bg-gray-700/50 p-3 rounded-lg">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-green-400 font-bold">{comment.userName || comment.author?.username}</span>
                          <span className="text-gray-500 text-xs">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-300">{comment.content || comment.text}</p>
                        {comment.isCollaborationRequest && (
                          <span className="inline-block mt-2 px-2 py-1 bg-purple-900/50 text-purple-300 text-xs rounded-full">
                            🤝 Collaboration Request
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
                
                <div className="flex gap-2 mt-4">
                  <input
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && submitComment()}
                    placeholder="Add a comment or ask for collaboration..."
                    className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={submitComment}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}