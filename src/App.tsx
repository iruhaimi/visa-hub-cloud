import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ScrollToTop from "@/components/layout/ScrollToTop";

// Layouts (kept eager - needed for shell)
import MainLayout from "@/components/layout/MainLayout";
import AdminLayout from "@/components/admin/AdminLayout";
import AgentLayout from "@/components/agent/AgentLayout";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

// Lazy-loaded Pages
const HomeArabic = lazy(() => import("@/pages/HomeArabic"));
const Destinations = lazy(() => import("@/pages/Destinations"));
const CountryDetail = lazy(() => import("@/pages/CountryDetail"));
const VisaServices = lazy(() => import("@/pages/VisaServices"));
const VisaDetail = lazy(() => import("@/pages/VisaDetail"));
const SchengenDetail = lazy(() => import("@/pages/SchengenDetail"));
const Apply = lazy(() => import("@/pages/Apply"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const TrackApplication = lazy(() => import("@/pages/TrackApplication"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Refund = lazy(() => import("@/pages/Refund"));
const TrackRefund = lazy(() => import("@/pages/TrackRefund"));
const PaymentSuccess = lazy(() => import("@/pages/PaymentSuccess"));
const PaymentFailed = lazy(() => import("@/pages/PaymentFailed"));
const Auth = lazy(() => import("@/pages/Auth"));
const Profile = lazy(() => import("@/pages/Profile"));
const MyApplications = lazy(() => import("@/pages/MyApplications"));
const MyApplicationDetail = lazy(() => import("@/pages/MyApplicationDetail"));
const SpecialOffers = lazy(() => import("@/pages/SpecialOffers"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const SecureStaffAuth = lazy(() => import("@/pages/SecureStaffAuth"));
const Install = lazy(() => import("@/pages/Install"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Admin Pages
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const ApplicationsList = lazy(() => import("@/pages/admin/ApplicationsList"));
const ApplicationDetail = lazy(() => import("@/pages/admin/ApplicationDetail"));
const UsersManagement = lazy(() => import("@/pages/admin/UsersManagement"));
const Settings = lazy(() => import("@/pages/admin/Settings"));
const OffersManagement = lazy(() => import("@/pages/admin/OffersManagement"));
const RefundRequestsManagement = lazy(() => import("@/pages/admin/RefundRequestsManagement"));
const HeroManagement = lazy(() => import("@/pages/admin/HeroManagement"));
const LoginAttemptsManagement = lazy(() => import("@/pages/admin/LoginAttemptsManagement"));
const UnlockRequestsManagement = lazy(() => import("@/pages/admin/UnlockRequestsManagement"));
const AgentRequestsManagement = lazy(() => import("@/pages/admin/AgentRequestsManagement"));
const SensitiveOperations = lazy(() => import("@/pages/admin/SensitiveOperations"));
const OwnerSettings = lazy(() => import("@/pages/admin/OwnerSettings"));
const DocumentAccessLogs = lazy(() => import("@/pages/admin/DocumentAccessLogs"));
const FooterManagement = lazy(() => import("@/pages/admin/FooterManagement"));

// Agent Pages
const AgentDashboard = lazy(() => import("@/pages/agent/AgentDashboard"));
const AgentApplicationsList = lazy(() => import("@/pages/agent/AgentApplicationsList"));
const AgentApplicationDetail = lazy(() => import("@/pages/agent/AgentApplicationDetail"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes with Main Layout */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<HomeArabic />} />
                  <Route path="/destinations" element={<Destinations />} />
                  <Route path="/country/:countryCode" element={<CountryDetail />} />
                  <Route path="/visa-services" element={<VisaServices />} />
                  <Route path="/visa/:id" element={<VisaDetail />} />
                  <Route path="/schengen/:country" element={<SchengenDetail />} />
                  <Route path="/apply" element={<Apply />} />
                  <Route path="/apply/:countryCode" element={<Apply />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/track" element={<TrackApplication />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/refund" element={<Refund />} />
                  <Route path="/track-refund" element={<TrackRefund />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="/payment-failed" element={<PaymentFailed />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/my-applications" element={<MyApplications />} />
                  <Route path="/application" element={<MyApplicationDetail />} />
                  <Route path="/offers" element={<SpecialOffers />} />
                </Route>

                {/* Auth Routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/portal-x7k9m2" element={<SecureStaffAuth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/install" element={<Install />} />

                {/* Admin Routes */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="applications" element={<ApplicationsList />} />
                  <Route path="applications/:id" element={<ApplicationDetail />} />
                  <Route path="users" element={<UsersManagement />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="offers" element={<OffersManagement />} />
                  <Route path="refunds" element={<RefundRequestsManagement />} />
                  <Route path="hero" element={<HeroManagement />} />
                  <Route path="login-attempts" element={<LoginAttemptsManagement />} />
                  <Route path="unlock-requests" element={<UnlockRequestsManagement />} />
                  <Route path="agent-requests" element={<AgentRequestsManagement />} />
                  <Route path="sensitive-operations" element={<SensitiveOperations />} />
                  <Route path="owner-settings" element={<OwnerSettings />} />
                  <Route path="document-logs" element={<DocumentAccessLogs />} />
                  <Route path="footer" element={<FooterManagement />} />
                </Route>

                {/* Agent Routes */}
                <Route 
                  path="/agent" 
                  element={
                    <ProtectedRoute allowedRoles={['agent', 'admin']}>
                      <AgentLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AgentDashboard />} />
                  <Route path="applications" element={<AgentApplicationsList />} />
                  <Route path="applications/:id" element={<AgentApplicationDetail />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
