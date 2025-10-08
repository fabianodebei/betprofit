import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { WalletProvider } from "./contexts/WalletContext";
import { AccountProvider } from "./contexts/AccountContext";
import { BetProvider } from "./contexts/BetContext";
import { TransactionProvider } from "./contexts/TransactionContext";
import { ReminderProvider } from "./contexts/ReminderContext";
import Dashboard from "./pages/Dashboard";
import Wallets from "./pages/Wallets";
import Accounts from "./pages/Accounts";
import OngoingBets from "./pages/OngoingBets";
import QuickBets from "./pages/QuickBets";
import ArchivedBets from "./pages/ArchivedBets";
import Deposits from "./pages/Deposits";
import Balance from "./pages/Balance";
import Promemoria from "./pages/Promemoria";
import Settings from "./pages/Settings";
import GeneralSettings from "./pages/GeneralSettings";
import Transactions from "./pages/Transactions";
import Redditometro from "./pages/Redditometro";
import Report from "./pages/Report";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WalletProvider>
        <AccountProvider>
          <BetProvider>
            <TransactionProvider>
              <ReminderProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <div className="flex min-h-screen flex-col">
                    <Header />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/wallets" element={<Wallets />} />
                        <Route path="/conti" element={<Accounts />} />
                        <Route path="/puntate" element={<OngoingBets />} />
                        <Route path="/rapide" element={<QuickBets />} />
                        <Route path="/archiviate" element={<ArchivedBets />} />
                        <Route path="/depositi" element={<Deposits />} />
                        <Route path="/bilancio" element={<Balance />} />
                        <Route path="/promemoria" element={<Promemoria />} />
                        <Route path="/impostazioni" element={<Settings />} />
                        <Route path="/impostazioni/generali" element={<GeneralSettings />} />
                        <Route path="/impostazioni/transazioni" element={<Transactions />} />
                        <Route path="/impostazioni/redditometro" element={<Redditometro />} />
                        <Route path="/impostazioni/report" element={<Report />} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                </BrowserRouter>
              </ReminderProvider>
            </TransactionProvider>
          </BetProvider>
        </AccountProvider>
      </WalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
