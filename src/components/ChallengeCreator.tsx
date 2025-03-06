import React, { useState } from 'react';
import { Save, X, Plus, Trash2, Edit, Eye } from 'lucide-react';

// Challenge types that can be created
const challengeTypes = [
  { id: 'text', name: 'Text Recognition', description: 'Recognize distorted text' },
  { id: 'image', name: 'Image Selection', description: 'Select images matching a category' },
  { id: 'puzzle', name: 'Puzzle Completion', description: 'Complete a puzzle by arranging pieces' },
  { id: 'pattern', name: 'Pattern Memory', description: 'Memorize and recreate a pattern' },
  { id: 'rotation', name: '3D Rotation', description: 'Identify matching 3D objects after rotation' },
  { id: 'semantic', name: 'Semantic Understanding', description: 'Answer questions based on semantic understanding' },
  { id: 'math', name: 'Math Problem', description: 'Solve a simple math problem' },
  { id: 'audio', name: 'Audio Recognition', description: 'Recognize spoken words or numbers' },
  { id: 'behavioral', name: 'Behavioral Analysis', description: 'Analyze user behavior patterns' }
];

// Sample difficulty options
const difficultyOptions = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'adaptive', label: 'Adaptive' }
];

// Initial challenges data
const initialChallenges = [
  {
    id: 'challenge_1',
    name: 'Basic Text CAPTCHA',
    type: 'text',
    difficulty: 'easy',
    description: 'Simple distorted text that users need to type',
    settings: {
      distortionLevel: 'low',
      characterCount: 6,
      includeNumbers: true,
      includeSpecialChars: false
    },
    status: 'active',
    createdAt: '2025-03-01'
  },
  {
    id: 'challenge_2',
    name: 'Animal Image Selection',
    type: 'image',
    difficulty: 'medium',
    description: 'Select all images containing animals from a grid',
    settings: {
      gridSize: '3x3',
      targetCategory: 'animals',
      minSelections: 3,
      timeLimit: 30
    },
    status: 'active',
    createdAt: '2025-03-05'
  },
  {
    id: 'challenge_3',
    name: 'Memory Pattern Challenge',
    type: 'pattern',
    difficulty: 'medium',
    description: 'Remember and reproduce a sequence of dots',
    settings: {
      patternLength: 5,
      displayTime: 3,
      gridSize: '4x4'
    },
    status: 'active',
    createdAt: '2025-03-10'
  }
];

