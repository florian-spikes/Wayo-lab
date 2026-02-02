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