import { Switch, Route, useLocation } from "wouter";
import { Home } from "./pages/Home";
import { Stats } from "./pages/Stats";
import { Leaderboard } from "./pages/Leaderboard";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { EnergyProvider } from "./contexts/EnergyContext";
import { ParticleBackground } from "./components/ParticleBackground";
import { useAppHaptics } from "./hooks/useAppHaptics";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (fn: () => void) => void;
          offClick: (fn: () => void) => void;
        };
      };
    };
  }
}

function App() {
  const [location, setLocation] = useLocation();
  useAppHaptics();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      if (location === '/') {
        tg.BackButton.hide();
      } else {
        tg.BackButton.show();
        const handleBack = () => setLocation('/');
        tg.BackButton.onClick(handleBack);
        return () => tg.BackButton.offClick(handleBack);
      }
    }
  }, [location, setLocation]);

  return (
    <EnergyProvider>
      <ParticleBackground />
      <div className="min-h-screen w-full">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/stats" component={Stats} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </EnergyProvider>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold">404 Page Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
