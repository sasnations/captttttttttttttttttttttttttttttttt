import React, { useState, useEffect } from 'react';
import { Key, Copy, RefreshCw, Check, Code } from 'lucide-react';
import axios from 'axios';

const ApiIntegration: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'javascript' | 'php' | 'python'>('javascript');

  useEffect(() => {
    async function fetchApiKey() {
      try {
        // In a real implementation, this would fetch the API key from the server
        // For demo purposes, we'll simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setApiKey('icaptcha_1234567890abcdef1234567890abcdef');
        setLoading(false);
      } catch (err: any) {
        setError('Failed to load API key: ' + err.message);
        setLoading(false);
      }
    }
    
    fetchApiKey();
  }, []);

  const handleGenerateApiKey = async () => {
    setGenerating(true);
    setError(null);
    
    try {
      // For demo purposes, we'll simulate a successful API key generation
      // instead of making an actual API call that would fail
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newApiKey = 'icaptcha_' + Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
      setApiKey(newApiKey);
      
      // Uncomment this for actual API integration when the backend is ready
      // const response = await axios.post('/api/client/api-key');
      // setApiKey(response.data.api_key);
    } catch (err: any) {
      setError('Failed to generate API key: ' + (err.response?.data?.error || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const javascriptCode = `
// Client-side implementation
<script src="https://icaptcha.net/cdn/captcha.js" async></script>

<form id="myForm">
  <!-- Your form fields here -->
  <div class="icaptcha-container"></div>
  <button type="submit">Submit</button>
</form>

<script>
  document.getElementById('myForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    iCaptcha.verify({
      apiKey: '${apiKey || 'YOUR_API_KEY'}',
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
      }
    });
  });
</script>
  `;

  const phpCode = `
<?php
// Server-side verification
function verifyCaptcha($token) {
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, 'https://captttttttttttttttttttttttttttttttt.onrender.com/api/verify');
  curl_setopt($ch, CURLOPT_POST, 1);
  curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'token' => $token
  ]));
  curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-Key: ${apiKey || 'YOUR_API_KEY'}'
  ]);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  
  $response = curl_exec($ch);
  curl_close($ch);
  
  $result = json_decode($response, true);
  return $result['success'] === true;
}

// Usage in form handler
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $captchaToken = $_POST['captcha_token'] ?? '';
  
  if (verifyCaptcha($captchaToken)) {
    // Verification successful, process the form
    // ...
  } else {
    // Verification failed, show error
    echo "CAPTCHA verification failed. Please try again.";
  }
}
?>
  `;

  const pythonCode = `
# Server-side verification with Python
import requests

def verify_captcha(token):
    response = requests.post(
        'https://captttttttttttttttttttttttttttttttt.onrender.com/api/verify',
        headers={'X-API-Key': '${apiKey || 'YOUR_API_KEY'}'},
        data={'token': token}
    )
    
    result = response.json()
    return result.get('success', False)

# Usage in a Flask application
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/submit-form', methods=['POST'])
def submit_form():
    captcha_token = request.form.get('captcha_token', '')
    
    if verify_captcha(captcha_token):
        # Verification successful, process the form
        # ...
        return jsonify({'success': True})
    else:
        # Verification failed
        return jsonify({'success': False, 'error': 'CAPTCHA verification failed'})

if __name__ == '__main__':
    app.run(debug=True)
  `;

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
            <Key className="text-indigo-600 mr-2" size={24} />
            <h2 className="text-2xl font-semibold text-gray-800">API Integration</h2>
          </div>
          
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your API Key</h3>
            
            <div className="flex items-center">
              <div className="flex-1 bg-gray-100 p-3 rounded-l-md font-mono text-sm overflow-x-auto">
                {apiKey || 'No API key generated'}
              </div>
              <button
                onClick={handleCopyApiKey}
                disabled={!apiKey}
                className="p-3 bg-gray-200 hover:bg-gray-300 rounded-r-md"
              >
                {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
              </button>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleGenerateApiKey}
                disabled={generating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} className="mr-2" />
                    Generate New Key
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Integration Examples</h3>
            
            <div className="mb-4 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('javascript')}
                  className={`${
                    activeTab === 'javascript'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  JavaScript
                </button>
                <button
                  onClick={() => setActiveTab('php')}
                  className={`${
                    activeTab === 'php'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  PHP
                </button>
                <button
                  onClick={() => setActiveTab('python')}
                  className={`${
                    activeTab === 'python'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Python
                </button>
              </nav>
            </div>
            
            <div className="bg-gray-800 rounded-md p-4 overflow-x-auto">
              <pre className="text-gray-300 text-sm">
                <code>
                  {activeTab === 'javascript' && javascriptCode}
                  {activeTab === 'php' && phpCode}
                  {activeTab === 'python' && pythonCode}
                </code>
              </pre>
            </div>
            
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-2">API Documentation</h4>
              <p className="text-gray-600 mb-4">
                For complete API documentation, including all endpoints, parameters, and response formats,
                please refer to our comprehensive API documentation.
              </p>
              <a
                href="#"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Code size={16} className="mr-2" />
                View Full API Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiIntegration;