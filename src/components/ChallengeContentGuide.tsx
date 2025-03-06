import React from 'react';
import { FileText, Code, Image, AlertCircle, Info } from 'lucide-react';

const ChallengeContentGuide: React.FC = () => {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-6">
            <FileText className="text-indigo-600 mr-2" size={24} />
            <h2 className="text-2xl font-semibold text-gray-800">Challenge Content Guide</h2>
          </div>
          
          <div className="prose max-w-none">
            <h3 className="text-lg font-medium text-gray-900">Overview</h3>
            <p className="text-gray-600">
              CaptchaShield's CAPTCHA challenges need to be varied and unpredictable to effectively prevent bots.
              This guide explains how to create and manage different types of challenge content.
            </p>
            
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <Info className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    The Challenge Content Manager provides a user interface for uploading and managing challenge content.
                    For more advanced needs, you can use the API directly.
                  </p>
                </div>
              </div>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mt-8">Supported Challenge Types</h3>
            
            <div className="space-y-6 mt-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium flex items-center">
                  <Image size={18} className="text-indigo-600 mr-2" />
                  Image Selection
                </h4>
                <p className="text-gray-600 text-sm mt-2">
                  Users are presented with a grid of images and must select all images matching a specific category.
                </p>
                <div className="mt-2 bg-gray-50 p-3 rounded-md">
                  <h5 className="text-sm font-medium">Required Content:</h5>
                  <ul className="text-sm text-gray-600 list-disc pl-5 mt-1">
                    <li>Category name (e.g., "animals", "vehicles")</li>
                    <li>At least 4-9 image URLs</li>
                    <li>Indices of correct images</li>
                  </ul>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium flex items-center">
                  <Code size={18} className="text-indigo-600 mr-2" />
                  Text Recognition
                </h4>
                <p className="text-gray-600 text-sm mt-2">
                  Users must identify and type distorted text characters.
                </p>
                <div className="mt-2 bg-gray-50 p-3 rounded-md">
                  <h5 className="text-sm font-medium">Required Content:</h5>
                  <ul className="text-sm text-gray-600 list-disc pl-5 mt-1">
                    <li>Text string to display</li>
                    <li>Distortion level (low, medium, high)</li>
                  </ul>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium flex items-center">
                  <Code size={18} className="text-indigo-600 mr-2" />
                  Pattern Memory
                </h4>
                <p className="text-gray-600 text-sm mt-2">
                  Users are shown a pattern of dots and must recreate it from memory.
                </p>
                <div className="mt-2 bg-gray-50 p-3 rounded-md">
                  <h5 className="text-sm font-medium">Required Content:</h5>
                  <ul className="text-sm text-gray-600 list-disc pl-5 mt-1">
                    <li>Pattern length (number of dots)</li>
                    <li>Grid size (3x3, 4x4, or 5x5)</li>
                  </ul>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium flex items-center">
                  <Code size={18} className="text-indigo-600 mr-2" />
                  Semantic Understanding
                </h4>
                <p className="text-gray-600 text-sm mt-2">
                  Users must answer simple questions that require human understanding.
                </p>
                <div className="mt-2 bg-gray-50 p-3 rounded-md">
                  <h5 className="text-sm font-medium">Required Content:</h5>
                  <ul className="text-sm text-gray-600 list-disc pl-5 mt-1">
                    <li>Question text</li>
                    <li>Answer options (at least 2)</li>
                    <li>Index of the correct option</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mt-8">Using the API Directly</h3>
            <p className="text-gray-600">
              For programmatic content management, you can use the API endpoints directly:
            </p>
            
            <div className="mt-4 bg-gray-800 rounded-md p-4 overflow-auto">
              <pre className="text-gray-300 text-sm">
{`// Upload new challenge content
const uploadChallenge = async () => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch('/api/challenge-content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`
    },
    body: JSON.stringify({
      challenge_type: 'image_selection',
      content_data: {
        category: 'animals',
        images: [
          'https://images.unsplash.com/photo-1530595467517-49740742c05f?w=150&h=150&fit=crop',
          'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=150&h=150&fit=crop',
          // More image URLs...
        ],
        correctIndices: [0, 2]
      },
      metadata: {
        difficulty: 'medium'
      }
    })
  });
  
  return await response.json();
};`}
              </pre>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mt-8">Best Practices</h3>
            <ul className="text-gray-600 space-y-2 mt-2">
              <li>
                <strong>Diverse Content:</strong> Upload many variations of each challenge type to prevent bots from learning patterns.
              </li>
              <li>
                <strong>Different Difficulty Levels:</strong> Provide challenges ranging from easy to hard to adapt to different risk levels.
              </li>
              <li>
                <strong>Clear Instructions:</strong> Ensure challenge instructions are clear for humans to understand.
              </li>
              <li>
                <strong>Accessible Options:</strong> Include challenges that work for users with disabilities.
              </li>
              <li>
                <strong>Regular Updates:</strong> Refresh your challenge content periodically to stay ahead of automated solving techniques.
              </li>
            </ul>
            
            <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Important:</strong> For image-based challenges, use publicly available image URLs (like Unsplash) 
                    or your own hosted images. Make sure you have rights to use any images you upload.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeContentGuide;