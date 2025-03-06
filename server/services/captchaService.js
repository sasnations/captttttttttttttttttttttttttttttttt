import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates or updates the captcha.js file in the CDN directory
 * @param {string} frontendUrl - The frontend URL for API calls
 */
export function initializeCaptchaScript(frontendUrl) {
  const publicPath = path.join(__dirname, '..', '..', 'public');
  const cdnPath = path.join(publicPath, 'cdn');
  
  // Create cdn directory if it doesn't exist
  if (!fs.existsSync(cdnPath)) {
    logger.info(`Creating cdn directory at: ${cdnPath}`);
    fs.mkdirSync(cdnPath, { recursive: true });
  }

  // Check if captcha.js exists, if not create it
  const captchaJsPath = path.join(cdnPath, 'captcha.js');
  if (!fs.existsSync(captchaJsPath)) {
    logger.info(`Creating captcha.js at: ${captchaJsPath}`);
    
    // Copy the script content from the project file
    try {
      const sourceFile = path.join(__dirname, '..', '..', 'public', 'cdn', 'captcha.js');
      if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, captchaJsPath);
        logger.info('Successfully copied captcha.js from source');
      } else {
        // If the source file doesn't exist, create a basic version
        createDefaultCaptchaScript(captchaJsPath, frontendUrl);
      }
    } catch (err) {
      logger.error('Error creating captcha.js', err);
    }
  }
}

/**
 * Creates a default captcha script with the provided frontend URL
 * @param {string} filePath - Path where the file should be created
 * @param {string} frontendUrl - The frontend URL for API calls
 */
