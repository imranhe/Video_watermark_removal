export interface HistoryItem {
  id: string;
  name: string;
  type: 'image' | 'video';
  date: string;
  url: string;
  status: 'download' | 'view';
  originalUrl?: string; // Before watermark removal
  subtitleList?: SubtitleItem[]; // For video subtitle generation
}

export interface MembershipPackage {
  id: string;
  title: string;
  price: number;
  duration: string;
  description: string;
  dailyQuota: string;
  badge?: string;
  tag?: string;
}

export interface UserQuota {
  id: string;
  remainingSeconds: number;
  monthlyDays: number;
  membershipLevel: 'free' | 'experience' | 'basic' | 'premium';
}

export interface SubtitleItem {
  id: string;
  startTime: string;
  endTime: string;
  text: string;
}

export interface SupportMessage {
  id: string;
  sender: 'user' | 'system' | 'bot';
  text: string;
  timestamp: string;
}
