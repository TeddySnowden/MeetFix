import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import JoinGroup from "./pages/JoinGroup";
import GroupDetail from "./pages/GroupDetail";
import EventDetail from "./pages/EventDetail";
import Groups from "./pages/Groups";
import GetReady from "./pages/GetReady";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { PwaInstallButton } from "./components/PwaInstallButton";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PwaInstallButton />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/join/:inviteCode" element={<JoinGroup />} />
            <Route path="/invite/:inviteCode" element={<JoinGroup />} />
            <Route path="/g/:groupId" element={<GroupDetail />} />
            <Route path="/e/:eventId" element={<EventDetail />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/get-ready" element={<GetReady />} />
            <Route path="/profile" element={<Profile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