function createDefaultCaptchaScript(filePath, frontendUrl) {
  const scriptContent = `/**
 * iCaptcha - Advanced CAPTCHA Protection Service
 * Version 1.0.0
 * https://icaptcha.net
 */
(function(window, document) {
  'use strict';

  // Configuration
  const API_URL = "${frontendUrl}";

  // Private variables
  let clientApiKey = '';
  let containerElement = null;
  let challengeToken = null;
  let challengeType = 'standard';
  let currentChallenge = null;
  let verifyCallback = null;
  let errorCallback = null;

  // Behavior analysis data
  let behaviorData = {
    mouseMoves: 0,
    mousePositions: [],
    clickPattern: [],
    keyPressTimings: [],
    scrollEvents: 0,
    startTime: Date.now()
  };

  /**
   * Core iCaptcha object exposed to the global scope
   */
  const iCaptcha = {
    /**
     * Initialize the CAPTCHA with API key and options
     * @param {Object} options Configuration options
     */
    init: function(options = {}) {
      if (!options.apiKey) {
        console.error('iCaptcha: API key is required');
        return;
      }
      
      clientApiKey = options.apiKey;
      
      // Start behavior tracking if invisible mode is enabled
      if (options.invisibleMode) {
        startBehaviorTracking();
      }
      
      return this;
    },
    
    /**
     * Render a CAPTCHA challenge in a container
     * @param {string} containerId The ID of the container element
     * @param {Object} options Rendering options
     */
    render: function(containerId, options = {}) {
      containerElement = document.getElementById(containerId);
      
      if (!containerElement) {
        console.error('iCaptcha: Container element not found');
        return;
      }
      
      if (!clientApiKey) {
        console.error('iCaptcha: Please call init() with your API key first');
        return;
      }
      
      if (options.challengeType) {
        challengeType = options.challengeType;
      }
      
      // Create challenge container
      containerElement.innerHTML = '';
      containerElement.classList.add('icaptcha-container');
      
      // Create loading indicator
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'icaptcha-loading';
      loadingIndicator.innerHTML = '<div class="icaptcha-spinner"></div><p>Loading CAPTCHA...</p>';
      containerElement.appendChild(loadingIndicator);
      
      // Fetch challenge from server
      fetchChallenge(challengeType)
        .then(challenge => {
          loadingIndicator.remove();
          renderChallenge(challenge);
        })
        .catch(error => {
          loadingIndicator.remove();
          renderError('Failed to load CAPTCHA challenge. Please try again.');
          console.error('iCaptcha error:', error);
        });
      
      // Inject CSS styles
      injectStyles();
      
      return this;
    },
    
    /**
     * Reset the current CAPTCHA challenge
     */
    reset: function() {
      if (containerElement) {
        this.render(containerElement.id, { challengeType });
      }
      return this;
    },
    
    /**
     * Verify user with invisible CAPTCHA
     * @param {Object} options Verification options
     */
    verify: function(options = {}) {
      if (!clientApiKey) {
        if (options.onFailure) {
          options.onFailure('API key not initialized. Call init() first.');
        }
        return;
      }
      
      verifyCallback = options.onSuccess || function() {};
      errorCallback = options.onFailure || function() {};
      
      // First try invisible verification using behavior analysis
      const behaviorScore = analyzeBehavior();
      
      // If behavior score is good enough, verify without showing challenge
      if (behaviorScore < 0.3) {
        verifyInvisible()
          .then(token => {
            verifyCallback(token);
          })
          .catch(error => {
            // If invisible verification fails, show challenge
            if (options.containerId) {
              this.render(options.containerId, {
                challengeType: options.challengeType || 'standard'
              });
            } else {
              // Create modal if no container specified
              createChallengeModal(options.challengeType || 'standard');
            }
            
            if (options.onFailure) {
              options.onFailure(error);
            }
          });
      } else {
        // Show challenge immediately if behavior is suspicious
        if (options.containerId) {
          this.render(options.containerId, {
            challengeType: options.challengeType || 'standard'
          });
        } else {
          // Create modal if no container specified
          createChallengeModal(options.challengeType || 'standard');
        }
      }
      
      return this;
    },
    
    /**
     * Get behavior analysis risk score
     * @return {number} Risk score between 0-1
     */
    getRiskScore: function() {
      return analyzeBehavior();
    },
    
    /**
     * Version information
     */
    version: '1.0.0'
  };
  
  /**
   * Start tracking user behavior for analysis
   */
  function startBehaviorTracking() {
    // Mouse movement tracking
    document.addEventListener('mousemove', function(e) {
      behaviorData.mouseMoves++;
      
      // Sample mouse positions (don't track every movement to reduce data size)
      if (behaviorData.mouseMoves % 10 === 0) {
        behaviorData.mousePositions.push({
          x: e.clientX,
          y: e.clientY,
          t: Date.now() - behaviorData.startTime
        });
        
        // Keep array size reasonable
        if (behaviorData.mousePositions.length > 100) {
          behaviorData.mousePositions.shift();
        }
      }
    });
    
    // Click tracking
    document.addEventListener('click', function(e) {
      behaviorData.clickPattern.push({
        x: e.clientX,
        y: e.clientY,
        t: Date.now() - behaviorData.startTime
      });
      
      // Keep array size reasonable
      if (behaviorData.clickPattern.length > 20) {
        behaviorData.clickPattern.shift();
      }
    });
    
    // Keyboard tracking (timing only, not actual keys)
    document.addEventListener('keydown', function() {
      behaviorData.keyPressTimings.push(Date.now() - behaviorData.startTime);
      
      // Keep array size reasonable
      if (behaviorData.keyPressTimings.length > 30) {
        behaviorData.keyPressTimings.shift();
      }
    });
    
    // Scroll tracking
    document.addEventListener('scroll', function() {
      behaviorData.scrollEvents++;
    });
  }
  
  /**
   * Analyze behavior data to determine bot probability
   * @return {number} Risk score (0 = human, 1 = bot)
   */
  function analyzeBehavior() {
    let score = 0.5; // Start with neutral score
    
    // If no data, return default score
    if (behaviorData.mouseMoves === 0 && behaviorData.clickPattern.length === 0) {
      return score;
    }
    
    // Check for natural mouse movement patterns
    if (behaviorData.mousePositions.length > 5) {
      const mouseConsistency = analyzeMouseConsistency();
      score = score * 0.6 + mouseConsistency * 0.4;
    }
    
    // Check for natural timing between clicks
    if (behaviorData.clickPattern.length > 2) {
      const clickConsistency = analyzeClickConsistency();
      score = score * 0.7 + clickConsistency * 0.3;
    }
    
    // Check for natural timing between keystrokes
    if (behaviorData.keyPressTimings.length > 5) {
      const keystrokeConsistency = analyzeKeystrokeConsistency();
      score = score * 0.7 + keystrokeConsistency * 0.3;
    }
    
    return Math.min(Math.max(score, 0), 1); // Ensure between 0 and 1
  }
  
  /**
   * Analyze mouse movement consistency
   * Returns low score for natural movements, high score for bot-like patterns
   */
  function analyzeMouseConsistency() {
    const positions = behaviorData.mousePositions;
    if (positions.length < 5) return 0.5;
    
    let straightLineCount = 0;
    let angleDifferences = [];
    
    // Check for straight lines and consistent angles
    for (let i = 2; i < positions.length; i++) {
      const p1 = positions[i-2];
      const p2 = positions[i-1];
      const p3 = positions[i];
      
      // Calculate angles between consecutive points
      const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
      
      // Check if movement is in a straight line
      const angleDiff = Math.abs(angle1 - angle2);
      angleDifferences.push(angleDiff);
      
      if (angleDiff < 0.1 || angleDiff > Math.PI * 2 - 0.1) {
        straightLineCount++;
      }
    }
    
    // Calculate variance in angle changes
    const averageAngleDiff = angleDifferences.reduce((sum, diff) => sum + diff, 0) / angleDifferences.length;
    const angleVariance = angleDifferences.reduce((sum, diff) => sum + Math.pow(diff - averageAngleDiff, 2), 0) / angleDifferences.length;
    
    // High straight line percentage and low angle variance suggests bot
    const straightLinePercentage = straightLineCount / (positions.length - 2);
    
    let score = 0;
    score += straightLinePercentage * 0.7; // More straight lines = higher score = more bot-like
    score += (0.1 - Math.min(angleVariance, 0.1)) / 0.1 * 0.3; // Lower variance = higher score = more bot-like
    
    return score;
  }
  
  /**
   * Analyze click pattern consistency
   */
  function analyzeClickConsistency() {
    const clicks = behaviorData.clickPattern;
    if (clicks.length < 3) return 0.5;
    
    // Check timing between clicks
    const timeDiffs = [];
    for (let i = 1; i < clicks.length; i++) {
      timeDiffs.push(clicks[i].t - clicks[i-1].t);
    }
    
    // Calculate variance in timing
    const avgTimeDiff = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
    const timeVariance = timeDiffs.reduce((sum, diff) => sum + Math.pow(diff - avgTimeDiff, 2), 0) / timeDiffs.length;
    
    // Normalize variance (0 = very consistent = bot-like, 1 = very varied = human-like)
    const normalizedVariance = Math.min(timeVariance / 10000, 1);
    
    // Invert so higher score means more bot-like
    return 1 - normalizedVariance;
  }
  
  /**
   * Analyze keystroke timing consistency
   */
  function analyzeKeystrokeConsistency() {
    const timings = behaviorData.keyPressTimings;
    if (timings.length < 5) return 0.5;
    
    // Check timing between keystrokes
    const timeDiffs = [];
    for (let i = 1; i < timings.length; i++) {
      timeDiffs.push(timings[i] - timings[i-1]);
    }
    
    // Calculate variance in timing
    const avgTimeDiff = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
    const timeVariance = timeDiffs.reduce((sum, diff) => sum + Math.pow(diff - avgTimeDiff, 2), 0) / timeDiffs.length;
    
    // Normalize variance (0 = very consistent = bot-like, 1 = very varied = human-like)
    const normalizedVariance = Math.min(timeVariance / 5000, 1);
    
    // Invert so higher score means more bot-like
    return 1 - normalizedVariance;
  }
  
  /**
   * Fetch a CAPTCHA challenge from the server
   */
  function fetchChallenge(type) {
    return new Promise((resolve, reject) => {
      // Make an actual API call to the server
      fetch(\`\${API_URL}/api/captcha/generate\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': clientApiKey
        },
        body: JSON.stringify({ type })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch challenge: ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        if (data.success && data.challenge) {
          resolve(data.challenge);
        } else {
          throw new Error(data.error || 'Failed to fetch challenge');
        }
      })
      .catch(error => {
        console.error('Error fetching challenge:', error);
        // Fallback to default challenges if API call fails
        if (type === 'image') {
          resolve({
            id: 'challenge_' + Math.random().toString(36).substr(2, 9),
            type: 'image',
            data: {
              question: 'Select all images containing animals',
              images: [
                'https://images.unsplash.com/photo-1530595467517-49740742c05f?w=150&h=150&fit=crop',
                'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=150&h=150&fit=crop',
                'https://images.unsplash.com/photo-1501706362039-c06b2d715385?w=150&h=150&fit=crop',
                'https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=150&h=150&fit=crop',
                'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150&h=150&fit=crop',
                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&h=150&fit=crop',
                'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=150&h=150&fit=crop',
                'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=150&h=150&fit=crop',
                'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=150&h=150&fit=crop'
              ],
              correctIndices: [0, 1, 2, 3]
            }
          });
        } else if (type === 'pattern') {
          resolve({
            id: 'challenge_' + Math.random().toString(36).substr(2, 9),
            type: 'pattern',
            data: {
              gridSize: 3,
              pattern: [0, 4, 8, 5, 2]
            }
          });
        } else {
          // Default to text challenge
          resolve({
            id: 'challenge_' + Math.random().toString(36).substr(2, 9),
            type: 'text',
            data: {
              text: 'RH9X7A'
            }
          });
        }
      });
    });
  }
  
  /**
   * Render a CAPTCHA challenge in the container
   */
  function renderChallenge(challenge) {
    currentChallenge = challenge;
    
    const challengeContainer = document.createElement('div');
    challengeContainer.className = 'icaptcha-challenge';
    
    if (challenge.type === 'text') {
      // Text CAPTCHA
      challengeContainer.innerHTML = \`
        <div class="icaptcha-header">Verify you are human</div>
        <div class="icaptcha-text-challenge">
          <div class="icaptcha-text">\${challenge.data.text}</div>
          <input type="text" class="icaptcha-input" placeholder="Enter the text above" autocomplete="off">
        </div>
        <div class="icaptcha-footer">
          <button class="icaptcha-verify-button">Verify</button>
          <button class="icaptcha-reset-button">New Challenge</button>
        </div>
      \`;
      
      const input = challengeContainer.querySelector('.icaptcha-input');
      const verifyButton = challengeContainer.querySelector('.icaptcha-verify-button');
      const resetButton = challengeContainer.querySelector('.icaptcha-reset-button');
      
      verifyButton.addEventListener('click', function() {
        const value = input.value.trim();
        if (value === '') {
          showMessage(challengeContainer, 'Please enter the text', 'error');
          return;
        }
        
        verifyChallenge({
          id: challenge.id,
          type: 'text',
          answer: value
        }, challengeContainer);
      });
      
      resetButton.addEventListener('click', function() {
        iCaptcha.reset();
      });
      
    } else if (challenge.type === 'image') {
      // Image selection CAPTCHA
      const selectedIndices = [];
      
      challengeContainer.innerHTML = \`
        <div class="icaptcha-header">Verify you are human</div>
        <div class="icaptcha-instruction">\${challenge.data.question}</div>
        <div class="icaptcha-image-grid"></div>
        <div class="icaptcha-footer">
          <button class="icaptcha-verify-button">Verify</button>
          <button class="icaptcha-reset-button">New Challenge</button>
        </div>
      \`;
      
      const imageGrid = challengeContainer.querySelector('.icaptcha-image-grid');
      challenge.data.images.forEach((imgUrl, index) => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'icaptcha-image-container';
        imgContainer.innerHTML = \`<img src="\${imgUrl}" alt="Challenge image \${index + 1}">\`;
        imgContainer.setAttribute('data-index', index);
        
        imgContainer.addEventListener('click', function() {
          this.classList.toggle('selected');
          
          const idx = parseInt(this.getAttribute('data-index'));
          const selectedIndex = selectedIndices.indexOf(idx);
          
          if (selectedIndex === -1) {
            selectedIndices.push(idx);
          } else {
            selectedIndices.splice(selectedIndex, 1);
          }
        });
        
        imageGrid.appendChild(imgContainer);
      });
      
      const verifyButton = challengeContainer.querySelector('.icaptcha-verify-button');
      const resetButton = challengeContainer.querySelector('.icaptcha-reset-button');
      
      verifyButton.addEventListener('click', function() {
        if (selectedIndices.length === 0) {
          showMessage(challengeContainer, 'Please select at least one image', 'error');
          return;
        }
        
        verifyChallenge({
          id: challenge.id,
          type: 'image',
          answer: selectedIndices
        }, challengeContainer);
      });
      
      resetButton.addEventListener('click', function() {
        iCaptcha.reset();
      });
      
    } else if (challenge.type === 'pattern') {
      // Pattern memory CAPTCHA
      const userPattern = [];
      let patternShown = false;
      
      challengeContainer.innerHTML = \`
        <div class="icaptcha-header">Verify you are human</div>
        <div class="icaptcha-instruction">Memorize and repeat the pattern</div>
        <div class="icaptcha-pattern-grid"></div>
        <div class="icaptcha-footer">
          <button class="icaptcha-show-pattern">Show Pattern</button>
          <button class="icaptcha-verify-button" disabled>Verify</button>
          <button class="icaptcha-reset-button">New Challenge</button>
        </div>
      \`;
      
      const patternGrid = challengeContainer.querySelector('.icaptcha-pattern-grid');
      const showPatternButton = challengeContainer.querySelector('.icaptcha-show-pattern');
      const verifyButton = challengeContainer.querySelector('.icaptcha-verify-button');
      const resetButton = challengeContainer.querySelector('.icaptcha-reset-button');
      
      // Create grid
      const gridSize = challenge.data.gridSize;
      for (let i = 0; i < gridSize * gridSize; i++) {
        const dot = document.createElement('div');
        dot.className = 'icaptcha-pattern-dot';
        dot.setAttribute('data-index', i);
        
        dot.addEventListener('click', function() {
          if (!patternShown) return;
          
          const idx = parseInt(this.getAttribute('data-index'));
          userPattern.push(idx);
          this.classList.add('selected');
          
          // Enable verify button once at least one dot is selected
          verifyButton.disabled = false;
        });
        
        patternGrid.appendChild(dot);
      }
      
      // Style the grid based on size
      patternGrid.style.gridTemplateColumns = \`repeat(\${gridSize}, 1fr)\`;
      
      showPatternButton.addEventListener('click', function() {
        showPattern(patternGrid, challenge.data.pattern);
        patternShown = true;
        this.disabled = true;
      });
      
      verifyButton.addEventListener('click', function() {
        verifyChallenge({
          id: challenge.id,
          type: 'pattern',
          answer: userPattern
        }, challengeContainer);
      });
      
      resetButton.addEventListener('click', function() {
        iCaptcha.reset();
      });
    }
    
    containerElement.appendChild(challengeContainer);
  }
  
  /**
   * Show pattern animation for pattern challenge
   */
  function showPattern(grid, pattern) {
    const dots = grid.querySelectorAll('.icaptcha-pattern-dot');
    
    // Reset all dots
    dots.forEach(dot => dot.classList.remove('pattern', 'selected'));
    
    // Animate pattern
    let i = 0;
    const intervalId = setInterval(() => {
      if (i < pattern.length) {
        const dot = dots[pattern[i]];
        dot.classList.add('pattern');
        i++;
      } else {
        clearInterval(intervalId);
        
        // Remove pattern after showing
        setTimeout(() => {
          dots.forEach(dot => dot.classList.remove('pattern'));
        }, 1000);
      }
    }, 600);
  }
  
  /**
   * Verify a challenge answer with the server
   */
  function verifyChallenge(answer, challengeContainer) {
    // Show loading state
    const footer = challengeContainer.querySelector('.icaptcha-footer');
    const oldContent = footer.innerHTML;
    footer.innerHTML = '<div class="icaptcha-spinner"></div><p>Verifying...</p>';
    
    // Make an actual API call to verify the challenge
    fetch(\`\${API_URL}/api/captcha/verify\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': clientApiKey
      },
      body: JSON.stringify({
        challengeId: answer.id,
        response: answer.answer
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Verification failed: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        // Success
        challengeToken = data.token;
        
        footer.innerHTML = '<div class="icaptcha-success">✓ Verification successful</div>';
        
        // Call success callback if set
        if (verifyCallback) {
          setTimeout(() => {
            verifyCallback(challengeToken);
            
            // Hide modal if in modal mode
            const modal = document.querySelector('.icaptcha-modal');
            if (modal) {
              document.body.removeChild(modal);
            }
          }, 1000);
        }
      } else {
        // Failure
        throw new Error(data.error || 'Verification failed');
      }
    })
    .catch(error => {
      console.error('Verification error:', error);
      
      // Failure
      footer.innerHTML = oldContent;
      showMessage(challengeContainer, 'Verification failed. Please try again.', 'error');
      
      // Call error callback if set
      if (errorCallback) {
        errorCallback('Verification failed');
      }
    });
  }
  
  /**
   * Verify invisibly using behavior analysis
   */
  function verifyInvisible() {
    return new Promise((resolve, reject) => {
      // Make an actual API call with behavior data
      fetch(\`\${API_URL}/api/captcha/verify\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': clientApiKey
        },
        body: JSON.stringify({
          behaviorData: behaviorData,
          invisible: true
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Invisible verification failed: ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          challengeToken = data.token;
          resolve(challengeToken);
        } else {
          throw new Error(data.error || 'Invisible verification failed');
        }
      })
      .catch(error => {
        console.error('Invisible verification error:', error);
        reject('Invisible verification failed');
      });
    });
  }
  
  /**
   * Create a modal for displaying the CAPTCHA challenge
   */
  function createChallengeModal(challengeType) {
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'icaptcha-modal';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'icaptcha-modal-content';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'icaptcha-modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', function() {
      document.body.removeChild(modal);
      
      // Call error callback
      if (errorCallback) {
        errorCallback('User closed CAPTCHA challenge');
      }
    });
    
    modalContent.appendChild(closeButton);
    
    // Create challenge container
    const challengeContainer = document.createElement('div');
    challengeContainer.id = 'icaptcha-modal-challenge';
    modalContent.appendChild(challengeContainer);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Render challenge in the modal
    containerElement = challengeContainer;
    iCaptcha.render('icaptcha-modal-challenge', { challengeType });
  }
  
  /**
   * Show an error message in the challenge container
   */
  function renderError(message) {
    containerElement.innerHTML = \`
      <div class="icaptcha-error">
        <div class="icaptcha-error-icon">⚠️</div>
        <div class="icaptcha-error-message">\${message}</div>
        <button class="icaptcha-retry-button">Try Again</button>
      </div>
    \`;
    
    const retryButton = containerElement.querySelector('.icaptcha-retry-button');
    retryButton.addEventListener('click', function() {
      iCaptcha.reset();
    });
  }
  
  /**
   * Show a message in the challenge container
   */
  function showMessage(container, message, type) {
    // Remove any existing messages
    const existingMessage = container.querySelector('.icaptcha-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = \`icaptcha-message icaptcha-message-\${type}\`;
    messageEl.textContent = message;
    
    // Insert after the challenge and before the footer
    const footer = container.querySelector('.icaptcha-footer');
    container.insertBefore(messageEl, footer);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (messageEl.parentNode === container) {
        container.removeChild(messageEl);
      }
    }, 3000);
  }
  
  /**
   * Inject CSS styles for CAPTCHA
   */
  function injectStyles() {
    if (document.getElementById('icaptcha-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'icaptcha-styles';
    styleEl.textContent = \`
      .icaptcha-container {
        position: relative;
        min-height: 100px;
        width: 100%;
        max-width: 360px;
        margin: 0 auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }
      
      .icaptcha-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100px;
      }
      
      .icaptcha-spinner {
        width: 30px;
        height: 30px;
        border: 3px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top-color: #3b82f6;
        animation: icaptcha-spin 1s linear infinite;
        margin-bottom: 10px;
      }
      
      @keyframes icaptcha-spin {
        to { transform: rotate(360deg); }
      }
      
      .icaptcha-challenge {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        background: #fff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .icaptcha-header {
        background: #f3f4f6;
        color: #374151;
        padding: 12px 16px;
        font-weight: 600;
        font-size: 14px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .icaptcha-instruction {
        padding: 12px 16px;
        font-size: 14px;
        color: #4b5563;
      }
      
      .icaptcha-text-challenge {
        padding: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .icaptcha-text {
        font-family: monospace;
        font-size: 24px;
        font-weight: bold;
        letter-spacing: 3px;
        color: #111827;
        background: #f3f4f6;
        padding: 10px 16px;
        border-radius: 4px;
        margin-bottom: 16px;
        user-select: none;
        position: relative;
        text-transform: uppercase;
        /* Distortion effect */
        transform: perspective(400px) rotateX(3deg);
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
      }
      
      .icaptcha-text::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: repeating-linear-gradient(
          45deg,
          rgba(0, 0, 0, 0.02),
          rgba(0, 0, 0, 0.02) 10px,
          rgba(0, 0, 0, 0) 10px,
          rgba(0, 0, 0, 0) 20px
        );
      }
      
      .icaptcha-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 14px;
        outline: none;
      }
      
      .icaptcha-input:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
      }
      
      .icaptcha-image-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        padding: 16px;
      }
      
      .icaptcha-image-container {
        position: relative;
        aspect-ratio: 1;
        overflow: hidden;
        border-radius: 4px;
        cursor: pointer;
        border: 2px solid transparent;
      }
      
      .icaptcha-image-container img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .icaptcha-image-container.selected {
        border-color: #3b82f6;
      }
      
      .icaptcha-image-container.selected::after {
        content: '✓';
        position: absolute;
        top: 0;
        right: 0;
        background: #3b82f6;
        color: white;
        font-size: 12px;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-bottom-left-radius: 4px;
      }
      
      .icaptcha-pattern-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        padding: 16px;
        max-width: 240px;
        margin: 0 auto;
      }
      
      .icaptcha-pattern-dot {
        width: 100%;
        aspect-ratio: 1;
        background: #f3f4f6;
        border-radius: 50%;
        cursor: pointer;
      }
      
      .icaptcha-pattern-dot.pattern {
        background: #3b82f6;
        transform: scale(1.1);
        transition: background-color 0.3s, transform 0.3s;
      }
      
      .icaptcha-pattern-dot.selected {
        background: #3b82f6;
        transform: scale(1.1);
      }
      
      .icaptcha-footer {
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #e5e7eb;
      }
      
      .icaptcha-verify-button,
      .icaptcha-reset-button,
      .icaptcha-show-pattern,
      .icaptcha-retry-button {
        padding: 8px 16px;
        font-size: 14px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        border: none;
      }
      
      .icaptcha-verify-button {
        background: #3b82f6;
        color: white;
      }
      
      .icaptcha-verify-button:hover {
        background: #2563eb;
      }
      
      .icaptcha-verify-button:disabled {
        background: #93c5fd;
        cursor: not-allowed;
      }
      
      .icaptcha-reset-button,
      .icaptcha-show-pattern {
        background: #f3f4f6;
        color: #4b5563;
      }
      
      .icaptcha-reset-button:hover,
      .icaptcha-show-pattern:hover {
        background: #e5e7eb;
      }
      
      .icaptcha-retry-button {
        margin: 0 auto;
        display: block;
        background: #3b82f6;
        color: white;
      }
      
      .icaptcha-retry-button:hover {
        background: #2563eb;
      }
      
      .icaptcha-error {
        padding: 24px 16px;
        text-align: center;
      }
      
      .icaptcha-error-icon {
        font-size: 24px;
        margin-bottom: 8px;
      }
      
      .icaptcha-error-message {
        color: #4b5563;
        margin-bottom: 16px;
      }
      
      .icaptcha-message {
        margin: 0 16px 12px;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 13px;
      }
      
      .icaptcha-message-error {
        background: #fee2e2;
        color: #b91c1c;
      }
      
      .icaptcha-message-success {
        background: #d1fae5;
        color: #047857;
      }
      
      .icaptcha-success {
        color: #047857;
        font-weight: 500;
      }
      
      .icaptcha-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
      }
      
      .icaptcha-modal-content {
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 90%;
        width: 360px;
        position: relative;
      }
      
      .icaptcha-modal-close {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
        color: #9ca3af;
      }
      
      .icaptcha-modal-close:hover {
        color: #4b5563;
      }
    \`;
    
    document.head.appendChild(styleEl);
  }
  
  // Expose iCaptcha to the global scope
  window.iCaptcha = iCaptcha;
  
})(window, document);`;
  
  fs.writeFileSync(filePath, scriptContent);
  logger.info('Created default captcha.js file');
}

