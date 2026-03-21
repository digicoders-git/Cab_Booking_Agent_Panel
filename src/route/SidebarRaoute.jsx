import { lazy } from "react";
import { FaTachometerAlt, FaCar, FaWallet, FaBell, FaUser, FaPlusCircle, FaHeadset, FaFileAlt } from "react-icons/fa";

const AgentDashboard = lazy(() => import("../pages/agent/AgentDashboard"));
const AgentBookings = lazy(() => import("../pages/agent/AgentBookings"));
const AgentWallet = lazy(() => import("../pages/agent/AgentWallet"));
const AgentNotifications = lazy(() => import("../pages/agent/AgentNotifications"));
const AgentProfile = lazy(() => import("../pages/agent/AgentProfile"));
const CreateBooking = lazy(() => import("../pages/agent/CreateBooking"));
const Support = lazy(() => import("../pages/agent/Support"));
const Report = lazy(() => import("../pages/agent/Report"));

const routes = [
  { path: "/agent/dashboard", component: AgentDashboard, name: "Dashboard", icon: FaTachometerAlt },
  { path: "/agent/bookings", component: AgentBookings, name: "Bookings", icon: FaCar },
  { path: "/agent/create-booking", component: CreateBooking, name: "New Booking", icon: FaPlusCircle, hide: true },
  { path: "/agent/wallet", component: AgentWallet, name: "Wallet", icon: FaWallet },
  { path: "/agent/support", component: Support, name: "Support", icon: FaHeadset },
  { path: "/agent/notifications", component: AgentNotifications, name: "Notifications", icon: FaBell },
  { path: "/agent/profile", component: AgentProfile, name: "Profile", icon: FaUser },
  { path: "/agent/report", component: Report, name: "Report", icon: FaFileAlt },
];

export default routes;
