// src/components/Header.jsx
import { memo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { agentService } from "../api/agentApi";
import { 
  FaCog, 
  FaSun, 
  FaMoon, 
  FaPalette, 
  FaFont, 
  FaTimes,
  FaBriefcase,
  FaStar,
  FaGem,
  FaSquare,
  FaUser,
  FaBell
} from "react-icons/fa";



const Header = memo(({
  toggleSidebar,
  currentPageTitle
}) => {
  const navigate = useNavigate();
  const { themeColors, toggleTheme } = useTheme();
  const { currentFont } = useFont();
  const { unreadCount, setUnreadCount, isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchUnread = async () => {
      try {
        const data = await agentService.getNotifications();
        const count = data?.notifications?.filter(n => !n.read)?.length || data?.unreadCount || 0;
        setUnreadCount(count);
      } catch (err) {
        console.error("Failed to fetch notification count", err);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [isLoggedIn, setUnreadCount]);
  
  return (
    <>
      <header
        className="h-16 flex items-center justify-between px-4 border-b backdrop-blur-sm sticky top-0 z-40"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        }}
      >
        <div className="flex items-center min-w-0 flex-1">
          <button
            onClick={toggleSidebar}
            className="lg:hidden mr-3 p-1.5 rounded-md hover:scale-110 transition-all duration-200"
            style={{
              color: themeColors.text,
              backgroundColor: themeColors.background
            }}
            aria-label="Open sidebar"
          >
            <span className="text-base">☰</span>
          </button>
          <h2
            className="text-sm font-semibold truncate"
            style={{
              color: themeColors.text,
              fontFamily: currentFont.family
            }}
          >
            {currentPageTitle}
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          {/* Notification Bell */}
          <button
            onClick={() => navigate('/agent/notifications')}
            className="p-2 rounded-md border hover:scale-110 transition-all duration-300 relative group"
            style={{
              backgroundColor: themeColors.background,
              color: themeColors.text,
              borderColor: themeColors.border,
            }}
            aria-label="Notifications"
            title="Notifications"
          >
            <FaBell className="text-sm" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
            )}
          </button>

          {/* Profile Button */}
          <button
            onClick={() => navigate('/agent/profile')}
            className="p-2 rounded-md border hover:scale-110 transition-all duration-300 group flex items-center gap-2 px-3"
            style={{
              backgroundColor: themeColors.background,
              color: themeColors.text,
              borderColor: themeColors.border,
            }}
            aria-label="Profile"
            title="Profile"
          >
            <FaUser className="text-sm" />
            <span className="text-xs font-medium hidden sm:inline">Profile</span>
          </button>
        </div>
      </header>

    </>
  );
});

Header.displayName = 'Header';
export default Header;