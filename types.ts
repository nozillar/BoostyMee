
export enum AppView {
  HOME = 'HOME',
  COACH = 'COACH',
  BOOST = 'BOOST',
  JOURNEY = 'JOURNEY',
  PROFILE = 'PROFILE'
}

export interface TaskStep {
  title: string;
  description: string;
  duration: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface CheckInRecord {
  id: string;
  date: string;
  score: number;
  mood: string;
  note: string;
  aiResponse: string;
}

export interface DailyMission {
  id: number;
  text: string;
  completed: boolean;
}

export interface UserStats {
  totalCheckIns: number;
  avgConfidence: number;
  totalMissionsCompleted: number;
}

export interface UserProfile {
  name: string;
  role: string;
  goal: string;
  note: string;
  avatar: string;
}

export interface ReminderSettings {
  enabled: boolean;
  time: string;
  type: 'checkin' | 'boost' | 'both';
}
