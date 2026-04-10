import React, { useState, useEffect } from 'react';

const STAGES = ['idea', 'planning', 'building', 'testing', 'launched', 'completed'];

// Add this line - API configuration
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [milestoneTitle, setMilestoneTitle] = useState('');

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const fetchMyProjects = async () => {
    const token = localStorage.getItem('token');
    try {
      // UPDATED: Use API variable instead of hardcoded URL
      const res = await fetch(`${API}/projects/my-projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const updateStage = async (projectId, newStage) => {
    const token = localStorage.getItem('token');
    try {
      // UPDATED: Use API variable
      const res = await fetch(`${API}/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stage: newStage })
      });
      
      if (res.ok) {
        fetchMyProjects();
        if (selectedProject?._id === projectId) {
          setSelectedProject({...selectedProject, stage: newStage});
        }
      }
    } catch (err) {
      console.error('Error updating stage:', err);
    }
  };

  const addMilestone = async () => {
    if (!milestoneTitle.trim()) return;
    
    const token = localStorage.getItem('token');
    try {
      // UPDATED: Use API variable
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
        fetchMyProjects();
        // Refresh selected project
        const updated = await fetch(`${API}/projects/my-projects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json());
        const fresh = updated.find(p => p._id === selectedProject._id);
        setSelectedProject(fresh);
      }
    } catch (err) {
      console.error('Error adding milestone:', err);
    }
  };

  const getStageEmoji = (stage) => {
    const emojis = {
      idea: '💡', planning: '📋', building: '🔨',
      testing: '🧪', launched: '🚀', completed: '🎉'
    };
    return emojis[stage] || '💡';
  };

  // Calculate progress based on stage
  const getProgress = (stage) => {
    const progressMap = {
      idea: 0,
      planning: 20,
      building: 40,
      testing: 60,
      launched: 80,
      completed: 100
    };
    return progressMap[stage] || 0;
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
                        {project.stage} • {getProgress(project.stage)}% complete
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-400">
                      ✅ {project.milestones?.length || 0} milestones
                    </p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                      style={{ width: `${getProgress(project.stage)}%` }}
                    />
                  </div>
                </div>
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
                <p className="text-gray-400 text-sm mt-1">Manage your project progress</p>
              </div>
              <button 
                onClick={() => setSelectedProject(null)}
                className="text-gray-400 hover:text-white text-3xl leading-none transition"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {/* Stage Progress */}
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-3 font-semibold">📊 Update Stage:</p>
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
              
              {/* Progress Bar */}
              <div className="mb-6 bg-gray-900 p-4 rounded-xl">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Overall Progress</span>
                  <span className="text-green-400 font-bold">{getProgress(selectedProject.stage)}%</span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                    style={{ width: `${getProgress(selectedProject.stage)}%` }}
                  />
                </div>
              </div>
              
              {/* Milestones */}
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
                    Add
                  </button>
                </div>
              </div>
              
              {/* Collaboration Requests */}
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