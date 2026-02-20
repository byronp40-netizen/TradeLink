import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Sparkles, MessageSquare, Shield, CheckCircle2 } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">TradeLink</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-b from-background to-muted/50">
        <div className="container px-4 py-16">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Find Trusted Tradespeople in Ireland
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                AI-powered platform connecting homeowners with qualified tradespeople.
                Simply describe your problem, get quotes, and hire with confidence.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="gap-2">
                  <Sparkles className="h-5 w-5" />
                  Start Your Project
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6 space-y-2 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">AI Job Matching</h3>
                  <p className="text-sm text-muted-foreground">
                    Describe your issue in plain English. Our AI identifies the right trades for you.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6 space-y-2 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Direct Communication</h3>
                  <p className="text-sm text-muted-foreground">
                    Message tradespeople directly through our secure platform.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6 space-y-2 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Verified Reviews</h3>
                  <p className="text-sm text-muted-foreground">
                    Read genuine reviews from Irish homeowners and make informed decisions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-6">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 TradeLink. Connecting Irish homes with trusted trades.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;