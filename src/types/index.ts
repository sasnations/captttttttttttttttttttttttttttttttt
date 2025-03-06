export type BehaviorScore = {
  score: number;
  confidence: number;
  details: {
    mouseMovementScore: number;
    keyboardPatternScore: number;
    interactionConsistencyScore: number;
    timingScore: number;
  };
};

export type CaptchaVerificationResult = {
  success: boolean;
  token?: string;
  error?: string;
};

export type CaptchaVerificationOptions = {
  difficulty: 'easy' | 'medium' | 'hard';
  onSuccess: (token: string) => void;
  onFailure: (error: string) => void;
};