/**
 * Generate a new CAPTCHA challenge from the database
 * @param {object} pool - Database connection pool
 * @param {string} type - Type of CAPTCHA challenge to generate
 * @param {object} options - Additional options like difficulty
 * @returns {Promise<Object>} - Returns a Promise that resolves to the challenge object
 */
export async function generateChallenge(pool, type, options = {}) {
  const { difficulty = 'medium', onlyActive = true } = options;
  
  try {
    // Try to get a challenge with the specified difficulty first
    let query = `
      SELECT * FROM challenge_content 
      WHERE challenge_type = $1
    `;
    
    const queryParams = [type];
    let paramIndex = 2;
    
    if (difficulty) {
      query += ` AND metadata->>'difficulty' = $${paramIndex}`;
      queryParams.push(difficulty);
      paramIndex++;
    }
    
    if (onlyActive) {
      query += ` AND is_active = $${paramIndex}`;
      queryParams.push(true);
      paramIndex++;
    }
    
    // Add random ordering
    query += ` ORDER BY RANDOM() LIMIT 1`;
    
    logger.info(`Executing challenge query for type: ${type}, params: ${JSON.stringify({
      difficulty, onlyActive
    })}`);
    
    let result = await pool.query(query, queryParams);
    
    // If no results with specific difficulty, try without difficulty filter
    if (result.rows.length === 0 && difficulty) {
      logger.info(`No ${type} challenge found with difficulty: ${difficulty}, trying without difficulty filter`);
      
      // Remove difficulty from query
      query = `
        SELECT * FROM challenge_content 
        WHERE challenge_type = $1
      `;
      
      const newParams = [type];
      paramIndex = 2;
      
      if (onlyActive) {
        query += ` AND is_active = $${paramIndex}`;
        newParams.push(true);
        paramIndex++;
      }
      
      query += ` ORDER BY RANDOM() LIMIT 1`;
      
      result = await pool.query(query, newParams);
    }
    
    if (result.rows.length > 0) {
      const challenge = result.rows[0];
      
      // Handle the possibility that content_data might be empty
      if (!challenge.content_data) {
        logger.warn(`Challenge ${challenge.id} has empty content_data`);
        return createDefaultChallenge(type, difficulty);
      }
      
      // For image_selection challenges, ensure correctIndices exists
      if (type === 'image_selection' && !challenge.content_data.correctIndices) {
        logger.warn(`Image selection challenge ${challenge.id} missing correctIndices, adding default`);
        challenge.content_data.correctIndices = [0]; // Default to first image
      }
      
      return {
        id: challenge.id,
        type: challenge.challenge_type,
        data: challenge.content_data
      };
    } else {
      logger.warn(`No ${type} challenge found in database, using default`);
      return createDefaultChallenge(type, difficulty);
    }
  } catch (error) {
    logger.error('Error generating challenge from database:', error);
    // Fallback to default challenge
    return createDefaultChallenge(type, difficulty);
  }
}

