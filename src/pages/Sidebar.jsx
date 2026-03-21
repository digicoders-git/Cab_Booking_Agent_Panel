// src/pages/Sidebar.jsx
import { Link } from "react-router-dom";
import { memo, useState } from "react";
import {
  FaSignOutAlt,
  FaTimes,
  FaUserCircle,
  FaChevronDown,
  FaChevronRight
} from "react-icons/fa";

const SidebarItem = memo(({ route, isActive, themeColors, onClose, currentPath, isExpanded }) => {
  const IconComponent = route.icon;
  const hasChildren = route.children && route.children.length > 0;
  const [isOpen, setIsOpen] = useState(() => {
    // Auto-open if child is active
    if (!hasChildren) return false;
    return route.children.some(child => currentPath === child.path || currentPath.startsWith(child.path + "/"));
  });

  // Toggle for parent items
  const handleToggle = (e) => {
    e.preventDefault();
    if (isExpanded) {
      setIsOpen(!isOpen);
    }
  };

  const itemContent = (
    <div className="flex items-center w-full overflow-hidden">
      <div className="w-15 flex items-center justify-center shrink-0">
        <IconComponent
          className="text-xl transition-all duration-300 transform "
          style={{
            color: isActive ? themeColors.primary : themeColors.textSecondary,
          }}
        />
      </div>
      <span className={`font-semibold text-sm whitespace-nowrap transition-all duration-300 delay-75 ${isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10 pointer-events-none"}`}>
        {route.name}
      </span>
    </div>
  );

  if (hasChildren) {
    return (
      <div className="mb-1">
        <div
          onClick={handleToggle}
          className={`flex items-center justify-between py-3.5 rounded-xl cursor-pointer transition-all duration-300 ${isActive ? "shadow-lg bg-white" : "hover:bg-white/50"
            } ${isExpanded ? "px-4" : "px-0"}`}
          style={{
            color: isActive ? themeColors.primary : themeColors.text,
            border: isActive ? `1px solid ${themeColors.primary}40` : "1px solid transparent",
          }}
        >
          {itemContent}
          {isExpanded && (
            <div className={`mr-2 transition-all duration-300 ${isExpanded ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"}`}>
              {isOpen ? <FaChevronDown size={11} /> : <FaChevronRight size={11} />}
            </div>
          )}
        </div>
        {isOpen && isExpanded && (
          <div className="ml-10 pl-1 border-l-2 border-blue-100 mt-1 space-y-1 transition-all duration-300">
            {route.children.map((child) => (
              <SidebarItem
                key={child.path}
                route={child}
                isActive={currentPath === child.path || (child.path !== "/" && currentPath.startsWith(child.path + "/"))}
                themeColors={themeColors}
                onClose={onClose}
                currentPath={currentPath}
                isExpanded={isExpanded}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={route.path}
      className={`flex items-center py-3.5 rounded-xl transition-all duration-300 ${isActive ? "shadow-lg bg-white" : "hover:bg-white/50"
        } ${isExpanded ? "px-4" : "px-0"}`}
      style={{
        color: isActive ? themeColors.primary : themeColors.text,
        border: isActive ? `1px solid ${themeColors.primary}40` : "1px solid transparent",
      }}
      onClick={onClose}
      aria-current={isActive ? "page" : undefined}
    >
      {itemContent}
    </Link>
  );
});

SidebarItem.displayName = "SidebarItem";

const Sidebar = ({
  isOpen,
  onClose,
  routes,
  currentPath,
  user,
  logout,
  themeColors,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const visibleRoutes = routes.filter((r) => !r.hide);

  const isExpanded = isOpen || isHovered;

  const isRouteActive = (route) => {
    if (route.children) {
      return route.children.some(child => isRouteActive(child));
    }
    if (currentPath === route.path) return true;
    if (route.path !== "/" && currentPath.startsWith(route.path + "/")) {
      return true;
    }
    return false;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={onClose}
        />
      )}

      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed inset-y-0 left-0 z-50 transform ${isOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 lg:static lg:inset-0 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isExpanded ? "w-58" : "w-20"
          } flex flex-col border-r bg-white lg:bg-gray-50/80 lg:backdrop-blur-md overflow-hidden group shadow-2xl`}
        style={{
          borderColor: themeColors.border,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center h-16 border-b shrink-0 overflow-hidden px-0 bg-white/50"
          style={{ borderColor: themeColors.border }}
        >
          <div className="flex items-center w-full min-w-0">
            <div className="w-20 flex items-center justify-center shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 transform group-hover:rotate-6 transition-transform">
                <span className="text-white text-sm font-black tracking-tighter">CB</span>
              </div>
            </div>
            <h2
              className={`text-lg font-black ml-1 whitespace-nowrap tracking-tight transition-all duration-500 ${isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
              style={{ color: themeColors.primary }}
            >
              Cab Booking
            </h2>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2.5 mr-3 rounded-xl hover:bg-gray-100 transition-all"
            style={{ color: themeColors.text }}
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-8 overflow-x-hidden space-y-1">
          <nav className="px-2 space-y-2" aria-label="Main navigation">
            {visibleRoutes.map((route) => (
              <SidebarItem
                key={route.path || route.name}
                route={route}
                isActive={isRouteActive(route)}
                themeColors={themeColors}
                onClose={onClose}
                currentPath={currentPath}
                isExpanded={isExpanded}
              />
            ))}
          </nav>
        </div>

        {/* User Section */}
        <div
          className="p-3 border-t shrink-0 overflow-hidden bg-white/50"
          style={{ borderColor: themeColors.border }}
        >
          <div
            className={`flex items-center mb-4 p-2.5 rounded-2xl transition-all duration-300 ${isExpanded ? "bg-white shadow-sm border border-gray-100" : "justify-center"}`}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border-2 shadow-inner transition-transform group-hover:scale-105"
              style={{
                backgroundColor: themeColors.primary,
                color: themeColors.onPrimary,
                borderColor: 'white',
              }}
            >
              <FaUserCircle className="text-2xl" />
            </div>
            <div className={`flex-1 min-w-0 transition-all duration-500 ${isExpanded ? "opacity-100 ml-4 translate-x-0" : "opacity-0 w-0 -translate-x-10"}`}>
              <p
                className="font-bold text-sm truncate text-gray-900"
              >
                {user?.name || "Agent Panel"}
              </p>
              <p
                className="text-xs font-medium text-blue-600 truncate uppercase tracking-tighter"
              >
                {user?.role || "Authorized Agent"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className={`group/logout transition-all duration-500 flex items-center justify-center gap-3 border-2 hover:shadow-xl active:scale-95 ${!isExpanded ? "h-11 w-11 mx-auto rounded-xl" : "w-full py-3.5 px-4 rounded-2xl"}`}
            style={{
              color: themeColors.danger,
              backgroundColor: "white",
              borderColor: `${themeColors.danger}20`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.danger;
              e.currentTarget.style.color = "white";
              e.currentTarget.style.borderColor = themeColors.danger;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
              e.currentTarget.style.color = themeColors.danger;
              e.currentTarget.style.borderColor = `${themeColors.danger}20`;
            }}
          >
            <FaSignOutAlt className="text-lg shrink-0 transition-transform group-hover/logout:-translate-x-0.5" />
            {isExpanded && <span className="text-sm font-bold whitespace-nowrap">Sign Out</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default memo(Sidebar);
