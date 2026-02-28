import { MapPin, Globe } from 'lucide-react';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';

export function Header() {

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            CityLink
          </span>
        </div>

        {/* Navigation / Actions */}
        <div className="flex items-center gap-4 md:gap-6">
          <Button className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Globe className="h-4 w-4" />
            தமிழ்
          </Button>
          
          <Link to="/auth/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" viewTransition>
            Login
          </Link>
          
          <Link to="/auth/signup" className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-background" viewTransition>
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}