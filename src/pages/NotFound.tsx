import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <div className="space-y-2">
          <p className="text-xl text-muted-foreground">Pagina non trovata</p>
          <p className="text-sm text-muted-foreground">
            Verrai reindirizzato alla home tra {countdown} second{countdown !== 1 ? 'i' : 'o'}...
          </p>
        </div>
        <Button asChild>
          <Link to="/">Torna alla Home Ora</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
