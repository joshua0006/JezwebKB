export interface Notification {
  id: string;
  title: string;
  message: string;
  recipients: 'all' | 'active' | 'inactive';
  sender: string;
  createdAt: Date;
  status: 'draft' | 'sent';
} 