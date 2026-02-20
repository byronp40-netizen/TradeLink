import { Link } from 'react-router-dom';
import { Home, Mail, Phone, MapPin } from 'lucide-react';

const CustomerFooter = () => {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold text-primary">TradeLink</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Connecting Irish customers with trusted tradespeople for all your home maintenance needs.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">For Customers</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/find-trades" className="text-muted-foreground hover:text-foreground transition-colors">
                  Find Trades
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">For Tradespeople</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/join" className="text-muted-foreground hover:text-foreground transition-colors">
                  Join TradeLink
                </Link>
              </li>
              <li>
                <Link to="/benefits" className="text-muted-foreground hover:text-foreground transition-colors">
                  Benefits
                </Link>
              </li>
              <li>
                <Link to="/trader-guide" className="text-muted-foreground hover:text-foreground transition-colors">
                  Trader Guide
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@tradelink.ie</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+353 1 234 5678</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Dublin, Ireland</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2024 TradeLink. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link to="/cookies" className="hover:text-foreground transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default CustomerFooter;
