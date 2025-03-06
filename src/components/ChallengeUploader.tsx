import React, { useState, useEffect } from 'react';
import { Upload, Image, AlertCircle, Check, X, Loader2 } from 'lucide-react';
import { uploadChallengeContent, getChallengeContent } from '../lib/supabase';

type ChallengeType = 'image_selection' | 'pattern' | 'text' | 'semantic' | 'audio';

interface ImageSelectionData {
  category: string;
  images: string[];
  correctIndices?: number[];
}

const ChallengeUploader: React.FC = () => {
  const [challengeType, setChallengeType] = useState<ChallengeType>('image_selection');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [existingChallenges, setExistingChallenges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Image selection specific state
  const [category, setCategory] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['', '', '', '', '', '', '', '', '']);
  const [correctIndices, setCorrectIndices] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Text challenge specific state
  const [textValue, setTextValue] = useState('');
  const [distortionLevel, setDistortionLevel] = useState<'low' | 'medium' | 'high'>('medium');

  // Pattern challenge specific state
  const [patternLength, setPatternLength] = useState(5);
  const [gridSize, setGridSize] = useState<'3x3' | '4x4' | '5x5'>('4x4');

  // Semantic challenge specific state
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);

  useEffect(() => {
    fetchExistingChallenges();
  }, []);

  const fetchExistingChallenges = async () => {
    setIsLoading(true);
    const result = await getChallengeContent();
    if (result.success) {
      setExistingChallenges(result.data);
    }
    setIsLoading(false);
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const handleOptionsChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const toggleCorrectImage = (index: number) => {
    if (correctIndices.includes(index)) {
      setCorrectIndices(correctIndices.filter(i => i !== index));
    } else {
      setCorrectIndices([...correctIndices, index]);
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadSuccess(false);
    setUploadError(null);

    try {
      let contentData: any;
      let metadata: any = { difficulty };

      // Prepare content data based on challenge type
      switch (challengeType) {
        case 'image_selection':
          // Filter out empty URLs
          const validImageUrls = imageUrls.filter(url => url.trim() !== '');
          
          if (validImageUrls.length < 2) {
            throw new Error('Please add at least 2 images');
          }
          
          if (correctIndices.length === 0) {
            throw new Error('Please select at least one correct image');
          }
          
          if (!category) {
            throw new Error('Category is required');
          }
          
          contentData = {
            category,
            images: validImageUrls,
            correctIndices: correctIndices.filter(index => imageUrls[index].trim() !== '')
          };
          break;

        case 'text':
          if (!textValue) {
            throw new Error('Text value is required');
          }
          
          contentData = {
            text: textValue,
            distortionLevel
          };
          break;

        case 'pattern':
          contentData = {
            patternLength,
            gridSize
          };
          break;

        case 'semantic':
          if (!question) {
            throw new Error('Question is required');
          }
          
          const validOptions = options.filter(opt => opt.trim() !== '');
          if (validOptions.length < 2) {
            throw new Error('Please add at least 2 options');
          }
          
          contentData = {
            question,
            options: validOptions,
            correctOptionIndex
          };
          break;
      }

      const result = await uploadChallengeContent(challengeType, contentData, metadata);
      
      if (result.success) {
        setUploadSuccess(true);
        // Reset form
        resetForm();
        // Refresh the list of challenges
        fetchExistingChallenges();
      } else {
        setUploadError(result.error || 'Upload failed');
      }
    } catch (error: any) {
      setUploadError(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    switch (challengeType) {
      case 'image_selection':
        setCategory('');
        setImageUrls(['', '', '', '', '', '', '', '', '']);
        setCorrectIndices([]);
        break;
      case 'text':
        setTextValue('');
        break;
      case 'pattern':
        setPatternLength(5);
        break;
      case 'semantic':
        setQuestion('');
        setOptions(['', '', '', '']);
        setCorrectOptionIndex(0);
        break;
    }
    setDifficulty('medium');
  };

  const renderChallengeForm = () => {
    switch (challengeType) {
      case 'image_selection':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., animals, vehicles, food"
              />
              <p className="mt-1 text-xs text-gray-500">
                This is what users will be asked to select (e.g., "Select all images containing animals")
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Images
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Add URLs of images (preferably from Unsplash). Click on images to mark them as "correct" answers.
              </p>
              
              <div className="grid grid-cols-3 gap-2">
                {imageUrls.map((url, index) => (
                  <div key={index} className="space-y-1">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => handleImageUrlChange(index, e.target.value)}
                      className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-xs focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Image URL"
                    />
                    {url.trim() !== '' && (
                      <div 
                        className={`relative aspect-square border ${correctIndices.includes(index) ? 'border-green-500' : 'border-gray-300'} rounded-md overflow-hidden cursor-pointer`}
                        onClick={() => toggleCorrectImage(index)}
                      >
                        <img 
                          src={url} 
                          alt={`Challenge image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {correctIndices.includes(index) && (
                          <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Challenge Text
              </label>
              <input
                type="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter text for the CAPTCHA"
              />
              <p className="mt-1 text-xs text-gray-500">
                This is the text that will be distorted and presented to users
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distortion Level
              </label>
              <select
                value={distortionLevel}
                onChange={(e) => setDistortionLevel(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        );

      case 'pattern':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pattern Length
              </label>
              <input
                type="number"
                value={patternLength}
                onChange={(e) => setPatternLength(parseInt(e.target.value))}
                min={3}
                max={9}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Number of dots in the pattern (3-9 recommended)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grid Size
              </label>
              <select
                value={gridSize}
                onChange={(e) => setGridSize(e.target.value as '3x3' | '4x4' | '5x5')}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="3x3">3x3</option>
                <option value="4x4">4x4</option>
                <option value="5x5">5x5</option>
              </select>
            </div>
          </div>
        );

      case 'semantic':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Which of these is used to measure temperature?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Add answer options. Select the correct answer below.
              </p>
              
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionsChange(index, e.target.value)}
                      className="flex-grow border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={`Option ${index + 1}`}
                    />
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={correctOptionIndex === index}
                        onChange={() => setCorrectOptionIndex(index)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Correct</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return <p>Select a challenge type to continue</p>;
    }
  };

  const renderExistingChallenges = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
        </div>
      );
    }

    if (existingChallenges.length === 0) {
      return (
        <div className="bg-gray-50 p-6 text-center rounded-md">
          <p className="text-gray-500">No challenges found. Create your first challenge above.</p>
        </div>
      );
    }

    // Group by challenge type
    const groupedChallenges: { [key: string]: any[] } = {};
    existingChallenges.forEach(challenge => {
      const type = challenge.challenge_type;
      if (!groupedChallenges[type]) {
        groupedChallenges[type] = [];
      }
      groupedChallenges[type].push(challenge);
    });

    return (
      <div className="space-y-6">
        {Object.entries(groupedChallenges).map(([type, challenges]) => (
          <div key={type}>
            <h3 className="text-lg font-medium text-gray-900 mb-2 capitalize">
              {type.replace('_', ' ')} Challenges
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {challenges.map(challenge => (
                <div key={challenge.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-sm capitalize">
                      {challenge.metadata?.difficulty || 'medium'} difficulty
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(challenge.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {renderChallengePreview(challenge)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderChallengePreview = (challenge: any) => {
    const { challenge_type, content_data } = challenge;
    
    switch (challenge_type) {
      case 'image_selection':
        return (
          <div>
            <div className="mt-2 mb-1 text-sm font-medium">Category: {content_data.category}</div>
            {content_data.images && content_data.images.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 mt-2">
                {content_data.images.slice(0, 6).map((img: string, idx: number) => (
                  <div key={idx} className="aspect-square relative">
                    <img 
                      src={img} 
                      alt="Challenge" 
                      className="w-full h-full object-cover rounded-sm"
                    />
                    {content_data.correctIndices?.includes(idx) && (
                      <div className="absolute top-0 right-0 p-0.5 bg-green-500 rounded-full">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No images</div>
            )}
            <div className="mt-2 text-xs text-gray-500">
              {content_data.images?.length || 0} images, {content_data.correctIndices?.length || 0} correct
            </div>
          </div>
        );
        
      case 'text':
        return (
          <div>
            <div className="font-mono mt-3 p-2 bg-gray-50 rounded text-center">
              {content_data.text || 'No text'}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Distortion: {content_data.distortionLevel || 'medium'}
            </div>
          </div>
        );
        
      case 'pattern':
        return (
          <div>
            <div className="mt-2 text-sm">
              <div>Pattern length: {content_data.patternLength || 5}</div>
              <div>Grid size: {content_data.gridSize || '4x4'}</div>
            </div>
            <div className="mt-2 bg-gray-50 p-2 rounded">
              <div className="w-full aspect-square relative">
                {Array.from({ length: content_data.patternLength || 5 }).map((_, i) => (
                  <div 
                    key={i}
                    className="absolute w-3 h-3 bg-indigo-600 rounded-full"
                    style={{
                      left: `${20 + Math.cos(i * (Math.PI * 2 / (content_data.patternLength || 5))) * 40}%`,
                      top: `${20 + Math.sin(i * (Math.PI * 2 / (content_data.patternLength || 5))) * 40}%`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'semantic':
        return (
          <div>
            <div className="mt-2 text-sm font-medium">{content_data.question}</div>
            <div className="mt-2 space-y-1">
              {content_data.options?.map((option: string, idx: number) => (
                <div 
                  key={idx}
                  className={`text-sm p-1 rounded ${
                    idx === content_data.correctOptionIndex 
                      ? 'bg-green-50 text-green-700' 
                      : 'text-gray-700'
                  }`}
                >
                  {option}
                  {idx === content_data.correctOptionIndex && (
                    <Check className="inline ml-1" size={14} />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
        
      default:
        return (
          <div className="text-sm text-gray-500">
            Unsupported challenge type
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-6">
            <Upload className="text-indigo-600 mr-2" size={24} />
            <h2 className="text-2xl font-semibold text-gray-800">Challenge Content Manager</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload New Challenge</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Challenge Type
                  </label>
                  <select
                    value={challengeType}
                    onChange={(e) => setChallengeType(e.target.value as ChallengeType)}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="image_selection">Image Selection</option>
                    <option value="text">Text Recognition</option>
                    <option value="pattern">Pattern Memory</option>
                    <option value="semantic">Semantic Understanding</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                
                {renderChallengeForm()}
                
                {uploadError && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{uploadError}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {uploadSuccess && (
                  <div className="bg-green-50 border-l-4 border-green-400 p-4">
                    <div className="flex">
                      <Check className="h-5 w-5 text-green-400" />
                      <div className="ml-3">
                        <p className="text-sm text-green-700">Challenge uploaded successfully!</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={16} />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2" size={16} />
                        Upload Challenge
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Challenges</h3>
              {renderExistingChallenges()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeUploader;