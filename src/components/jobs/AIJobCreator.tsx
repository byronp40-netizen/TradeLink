import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TradeCategory, UrgencyLevel } from '@/types';
import { Loader2, Sparkles, CheckCircle2, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { analyzeJobDescription } from '@/services/jobService';

interface AIJobCreatorProps {
  onComplete: (jobData: {
    description: string;
    originalDescription: string;
    tradeCategories: TradeCategory[];
    urgency: UrgencyLevel;
    county: string;
    address: string;
    eircode?: string;
    preferredStartDate?: Date;
  }) => void;
}

const counties = [
  'Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kilkenny',
  'Wexford', 'Clare', 'Kerry', 'Mayo', 'Donegal', 'Wicklow',
  'Meath', 'Kildare', 'Tipperary', 'Sligo', 'Louth', 'Carlow',
  'Westmeath', 'Offaly', 'Laois', 'Cavan', 'Monaghan', 'Longford',
  'Roscommon', 'Leitrim',
];

const AIJobCreator = ({ onComplete }: AIJobCreatorProps) => {
  const [step, setStep] = useState(1);
  const [originalDescription, setOriginalDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendedTrades, setRecommendedTrades] = useState<TradeCategory[]>([]);
  const [selectedTrades, setSelectedTrades] = useState<TradeCategory[]>([]);
  const [enhancedDescription, setEnhancedDescription] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('normal');
  const [county, setCounty] = useState('');
  const [address, setAddress] = useState('');
  const [eircode, setEircode] = useState('');
  const [preferredStartDate, setPreferredStartDate] = useState('');

  const handleAnalyze = async () => {
    if (!originalDescription.trim()) return;

    setIsAnalyzing(true);
    const analysis = await analyzeJobDescription(originalDescription);
    setRecommendedTrades(analysis.recommendedTrades);
    setSelectedTrades(analysis.recommendedTrades);
    setEnhancedDescription(originalDescription);
    setIsAnalyzing(false);
    setStep(2);
  };

  const handleComplete = () => {
    onComplete({
      description: enhancedDescription,
      originalDescription,
      tradeCategories: selectedTrades,
      urgency,
      county,
      address,
      eircode: eircode || undefined,
      preferredStartDate: preferredStartDate ? new Date(preferredStartDate) : undefined,
    });
  };

  const toggleTrade = (trade: TradeCategory) => {
    setSelectedTrades(prev =>
      prev.includes(trade)
        ? prev.filter(t => t !== trade)
        : [...prev, trade]
    );
  };

  return (
    <div className="space-y-6">
      {step === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Describe Your Issue</CardTitle>
            </div>
            <CardDescription>
              Tell us what needs fixing in your own words. Our AI will help identify the right tradespeople.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">What's the problem?</Label>
              <Textarea
                id="description"
                placeholder="e.g., My kitchen tap is dripping and won't stop leaking..."
                value={originalDescription}
                onChange={(e) => setOriginalDescription(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Don't worry about technical terms - just describe the issue naturally.
              </p>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={!originalDescription.trim() || isAnalyzing}
              className="w-full"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <CardTitle>AI Analysis Complete</CardTitle>
              </div>
              <CardDescription>
                We've identified the trades you'll need. You can adjust if needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Recommended Trades</Label>
                <div className="flex flex-wrap gap-2">
                  {recommendedTrades.map(trade => (
                    <Badge
                      key={trade}
                      variant={selectedTrades.includes(trade) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleTrade(trade)}
                    >
                      {selectedTrades.includes(trade) && (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      )}
                      {trade}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="enhanced-description">Job Description</Label>
                <Textarea
                  id="enhanced-description"
                  value={enhancedDescription}
                  onChange={(e) => setEnhancedDescription(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>
                Help us match you with the right tradespeople
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="urgency">
                  <AlertCircle className="inline h-4 w-4 mr-1" />
                  How urgent is this?
                </Label>
                <Select value={urgency} onValueChange={(value: UrgencyLevel) => setUrgency(value)}>
                  <SelectTrigger id="urgency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency">Emergency - Needs immediate attention</SelectItem>
                    <SelectItem value="urgent">Urgent - Within a few days</SelectItem>
                    <SelectItem value="normal">Normal - Within 1-2 weeks</SelectItem>
                    <SelectItem value="flexible">Flexible - No rush</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="county">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  County
                </Label>
                <Select value={county} onValueChange={setCounty}>
                  <SelectTrigger id="county">
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {counties.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eircode">Eircode (Optional)</Label>
                <Input
                  id="eircode"
                  value={eircode}
                  onChange={(e) => setEircode(e.target.value)}
                  placeholder="e.g., D02 XY45"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Preferred Start Date (Optional)
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={preferredStartDate}
                  onChange={(e) => setPreferredStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!county || !address || selectedTrades.length === 0}
              className="flex-1"
              size="lg"
            >
              Create Job & Find Tradespeople
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIJobCreator;
