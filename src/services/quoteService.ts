import type { Quote } from '@/types';

// In-memory data store
let quotes: Quote[] = [
  {
    id: 'quote-001',
    jobId: 'job-001',
    tradespersonId: 'trader-001',
    amount: 120,
    currency: 'EUR',
    description: 'Replace tap cartridge and reseal base. Includes parts and labour. 1-year warranty on parts.',
    estimatedDuration: '2 hours',
    startDate: new Date('2024-01-18T09:00:00'),
    validUntil: new Date('2024-01-25'),
    status: 'pending',
    createdAt: new Date('2024-01-15T11:30:00'),
  },
  {
    id: 'quote-002',
    jobId: 'job-001',
    tradespersonId: 'trader-002',
    amount: 95,
    currency: 'EUR',
    description: 'Fix leaking tap with new washers and seals. Quick same-day service available.',
    estimatedDuration: '1.5 hours',
    startDate: new Date('2024-01-17T14:00:00'),
    validUntil: new Date('2024-01-22'),
    status: 'pending',
    createdAt: new Date('2024-01-15T13:45:00'),
  },
  {
    id: 'quote-003',
    jobId: 'job-001',
    tradespersonId: 'trader-003',
    amount: 150,
    currency: 'EUR',
    description: 'Complete tap replacement with premium mixer tap. Includes removal, installation, and testing.',
    estimatedDuration: '3 hours',
    startDate: new Date('2024-01-19T10:00:00'),
    validUntil: new Date('2024-01-26'),
    status: 'pending',
    createdAt: new Date('2024-01-15T16:20:00'),
  },
  {
    id: 'quote-005',
    jobId: 'job-003',
    tradespersonId: 'trader-005',
    amount: 650,
    currency: 'EUR',
    description: 'Replace 6 decking boards with treated timber. Check and reinforce support joists. Apply protective oil finish.',
    estimatedDuration: '1.5 days',
    startDate: new Date('2024-01-17T08:00:00'),
    validUntil: new Date('2024-01-24'),
    status: 'accepted',
    createdAt: new Date('2024-01-12T10:15:00'),
  },
];

export const getQuotesByJobId = async (jobId: string): Promise<Quote[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return quotes
    .filter(quote => quote.jobId === jobId)
    .sort((a, b) => a.amount - b.amount);
};

export const getQuoteById = async (id: string): Promise<Quote | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return quotes.find(quote => quote.id === id);
};

export const createQuote = async (quoteData: Omit<Quote, 'id' | 'createdAt'>): Promise<Quote> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const newQuote: Quote = {
    ...quoteData,
    id: `quote-${Date.now()}`,
    createdAt: new Date(),
  };
  
  quotes.push(newQuote);
  console.log('Quote created:', newQuote);
  return newQuote;
};

export const updateQuoteStatus = async (
  quoteId: string,
  status: 'pending' | 'accepted' | 'declined'
): Promise<Quote | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const quoteIndex = quotes.findIndex(q => q.id === quoteId);
  if (quoteIndex === -1) return undefined;
  
  quotes[quoteIndex] = {
    ...quotes[quoteIndex],
    status,
  };
  
  console.log('Quote status updated:', quotes[quoteIndex]);
  return quotes[quoteIndex];
};

export const getQuotesByTradespersonId = async (tradespersonId: string): Promise<Quote[]> => {
  await new Promise(resolve => setTimeout(resolve, 250));
  return quotes
    .filter(quote => quote.tradespersonId === tradespersonId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};
