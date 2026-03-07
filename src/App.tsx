import { lazy, Suspense } from "react";
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
import { ThemeProvider } from "./contexts/ThemeContext";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

// Lazy load pages for better initial load performance
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const SetupGuide = lazy(() => import("./pages/SetupGuide"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Wallets = lazy(() => import("./pages/Wallets"));
const Accounts = lazy(() => import("./pages/Accounts"));
const OngoingBets = lazy(() => import("./pages/OngoingBets"));
const QuickBets = lazy(() => import("./pages/QuickBets"));
const ArchivedBets = lazy(() => import("./pages/ArchivedBets"));
const Deposits = lazy(() => import("./pages/Deposits"));
const Balance = lazy(() => import("./pages/Balance"));
const Promemoria = lazy(() => import("./pages/Promemoria"));
const Settings = lazy(() => import("./pages/Settings"));
const TelegramSettings = lazy(() => import("./pages/TelegramSettings"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Redditometro = lazy(() => import("./pages/Redditometro"));
const Report = lazy(() => import("./pages/Report"));
const Intestatari = lazy(() => import("./pages/Intestatari"));
const Books = lazy(() => import("./pages/Books"));
const Tags = lazy(() => import("./pages/Tags"));
const ImportExport = lazy(() => import("./pages/ImportExport"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
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
                                  <Suspense fallback={<PageLoader />}>
                                    <Routes>
                                      <Route path="/auth" element={<Auth />} />
                                      <Route path="/reset-password" element={<ResetPassword />} />
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
                                                <Route path="/impostazioni/telegram" element={<TelegramSettings />} />
                                                <Route path="/impostazioni/transazioni" element={<Transactions />} />
                                                <Route path="/impostazioni/redditometro" element={<Redditometro />} />
                                                <Route path="/impostazioni/report" element={<Report />} />
                                                <Route path="/impostazioni/intestatari" element={<Intestatari />} />
                                                <Route path="/impostazioni/books" element={<Books />} />
                                                <Route path="/impostazioni/tags" element={<Tags />} />
                                                <Route path="/impostazioni/import-export" element={<ImportExport />} />
                                                <Route path="*" element={<NotFound />} />
                                              </Routes>
                                            </main>
                                            <Footer />
                                          </div>
                                        </ProtectedRoute>
                                      }
                                    />
                                    </Routes>
                                  </Suspense>
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
  </ErrorBoundary>
);

export default App;
