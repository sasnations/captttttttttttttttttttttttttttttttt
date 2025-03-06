import React, { useState, useEffect } from 'react';
import { BarChart3, Shield, Code, Settings, ExternalLink, Copy, Check, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CustomerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'integration' | 'settings' | 'logs'>('overview');
  const [apiKey, setApiKey] = useState('captcha_client_1234567890abcdef');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [domains, setDomains] = useState<string[]>(['example.com', 'mywebsite.com']);
  const [newDomain, setNewDomain] = useState('');
  const [settings, setSettings] = useState({
    riskThreshold: 0.5,
    challengeDifficulty: 'adaptive',
    preferredChallengeTypes: ['image_selection', 'text'],
    behavioralAnalysisEnabled: true
  });

  // Sample data for the dashboard
  const stats = {
    total: 12587,
    passed: 12254,
    blocked: 333,
    passRate: 97.4,
    avgResponseTime: 820
  };

  // Sample verification logs
  const verificationLogs = [
    { id: 'log1', timestamp: '2025-03-15 14:22:33', ip: '192.168.1.45', result: 'passed', riskScore: 0.12, challengeType: 'behavioral' },
    { id: 'log2', timestamp: '2025-03-15 14:20:11', ip: '45.67.89.123', result: 'passed', riskScore: 0.35, challengeType: 'image_selection' },
    { id: 'log3', timestamp: '2025-03-15 14:15:08', ip: '78.90.12.345', result: 'blocked', riskScore: 0.88, challengeType: 'text' },
    { id: 'log4', timestamp: '2025-03-15 14:10:45', ip: '123.45.67.89', result: 'passed', riskScore: 0.22, challengeType: 'pattern' },
    { id: 'log5', timestamp: '2025-03-15 14:05:22', ip: '98.76.54.32', result: 'blocked', riskScore: 0.92, challengeType: 'behavioral' }
  ];

  // Sample chart data (for weekly verification trend)
  const chartData = {
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [1250, 1480, 1320, 1590, 1760, 1020, 1167]
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDomain && !domains.includes(newDomain)) {
      setDomains([...domains, newDomain]);
      setNewDomain('');
    }
  };

  const handleRemoveDomain = (domain: string) => {
    setDomains(domains.filter(d => d !== domain));
  };

  const handleSaveSettings = () => {
    setLoading(true);
    // Simulating an API call
    setTimeout(() => {
      setLoading(false);
      // We'd usually save settings to the backend here
    }, 1000);
  };

  const getIntegrationCode = () => {
    return `
<script src="https://cdn.captchashield.com/api.js" async></script>

<form id="myForm">
  <!-- Your form fields here -->
  <div class="captchashield-container"></div>
  <button type="submit">Submit</button>
</form>

<script>
  document.getElementById('myForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    CaptchaShield.verify({
      apiKey: '${apiKey}',
      onSuccess: function(token) {
        // Add token to form and submit
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'captcha_token';
        hiddenInput.value = token;
        document.getElementById('myForm').appendChild(hiddenInput);
        document.getElementById('myForm').submit();
      },
      onFailure: function(error) {
        console.error('Verification failed:', error);
        alert('Please complete the CAPTCHA challenge.');
      }
    });
  });
</script>
    `;
  };

  const getServerVerificationCode = () => {
    return `
// Node.js/Express example
app.post('/form-submit', async (req, res) => {
  const captchaToken = req.body.captcha_token;
  
  if (!captchaToken) {
    return res.status(400).json({ error: 'CAPTCHA verification failed' });
  }
  
  try {
    const verificationResult = await axios.post(
      'https://api.captchashield.com/verify',
      { token: captchaToken },
      { 
        headers: { 
          'X-API-Key': '${apiKey}',
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (verificationResult.data.success) {
      // CAPTCHA verification passed, process the form
      // ...
      return res.json({ success: true });
    } else {
      return res.status(400).json({ error: 'CAPTCHA verification failed' });
    }
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});
    `;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Client Dashboard</h1>
        <p className="text-gray-600">Manage your CAPTCHA integration and view verification statistics</p>
      </div>

      <div className="mb-6 bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
            >
              <BarChart3 className="inline-block mr-2" size={16} />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('integration')}
              className={`${
                activeTab === 'integration'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
            >
              <Code className="inline-block mr-2" size={16} />
              Integration
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
            >
              <Settings className="inline-block mr-2" size={16} />
              Settings
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`${
                activeTab === 'logs'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
            >
              <Shield className="inline-block mr-2" size={16} />
              Verification Logs
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Verifications</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
                    </div>
                    <div className="rounded-full bg-blue-50 p-2">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-green-600">+5.2% from last week</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Verification Success</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">{stats.passRate}%</p>
                    </div>
                    <div className="rounded-full bg-green-50 p-2">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-green-600">+0.8% from last week</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Blocked Attempts</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">{stats.blocked.toLocaleString()}</p>
                    </div>
                    <div className="rounded-full bg-red-50 p-2">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-red-600">+2.5% from last week</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Avg. Response Time</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">{stats.avgResponseTime}ms</p>
                    </div>
                    <div className="rounded-full bg-indigo-50 p-2">
                      <BarChart3 className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-green-600">-50ms from last week</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Verification Trend</h3>
                <div className="h-64 relative">
                  {/* This would be replaced with an actual chart component in production */}
                  <div className="flex items-end h-48 gap-2 absolute bottom-0 left-0 right-0">
                    {chartData.values.map((value, index) => (
                      <div key={index} className="flex-1 bg-indigo-500 rounded-t" style={{ height: `${value / 20}%` }}>
                        <div className="text-xs text-center text-white font-medium pt-1">
                          {value > 1500 ? Math.round(value / 100) / 10 + 'k' : value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-2 border-t absolute bottom-0 left-0 right-0">
                    {chartData.days.map((day, index) => (
                      <div key={index} className="text-xs text-gray-500">{day}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Verifications</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challenge Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {verificationLogs.slice(0, 5).map((log) => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.timestamp}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ip}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{log.challengeType.replace('_', ' ')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.riskScore}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.result === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {log.result}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-right">
                  <button
                    onClick={() => setActiveTab('logs')}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    View all logs
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Integration Tab */}
          {activeTab === 'integration' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your API Key</h3>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-100 p-3 rounded-l-md font-mono text-sm overflow-x-auto">
                    {apiKey}
                  </div>
                  <button
                    onClick={handleCopyApiKey}
                    className="p-3 bg-gray-200 hover:bg-gray-300 rounded-r-md"
                    title="Copy API key"
                  >
                    {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Keep this key secret. Use it in your backend to verify CAPTCHA responses.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Authorized Domains</h3>
                <p className="text-sm text-gray-500 mb-4">
                  List the domains where your CAPTCHA will be used. Only these domains will be able to load the CAPTCHA.
                </p>

                <div className="mb-4">
                  <form onSubmit={handleAddDomain} className="flex gap-2">
                    <input
                      type="text"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      placeholder="example.com"
                      className="flex-1 border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      Add Domain
                    </button>
                  </form>
                </div>

                <div className="bg-gray-50 rounded-md p-4">
                  {domains.length === 0 ? (
                    <p className="text-gray-500 text-center">No domains added yet</p>
                  ) : (
                    <ul className="space-y-2">
                      {domains.map((domain) => (
                        <li key={domain} className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm">
                          <span className="font-mono text-sm">{domain}</span>
                          <button
                            onClick={() => handleRemoveDomain(domain)}
                            className="text-red-600 hover:text-red-900"
                            title="Remove domain"
                          >
                            &times;
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Client-Side Integration</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Add this code to your website to implement CAPTCHA verification on your forms.
                </p>

                <div className="bg-gray-800 rounded-md p-4 overflow-x-auto">
                  <pre className="text-gray-300 text-sm">{getIntegrationCode()}</pre>
                </div>

                <button
                  onClick={() => navigator.clipboard.writeText(getIntegrationCode())}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-900 flex items-center"
                >
                  <Copy size={14} className="mr-1" /> Copy to clipboard
                </button>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Server-Side Verification</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Use this code on your server to verify the CAPTCHA token submitted by users.
                </p>

                <div className="bg-gray-800 rounded-md p-4 overflow-x-auto">
                  <pre className="text-gray-300 text-sm">{getServerVerificationCode()}</pre>
                </div>

                <button
                  onClick={() => navigator.clipboard.writeText(getServerVerificationCode())}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-900 flex items-center"
                >
                  <Copy size={14} className="mr-1" /> Copy to clipboard
                </button>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              <div className="max-w-3xl">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">CAPTCHA Settings</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="risk_threshold" className="block text-sm font-medium text-gray-700 mb-1">
                        Risk Threshold ({settings.riskThreshold.toFixed(2)})
                      </label>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">0.0</span>
                        <input
                          type="range"
                          id="risk_threshold"
                          min="0"
                          max="1"
                          step="0.01"
                          value={settings.riskThreshold}
                          onChange={(e) => setSettings({...settings, riskThreshold: parseFloat(e.target.value)})}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm text-gray-500 ml-2">1.0</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Scores above this threshold will trigger CAPTCHA challenges. Lower values are more strict.
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="challenge_difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                        Challenge Difficulty
                      </label>
                      <select
                        id="challenge_difficulty"
                        value={settings.challengeDifficulty}
                        onChange={(e) => setSettings({...settings, challengeDifficulty: e.target.value})}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
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
                        Preferred Challenge Types
                      </label>
                      <div className="space-y-2">
                        {[
                          { id: 'image_selection', name: 'Image Selection' },
                          { id: 'text', name: 'Text Recognition' },
                          { id: 'pattern', name: 'Pattern Memory' },
                          { id: 'semantic', name: 'Semantic Understanding' }
                        ].map((type) => (
                          <div key={type.id} className="flex items-center">
                            <input
                              id={`type-${type.id}`}
                              type="checkbox"
                              checked={settings.preferredChallengeTypes.includes(type.id)}
                              onChange={() => {
                                if (settings.preferredChallengeTypes.includes(type.id)) {
                                  setSettings({
                                    ...settings,
                                    preferredChallengeTypes: settings.preferredChallengeTypes.filter(t => t !== type.id)
                                  });
                                } else {
                                  setSettings({
                                    ...settings,
                                    preferredChallengeTypes: [...settings.preferredChallengeTypes, type.id]
                                  });
                                }
                              }}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`type-${type.id}`} className="ml-2 block text-sm text-gray-900">
                              {type.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Select which types of challenges can be presented to your users.
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <input
                          id="behavioral_analysis"
                          type="checkbox"
                          checked={settings.behavioralAnalysisEnabled}
                          onChange={(e) => setSettings({...settings, behavioralAnalysisEnabled: e.target.checked})}
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
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Settings'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Verification Logs Tab */}
          {activeTab === 'logs' && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Verification Logs</h3>
                <div className="flex gap-2">
                  <select
                    className="border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="all">All results</option>
                    <option value="passed">Passed only</option>
                    <option value="blocked">Blocked only</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search logs..."
                    className="border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challenge Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {verificationLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.timestamp}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ip}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{log.challengeType.replace('_', ' ')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.riskScore}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.result === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {log.result}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of <span className="font-medium">20</span> results
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-700">Previous</button>
                      <button className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-700">Next</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;