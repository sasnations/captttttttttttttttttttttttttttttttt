import React, { useState } from 'react';
import { Plus, Edit, Trash2, AlertCircle, Activity, X, Check } from 'lucide-react';

// Initial categories data
const initialCategories = [
  {
    id: 'cat_1',
    name: 'Standard',
    description: 'Traditional CAPTCHA challenges like text and image recognition',
    captchaCount: 8,
    status: 'active',
    createdAt: '2025-01-05',
  },
  {
    id: 'cat_2',
    name: 'Advanced',
    description: 'Complex puzzles and interactive challenges',
    captchaCount: 5,
    status: 'active',
    createdAt: '2025-01-10',
  },
  {
    id: 'cat_3',
    name: 'Invisible',
    description: 'Background verification without user interaction',
    captchaCount: 3,
    status: 'active',
    createdAt: '2025-01-15',
  },
  {
    id: 'cat_4',
    name: 'Accessibility',
    description: 'CAPTCHA options designed for users with disabilities',
    captchaCount: 4,
    status: 'active', 
    createdAt: '2025-01-20',
  },
  {
    id: 'cat_5',
    name: 'Custom',
    description: 'Specially designed challenges for specific use cases',
    captchaCount: 2,
    status: 'testing',
    createdAt: '2025-02-01',
  },
];

interface AdminPanelProps {
  section: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ section }) => {
  const [categories, setCategories] = useState(initialCategories);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({
    id: '',
    name: '',
    description: '',
    status: 'active'
  });

  const handleAddCategory = () => {
    const newCategoryItem = {
      id: `cat_${categories.length + 1}`,
      name: currentCategory.name,
      description: currentCategory.description,
      captchaCount: 0,
      status: currentCategory.status,
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    setCategories([...categories, newCategoryItem]);
    setShowAddCategoryModal(false);
    setCurrentCategory({
      id: '',
      name: '',
      description: '',
      status: 'active'
    });
  };

  const handleEditCategory = (category) => {
    setCurrentCategory({
      id: category.id,
      name: category.name,
      description: category.description,
      status: category.status
    });
    setShowEditCategoryModal(true);
  };

  const handleUpdateCategory = () => {
    setCategories(categories.map(category => 
      category.id === currentCategory.id 
        ? { 
            ...category, 
            name: currentCategory.name, 
            description: currentCategory.description,
            status: currentCategory.status
          } 
        : category
    ));
    setShowEditCategoryModal(false);
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(category => category.id !== id));
    }
  };

  // Render different admin sections based on the prop
  if (section === 'categories') {
    return (
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">CAPTCHA Categories</h2>
            <p className="text-sm text-gray-500 mt-1">Manage CAPTCHA challenge categories and configure their behavior</p>
          </div>
          <button 
            onClick={() => {
              setCurrentCategory({
                id: '',
                name: '',
                description: '',
                status: 'active'
              });
              setShowAddCategoryModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add Category
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CAPTCHAs
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
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{category.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{category.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{category.captchaCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      category.status === 'active' ? 'bg-green-100 text-green-800' : 
                      category.status === 'testing' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {category.status === 'active' ? 'Active' : 
                       category.status === 'testing' ? 'Testing' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add New Category Modal */}
        {showAddCategoryModal && (
          <div className="fixed inset-0 overflow-y-auto z-50">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Add New Category</h3>
                    <button 
                      onClick={() => setShowAddCategoryModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Category Name</label>
                      <input
                        type="text"
                        id="name"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={currentCategory.name}
                        onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        id="description"
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={currentCategory.description}
                        onChange={(e) => setCurrentCategory({...currentCategory, description: e.target.value})}
                      ></textarea>
                    </div>
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        id="status"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={currentCategory.status}
                        onChange={(e) => setCurrentCategory({...currentCategory, status: e.target.value})}
                      >
                        <option value="active">Active</option>
                        <option value="testing">Testing</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleAddCategory}
                  >
                    Add Category
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowAddCategoryModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Category Modal */}
        {showEditCategoryModal && (
          <div className="fixed inset-0 overflow-y-auto z-50">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Edit Category</h3>
                    <button 
                      onClick={() => setShowEditCategoryModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">Category Name</label>
                      <input
                        type="text"
                        id="edit-name"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={currentCategory.name}
                        onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        id="edit-description"
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={currentCategory.description}
                        onChange={(e) => setCurrentCategory({...currentCategory, description: e.target.value})}
                      ></textarea>
                    </div>
                    <div>
                      <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        id="edit-status"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={currentCategory.status}
                        onChange={(e) => setCurrentCategory({...currentCategory, status: e.target.value})}
                      >
                        <option value="active">Active</option>
                        <option value="testing">Testing</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleUpdateCategory}
                  >
                    Update Category
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowEditCategoryModal(false)}
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
  }

  // Fallback for other sections
  return (
    <div className="p-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              This section is currently under development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;