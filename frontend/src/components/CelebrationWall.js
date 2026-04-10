import React, { useState, useEffect } from 'react';

// API URL configuration - works for both local and production
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function CelebrationWall() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCelebrations();
  }, []);

  const fetchCelebrations = async () => {
    try {
      const res = await fetch(`${API}/projects/celebration-wall`);
      const data = await res.json();
      setProjects(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching celebrations:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-900/20 via-gray-900 to-green-900/20 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading celebrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900/20 via-gray-900 to-green-900/20 text-white p-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-yellow-400 mb-4">🎉 Celebration Wall 🎉</h2>
        <p className="text-gray-400">Developers who built in public and shipped!</p>
        {projects.length === 0 && (
          <p className="text-gray-500 mt-4">No completed projects yet. Be the first! 🚀</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div
            key={project._id}
            className="bg-gradient-to-br from-yellow-600/20 to-green-600/20 p-6 rounded-2xl border border-yellow-500/30 hover:scale-105 transition-transform duration-300"
          >
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-yellow-400 mb-2">{project.title}</h3>
            <p className="text-gray-300 text-sm mb-4 line-clamp-2">{project.description}</p>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-400 font-bold">{project.ownerName || project.owner?.username}</span>
              <span className="text-gray-500">
                Completed {new Date(project.completedAt).toLocaleDateString()}
              </span>
            </div>
            
            {project.technologies && project.technologies.length > 0 && (
              <div className="mt-4 pt-4 border-t border-yellow-500/20">
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map(tech => (
                    <span key={tech} className="px-2 py-1 bg-black/30 rounded text-xs text-yellow-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {project.milestones && project.milestones.length > 0 && (
              <div className="mt-3 text-xs text-green-400">
                ✨ {project.milestones.length} milestones achieved
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}