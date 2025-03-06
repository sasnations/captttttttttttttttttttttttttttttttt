import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, X, Check } from 'lucide-react';

// Sample data - in a real application this would come from your backend
const initialCaptchas = [
  {
    id: 'cap_1',
    name: 'Text Recognition',
    category: 'Standard',
    status: 'Active',
    successRate: '98.7%',
    botDetectionRate: '96.2%',
    createdAt: '2025-01-05',
  },
  {
    id: 'cap_2',
    name: 'Image Selection',
    category: 'Standard',
    status: 'Active',
    successRate: '97.3%',
    botDetectionRate: '94.5%',
    createdAt: '2025-01-10',
  },
  {
    id: 'cap_3',
    name: 'Puzzle Completion',
    category: 'Advanced',
    status: 'Testing',
    successRate: '95.8%',
    botDetectionRate: '98.1%',
    createdAt: '2025-02-15',
  },
  {
    id: 'cap_4',
    name: 'Audio Recognition',
    category: 'Accessibility',
    status: 'Active',
    successRate: '93.2%',
    botDetectionRate: '91.8%',
    createdAt: '2025-01-20',
  },
  {
    id: 'cap_5',
    name: 'Behavioral Analysis',
    category: 'Invisible',
    status: 'Active',
    successRate: '99.1%',
    botDetectionRate: '97.4%',
    createdAt: '2025-02-01',
  },
];

const categories = [
  { id: 'cat_1', name: 'Standard' },
  { id: 'cat_2', name: 'Advanced' },
  { id: 'cat_3', name: 'Invisible' },
  { id: 'cat_4', name: 'Accessibility' },
  { id: 'cat_5', name: 'Custom' },
];

const CaptchaManager: React.FC = () => {
  const [captchas, setCaptchas] = useState(initialCaptchas);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddNewModal, setShowAddNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCaptcha, setCurrentCaptcha] = useState({
    id: '',
    name: '',
    category: 'Standard',
    description: '',
    status: 'Active'
  });

  const filteredCaptchas = captchas.filter(captcha => 
    captcha.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    captcha.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCaptcha = () => {
    const id = `cap_${captchas.length + 1}`;
    const newCaptchaItem = {
      id,
      name: currentCaptcha.name,
      category: currentCaptcha.category,
      status: currentCaptcha.status,
      successRate: 'N/A',
      botDetectionRate: 'N/A',
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    setCaptchas([...captchas, newCaptchaItem]);
    setShowAddNewModal(false);
    setCurrentCaptcha({
      id: '',
      name: '',
      category: 'Standard',
      description: '',
      status: 'Active'
    });
  };

  const handleEditCaptcha = (captcha) => {
    setCurrentCaptcha({
      id: captcha.id,
      name: captcha.name,
      category: captcha.category,
      description: '',
      status: captcha.status
    });
    setShowEditModal(true);
  };

  const handleUpdateCaptcha = () => {
    setCaptchas(captchas.map(captcha => 
      captcha.id === currentCaptcha.id 
        ? { 
            ...captcha, 
            name: currentCaptcha.name, 
            category: currentCaptcha.category,
            status: currentCaptcha.status
          } 
        : captcha
    ));
    setShowEditModal(false);
  };

  const handleDeleteCaptcha = (id) => {
    if (window.confirm('Are you sure you want to delete this CAPTCHA?')) {
      setCaptchas(captchas.filter(captcha => captcha.id !== id));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Search CAPTCHAs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-3">
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Filter size={16} className="mr-2" />
            Filter
          </button>
          <button 
            onClick={() => {
              setCurrentCaptcha({
                id: '',
                name: '',
                category: 'Standard',
                description: '',
                status: 'Active'
              });
              setShowAddNewModal(true);
            }}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus size={16} className="mr-2" />
            Add New CAPTCHA
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
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Success Rate
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bot Detection
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
            {filteredCaptchas.map((captcha) => (
              <tr key={captcha.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{captcha.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {captcha.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    captcha.status === 'Active' ? 'bg-green-100 text-green-800' : 
                    captcha.status === 'Testing' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {captcha.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {captcha.successRate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {captcha.botDetectionRate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {captcha.createdAt}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                    onClick={() => handleEditCaptcha(captcha)}
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className="text-red-600 hover:text-red-900"
                    onClick={() => handleDeleteCaptcha(captcha.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add New CAPTCHA Modal */}
      {showAddNewModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add New CAPTCHA</h3>
                  <button 
                    onClick={() => setShowAddNewModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      id="name"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentCaptcha.name}
                      onChange={(e) => setCurrentCaptcha({...currentCaptcha, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      id="category"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentCaptcha.category}
                      onChange={(e) => setCurrentCaptcha({...currentCaptcha, category: e.target.value})}
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      id="status"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentCaptcha.status}
                      onChange={(e) => setCurrentCaptcha({...currentCaptcha, status: e.target.value})}
                    >
                      <option value="Active">Active</option>
                      <option value="Testing">Testing</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      id="description"
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentCaptcha.description}
                      onChange={(e) => setCurrentCaptcha({...currentCaptcha, description: e.target.value})}
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleAddCaptcha}
                >
                  Add CAPTCHA
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowAddNewModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit CAPTCHA Modal */}
      {showEditModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit CAPTCHA</h3>
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      id="edit-name"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentCaptcha.name}
                      onChange={(e) => setCurrentCaptcha({...currentCaptcha, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      id="edit-category"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentCaptcha.category}
                      onChange={(e) => setCurrentCaptcha({...currentCaptcha, category: e.target.value})}
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      id="edit-status"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentCaptcha.status}
                      onChange={(e) => setCurrentCaptcha({...currentCaptcha, status: e.target.value})}
                    >
                      <option value="Active">Active</option>
                      <option value="Testing">Testing</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      id="edit-description"
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentCaptcha.description}
                      onChange={(e) => setCurrentCaptcha({...currentCaptcha, description: e.target.value})}
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleUpdateCaptcha}
                >
                  Update CAPTCHA
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
    </div>
  );
};

export default CaptchaManager;