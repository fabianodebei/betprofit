import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TelegramConfigProvider } from "./contexts/TelegramConfigContext";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AdminRoute } from "./components/layout/AdminRoute";
import { WalletProvider } from "./contexts/WalletContext";
import { AccountProvider } from "./contexts/AccountContext";
import { BetProvider } from "./contexts/BetContext";
import { BetLegProvider } from "./contexts/BetLegContext";
import { LayBetProvider } from "./contexts/LayBetContext";
import { TransactionProvider } from "./contexts/TransactionContext";
import { ReminderProvider } from "./contexts/ReminderContext";
import { IntestatariProvider } from "./contexts/IntestatariContext";
import { BookProvider } from "./contexts/BookContext";
import { TagProvider } from "./contexts/TagContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { YearProvider } from "./contexts/YearContext";
import Auth from "./pages/Auth";
import SetupGuide from "./pages/SetupGuide";
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
import TelegramSettings from "./pages/TelegramSettings";
import Transactions from "./pages/Transactions";
import Redditometro from "./pages/Redditometro";
import Report from "./pages/Report";
import Intestatari from "./pages/Intestatari";
import Books from "./pages/Books";
import Tags from "./pages/Tags";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <TelegramConfigProvider>
            <YearProvider>
              <SettingsProvider>
                <IntestatariProvider>
                  <BookProvider>
                    <TagProvider>
                      <WalletProvider>
                        <AccountProvider>
                          <BetProvider>
                            <BetLegProvider>
                              <LayBetProvider>
                                <TransactionProvider>
                                  <ReminderProvider>
                                  <Toaster />
                                  <Sonner />
                                  <Routes>
                                    <Route path="/auth" element={<Auth />} />
                                    <Route path="/guida" element={<SetupGuide />} />
                                    <Route path="/admin" element={
                                      <AdminRoute>
                                        <Admin />
                                      </AdminRoute>
                                    } />
                                    <Route
                                      path="/*"
                                      element={
                                        <ProtectedRoute>
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
                                                <Route path="/impostazioni/telegram" element={<TelegramSettings />} />
                                                <Route path="/impostazioni/transazioni" element={<Transactions />} />
                                                <Route path="/impostazioni/redditometro" element={<Redditometro />} />
                                                <Route path="/impostazioni/report" element={<Report />} />
                                                <Route path="/impostazioni/intestatari" element={<Intestatari />} />
                                                <Route path="/impostazioni/books" element={<Books />} />
                                                <Route path="/impostazioni/tags" element={<Tags />} />
                                                <Route path="*" element={<NotFound />} />
                                              </Routes>
                                            </main>
                                            <Footer />
                                          </div>
                                        </ProtectedRoute>
                                      }
                                    />
                                  </Routes>
                                  </ReminderProvider>
                                </TransactionProvider>
                              </LayBetProvider>
                            </BetLegProvider>
                          </BetProvider>
                        </AccountProvider>
                      </WalletProvider>
                    </TagProvider>
                  </BookProvider>
                </IntestatariProvider>
              </SettingsProvider>
            </YearProvider>
          </TelegramConfigProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
