import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import AgentLogin from "./pages/agent/AgentLogin";
import DashboardLayout from "./components/DashboardLayout";
import { Toaster } from "sonner";
import routes from "./route/SidebarRaoute";

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading Agent Panel...</p>
    </div>
  </div>
);

// Scroll to top component
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <Router>
      <ScrollToTop />
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/agent/login" 
          element={isLoggedIn ? <Navigate to="/agent/dashboard" replace /> : <AgentLogin />} 
        />

        {/* Protected Routes */}
        {isLoggedIn ? (
          <Route element={<DashboardLayout />}>
            {routes.map(({ path, component: Component }) => (
              <Route
                key={path}
                path={path}
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Component />
                  </Suspense>
                }
              />
            ))}
            <Route path="*" element={<Navigate to="/agent/dashboard" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/agent/login" replace />} />
        )}

        {/* Root Redirect */}
        <Route path="/" element={<Navigate to={isLoggedIn ? "/agent/dashboard" : "/agent/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;