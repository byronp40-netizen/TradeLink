import type { Job, JobStatus, TradeCategory } from '@/types';

// In-memory data store
let jobs: Job[] = [
  {
    id: 'job-001',
    customerId: 'user-001',
    title: 'Leaking Kitchen Tap Repair',
    description: 'Kitchen tap has developed a persistent drip. Water is leaking from the base when turned on. Need urgent repair to prevent water damage.',
    originalDescription: 'My kitchen tap is dripping and won\'t stop leaking',
    tradeCategories: ['Plumbing'],
    status: 'quotes_received',
    urgency: 'urgent',
    county: 'Dublin',
    eircode: 'D02 XY45',
    address: '15 Main Street, Dublin 2',
    images: ['https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800'],
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T14:20:00'),
    preferredStartDate: new Date('2024-01-18'),
    estimatedDuration: '2-3 hours',
  },
  {
    id: 'job-002',
    customerId: 'user-001',
    title: 'Electrical Socket Installation',
    description: 'Need 3 additional power sockets installed in home office. Wall is plasterboard. All work must comply with Irish electrical safety standards.',
    originalDescription: 'I need more plugs in my office room',
    tradeCategories: ['Electrical'],
    status: 'pending_quotes',
    urgency: 'normal',
    county: 'Cork',
    eircode: 'T12 AB34',
    address: '42 Oak Drive, Cork',
    images: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800'],
    createdAt: new Date('2024-01-16T09:15:00'),
    updatedAt: new Date('2024-01-16T09:15:00'),
    preferredStartDate: new Date('2024-01-22'),
    estimatedDuration: '3-4 hours',
  },
  {
    id: 'job-003',
    customerId: 'user-001',
    title: 'Garden Decking Repair',
    description: 'Wooden decking has rotted planks that need replacement. Approximately 5-6 boards affected. May also need structural support inspection.',
    originalDescription: 'The wood on my back deck is rotting and needs fixing',
    tradeCategories: ['Carpentry', 'Landscaping'],
    status: 'in_progress',
    urgency: 'normal',
    county: 'Galway',
    eircode: 'H91 CD56',
    address: '8 Coastal View, Galway',
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],
    createdAt: new Date('2024-01-10T14:00:00'),
    updatedAt: new Date('2024-01-17T10:30:00'),
    selectedQuoteId: 'quote-005',
    preferredStartDate: new Date('2024-01-17'),
    estimatedDuration: '1-2 days',
  },
];

export const getAllJobs = async (): Promise<Job[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...jobs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getJobById = async (id: string): Promise<Job | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return jobs.find(job => job.id === id);
};

export const getJobsByCustomerId = async (customerId: string): Promise<Job[]> => {
  await new Promise(resolve => setTimeout(resolve, 250));
  return jobs.filter(job => job.customerId === customerId);
};

export const createJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const newJob: Job = {
    ...jobData,
    id: `job-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  jobs.push(newJob);
  console.log('Job created:', newJob);
  return newJob;
};

export const updateJobStatus = async (jobId: string, status: JobStatus): Promise<Job | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const jobIndex = jobs.findIndex(j => j.id === jobId);
  if (jobIndex === -1) return undefined;
  
  jobs[jobIndex] = {
    ...jobs[jobIndex],
    status,
    updatedAt: new Date(),
  };
  
  console.log('Job status updated:', jobs[jobIndex]);
  return jobs[jobIndex];
};

export const selectQuoteForJob = async (jobId: string, quoteId: string): Promise<Job | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const jobIndex = jobs.findIndex(j => j.id === jobId);
  if (jobIndex === -1) return undefined;
  
  jobs[jobIndex] = {
    ...jobs[jobIndex],
    selectedQuoteId: quoteId,
    status: 'contractor_selected',
    updatedAt: new Date(),
  };
  
  console.log('Quote selected for job:', jobs[jobIndex]);
  return jobs[jobIndex];
};

export const analyzeJobDescription = async (description: string): Promise<{
  recommendedTrades: TradeCategory[];
  confidence: number;
  reasoning: string;
}> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const lowerDesc = description.toLowerCase();
  const trades: TradeCategory[] = [];
  let reasoning = '';
  
  // Simple keyword-based analysis (simulating AI)
  if (lowerDesc.includes('tap') || lowerDesc.includes('leak') || lowerDesc.includes('pipe') || 
      lowerDesc.includes('water') || lowerDesc.includes('sink') || lowerDesc.includes('toilet')) {
    trades.push('Plumbing');
    reasoning = 'Keywords related to water systems and plumbing fixtures detected. ';
  }
  
  if (lowerDesc.includes('electric') || lowerDesc.includes('socket') || lowerDesc.includes('plug') || 
      lowerDesc.includes('light') || lowerDesc.includes('switch') || lowerDesc.includes('wire')) {
    trades.push('Electrical');
    reasoning += 'Electrical components and wiring terms identified. ';
  }
  
  if (lowerDesc.includes('paint') || lowerDesc.includes('decor') || lowerDesc.includes('wall color')) {
    trades.push('Painting & Decorating');
    reasoning += 'Painting and decoration work mentioned. ';
  }
  
  if (lowerDesc.includes('wood') || lowerDesc.includes('door') || lowerDesc.includes('cabinet') || 
      lowerDesc.includes('shelf') || lowerDesc.includes('deck')) {
    trades.push('Carpentry');
    reasoning += 'Woodwork and carpentry tasks detected. ';
  }
  
  if (lowerDesc.includes('roof') || lowerDesc.includes('gutter') || lowerDesc.includes('slate')) {
    trades.push('Roofing');
    reasoning += 'Roofing work identified. ';
  }
  
  if (lowerDesc.includes('boiler') || lowerDesc.includes('heating') || lowerDesc.includes('radiator') || 
      lowerDesc.includes('gas')) {
    trades.push('Heating & Gas');
    reasoning += 'Heating system and gas work detected. ';
  }
  
  if (lowerDesc.includes('plaster') || lowerDesc.includes('ceiling') || lowerDesc.includes('render')) {
    trades.push('Plastering');
    reasoning += 'Plastering work identified. ';
  }
  
  if (lowerDesc.includes('tile') || lowerDesc.includes('bathroom floor') || lowerDesc.includes('kitchen floor')) {
    trades.push('Tiling');
    reasoning += 'Tiling work mentioned. ';
  }
  
  if (lowerDesc.includes('garden') || lowerDesc.includes('lawn') || lowerDesc.includes('patio') || 
      lowerDesc.includes('fence')) {
    trades.push('Landscaping');
    reasoning += 'Garden and landscaping work detected. ';
  }
  
  if (lowerDesc.includes('window') || lowerDesc.includes('glass') || lowerDesc.includes('door glass')) {
    trades.push('Glazing');
    reasoning += 'Glass and glazing work identified. ';
  }
  
  if (lowerDesc.includes('build') || lowerDesc.includes('extension') || lowerDesc.includes('wall')) {
    trades.push('Building & Construction');
    reasoning += 'Construction and building work mentioned. ';
  }
  
  const confidence = trades.length > 0 ? 0.85 : 0.3;
  
  if (trades.length === 0) {
    trades.push('Building & Construction');
    reasoning = 'Unable to determine specific trade from description. General building category suggested.';
  }
  
  console.log('AI Analysis:', { description, recommendedTrades: trades, confidence, reasoning });
  
  return {
    recommendedTrades: trades,
    confidence,
    reasoning: reasoning.trim(),
  };
};
