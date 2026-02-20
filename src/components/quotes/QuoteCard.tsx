import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Quote, User } from '@/types';
import { Calendar, Clock, CheckCircle2, Star } from 'lucide-react';
import { format } from 'date-fns';

interface QuoteCardProps {
  quote: Quote;
  tradesperson: User;
  onAccept?: (quoteId: string) => void;
  onDecline?: (quoteId: string) => void;
  onMessage?: (tradespersonId: string) => void;
  isSelected?: boolean;
}

const QuoteCard = ({ 
  quote, 
  tradesperson, 
  onAccept, 
  onDecline, 
  onMessage,
  isSelected = false,
}: QuoteCardProps) => {
  const initials = tradesperson.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const isAccepted = quote.status === 'accepted';
  const isDeclined = quote.status === 'declined';

  return (
    <Card className={`${isSelected ? 'ring-2 ring-primary' : ''} ${isAccepted ? 'border-green-500' : ''} ${isDeclined ? 'opacity-60' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={tradesperson.avatar} alt={tradesperson.name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="font-semibold">{tradesperson.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{tradesperson.rating?.toFixed(1)}</span>
                </div>
                <span>•</span>
                <span>{tradesperson.completedJobs} jobs</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              €{quote.amount.toFixed(2)}
            </div>
            {isAccepted && (
              <Badge variant="default" className="mt-1 bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Accepted
              </Badge>
            )}
            {isDeclined && (
              <Badge variant="outline" className="mt-1">
                Declined
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{quote.description}</p>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Duration</div>
              <div className="text-muted-foreground">{quote.estimatedDuration}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Start Date</div>
              <div className="text-muted-foreground">
                {format(new Date(quote.startDate), 'MMM dd, yyyy')}
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Valid until {format(new Date(quote.validUntil), 'MMM dd, yyyy')}
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        {quote.status === 'pending' && !isSelected && (
          <>
            <Button 
              onClick={() => onAccept?.(quote.id)}
              className="flex-1"
            >
              Accept Quote
            </Button>
            <Button 
              onClick={() => onDecline?.(quote.id)}
              variant="outline"
              className="flex-1"
            >
              Decline
            </Button>
          </>
        )}
        <Button 
          onClick={() => onMessage?.(tradesperson.id)}
          variant={quote.status === 'pending' ? 'outline' : 'default'}
          className="flex-1"
        >
          Message
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuoteCard;
