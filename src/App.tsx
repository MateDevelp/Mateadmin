import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminProvider } from "./AdminContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import UserDetail from "./pages/UserDetail";
import Houses from "./pages/Houses";
import HouseDetail from "./pages/HouseDetail";
import Chats from "./pages/Chats";
import Reports from "./pages/Reports";
import Verifications from "./pages/Verifications";
import Analytics from "./pages/Analytics";
import Export from "./pages/Export";
import ExportUsers from "./pages/ExportUsers";
import ExportHouses from "./pages/ExportHouses";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminSetupPage from "./pages/AdminSetupPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminVerification from "./AdminVerification";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AdminProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/:id"
                element={
                  <ProtectedRoute>
                    <UserDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/houses"
                element={
                  <ProtectedRoute>
                    <Houses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/houses/:id"
                element={
                  <ProtectedRoute>
                    <HouseDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chats"
                element={
                  <ProtectedRoute>
                    <Chats />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/verifications"
                element={
                  <ProtectedRoute>
                    <Verifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/export"
                element={
                  <ProtectedRoute>
                    <Export />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/export/users"
                element={
                  <ProtectedRoute>
                    <ExportUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/export/houses"
                element={
                  <ProtectedRoute>
                    <ExportHouses />
                  </ProtectedRoute>
                }
              />

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify" element={<AdminVerification />} />
              <Route path="/setup" element={<AdminSetupPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AdminProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
