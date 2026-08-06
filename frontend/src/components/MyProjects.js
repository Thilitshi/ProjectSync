import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const STAGES = ['idea', 'planning', 'building', 'testing', 'launched', 'completed'];

const API = process.env.REACT_APP_API_URL || "https://projectsync-1-qdsm.onrender.com/api";

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const fetchMyProjects = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/projects/my-projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setProjects(data);
      return data;
    } catch (err) {
      console.error('Error fetching projects:', err);
      toast.error('Failed to load projects');
      return [];
    }
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This cannot be undone.')) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Project deleted');
        setSelectedProject(null);
        await fetchMyProjects();
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to delete project');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      toast.error('Cannot connect to server');
    }
  };

  const updateStage = async (projectId, newStage) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stage: newStage })
      });
      
      if (res.ok) {
        const updatedProjects = await fetchMyProjects();
        const freshProject = updatedProjects.find(p => p._id === projectId);
        if (freshProject) {
          setSelectedProject(freshProject);
        }
        toast.success(`Stage updated to ${newStage}!`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to update stage');
      }
    } catch (err) {
      console.error('Error updating stage:', err);
      toast.error('Cannot connect to server');
    }
  };

  const addMilestone = async () => {
    if (!milestoneTitle.trim()) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/projects/${selectedProject._id}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: milestoneTitle })
      });
      
      if (res.ok) {
        setMilestoneTitle('');
        const updatedProjects = await fetchMyProjects();
        const fresh = updatedProjects.find(p => p._id === selectedProject._id);
        if (fresh) setSelectedProject(fresh);
        toast.success('Milestone added!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to add milestone');
      }
    } catch (err) {
      console.error('Error adding milestone:', err);
      toast.error('Cannot connect to server');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB.');
      return;
    }

    setUploading(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await fetch(`${API}/projects/${selectedProject._id}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        toast.success('Document uploaded!');
        const updatedProjects = await fetchMyProjects();
        const fresh = updatedProjects.find(p => p._id === selectedProject._id);
        if (fresh) setSelectedProject(fresh);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to upload document');
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      toast.error('Cannot connect to server');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const deleteDocument = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/projects/${selectedProject._id}/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Document deleted');
        const updatedProjects = await fetchMyProjects();
        const fresh = updatedProjects.find(p => p._id === selectedProject._id);
        if (fresh) setSelectedProject(fresh);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to delete document');
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      toast.error('Cannot connect to server');
    }
  };

  const getStageEmoji = (stage) => {
    const emojis = {
      idea: '💡', planning: '📋', building: '🔨',
      testing: '🧪', launched: '🚀', completed: '🎉'
    };
    return emojis[stage] || '💡';
  };

  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext)) return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (['mp4', 'mov', 'avi'].includes(ext)) return '🎬';
    if (['mp3', 'wav'].includes(ext)) return '🎵';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-green-400 mb-8">📁 My Projects</h2>
        
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/50 rounded-xl">
            <div className="text-6xl mb-4">🚀</div>
            <p className="text-gray-400 text-lg">No projects yet.</p>
            <p className="text-gray-500">Click "New Project" to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map(project => (
              <div
                key={project._id}
                onClick={() => setSelectedProject(project)}
                className="bg-gray-800/50 p-6 rounded-2xl cursor-pointer hover:bg-gray-700 transition-all duration-300 border border-gray-700 hover:border-green-500"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{getStageEmoji(project.stage)}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">{project.title}</h3>
                      <p className="text-gray-400 text-sm capitalize">
                        {project.stage}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-400">
                      ✅ {project.milestones?.length || 0} milestones
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      📎 {project.documents?.length || 0} files
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProject && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-green-400">{selectedProject.title}</h2>
                <p className="text-gray-400 text-sm mt-1">Manage your project</p>
              </div>
              <button 
                onClick={() => setSelectedProject(null)}
                className="text-gray-400 hover:text-white text-3xl leading-none transition"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-3 font-semibold">📊 Stage:</p>
                <div className="flex flex-wrap gap-2">
                  {STAGES.map(stage => (
                    <button
                      key={stage}
                      onClick={() => updateStage(selectedProject._id, stage)}
                      className={`px-4 py-2 rounded-lg capitalize transition transform hover:scale-105 ${
                        selectedProject.stage === stage
                          ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {getStageEmoji(stage)} {stage}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-bold mb-3 text-green-400">🏆 Milestones Achieved</h3>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {selectedProject.milestones && selectedProject.milestones.length > 0 ? (
                    selectedProject.milestones.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-900 p-3 rounded-lg">
                        <span className="text-green-400 text-xl">✓</span>
                        <span className="text-gray-200">{m.title}</span>
                        <span className="text-gray-500 text-sm ml-auto">
                          {new Date(m.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No milestones yet. Add your first achievement!</p>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4">
                  <input
                    value={milestoneTitle}
                    onChange={e => setMilestoneTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addMilestone()}
                    placeholder="✨ What did you just achieve? (e.g., 'Completed MVP')"
                    className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={addMilestone}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    Update
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-green-400">📎 Documents</h3>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : '+ Attach File'}
                  </button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedProject.documents && selectedProject.documents.length > 0 ? (
                    selectedProject.documents.map((doc, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-900 p-3 rounded-lg group">
                        <span className="text-2xl">{getFileIcon(doc.name || doc.filename)}</span>
                        <div className="flex-1 min-w-0">
                          <a 
                            href={doc.url || doc.path} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 truncate block text-sm"
                          >
                            {doc.name || doc.filename || 'Untitled'}
                          </a>
                          <span className="text-gray-500 text-xs">
                            {formatFileSize(doc.size)} • {new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteDocument(doc._id || doc.id)}
                          className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-sm"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No documents attached yet.</p>
                  )}
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-700">
                <button
                  onClick={() => deleteProject(selectedProject._id)}
                  className="w-full p-3 bg-red-600/20 border border-red-600 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition font-semibold"
                >
                  🗑️ Delete Project
                </button>
              </div>
              
              {selectedProject.collaborationRequests && selectedProject.collaborationRequests.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <h3 className="font-bold mb-3 text-yellow-400">🤝 Collaboration Requests</h3>
                  <div className="space-y-2">
                    {selectedProject.collaborationRequests.map((req, i) => (
                      <div key={i} className="bg-gray-900 p-3 rounded-lg flex justify-between items-center">
                        <span className="text-gray-300">{req.user?.username || 'Unknown'}</span>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          req.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                          req.status === 'accepted' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                        }`}>
                          {req.status || 'pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}