const ChallengeCreator: React.FC = () => {
  const [challenges, setChallenges] = useState(initialChallenges);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentChallenge, setCurrentChallenge] = useState({
    id: '',
    name: '',
    type: 'text',
    difficulty: 'medium',
    description: '',
    settings: {},
    status: 'active'
  });

  // Filter challenges based on search term
  const filteredChallenges = challenges.filter(challenge => 
    challenge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    challenge.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddChallenge = () => {
    const newChallenge = {
      id: `challenge_${challenges.length + 1}`,
      name: currentChallenge.name,
      type: currentChallenge.type,
      difficulty: currentChallenge.difficulty,
      description: currentChallenge.description,
      settings: currentChallenge.settings,
      status: currentChallenge.status,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setChallenges([...challenges, newChallenge]);
    setShowAddModal(false);
    resetCurrentChallenge();
  };

  const handleEditChallenge = (challenge) => {
    setCurrentChallenge({
      id: challenge.id,
      name: challenge.name,
      type: challenge.type,
      difficulty: challenge.difficulty,
      description: challenge.description,
      settings: challenge.settings || {},
      status: challenge.status
    });
    setShowEditModal(true);
  };

  const handleUpdateChallenge = () => {
    setChallenges(challenges.map(challenge => 
      challenge.id === currentChallenge.id 
        ? { ...currentChallenge } 
        : challenge
    ));
    setShowEditModal(false);
  };

  const handleDeleteChallenge = (id) => {
    if (window.confirm('Are you sure you want to delete this challenge?')) {
      setChallenges(challenges.filter(challenge => challenge.id !== id));
    }
  };

  const handlePreviewChallenge = (challenge) => {
    setCurrentChallenge(challenge);
    setShowPreviewModal(true);
  };

  const resetCurrentChallenge = () => {
    setCurrentChallenge({
      id: '',
      name: '',
      type: 'text',
      difficulty: 'medium',
      description: '',
      settings: {},
      status: 'active'
    });
  };

  const getTypeSpecificSettings = () => {
    const type = currentChallenge.type;
    
    switch(type) {
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Distortion Level</label>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={currentChallenge.settings?.distortionLevel || 'medium'}
                onChange={(e) => setCurrentChallenge({
                  ...currentChallenge, 
                  settings: {...currentChallenge.settings, distortionLevel: e.target.value}
                })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Character Count</label>
              <input
                type="number"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={currentChallenge.settings?.characterCount || 6}
                onChange={(e) => setCurrentChallenge({
                  ...currentChallenge, 
                  settings: {...currentChallenge.settings, characterCount: parseInt(e.target.value)}
                })}
                min="4"
                max="12"
              />
            </div>
            <div className="flex items-center">
              <input
                id="includeNumbers"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={currentChallenge.settings?.includeNumbers || false}
                onChange={(e) => setCurrentChallenge({
                  ...currentChallenge, 
                  settings: {...currentChallenge.settings, includeNumbers: e.target.checked}
                })}
              />
              <label htmlFor="includeNumbers" className="ml-2 block text-sm text-gray-900">
                Include Numbers
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="includeSpecialChars"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={currentChallenge.settings?.includeSpecialChars || false}
                onChange={(e) => setCurrentChallenge({
                  ...currentChallenge, 
                  settings: {...currentChallenge.settings, includeSpecialChars: e.target.checked}
                })}
              />
              <label htmlFor="includeSpecialChars" className="ml-2 block text-sm text-gray-900">
                Include Special Characters
              </label>
            </div>
          </div>
        );
      
      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Grid Size</label>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={currentChallenge.settings?.gridSize || '3x3'}
                onChange={(e) => setCurrentChallenge({
                  ...currentChallenge, 
                  settings: {...currentChallenge.settings, gridSize: e.target.value}
                })}
              >
                <option value="2x2">2x2</option>
                <option value="3x3">3x3</option>
                <option value="4x4">4x4</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Target Category</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={currentChallenge.settings?.targetCategory || ''}
                onChange={(e) => setCurrentChallenge({
                  ...currentChallenge, 
                  settings: {...currentChallenge.settings, targetCategory: e.target.value}
                })}
                placeholder="e.g., animals, vehicles, food"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Minimum Selections</label>
              <input
                type="number"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={currentChallenge.settings?.minSelections || 3}
                onChange={(e) => setCurrentChallenge({
                  ...currentChallenge, 
                  settings: {...currentChallenge.settings, minSelections: parseInt(e.target.value)}
                })}
                min="1"
                max="9"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Time Limit (seconds)</label>
              <input
                type="number"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={currentChallenge.settings?.timeLimit || 30}
                onChange={(e) => setCurrentChallenge({
                  ...currentChallenge, 
                  settings: {...currentChallenge.settings, timeLimit: parseInt(e.target.value)}
                })}
                min="10"
                max="60"
              />
            </div>
          </div>
        );
      
      case 'pattern':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Pattern Length</label>
              <input
                type="number"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={currentChallenge.settings?.patternLength || 5}
                onChange={(e) => setCurrentChallenge({
                  ...currentChallenge, 
                  settings: {...currentChallenge.settings, patternLength: parseInt(e.target.value)}
                })}
                min="3"
                max="9"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Display Time (seconds)</label>
              <input
                type="number"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={currentChallenge.settings?.displayTime || 3}
                onChange={(e) => setCurrentChallenge({
                  ...currentChallenge, 
                  settings: {...currentChallenge.settings, displayTime: parseInt(e.target.value)}
                })}
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Grid Size</label>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={currentChallenge.settings?.gridSize || '4x4'}
                onChange={(e) => setCurrentChallenge({
                  ...currentChallenge, 
                  settings: {...currentChallenge.settings, gridSize: e.target.value}
                })}
              >
                <option value="3x3">3x3</option>
                <option value="4x4">4x4</option>
                <option value="5x5">5x5</option>
              </select>
            </div>
          </div>
        );
      
      // Add more cases for other challenge types
      
      default:
        return (
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
            <p>Configure the basic settings above first, then specific settings for this challenge type will appear here.</p>
          </div>
        );
    }
  };

  const renderChallengePreview = () => {
    const type = currentChallenge.type;
    
    switch(type) {
      case 'text':
        return (
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Text Recognition CAPTCHA</h3>
            <div className="bg-white p-4 rounded-md border border-gray-300 mb-4">
              <div className="text-center">
                <p className="font-mono text-2xl tracking-widest text-gray-700 transform skew-x-12 italic">
                  {currentChallenge.settings?.includeSpecialChars 
                    ? "R4nd@m!" 
                    : currentChallenge.settings?.includeNumbers 
                      ? "Rand0m" 
                      : "Random"}
                </p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter the text shown above:</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Type the text here"
              />
            </div>
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Verify
              </button>
            </div>
          </div>
        );
      
      case 'pattern':
        return (
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pattern Memory CAPTCHA</h3>
            <p className="text-sm text-gray-500 mb-4">Memorize the pattern and recreate it by clicking the dots in the same order.</p>
            
            <div className="bg-white p-4 rounded-md border border-gray-300 mb-4">
              <div className="w-64 h-64 mx-auto relative">
                {/* Render a grid based on settings */}
                {Array.from({ length: 16 }).map((_, i) => (
                  <div 
                    key={i}
                    className="absolute w-4 h-4 bg-indigo-600 rounded-full"
                    style={{
                      left: `${(i % 4) * 33.33 + 16}%`,
                      top: `${Math.floor(i / 4) * 33.33 + 16}%`
                    }}
                  />
                ))}
                
                {/* Show a sample pattern */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M21,21 L64,64 L107,21 L150,64" 
                    stroke="#4F46E5" 
                    strokeWidth="3" 
                    fill="none" 
                  />
                </svg>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                Show Pattern
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Verify
              </button>
            </div>
          </div>
        );
      
      case 'image':
        return (
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Image Selection CAPTCHA</h3>
            <p className="text-sm text-gray-500 mb-4">
              Select all squares with {currentChallenge.settings?.targetCategory || 'animals'}.
            </p>
            
            <div className="grid grid-cols-3 gap-2 mb-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div 
                  key={i}
                  className="aspect-square bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300"
                />
              ))}
            </div>
            
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Verify
              </button>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-500">Preview not available for this challenge type.</p>
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">CAPTCHA Challenge Creator</h2>
          <p className="text-sm text-gray-500 mt-1">Create and manage CAPTCHA challenges for your service</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search challenges..."
              className="pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <button
            onClick={() => {
              resetCurrentChallenge();
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Create Challenge
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Difficulty
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredChallenges.map((challenge) => (
              <tr key={challenge.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{challenge.name}</div>
                  <div className="text-sm text-gray-500">{challenge.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {challengeTypes.find(t => t.id === challenge.type)?.name || challenge.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    challenge.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    challenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    challenge.status === 'active' ? 'bg-green-100 text-green-800' :
                    challenge.status === 'testing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {challenge.createdAt}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                    onClick={() => handlePreviewChallenge(challenge)}
                  >
                    <Eye size={16} />
                  </button>
                  <button 
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                    onClick={() => handleEditChallenge(challenge)}
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className="text-red-600 hover:text-red-900"
                    onClick={() => handleDeleteChallenge(challenge.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Challenge Modal */}
      {showAddModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Create New Challenge</h3>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Challenge Name</label>
                    <input
                      type="text"
                      id="name"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentChallenge.name}
                      onChange={(e) => setCurrentChallenge({...currentChallenge, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Challenge Type</label>
                    <select
                      id="type"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentChallenge.type}
                      onChange={(e) => setCurrentChallenge({...currentChallenge, type: e.target.value, settings: {}})}
                    >
                      {challengeTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">Difficulty</label>
                    <select
                      id="difficulty"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentChallenge.difficulty}
                      onChange={(e) => setCurrentChallenge({...currentChallenge, difficulty: e.target.value})}
                    >
                      {difficultyOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      id="status"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentChallenge.status}
                      onChange={(e) => setCurrentChallenge({...currentChallenge, status: e.target.value})}
                    >
                      <option value="active">Active</option>
                      <option value="testing">Testing</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      id="description"
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentChallenge.description}
                      onChange={(e) => setCurrentChallenge({...currentChallenge, description: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Challenge Settings</h4>
                    {getTypeSpecificSettings()}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleAddChallenge}
                >
                  <Save size={16} className="mr-2" />
                  Create Challenge
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Challenge Modal */}
      {showEditModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit Challenge</h3>
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">Challenge Name</label>
                    <input
                      type="text"
                      id="edit-name"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentChallenge.name}
                      onChange={(e) => setCurrentChallenge({...currentChallenge, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700">Challenge Type</label>
                    <select
                      id="edit-type"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentChallenge.type}
                      onChange={(e) => setCurrentChallenge({...currentChallenge, type: e.target.value, settings: {}})}
                    >
                      {challengeTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit-difficulty" className="block text-sm font-medium text-gray-700">Difficulty</label>
                    <select
                      id="edit-difficulty"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentChallenge.difficulty}
                      onChange={(e) => setCurrentChallenge({...currentChallenge, difficulty: e.target.value})}
                    >
                      {difficultyOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      id="edit-status"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentChallenge.status}
                      onChange={(e) => setCurrentChallenge({...currentChallenge, status: e.target.value})}
                    >
                      <option value="active">Active</option>
                      <option value="testing">Testing</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      id="edit-description"
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentChallenge.description}
                      onChange={(e) => setCurrentChallenge({...currentChallenge, description: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Challenge Settings</h4>
                    {getTypeSpecificSettings()}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleUpdateChallenge}
                >
                  <Save size={16} className="mr-2" />
                  Update Challenge
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Challenge Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Challenge Preview: {currentChallenge.name}</h3>
                  <button 
                    onClick={() => setShowPreviewModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                {renderChallengePreview()}
                
                <div className="mt-4 bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Challenge Details</h4>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-gray-500">Type:</dt>
                    <dd className="text-gray-900">{challengeTypes.find(t => t.id === currentChallenge.type)?.name}</dd>
                    
                    <dt className="text-gray-500">Difficulty:</dt>
                    <dd className="text-gray-900">{currentChallenge.difficulty}</dd>
                    
                    <dt className="text-gray-500">Status:</dt>
                    <dd className="text-gray-900">{currentChallenge.status}</dd>
                  </dl>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
                  onClick={() => setShowPreviewModal(false)}
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeCreator;