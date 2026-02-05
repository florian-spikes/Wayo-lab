export interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  avatar: string;
}

export interface CanvasCardProps {
  title: string;
  time: string;
  type: 'activity' | 'food' | 'transport';
  x: number;
  y: number;
  delay?: number;
}

export interface Trip {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  duration_days: number;
  destination_country: string;
  preferences: {
    budget?: string;
    rhythm?: string;
    participants?: number;
    experiences?: string[];
    notes?: string;
    emoji?: string;
  };
  // Include joined members for dashboard display
  trip_members?: { count: number }[];
  members?: TripMember[];
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  user?: {
    id?: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
    username?: string;
    emoji?: string;
    location?: string;
  };
}

export interface TripInvitation {
  id: string;
  email: string | null;
  role: 'editor' | 'viewer';
  status: 'pending' | 'accepted' | 'expired';
  token: string;
  expires_at: string;
}
