import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { ClientSettings as ClientSettingsType } from '../App';

const ClientSettings: React.FC = () => {
  const [settings, setSettings] = useState<ClientSettingsType>({
    client_id: '',
    risk_threshold: 0.5,
    challenge_difficulty: 'adaptive',
    preferred_captcha_types: [],
    behavioral_analysis_enabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [captchaCategories, setCaptchaCategories] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    async function fetchSettings() {
      try {
        // Fetch client settings
        const response = await axios.get('/api/client/settings');
        if (response.data) {
          setSettings(response.data);
        }
        
        // Fetch captcha categories for the dropdown
        const categoriesResponse = await axios.get('/api/categories');
        setCaptchaCategories(categoriesResponse.data.map((cat: any) => ({
          id: cat.id,
          name: cat.name
        })));
        
        setLoading(false);
      } catch (err: any) {
        setError('Failed to load settings: ' + (err.response?.data?.error || err.message));
        setLoading(false);
      }
    }
    
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await axios.put('/api/client/settings', settings);
      setSettings(response.data);
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError('Failed to save settings: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleCaptchaTypeToggle = (categoryId: string) => {
    setSettings(prev => {
      const currentTypes = [...prev.preferred_captcha_types];
      
      if (currentTypes.includes(categoryId)) {
        return {
          ...prev,
          preferred_captcha_types: currentTypes.filter(id => id !== categoryId)
        };
      } else {
        return {
          ...prev,
          preferred_captcha_types: [...currentTypes, categoryId]
        };
      }
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-6">
            <Settings className="text-indigo-600 mr-2" size={24} />
            <h2 className="text-2xl font-semibold text-gray-800">Client Settings</h2>
          </div>
          
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700">Settings saved successfully!</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Assessment</h3>
              
              <div className="mb-4">
                <label htmlFor="risk_threshold" className="block text-sm font-medium text-gray-700 mb-1">
                  Risk Threshold ({settings.risk_threshold.toFixed(2)})
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">0.0</span>
                  <input
                    type="range"
                    id="risk_threshold"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.risk_threshold}
                    onChange={(e) => setSettings({...settings, risk_threshold: parseFloat(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm text-gray-500 ml-2">1.0</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Scores above this threshold will trigger CAPTCHA challenges. Lower values are more strict.
                </p>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    id="behavioral_analysis"
                    type="checkbox"
                    checked={settings.behavioral_analysis_enabled}
                    onChange={(e) => setSettings({...settings, behavioral_analysis_enabled: e.target.checked})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="behavioral_analysis" className="ml-2 block text-sm text-gray-900">
                    Enable Behavioral Analysis
                  </label>
                </div>
                <p className="mt-1 text-sm text-gray-500 ml-6">
                  Analyzes user behavior patterns to detect bots without visible challenges.
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Challenge Settings</h3>
              
              <div className="mb-4">
                <label htmlFor="challenge_difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                  Challenge Difficulty
                </label>
                <select
                  id="challenge_difficulty"
                  value={settings.challenge_difficulty}
                  onChange={(e) => setSettings({...settings, challenge_difficulty: e.target.value as any})}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="adaptive">Adaptive (based on risk score)</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Determines the complexity of CAPTCHA challenges presented to users.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred CAPTCHA Types
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {captchaCategories.map((category) => (
                    <div key={category.id} className="flex items-center">
                      <input
                        id={`category-${category.id}`}
                        type="checkbox"
                        checked={settings.preferred_captcha_types.includes(category.id)}
                        onChange={() => handleCaptchaTypeToggle(category.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`category-${category.id}`} className="ml-2 block text-sm text-gray-900">
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Select which types of CAPTCHAs can be presented to your users.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;