/**
 * Create a default challenge when database retrieval fails
 * @param {string} type - Type of challenge to create
 * @param {string} difficulty - Difficulty level
 * @returns {Object} - Default challenge object
 */
function createDefaultChallenge(type, difficulty = 'medium') {
  const id = uuidv4();
  
  // Convert 'image' type to 'image_selection' for consistency
  const normalizedType = type === 'image' ? 'image_selection' : type;
  
  switch (normalizedType) {
    case 'image_selection':
      return {
        id,
        type: 'image',
        data: {
          question: 'Select all images containing animals',
          images: [
            'https://images.unsplash.com/photo-1530595467517-49740742c05f?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1501706362039-c06b2d715385?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=150&h=150&fit=crop'
          ],
          correctIndices: [0, 1, 2, 3]
        }
      };
      
    case 'pattern':
      return {
        id,
        type: 'pattern',
        data: {
          gridSize: difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5,
          pattern: [0, 4, 8, 5, 2]
        }
      };
      
    case 'semantic':
      return {
        id,
        type: 'semantic',
        data: {
          question: 'Which of these is a color?',
          options: ['Apple', 'Blue', 'Chair', 'Dog'],
          correctIndex: 1
        }
      };
      
    default:
      // Default to text challenge
      return {
        id,
        type: 'text',
        data: {
          text: difficulty === 'easy' ? 'ABC123' : 
                difficulty === 'medium' ? 'RH9X7A' : 
                'J7K2#P9',
          distortionLevel: difficulty
        }
      };
  }
}

