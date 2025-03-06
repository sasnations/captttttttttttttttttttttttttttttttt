import { useState, useEffect } from 'react';

type BehaviorMetrics = {
  mouseMoves: number;
  mouseSpeed: number[];
  clickPrecision: number[];
  keyPressPatterns: number[];
  formInteractions: number;
  pageScrolls: number;
  totalTime: number; // in milliseconds
};

type BehaviorScore = {
  score: number;
  confidence: number;
  details: {
    mouseMovementScore: number;
    keyboardPatternScore: number;
    interactionConsistencyScore: number;
    timingScore: number;
  };
};

/**
 * Hook to analyze user behavior and detect potential bot activity
 * Returns a risk score between 0 (definitely human) and 1 (definitely bot)
 */
export function useBehaviorAnalysis(): [BehaviorScore, () => void] {
  const [metrics, setMetrics] = useState<BehaviorMetrics>({
    mouseMoves: 0,
    mouseSpeed: [],
    clickPrecision: [],
    keyPressPatterns: [],
    formInteractions: 0,
    pageScrolls: 0,
    totalTime: 0,
  });

  const [score, setScore] = useState<BehaviorScore>({
    score: 0.5,
    confidence: 0,
    details: {
      mouseMovementScore: 0.5,
      keyboardPatternScore: 0.5,
      interactionConsistencyScore: 0.5,
      timingScore: 0.5,
    },
  });

  // Start tracking behavior on mount
  useEffect(() => {
    const startTime = Date.now();
    let lastMousePosition = { x: 0, y: 0 };
    let lastMouseTime = startTime;
    let keyPressTimes: number[] = [];

    // Mouse movement tracking
    const handleMouseMove = (e: MouseEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastMouseTime;
      if (timeDiff < 10) return; // Throttle tracking

      // Calculate speed and direction
      const distX = e.clientX - lastMousePosition.x;
      const distY = e.clientY - lastMousePosition.y;
      const distance = Math.sqrt(distX * distX + distY * distY);
      const speed = distance / timeDiff;

      setMetrics((prev) => ({
        ...prev,
        mouseMoves: prev.mouseMoves + 1,
        mouseSpeed: [...prev.mouseSpeed, speed],
        totalTime: currentTime - startTime,
      }));

      lastMousePosition = { x: e.clientX, y: e.clientY };
      lastMouseTime = currentTime;
    };

    // Click precision tracking
    const handleMouseClick = (e: MouseEvent) => {
      const currentTime = Date.now();
      // Check precision (straightness of path to click target)
      const precision = Math.random(); // In a real implementation this would use actual metrics

      setMetrics((prev) => ({
        ...prev,
        clickPrecision: [...prev.clickPrecision, precision],
        totalTime: currentTime - startTime,
      }));
    };

    // Keyboard pattern tracking
    const handleKeyPress = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      keyPressTimes.push(currentTime);

      if (keyPressTimes.length > 1) {
        const timeBetweenKeys = currentTime - keyPressTimes[keyPressTimes.length - 2];
        
        setMetrics((prev) => ({
          ...prev,
          keyPressPatterns: [...prev.keyPressPatterns, timeBetweenKeys],
          totalTime: currentTime - startTime,
        }));
      }
    };

    // Scroll tracking
    const handleScroll = () => {
      const currentTime = Date.now();
      
      setMetrics((prev) => ({
        ...prev,
        pageScrolls: prev.pageScrolls + 1,
        totalTime: currentTime - startTime,
      }));
    };

    // Form interaction tracking
    const handleFormInteraction = (e: Event) => {
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLSelectElement || 
          e.target instanceof HTMLTextAreaElement) {
        const currentTime = Date.now();
        
        setMetrics((prev) => ({
          ...prev,
          formInteractions: prev.formInteractions + 1,
          totalTime: currentTime - startTime,
        }));
      }
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleMouseClick);
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('scroll', handleScroll);
    document.addEventListener('input', handleFormInteraction);
    document.addEventListener('change', handleFormInteraction);
    
    // Calculate score at regular intervals
    const scoreInterval = setInterval(() => {
      calculateRiskScore();
    }, 2000);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleMouseClick);
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('input', handleFormInteraction);
      document.removeEventListener('change', handleFormInteraction);
      clearInterval(scoreInterval);
    };
  }, []);

  const calculateRiskScore = () => {
    // Mouse movement analysis
    let mouseMovementScore = 0.5;
    if (metrics.mouseSpeed.length > 0) {
      // Check for natural variance in mouse speed
      const speeds = metrics.mouseSpeed;
      const variance = calculateVariance(speeds);
      
      // Bots often have very consistent or very erratic mouse movements
      const normalizedVariance = Math.min(variance / 5, 1); // Normalize between 0-1
      
      // Too consistent (low variance) or too erratic (high variance) are suspicious
      mouseMovementScore = normalizedVariance > 0.1 && normalizedVariance < 0.7 ? 0.2 : 0.8;
    }

    // Keyboard pattern analysis
    let keyboardPatternScore = 0.5;
    if (metrics.keyPressPatterns.length > 5) {
      // Check for rhythmic patterns in keystrokes
      const keyPatterns = metrics.keyPressPatterns;
      const keyVariance = calculateVariance(keyPatterns);
      
      // Humans have natural variance in typing rhythm
      const normalizedKeyVariance = Math.min(keyVariance / 1000, 1);
      
      // Too rhythmic or too random is suspicious
      keyboardPatternScore = normalizedKeyVariance > 0.05 && normalizedKeyVariance < 0.8 ? 0.2 : 0.8;
    }

    // Interaction consistency
    let interactionConsistencyScore = 0.5;
    // Analysis of overall interaction pattern
    if (metrics.totalTime > 3000) {
      const totalInteractions = metrics.mouseMoves + metrics.formInteractions + metrics.pageScrolls;
      const interactionsPerSecond = totalInteractions / (metrics.totalTime / 1000);
      
      // Humans typically have variable interaction rates
      interactionConsistencyScore = (interactionsPerSecond > 0.5 && interactionsPerSecond < 5) ? 0.2 : 0.8;
    }

    // Time-based analysis
    let timingScore = 0.5;
    if (metrics.totalTime > 1000) {
      // Very short or excessively long interaction times are suspicious
      timingScore = (metrics.totalTime > 3000 && metrics.totalTime < 30000) ? 0.2 : 0.7;
    }

    // Calculate overall risk score (weighted average)
    const overallScore = (
      mouseMovementScore * 0.35 + 
      keyboardPatternScore * 0.25 + 
      interactionConsistencyScore * 0.25 + 
      timingScore * 0.15
    );

    // Calculate confidence based on amount of data collected
    const dataPoints = metrics.mouseMoves + metrics.keyPressPatterns.length + metrics.formInteractions;
    const confidence = Math.min(dataPoints / 50, 1);

    setScore({
      score: overallScore,
      confidence: confidence,
      details: {
        mouseMovementScore,
        keyboardPatternScore,
        interactionConsistencyScore,
        timingScore
      }
    });
  };

  const resetAnalysis = () => {
    setMetrics({
      mouseMoves: 0,
      mouseSpeed: [],
      clickPrecision: [],
      keyPressPatterns: [],
      formInteractions: 0,
      pageScrolls: 0,
      totalTime: 0,
    });
    
    setScore({
      score: 0.5,
      confidence: 0,
      details: {
        mouseMovementScore: 0.5,
        keyboardPatternScore: 0.5,
        interactionConsistencyScore: 0.5,
        timingScore: 0.5,
      }
    });
  };

  return [score, resetAnalysis];
}

// Helper function to calculate variance of an array of numbers
function calculateVariance(arr: number[]): number {
  if (arr.length === 0) return 0;
  
  const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
  const squareDiffs = arr.map(value => {
    const diff = value - mean;
    return diff * diff;
  });
  
  return squareDiffs.reduce((sum, val) => sum + val, 0) / arr.length;
}