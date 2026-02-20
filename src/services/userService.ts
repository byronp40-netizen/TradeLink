import { User } from '@/types';

// In-memory data store
let users: User[] = [
  {
    id: 'user-001',
    name: 'Sarah Murphy',
    email: 'sarah.murphy@email.ie',
    phone: '+353 87 123 4567',
    type: 'customer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    county: 'Dublin',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'trader-001',
    name: 'John O\'Brien Plumbing',
    email: 'john@obrienplumbing.ie',
    phone: '+353 86 234 5678',
    type: 'tradesperson',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200',
    trades: ['Plumbing', 'Heating & Gas'],
    county: 'Dublin',
    rating: 4.8,
    completedJobs: 127,
    createdAt: new Date('2023-06-15'),
  },
  {
    id: 'trader-002',
    name: 'Quick Fix Plumbing',
    email: 'info@quickfixplumbing.ie',
    phone: '+353 87 345 6789',
    type: 'tradesperson',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    trades: ['Plumbing'],
    county: 'Dublin',
    rating: 4.6,
    completedJobs: 89,
    createdAt: new Date('2023-08-20'),
  },
  {
    id: 'trader-003',
    name: 'Premium Home Services',
    email: 'contact@premiumhome.ie',
    phone: '+353 85 456 7890',
    type: 'tradesperson',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200',
    trades: ['Plumbing', 'Electrical', 'Carpentry'],
    county: 'Dublin',
    rating: 4.9,
    completedJobs: 203,
    createdAt: new Date('2023-03-10'),
  },
  {
    id: 'trader-004',
    name: 'McCarthy Electrical',
    email: 'sean@mccarthyelectrical.ie',
    phone: '+353 86 567 8901',
    type: 'tradesperson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    trades: ['Electrical'],
    county: 'Cork',
    rating: 4.7,
    completedJobs: 156,
    createdAt: new Date('2023-05-22'),
  },
  {
    id: 'trader-005',
    name: 'Walsh Carpentry & Decking',
    email: 'michael@walshcarpentry.ie',
    phone: '+353 87 678 9012',
    type: 'tradesperson',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
    trades: ['Carpentry', 'Landscaping'],
    county: 'Galway',
    rating: 4.9,
    completedJobs: 178,
    createdAt: new Date('2023-04-18'),
  },
];

// Simulated current user (in real app, this would come from authentication)
let currentUser: User = users[0]; // Default to customer

export const getCurrentUser = async (): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return currentUser;
};

export const setCurrentUser = (userId: string): void => {
  const user = users.find(u => u.id === userId);
  if (user) {
    currentUser = user;
    console.log('Current user set to:', user.name);
  }
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return users.find(user => user.id === id);
};

export const getAllTradespeople = async (): Promise<User[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return users.filter(user => user.type === 'tradesperson');
};

export const getTradespeople = async (county?: string, trades?: string[]): Promise<User[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let filtered = users.filter(user => user.type === 'tradesperson');
  
  if (county) {
    filtered = filtered.filter(user => user.county === county);
  }
  
  if (trades && trades.length > 0) {
    filtered = filtered.filter(user => 
      user.trades?.some(trade => trades.includes(trade))
    );
  }
  
  return filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>
): Promise<User | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return undefined;
  
  users[userIndex] = {
    ...users[userIndex],
    ...updates,
  };
  
  if (currentUser.id === userId) {
    currentUser = users[userIndex];
  }
  
  console.log('User profile updated:', users[userIndex]);
  return users[userIndex];
};