/**
 * Verify a CAPTCHA challenge response
 * @param {object} pool - Database connection pool
 * @param {string} challengeId - The challenge ID
 * @param {any} response - The user's response
 * @param {object} options - Additional options
 * @returns {Promise<Object>} - Returns a Promise that resolves to the verification result
 */
export async function verifyChallenge(pool, challengeId, response, options = {}) {
  try {
    // Handle invisible verification
    if (options.invisible && options.behaviorData) {
      const behaviorScore = analyzeBehaviorData(options.behaviorData);
      
      // If score is low enough (human-like), return success
      if (behaviorScore < 0.4) {
        return {
          success: true,
          token: 'behavior_' + uuidv4()
        };
      } else {
        return {
          success: false,
          error: 'Behavior verification failed. Please complete a challenge.'
        };
      }
    }
    
    // For demo purposes, we'll implement a simple verification
    // Generate a token for successful verification
    const token = 'token_' + uuidv4();
    
    // For demo purposes, accept all responses
    return {
      success: true,
      token
    };
  } catch (error) {
    logger.error('Error verifying challenge:', error);
    return {
      success: false,
      error: 'Server error during verification'
    };
  }
}

/**
 * Analyze behavior data to detect if the user is a bot
 * @param {Object} behaviorData - Behavior data collected from the client
 * @returns {number} - Risk score (0 = definitely human, 1 = definitely bot)
 */
function analyzeBehaviorData(behaviorData) {
  // Simple implementation - in a real system this would be more sophisticated
  
  // If no data at all, very suspicious
  if (!behaviorData || !behaviorData.mouseMoves) {
    return 0.9;
  }
  
  let score = 0.5; // Start with a neutral score
  
  // Check for mouse movements
  if (behaviorData.mouseMoves > 10) {
    score -= 0.1; // More natural
  }
  
  // Check for varied mouse speeds (if available)
  if (behaviorData.mousePositions && behaviorData.mousePositions.length > 5) {
    score -= 0.1; // More natural
  }
  
  // Check for keyboard activity
  if (behaviorData.keyPressTimings && behaviorData.keyPressTimings.length > 0) {
    score -= 0.1; // More natural
  }
  
  // Check for scrolling
  if (behaviorData.scrollEvents > 0) {
    score -= 0.1; // More natural
  }
  
  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score));
}