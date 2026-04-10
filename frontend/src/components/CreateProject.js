import React, { useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SUPPORT_OPTIONS = [
  'frontend', 'backend', 'design', 'devops', 
  'marketing', 'funding', 'mentorship', 'testing'
];

export default function CreateProject({ onCreated, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    stage: 'idea',
    supportNeeded: [],
    techStack: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const token = localStorage.getItem('token');
    
    // Validate form
    if (!form.title.trim()) {
      setError('Project title is required');
      setLoading(false);
      return;
    }
    
    if (!form.description.trim()) {
      setError('Project description is required');
      setLoading(false);
      return;
    }
    
    if (form.supportNeeded.length === 0) {
      setError('Please select at least one support type');
      setLoading(false);
      return;
    }
    
    // Map stage to backend format
    const stageMap = {
      'idea': 'Ideation',
      'planning': 'MVP',
      'building': 'Development',
      'testing': 'Testing',
      'launched': 'Launch'
    };
    
    try {
      const res = await fetch(`${API}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          stage: stageMap[form.stage] || 'Ideation',
          supportRequired: form.supportNeeded.join(', '),
          technologies: form.techStack.split(',').map(t => t.trim()).filter(t => t),
          isPublic: true
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('✅ Project created successfully!');
        if (onCreated) onCreated();
      } else {
        setError(data.error || 'Failed to create project');
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSupport = (option) => {
    setForm(prev => ({
      ...prev,
      supportNeeded: prev.supportNeeded.includes(option)
        ? prev.supportNeeded.filter(s => s !== option)
        : [...prev.supportNeeded, option]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-green-400 mb-6">Create New Project</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-gray-400">Project Title *</label>
            <input
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., AI Task Manager"
              required
            />
          </div>
          
          <div>
            <label className="block mb-2 text-gray-400">Description *</label>
            <textarea
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white h-32 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="What are you building? What problem does it solve?"
              required
            />
          </div>
          
          <div>
            <label className="block mb-2 text-gray-400">Current Stage</label>
            <select
              value={form.stage}
              onChange={e => setForm({...form, stage: e.target.value})}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="idea">💡 Idea</option>
              <option value="planning">📋 Planning</option>
              <option value="building">🔨 Building</option>
              <option value="testing">🧪 Testing</option>
              <option value="launched">🚀 Launched</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-2 text-gray-400">Support Needed *</label>
            <div className="flex flex-wrap gap-2">
              {SUPPORT_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleSupport(option)}
                  className={`px-3 py-1 rounded-full text-sm capitalize transition ${
                    form.supportNeeded.includes(option)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {form.supportNeeded.length === 0 && (
              <p className="text-xs text-yellow-500 mt-1">Select at least one support type</p>
            )}
          </div>
          
          <div>
            <label className="block mb-2 text-gray-400">Tech Stack (comma separated)</label>
            <input
              value={form.techStack}
              onChange={e => setForm({...form, techStack: e.target.value})}
              placeholder="React, Node.js, MongoDB"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 p-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 p-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}