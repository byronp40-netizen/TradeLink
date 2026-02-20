import { Review } from '@/types';

// In-memory data store
let reviews: Review[] = [
  {
    id: 'review-001',
    jobId: 'job-003',
    reviewerId: 'user-001',
    reviewedId: 'trader-005',
    rating: 5,
    comment: 'Michael did an excellent job on our decking. Very professional, arrived on time, and the quality of work is outstanding. Would definitely recommend!',
    createdAt: new Date('2024-01-17T17:00:00'),
  },
];

export const getReviewsByUserId = async (userId: string): Promise<Review[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return reviews
    .filter(review => review.reviewedId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getReviewByJobId = async (jobId: string): Promise<Review | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return reviews.find(review => review.jobId === jobId);
};

export const createReview = async (
  reviewData: Omit<Review, 'id' | 'createdAt'>
): Promise<Review> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const newReview: Review = {
    ...reviewData,
    id: `review-${Date.now()}`,
    createdAt: new Date(),
  };
  
  reviews.push(newReview);
  console.log('Review created:', newReview);
  return newReview;
};

export const getAverageRating = async (userId: string): Promise<number> => {
  await new Promise(resolve => setTimeout(resolve, 250));
  
  const userReviews = reviews.filter(review => review.reviewedId === userId);
  
  if (userReviews.length === 0) return 0;
  
  const sum = userReviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / userReviews.length;
};

export const canReviewJob = async (jobId: string, userId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const existingReview = reviews.find(
    review => review.jobId === jobId && review.reviewerId === userId
  );
  
  return !existingReview;
};
