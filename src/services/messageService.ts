import { Message } from '@/types';

// In-memory data store
let messages: Message[] = [
  {
    id: 'msg-001',
    jobId: 'job-001',
    senderId: 'user-001',
    receiverId: 'trader-001',
    content: 'Hi John, I noticed your quote includes a 1-year warranty. Does that cover both parts and labour?',
    createdAt: new Date('2024-01-15T12:00:00'),
    read: true,
  },
  {
    id: 'msg-002',
    jobId: 'job-001',
    senderId: 'trader-001',
    receiverId: 'user-001',
    content: 'Hello Sarah! Yes, the warranty covers both parts and labour for the full year. If you have any issues with the tap after installation, I\'ll come back and fix it at no extra cost.',
    createdAt: new Date('2024-01-15T12:15:00'),
    read: true,
  },
  {
    id: 'msg-003',
    jobId: 'job-001',
    senderId: 'user-001',
    receiverId: 'trader-001',
    content: 'That\'s great, thank you! What time could you start on the 18th?',
    createdAt: new Date('2024-01-15T12:20:00'),
    read: true,
  },
  {
    id: 'msg-004',
    jobId: 'job-001',
    senderId: 'trader-001',
    receiverId: 'user-001',
    content: 'I can be there at 9am if that works for you? The job should take about 2 hours.',
    createdAt: new Date('2024-01-15T12:25:00'),
    read: false,
  },
  {
    id: 'msg-005',
    jobId: 'job-003',
    senderId: 'user-001',
    receiverId: 'trader-005',
    content: 'Michael, the decking looks fantastic! Really happy with the work. When can you come back to apply the protective oil you mentioned?',
    createdAt: new Date('2024-01-17T15:30:00'),
    read: true,
  },
  {
    id: 'msg-006',
    jobId: 'job-003',
    senderId: 'trader-005',
    receiverId: 'user-001',
    content: 'Glad you\'re happy with it! I can apply the oil tomorrow morning if the weather holds. It needs to be dry for 24 hours after application.',
    createdAt: new Date('2024-01-17T16:00:00'),
    read: false,
  },
];

export const getMessagesByJobId = async (jobId: string): Promise<Message[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return messages
    .filter(msg => msg.jobId === jobId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
};

export const getConversation = async (
  jobId: string,
  userId1: string,
  userId2: string
): Promise<Message[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return messages
    .filter(msg => 
      msg.jobId === jobId &&
      ((msg.senderId === userId1 && msg.receiverId === userId2) ||
       (msg.senderId === userId2 && msg.receiverId === userId1))
    )
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
};

export const sendMessage = async (
  messageData: Omit<Message, 'id' | 'createdAt' | 'read'>
): Promise<Message> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const newMessage: Message = {
    ...messageData,
    id: `msg-${Date.now()}`,
    createdAt: new Date(),
    read: false,
  };
  
  messages.push(newMessage);
  console.log('Message sent:', newMessage);
  return newMessage;
};

export const markMessageAsRead = async (messageId: string): Promise<Message | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const msgIndex = messages.findIndex(m => m.id === messageId);
  if (msgIndex === -1) return undefined;
  
  messages[msgIndex] = {
    ...messages[msgIndex],
    read: true,
  };
  
  return messages[msgIndex];
};

export const markAllMessagesAsRead = async (
  jobId: string,
  userId: string
): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  messages = messages.map(msg => {
    if (msg.jobId === jobId && msg.receiverId === userId && !msg.read) {
      return { ...msg, read: true };
    }
    return msg;
  });
  
  console.log('All messages marked as read for user:', userId, 'in job:', jobId);
};

export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return messages.filter(msg => msg.receiverId === userId && !msg.read).length;
};
