export interface Invitation {
  id: string;
  slug: string;
  guestName: string;
  guestLastName: string;
  customMessage: string;
  plusOnes: number;
  tableNumber: string;
  status: 'pending' | 'confirmed' | 'declined';
  rsvpResponse?: {
    attending: boolean;
    plusOnesCount: number;
    message: string;
    dietaryRestrictions: string;
    respondedAt: string;
  };
  createdAt: string;
  updatedAt: string;
  viewed: boolean;
  viewedAt?: string;
}

export interface AdminUser {
  username: string;
  password: string;
}

export interface EventConfig {
  parentNames: string;
  babyName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventAddress: string;
  dressCode: string;
  gender: 'boy' | 'girl' | 'surprise';
  theme: string;
  schedule: ScheduleItem[];
  giftRegistry: GiftItem[];
  namePoll: string[];
}

export interface ScheduleItem {
  time: string;
  event: string;
  icon: string;
  desc: string;
}

export interface GiftItem {
  name: string;
  icon: string;
  claimed: boolean;
}

export interface WishMessage {
  id: string;
  author: string;
  message: string;
  createdAt: string;
  slug: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
