// src/components/DashboardLayout.jsx
import { useState, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import routes from ".././route/SidebarRaoute";
import Sidebar from "../pages/Sidebar";
import Header from "./Header";
import { agentService } from "../api/agentApi";
import { requestForToken, onMessageListener } from "../firebase";
import { useEffect } from "react";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ Auth: admin object + logout
  const { admin, logout } = useAuth();

  const { themeColors, toggleTheme, palette, changePalette } = useTheme();
  const { currentFont, corporateFonts, changeFont } = useFont();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPageTitle = useMemo(() => {
    const allRoutes = routes.flatMap(r => r.children || r);
    return allRoutes.find((route) => route.path === location.pathname)?.name || "Dashboard";
  }, [location.pathname]);

  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // ✅ Logout handler: context clear + redirect to /login
  const handleLogout = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  // --- FCM TOKEN REGISTRATION ---
  useEffect(() => {
    const agentId = admin?._id || admin?.id;
    if (!agentId) return;

    const setupFCM = async () => {
      try {
        const token = await requestForToken();
        if (token) {
          await agentService.updateFcmToken(token);
          console.log("🚀 Agent FCM Token synchronized with backend");
        }
      } catch (error) {
        console.error("Agent FCM Registration failed:", error);
      }
    };

    setupFCM();

    // Foreground notification listener
    const unsubscribe = onMessageListener((payload) => {
        console.log("🔔 Agent Push Notification received:", payload);
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [admin?._id]);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        backgroundColor: themeColors.background,
        fontFamily:
          currentFont.family ||
          'var(--app-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
      }}
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        routes={routes}
        currentPath={location.pathname}
        user={admin}
        logout={handleLogout}
        themeColors={themeColors}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          toggleSidebar={toggleSidebar}
          currentPageTitle={currentPageTitle}
          themeColors={themeColors}
          currentFont={currentFont}
          corporateFonts={corporateFonts}
          changeFont={changeFont}
          palette={palette}
          changePalette={changePalette}
          toggleTheme={toggleTheme}
        />

        {/* Page Content   es */}
        <main className="flex-1 overflow-y-auto px-0 lg:px-2" style={{ backgroundColor: themeColors.background }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;