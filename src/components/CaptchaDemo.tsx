import React, { useState, useEffect, useRef } from 'react';
import { useBehaviorAnalysis } from '../hooks/useBehaviorAnalysis';
import { Shield, Check, X, AlertTriangle, RefreshCw } from 'lucide-react';

// Interactive pattern CAPTCHA
const PatternCaptcha: React.FC<{
  onVerify: (success: boolean) => void;
  difficulty: 'easy' | 'medium' | 'hard';
}> = ({ onVerify, difficulty }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pattern, setPattern] = useState<number[]>([]);
  const [userPattern, setUserPattern] = useState<number[]>([]);
  const [attemptFailed, setAttemptFailed] = useState(false);
  const [dots, setDots] = useState<{x: number; y: number; id: number}[]>([]);
  
  // Generate the pattern once on mount
  useEffect(() => {
    const patternLength = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7;
    const totalDots = difficulty === 'easy' ? 9 : difficulty === 'medium' ? 16 : 25;
    
    // Create a grid of dots
    const newDots = [];
    const size = Math.sqrt(totalDots);
    const padding = 40;
    const dotSize = 10;
    
    // Canvas dimensions from the ref
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    const gridSpacingX = (width - 2 * padding) / (size - 1);
    const gridSpacingY = (height - 2 * padding) / (size - 1);
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        newDots.push({
          x: padding + j * gridSpacingX,
          y: padding + i * gridSpacingY,
          id: i * size + j
        });
      }
    }
    
    setDots(newDots);
    
    // Generate a random pattern
    const newPattern = [];
    const availablePositions = Array.from({ length: totalDots }, (_, i) => i);
    
    // Start with a random position
    const firstPos = Math.floor(Math.random() * availablePositions.length);
    newPattern.push(availablePositions[firstPos]);
    availablePositions.splice(firstPos, 1);
    
    // Add remaining positions to the pattern
    for (let i = 1; i < patternLength; i++) {
      const nextPos = Math.floor(Math.random() * availablePositions.length);
      newPattern.push(availablePositions[nextPos]);
      availablePositions.splice(nextPos, 1);
    }
    
    setPattern(newPattern);
    
    // Draw the dots
    drawDots();
  }, [difficulty]);
  
  // Draw the dots and lines when the canvas or dots change
  useEffect(() => {
    drawDots();
    drawUserPattern();
  }, [dots, userPattern]);
  
  const drawDots = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw dots
    dots.forEach(dot => {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = '#6366F1';
      ctx.fill();
      ctx.closePath();
    });
  };
  
  const drawUserPattern = () => {
    const canvas = canvasRef.current;
    if (!canvas || userPattern.length < 1) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw lines connecting the dots in the user's pattern
    ctx.beginPath();
    
    // Start from the first dot in the pattern
    const firstDot = dots.find(d => d.id === userPattern[0]);
    if (!firstDot) return;
    
    ctx.moveTo(firstDot.x, firstDot.y);
    
    // Draw lines to each subsequent dot
    for (let i = 1; i < userPattern.length; i++) {
      const dot = dots.find(d => d.id === userPattern[i]);
      if (dot) {
        ctx.lineTo(dot.x, dot.y);
      }
    }
    
    ctx.strokeStyle = attemptFailed ? '#EF4444' : '#6366F1';
    ctx.lineWidth = 3;
    ctx.stroke();
  };
  
  const handleDotClick = (dotId: number) => {
    if (attemptFailed) return;
    
    // Add the dot to the user's pattern if it's not already there
    if (!userPattern.includes(dotId)) {
      const newUserPattern = [...userPattern, dotId];
      setUserPattern(newUserPattern);
      
      // Check if the pattern is complete
      if (newUserPattern.length === pattern.length) {
        checkPattern(newUserPattern);
      }
    }
  };
  
  const checkPattern = (userPat: number[]) => {
    // Simple check: same dots in the same order
    const isCorrect = userPat.every((dot, index) => dot === pattern[index]);
    
    if (isCorrect) {
      onVerify(true);
    } else {
      setAttemptFailed(true);
      setTimeout(() => {
        setUserPattern([]);
        setAttemptFailed(false);
        onVerify(false);
      }, 1000);
    }
  };
  
  const resetPattern = () => {
    setUserPattern([]);
    setAttemptFailed(false);
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Memory Pattern Verification</h3>
        <p className="text-sm text-gray-500">
          Memorize the pattern and recreate it by clicking the dots in the same order.
        </p>
      </div>
      
      {pattern.length > 0 && userPattern.length === 0 && !attemptFailed && (
        <div className="flex justify-center mb-4">
          <button
            onClick={() => {
              // Show the pattern briefly
              const demoPattern = [...pattern];
              let index = 0;
              
              const showNextDot = () => {
                if (index < demoPattern.length) {
                  setUserPattern(demoPattern.slice(0, index + 1));
                  index++;
                  setTimeout(showNextDot, 600);
                } else {
                  setTimeout(() => {
                    setUserPattern([]);
                  }, 1000);
                }
              };
              
              showNextDot();
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md"
          >
            Show Pattern
          </button>
        </div>
      )}
      
      <div className="mb-4 relative">
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="border border-gray-200 rounded-md mx-auto"
        />
        
        {/* Transparent overlay for dot clicks */}
        <div 
          className="absolute top-0 left-0 right-0 bottom-0"
          style={{ 
            width: '300px', 
            height: '300px',
            margin: '0 auto',
          }}
        >
          {dots.map(dot => (
            <button
              key={dot.id}
              onClick={() => handleDotClick(dot.id)}
              className="absolute rounded-full hover:bg-indigo-200 transition-colors"
              style={{
                width: '20px',
                height: '20px',
                left: `${dot.x - 10}px`,
                top: `${dot.y - 10}px`,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
              aria-label={`Dot ${dot.id}`}
            />
          ))}
        </div>
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={resetPattern}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md flex items-center"
        >
          <RefreshCw size={16} className="mr-2" />
          Reset
        </button>
      </div>
    </div>
  );
};

// Updated Image Selection CAPTCHA with real images from Unsplash
const ImageSelectionCaptcha: React.FC<{
  onVerify: (success: boolean) => void;
  difficulty: 'easy' | 'medium' | 'hard';
}> = ({ onVerify, difficulty }) => {
  // Actual images from Unsplash with known categories
  const imageCategories = {
    animals: [
      "https://images.unsplash.com/photo-1530595467517-49740742c05f?w=150&h=150&fit=crop&auto=format", // Cat
      "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=150&h=150&fit=crop&auto=format", // Dog
      "https://images.unsplash.com/photo-1501706362039-c06b2d715385?w=150&h=150&fit=crop&auto=format", // Fox
      "https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=150&h=150&fit=crop&auto=format"  // Elephant
    ],
    vehicles: [
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=150&h=150&fit=crop&auto=format", // Car
      "https://images.unsplash.com/photo-1511702771955-42b52e1cd168?w=150&h=150&fit=crop&auto=format", // Bike
      "https://images.unsplash.com/photo-1541443131876-44b03de101c5?w=150&h=150&fit=crop&auto=format", // Bus
      "https://images.unsplash.com/photo-1625042700258-a2376cf792e0?w=150&h=150&fit=crop&auto=format"  // Truck
    ],
    food: [
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=150&h=150&fit=crop&auto=format", // Salad
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=150&h=150&fit=crop&auto=format", // Pizza
      "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=150&h=150&fit=crop&auto=format", // Burger
      "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=150&h=150&fit=crop&auto=format"   // Ice cream
    ],
    nature: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150&h=150&fit=crop&auto=format", // Mountain
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&h=150&fit=crop&auto=format", // Beach
      "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=150&h=150&fit=crop&auto=format", // Forest
      "https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=150&h=150&fit=crop&auto=format"  // Waterfall
    ]
  };

  const [targetCategory, setTargetCategory] = useState<string>('');
  const [gridImages, setGridImages] = useState<{url: string, category: string, selected: boolean}[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Initialize the challenge
  useEffect(() => {
    // Choose a random category as the target
    const categories = Object.keys(imageCategories);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    setTargetCategory(randomCategory);
    
    // Create a grid of mixed images
    const allGridImages: {url: string, category: string, selected: boolean}[] = [];
    
    // Add target category images (3-4 images depending on difficulty)
    const targetCount = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
    const targetImages = [...imageCategories[randomCategory]].sort(() => 0.5 - Math.random()).slice(0, targetCount);
    
    targetImages.forEach(url => {
      allGridImages.push({
        url,
        category: randomCategory,
        selected: false
      });
    });
    
    // Add distractor images from other categories to fill a 3x3 grid
    const totalGridSize = 9; // 3x3 grid
    const remainingCount = totalGridSize - targetCount;
    
    const otherCategories = categories.filter(c => c !== randomCategory);
    const distractorImages: {url: string, category: string}[] = [];
    
    otherCategories.forEach(category => {
      imageCategories[category].forEach(url => {
        distractorImages.push({
          url,
          category
        });
      });
    });
    
    // Shuffle and select the required number of distractor images
    const selectedDistractors = distractorImages
      .sort(() => 0.5 - Math.random())
      .slice(0, remainingCount)
      .map(img => ({...img, selected: false}));
    
    // Combine and shuffle all images
    const combinedImages = [...allGridImages, ...selectedDistractors];
    setGridImages(combinedImages.sort(() => 0.5 - Math.random()));
    
  }, [difficulty]);
  
  const handleImageClick = (index: number) => {
    if (isVerifying) return;
    
    setGridImages(prev => 
      prev.map((img, i) => 
        i === index ? {...img, selected: !img.selected} : img
      )
    );
  };
  
  const handleVerify = () => {
    setIsVerifying(true);
    
    // Check if all selected images are from the target category
    // and if all target category images are selected
    const selectedImages = gridImages.filter(img => img.selected);
    const targetImages = gridImages.filter(img => img.category === targetCategory);
    
    const allSelectedAreTarget = selectedImages.every(img => img.category === targetCategory);
    const allTargetsSelected = targetImages.every(img => img.selected);
    
    const success = allSelectedAreTarget && allTargetsSelected;
    
    setTimeout(() => {
      onVerify(success);
      if (!success) {
        setIsVerifying(false);
        
        // Show correct answers
        setGridImages(prev => 
          prev.map(img => ({
            ...img,
            selected: img.category === targetCategory
          }))
        );
        
        // Reset after showing correct answers
        setTimeout(() => {
          setGridImages(prev => 
            prev.map(img => ({
              ...img,
              selected: false
            }))
          );
        }, 1500);
      }
    }, 1000);
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Image Selection CAPTCHA</h3>
        <p className="text-sm text-gray-500 mb-2">
          Select all images that contain {targetCategory}.
        </p>
        <p className="text-xs text-gray-400">
          Click on each image that matches the category.
        </p>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        {gridImages.map((image, index) => (
          <button
            key={index}
            onClick={() => handleImageClick(index)}
            className={`aspect-square relative overflow-hidden rounded-md border-2 transition-all ${
              image.selected 
                ? isVerifying 
                  ? image.category === targetCategory 
                    ? 'border-green-500 ring-2 ring-green-300' 
                    : 'border-red-500 ring-2 ring-red-300'
                  : 'border-indigo-500 ring-2 ring-indigo-300' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <img 
              src={image.url} 
              alt={`Grid image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {image.selected && (
              <div className="absolute top-1 right-1 bg-indigo-500 rounded-full p-1">
                <Check size={12} className="text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>
      </div>
      
      {/* Implementation note that would be removed in production */}
      <div className="mt-4 border-t border-gray-200 pt-3">
        <p className="text-xs text-gray-500">
          <strong>Implementation Note:</strong> In a production environment, you would:
        </p>
        <ul className="text-xs text-gray-500 list-disc pl-5 mt-1">
          <li>Store images in your database with proper categorization</li>
          <li>Create an API endpoint to fetch random images by category</li>
          <li>Implement server-side verification of selections</li>
          <li>Regularly update your image database to prevent automated solving</li>
        </ul>
      </div>
    </div>
  );
};

// Semantic Understanding CAPTCHA
const SemanticCaptcha: React.FC<{
  onVerify: (success: boolean) => void;
  difficulty: 'easy' | 'medium' | 'hard';
}> = ({ onVerify, difficulty }) => {
  const questions = [
    {
      text: "Which of these is used to measure temperature?",
      options: ["Ruler", "Thermometer", "Clock", "Scale"],
      answer: 1
    },
    {
      text: "Which of these animals can fly?",
      options: ["Dog", "Cat", "Bird", "Fish"],
      answer: 2
    },
    {
      text: "Which item doesn't belong in a kitchen?",
      options: ["Refrigerator", "Sofa", "Oven", "Sink"],
      answer: 1
    }
  ];
  
  const difficultyMap = {
    'easy': 0,
    'medium': 1,
    'hard': 2
  };
  
  const question = questions[difficultyMap[difficulty]];
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
    
    // Check if the answer is correct
    setTimeout(() => {
      onVerify(index === question.answer);
      
      if (index !== question.answer) {
        setSelectedOption(null);
      }
    }, 500);
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Semantic Understanding</h3>
        <p className="text-sm text-gray-500">
          Answer the question below to verify you're human.
        </p>
      </div>
      
      <div className="mb-4">
        <p className="text-center font-medium">{question.text}</p>
      </div>
      
      <div className="space-y-2">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionSelect(index)}
            className={`w-full p-3 text-left border ${
              selectedOption === index 
                ? selectedOption === question.answer 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-red-500 bg-red-50' 
                : 'border-gray-200 hover:border-indigo-300'
            } rounded-md transition-colors`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

// Main CAPTCHA Demo component
const CaptchaDemo: React.FC = () => {
  const [behaviorScore, resetBehaviorAnalysis] = useBehaviorAnalysis();
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [selectedCaptcha, setSelectedCaptcha] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  
  const handleCaptchaVerification = (success: boolean) => {
    setCaptchaVerified(success);
  };
  
  const handleReset = () => {
    setCaptchaVerified(false);
    setSelectedCaptcha(null);
    resetBehaviorAnalysis();
  };
  
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">CAPTCHA & Bot Detection Demo</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Behavior Analysis</h3>
            <p className="text-gray-600 mb-4">
              The system is analyzing your behavior in real-time to determine if you're human or a bot.
              Move your mouse, type, scroll, and interact naturally with the page.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">Risk Score: </span>
                <span className={`font-semibold ${
                  behaviorScore.score < 0.3 ? 'text-green-600' : 
                  behaviorScore.score < 0.7 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {behaviorScore.score.toFixed(2)}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div 
                  className={`h-2.5 rounded-full ${
                    behaviorScore.score < 0.3 ? 'bg-green-600' : 
                    behaviorScore.score < 0.7 ? 'bg-yellow-600' : 
                    'bg-red-600'
                  }`}
                  style={{ width: `${behaviorScore.score * 100}%` }}
                ></div>
              </div>
              
              <div className="text-xs text-gray-500 flex justify-between">
                <span>Human (0.0)</span>
                <span>Uncertain</span>
                <span>Bot (1.0)</span>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Score Breakdown:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span>Mouse Movement:</span>
                    <span className={`font-medium ${
                      behaviorScore.details.mouseMovementScore < 0.3 ? 'text-green-600' : 
                      behaviorScore.details.mouseMovementScore < 0.7 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {behaviorScore.details.mouseMovementScore.toFixed(2)}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Keyboard Pattern:</span>
                    <span className={`font-medium ${
                      behaviorScore.details.keyboardPatternScore < 0.3 ? 'text-green-600' : 
                      behaviorScore.details.keyboardPatternScore < 0.7 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {behaviorScore.details.keyboardPatternScore.toFixed(2)}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Interaction Consistency:</span>
                    <span className={`font-medium ${
                      behaviorScore.details.interactionConsistencyScore < 0.3 ? 'text-green-600' : 
                      behaviorScore.details.interactionConsistencyScore < 0.7 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {behaviorScore.details.interactionConsistencyScore.toFixed(2)}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Timing Analysis:</span>
                    <span className={`font-medium ${
                      behaviorScore.details.timingScore < 0.3 ? 'text-green-600' : 
                      behaviorScore.details.timingScore < 0.7 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {behaviorScore.details.timingScore.toFixed(2)}
                    </span>
                  </li>
                </ul>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                Confidence: {Math.round(behaviorScore.confidence * 100)}%
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full" 
                    style={{ width: `${behaviorScore.confidence * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Interactive CAPTCHA Verification</h3>
            <p className="text-gray-600 mb-4">
              Based on the risk score above, you may need to complete a CAPTCHA challenge. 
              Higher risk scores require more complex challenges.
            </p>
            
            {!captchaVerified ? (
              <div>
                {!selectedCaptcha ? (
                  <div>
                    <div className="mb-4">
                      <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">Challenge Difficulty</label>
                      <select
                        id="difficulty"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => setSelectedCaptcha('pattern')}
                        className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                      >
                        <h4 className="font-medium mb-2">Memory Pattern</h4>
                        <p className="text-sm text-gray-600">Memorize and recreate a pattern of dots</p>
                      </button>
                      
                      <button
                        onClick={() => setSelectedCaptcha('image')}
                        className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                      >
                        <h4 className="font-medium mb-2">Image Selection</h4>
                        <p className="text-sm text-gray-600">Select images matching a specific category</p>
                      </button>
                      
                      <button
                        onClick={() => setSelectedCaptcha('semantic')}
                        className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                      >
                        <h4 className="font-medium mb-2">Semantic Understanding</h4>
                        <p className="text-sm text-gray-600">Answer questions based on semantic understanding</p>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-md mx-auto">
                    {selectedCaptcha === 'pattern' && (
                      <PatternCaptcha 
                        onVerify={handleCaptchaVerification} 
                        difficulty={difficulty}
                      />
                    )}
                    
                    {selectedCaptcha === 'image' && (
                      <ImageSelectionCaptcha 
                        onVerify={handleCaptchaVerification} 
                        difficulty={difficulty}
                      />
                    )}
                    
                    {selectedCaptcha === 'semantic' && (
                      <SemanticCaptcha 
                        onVerify={handleCaptchaVerification} 
                        difficulty={difficulty}
                      />
                    )}
                    
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setSelectedCaptcha(null)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        Try a different CAPTCHA
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8">
                <div className="bg-green-100 rounded-full p-4 mb-4">
                  <Check size={32} className="text-green-600" />
                </div>
                <h4 className="text-xl font-medium text-green-700 mb-2">Verification Successful!</h4>
                <p className="text-gray-600 mb-4">You have been verified as human.</p>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Reset Demo
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">How It Works</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700">Behavioral Analysis</h4>
              <p className="text-gray-600">
                The system tracks natural user behaviors like mouse movements, typing patterns, and interaction rhythms.
                Machine learning algorithms analyze these patterns to distinguish humans from bots.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700">Risk-Based Verification</h4>
              <p className="text-gray-600">
                A risk score from 0.0 (definitely human) to 1.0 (definitely bot) is calculated in real-time.
                Higher risk scores trigger increasingly difficult CAPTCHA challenges.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700">Advanced CAPTCHA Types</h4>
              <p className="text-gray-600">
                Traditional CAPTCHAs are being defeated by AI. Our innovative challenges test cognitive abilities 
                that are still difficult for bots: pattern memory, image category recognition, and semantic understanding.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptchaDemo;
