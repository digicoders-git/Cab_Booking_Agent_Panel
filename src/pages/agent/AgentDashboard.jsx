// src/pages/agent/AgentDashboard.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentService } from '../../api/agentApi';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import {
  FaTachometerAlt, FaCar, FaWallet, FaUsers,
  FaCheckCircle, FaClock, FaBan, FaStar, FaChartLine,
  FaSync, FaHistory, FaMoneyBillWave, FaChartPie, FaChartBar,
  FaChartArea, FaChartLine as FaChartLineIcon, FaCalendarAlt,
  FaArrowUp, FaArrowDown, FaPercent, FaTrophy, FaMedal
} from 'react-icons/fa';
import {
  TrendingUp, DollarSign, Activity, Clock, Calendar,
  Download, Filter, Printer, MoreVertical, X, Bell,
  Award, Target, Gauge, Zap, Shield, Eye
} from 'lucide-react';
import BookingTable from '../../components/BookingTable';

// Chart Colors
const CHART_COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  orange: '#F97316',
  teal: '#14B8A6',
  pink: '#EC4899',
  indigo: '#6366F1',
  gray: '#94A3B8',
  lightGray: '#E5E7EB',
  gold: '#F59E0B',
  silver: '#94A3B8',
  bronze: '#CD7F32'
};

// Stat Card Component
const StatCard = ({ label, value, icon: Icon, color, trend, subtitle }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-lg transition-all group">
    <div className="flex items-start justify-between mb-3">
      <div className="p-3 rounded-xl" style={{ backgroundColor: color + '15' }}>
        <Icon className="text-xl" style={{ color }} />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-xs font-medium text-gray-500">{label}</p>
    {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
  </div>
);

// Chart Card Component
const ChartCard = ({ title, icon: Icon, subtitle, children, action }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-lg transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="text-blue-600" size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && (
        <button className="p-1.5 hover:bg-gray-100 rounded-lg">
          <MoreVertical size={14} className="text-gray-400" />
        </button>
      )}
    </div>
    {children}
  </div>
);

// Profile Card Component
const ProfileCard = ({ profile }) => {
  if (!profile) return null;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all">
      <div className="flex items-start gap-4 mb-6">
        <div className="relative">
          {profile.image ? (
            <img 
              src={profile.image} 
              alt={profile.name}
              className="w-20 h-20 rounded-2xl object-cover shadow-lg"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg"
            style={{ display: profile.image ? 'none' : 'flex' }}
          >
            {profile.name?.charAt(0) || 'A'}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
          <p className="text-sm text-gray-500 break-all">{profile.email}</p>
          <p className="text-sm text-gray-500 mt-1">{profile.phone}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <div className="p-3 bg-blue-50 rounded-xl text-center">
          <p className="text-xs text-gray-500 mb-1">Commission</p>
          <p className="text-lg font-bold text-blue-600">{profile.commissionPercentage || 0}%</p>
        </div>
        <div className="p-3 bg-green-50 rounded-xl text-center">
          <p className="text-xs text-gray-500 mb-1">Wallet</p>
          <p className="text-lg font-bold text-green-600">₹{profile.walletBalance?.toLocaleString() || 0}</p>
        </div>
        <div className="p-3 bg-purple-50 rounded-xl text-center">
          <p className="text-xs text-gray-500 mb-1">Earnings</p>
          <p className="text-lg font-bold text-purple-600">₹{profile.totalEarnings?.toLocaleString() || 0}</p>
        </div>
        <div className="p-3 bg-orange-50 rounded-xl text-center">
          <p className="text-xs text-gray-500 mb-1">Bookings</p>
          <p className="text-lg font-bold text-orange-600">{profile.totalBookings || 0}</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
          <FaWallet size={10} /> Bank Details
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-400">Bank:</span>
            <p className="font-medium text-gray-700">{profile.bankDetails?.bankName || '—'}</p>
          </div>
          <div>
            <span className="text-gray-400">Account:</span>
            <p className="font-medium text-gray-700">
              {profile.bankDetails?.accountNumber ? `****${profile.bankDetails.accountNumber.slice(-4)}` : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
export default function AgentDashboard() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentBookings, setRecentBookings] = useState([]);
  const [timeRange, setTimeRange] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('all');

  const fetchDashboard = async () => {
    try {
      setRefreshing(true);
      
      // Always fetch bookings separately to ensure we have data
      const [dashRes, bookingsRes] = await Promise.all([
        agentService.getDashboard(),
        agentService.getMyBookings()
      ]);
      
      const dashData = dashRes?.dashboard || dashRes || {};
      setDashboardData(dashData);
      
      // Use bookings from separate API call
      const allBookings = bookingsRes?.bookings || bookingsRes || [];
      console.log('📋 Total bookings fetched:', allBookings.length);
      
      if (allBookings.length > 0) {
        const sorted = [...allBookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const recent = sorted.slice(0, 5);
        console.log('✅ Recent bookings to display:', recent.length);
        setRecentBookings(recent);
      } else {
        console.log('⚠️ No bookings found');
        setRecentBookings([]);
      }
    } catch (err) {
      console.error('❌ Dashboard fetch error:', err);
      toast.error(err?.response?.data?.message || err?.message || "Dashboard load nahi ho saka");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const stats = dashboardData || {};
  const profile = {
    ...admin,
    ...dashboardData,
    name: admin?.name || dashboardData?.name || 'Agent',
    email: admin?.email || dashboardData?.email
  };

  // Chart Data - Using API response fields
  const bookingStatusData = [
    { name: 'Completed', value: stats.completedBookings || 0, color: CHART_COLORS.success },
    { name: 'Pending', value: stats.pendingBookings || 0, color: CHART_COLORS.warning },
    { name: 'Active', value: stats.activeBookings || 0, color: CHART_COLORS.primary },
    { name: 'Cancelled', value: stats.cancelledBookings || 0, color: CHART_COLORS.danger },
    { name: 'Expired', value: stats.expiredBookings || 0, color: CHART_COLORS.gray }
  ].filter(item => item.value > 0);

  const earningsData = [
    { name: 'Total Earnings', value: stats.totalEarnings || 0, color: CHART_COLORS.success },
    { name: 'Wallet Balance', value: stats.walletBalance || 0, color: CHART_COLORS.primary }
  ];

  // Monthly trend data - from API
  const monthlyTrendData = useMemo(() => {
    if (dashboardData?.monthlyTrend && Array.isArray(dashboardData.monthlyTrend)) {
      return dashboardData.monthlyTrend.map(item => ({
        month: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
        bookings: item.bookings || 0,
        earnings: item.earnings || 0
      }));
    }
    return [];
  }, [dashboardData]);

  // Weekly trend data - from API (weeklyTrend is an object with bookings and earnings)
  const weeklyTrendData = useMemo(() => {
    if (dashboardData?.weeklyTrend) {
      const trend = dashboardData.weeklyTrend;
      // Since API returns object with thisWeek/lastWeek, create simple display
      return [
        { day: 'Last Week', bookings: trend.bookings?.lastWeek || 0, earnings: trend.earnings?.lastWeek || 0 },
        { day: 'This Week', bookings: trend.bookings?.thisWeek || 0, earnings: trend.earnings?.thisWeek || 0 }
      ];
    }
    return [];
  }, [dashboardData]);

  // Peak hours data - from API
  const peakHoursData = useMemo(() => {
    if (dashboardData?.peakHours && Array.isArray(dashboardData.peakHours)) {
      return dashboardData.peakHours.map(item => ({
        hour: item.label || `${item.hour}:00`,
        bookings: item.count || 0
      }));
    }
    return [];
  }, [dashboardData]);

  // Performance metrics - from API
  const performanceData = [
    { metric: 'Success Rate', value: stats.totalBookings ? (stats.completedBookings / stats.totalBookings) * 100 : 0, color: CHART_COLORS.success },
    { metric: 'Completion', value: stats.completedBookings || 0, color: CHART_COLORS.primary },
    { metric: 'On Time', value: stats.onTimePercentage || 0, color: CHART_COLORS.warning },
    { metric: 'Rating', value: stats.averageRating || 0, color: CHART_COLORS.purple }
  ];

  // === HIGHCHARTS CONFIG ===
  const pieOptions = (data, title) => ({
    chart: { type: 'pie', height: 220, style: { fontFamily: 'inherit' } },
    title: { text: null },
    tooltip: { pointFormat: '{point.name}: <b>{point.y}</b> ({point.percentage:.1f}%)' },
    plotOptions: {
      pie: {
        innerRadius: '60%',
        dataLabels: { enabled: false },
        showInLegend: true
      }
    },
    series: [{
      name: title,
      colorByPoint: true,
      data: data.map(d => ({ name: d.name, y: d.value, color: d.color }))
    }],
    legend: { enabled: true, layout: 'vertical', align: 'right', verticalAlign: 'middle', itemStyle: { fontSize: '10px' } },
    credits: { enabled: false }
  });

  const barOptions = {
    chart: { type: 'column', height: 220, style: { fontFamily: 'inherit' } },
    title: { text: null },
    xAxis: { categories: ['Earnings', 'Wallet'] },
    yAxis: { title: { text: 'Amount (₹)' }, labels: { style: { fontSize: '10px' } } },
    legend: { enabled: false },
    tooltip: { pointFormat: '₹{point.y}' },
    plotOptions: { column: { borderRadius: 8 } },
    series: [{
      name: 'Amount',
      data: earningsData.map(d => ({ y: d.value, color: d.color }))
    }],
    credits: { enabled: false }
  };

  const lineOptions = {
    chart: { type: 'spline', height: 220, style: { fontFamily: 'inherit' } },
    title: { text: null },
    xAxis: { categories: weeklyTrendData.map(d => d.day) },
    yAxis: [{ title: { text: 'Bookings' }, labels: { style: { fontSize: '10px' } } }],
    legend: { enabled: true, itemStyle: { fontSize: '10px' } },
    plotOptions: { spline: { marker: { radius: 4, symbol: 'circle' } } },
    series: [
      { name: 'Bookings', data: weeklyTrendData.map(d => d.bookings), color: CHART_COLORS.primary, lineWidth: 2 },
      { name: 'Earnings', data: weeklyTrendData.map(d => d.earnings), color: CHART_COLORS.success, yAxis: 1, lineWidth: 2 }
    ],
    yAxis: [
      { title: { text: 'Bookings' }, opposite: false },
      { title: { text: 'Earnings (₹)' }, opposite: true }
    ],
    credits: { enabled: false }
  };

  const monthlyBarOptions = {
    chart: { type: 'column', height: 220, style: { fontFamily: 'inherit' } },
    title: { text: null },
    xAxis: { categories: monthlyTrendData.map(d => d.month) },
    yAxis: { title: { text: 'Bookings' }, labels: { style: { fontSize: '10px' } } },
    legend: { enabled: false },
    tooltip: { pointFormat: '{point.y} bookings' },
    plotOptions: { column: { borderRadius: 8, color: CHART_COLORS.primary } },
    series: [{ name: 'Bookings', data: monthlyTrendData.map(d => d.bookings) }],
    credits: { enabled: false }
  };

  const areaOptions = {
    chart: { type: 'areaspline', height: 220, style: { fontFamily: 'inherit' } },
    title: { text: null },
    xAxis: { categories: peakHoursData.map(d => d.hour) },
    yAxis: { title: { text: 'Bookings' }, labels: { style: { fontSize: '10px' } } },
    legend: { enabled: false },
    tooltip: { pointFormat: '{point.y} bookings' },
    plotOptions: {
      areaspline: {
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(59, 130, 246, 0.3)'],
            [1, 'rgba(59, 130, 246, 0.0)']
          ]
        },
        marker: { radius: 4 },
        lineWidth: 2,
        color: CHART_COLORS.primary
      }
    },
    series: [{ name: 'Bookings', data: peakHoursData.map(d => d.bookings) }],
    credits: { enabled: false }
  };

  const gaugeOptions = {
    chart: { type: 'solidgauge', height: 200, style: { fontFamily: 'inherit' } },
    title: { text: null },
    pane: {
      center: ['50%', '70%'],
      size: '100%',
      startAngle: -90,
      endAngle: 90,
      background: {
        backgroundColor: CHART_COLORS.lightGray,
        innerRadius: '60%',
        outerRadius: '100%',
        shape: 'arc'
      }
    },
    tooltip: { enabled: false },
    yAxis: {
      min: 0,
      max: 100,
      stops: [
        [0.3, CHART_COLORS.danger],
        [0.6, CHART_COLORS.warning],
        [0.9, CHART_COLORS.success]
      ],
      lineWidth: 0,
      tickWidth: 0,
      minorTickInterval: null,
      tickAmount: 2,
      labels: { y: 16 }
    },
    plotOptions: {
      solidgauge: {
        dataLabels: {
          y: -20,
          borderWidth: 0,
          useHTML: true,
          format: '<div style="text-align:center"><span style="font-size:24px">{point.y:.0f}%</span><br/><span style="font-size:10px">Success Rate</span></div>'
        }
      }
    },
    series: [{
      name: 'Success Rate',
      data: [stats.totalBookings ? (stats.completedBookings / stats.totalBookings) * 100 : 0],
      dataLabels: { format: '<div style="text-align:center"><span style="font-size:24px">{y:.0f}%</span><br/><span style="font-size:10px">Success Rate</span></div>' }
    }],
    credits: { enabled: false }
  };



  const scatterOptions = {
    chart: { type: 'scatter', height: 220, style: { fontFamily: 'inherit' } },
    title: { text: null },
    xAxis: { title: { text: 'Day' }, gridLineWidth: 1 },
    yAxis: { title: { text: 'Earnings (₹)' }, gridLineWidth: 1 },
    legend: { enabled: false },
    plotOptions: {
      scatter: {
        marker: { radius: 5, symbol: 'circle' },
        tooltip: { pointFormat: 'Day: {point.x}<br/>Earnings: ₹{point.y}' }
      }
    },
    series: [{
      name: 'Daily Earnings',
      data: dashboardData?.dailyEarnings || [],
      color: CHART_COLORS.success
    }],
    credits: { enabled: false }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 px-4 sm:px-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-gray-900">
              <FaTachometerAlt className="text-blue-600 text-lg sm:text-xl" />
              Agent Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Welcome back, {profile?.name || 'Agent'}! Here's your performance overview.
            </p>
          </div>
          <button
            onClick={fetchDashboard}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all sm:hidden"
            disabled={refreshing}
          >
            <FaSync className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all"
            disabled={refreshing}
          >
            <FaSync className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Profile & Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <ProfileCard profile={profile} />
        </div>

        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total Bookings"
            value={stats.totalBookings || 0}
            icon={FaCar}
            color={CHART_COLORS.primary}
            trend={12}
            subtitle="+2 from last week"
          />
          <StatCard
            label="Completed"
            value={stats.completedBookings || 0}
            icon={FaCheckCircle}
            color={CHART_COLORS.success}
            trend={stats.totalBookings ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}
            subtitle="Success rate"
          />
          <StatCard
            label="Pending"
            value={stats.pendingBookings || 0}
            icon={FaClock}
            color={CHART_COLORS.warning}
            trend={-5}
          />
          <StatCard
            label="Expired"
            value={stats.expiredBookings || 0}
            icon={FaClock}
            color={CHART_COLORS.gray}
            trend={-10}
          />
          <StatCard
            label="Wallet Balance"
            value={`₹${profile.walletBalance?.toLocaleString() || 0}`}
            icon={FaWallet}
            color={profile.walletBalance < 0 ? CHART_COLORS.danger : CHART_COLORS.success}
            subtitle="Available for withdrawal"
          />
          <StatCard
            label="Total Earnings"
            value={`₹${profile.totalEarnings?.toLocaleString() || 0}`}
            icon={DollarSign}
            color={CHART_COLORS.success}
            trend={15}
          />
          <StatCard
            label="Commission"
            value={`${profile.commissionPercentage || 0}%`}
            icon={FaPercent}
            color={CHART_COLORS.orange}
          />
          <StatCard
            label="Cancelled"
            value={stats.cancelledBookings || 0}
            icon={FaBan}
            color={CHART_COLORS.danger}
            trend={-3}
          />
        </div>
      </div>

      {/* Metric Selector */}
      <div className="flex flex-wrap gap-2">
        {['all', 'bookings', 'earnings', 'performance', 'trends'].map((metric) => (
          <button
            key={metric}
            onClick={() => setSelectedMetric(metric)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedMetric === metric
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            {metric.charAt(0).toUpperCase() + metric.slice(1)} View
          </button>
        ))}
      </div>

      {/* Charts Section - 6 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Chart 1: Booking Status - Pie */}
          {(selectedMetric === 'all' || selectedMetric === 'bookings') && (
            <ChartCard title="Booking Status" icon={FaChartPie} subtitle="Distribution by status">
              {bookingStatusData.length > 0 ? (
                <HighchartsReact highcharts={Highcharts} options={pieOptions(bookingStatusData, 'Bookings')} />
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                  No booking data available
                </div>
              )}
            </ChartCard>
          )}

          {/* Chart 2: Earnings Overview - Bar */}
          {(selectedMetric === 'all' || selectedMetric === 'earnings') && (
            <ChartCard title="Earnings Overview" icon={FaChartBar} subtitle="Earnings vs Wallet">
              <HighchartsReact highcharts={Highcharts} options={barOptions} />
            </ChartCard>
          )}

          {/* Chart 3: Weekly Trend - Line */}
          {(selectedMetric === 'all' || selectedMetric === 'trends') && (
            <ChartCard title="Weekly Trend" icon={FaChartLineIcon} subtitle="Bookings & Earnings">
              <HighchartsReact highcharts={Highcharts} options={lineOptions} />
            </ChartCard>
          )}

          {/* Chart 4: Monthly Trend - Bar */}
          {(selectedMetric === 'all' || selectedMetric === 'trends') && (
            <ChartCard title="Monthly Trend" icon={FaCalendarAlt} subtitle="Last 6 months bookings">
              {monthlyTrendData.length > 0 ? (
                <HighchartsReact highcharts={Highcharts} options={monthlyBarOptions} />
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                  No monthly trend data available
                </div>
              )}
            </ChartCard>
          )}

          {/* Chart 5: Peak Hours - Area */}
          {(selectedMetric === 'all' || selectedMetric === 'performance') && (
            <ChartCard title="Peak Hours" icon={Clock} subtitle="Booking distribution by hour">
              {peakHoursData.length > 0 ? (
                <HighchartsReact highcharts={Highcharts} options={areaOptions} />
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                  No peak hours data available
                </div>
              )}
            </ChartCard>
          )}

          {/* Chart 6: Success Rate - Simple Progress */}
          {(selectedMetric === 'all' || selectedMetric === 'performance') && (
            <ChartCard title="Success Rate" icon={Target} subtitle="Booking completion rate">
              <div className="flex flex-col items-center justify-center h-[220px]">
                <div className="relative w-32 h-32">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle cx="64" cy="64" r="56" stroke="#E5E7EB" strokeWidth="12" fill="none" />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke={CHART_COLORS.success}
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - (stats.totalBookings ? (stats.completedBookings / stats.totalBookings) : 0))}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">
                      {stats.totalBookings ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}%
                    </span>
                    <span className="text-xs text-gray-500">Success Rate</span>
                  </div>
                </div>
              </div>
            </ChartCard>
          )}
      </div>

      {/* Second Row - More Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Chart 7: Performance Metrics Grid */}
        {(selectedMetric === 'all' || selectedMetric === 'performance') && (
          <ChartCard title="Performance Overview" icon={Gauge} subtitle="Key performance indicators">
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="p-4 rounded-lg bg-blue-50 text-center">
                <p className="text-xs text-gray-500 mb-1">Bookings</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalBookings || 0}</p>
              </div>
              <div className="p-4 rounded-lg bg-green-50 text-center">
                <p className="text-xs text-gray-500 mb-1">Earnings</p>
                <p className="text-2xl font-bold text-green-600">₹{stats.totalEarnings?.toLocaleString() || 0}</p>
              </div>
              <div className="p-4 rounded-lg bg-purple-50 text-center">
                <p className="text-xs text-gray-500 mb-1">Completion</p>
                <p className="text-2xl font-bold text-purple-600">{stats.completedBookings || 0}</p>
              </div>
              <div className="p-4 rounded-lg bg-orange-50 text-center">
                <p className="text-xs text-gray-500 mb-1">Rating</p>
                <p className="text-2xl font-bold text-orange-600">{stats.averageRating || 0}/5</p>
              </div>
            </div>
          </ChartCard>
        )}

        {/* Chart 8: Earnings Scatter */}
        {(selectedMetric === 'all' || selectedMetric === 'earnings') && dashboardData?.dailyEarnings && dashboardData.dailyEarnings.length > 0 && (
          <ChartCard title="Earnings Distribution" icon={Eye} subtitle="Daily earnings pattern">
            <HighchartsReact highcharts={Highcharts} options={scatterOptions} />
          </ChartCard>
        )}

        {/* Chart 9: Performance Metrics */}
        {(selectedMetric === 'all' || selectedMetric === 'performance') && (
          <ChartCard title="Performance Metrics" icon={Award} subtitle="Key indicators">
            <div className="grid grid-cols-2 gap-4 mt-2">
              {performanceData.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg" style={{ backgroundColor: item.color + '15' }}>
                  <p className="text-xs text-gray-500">{item.metric}</p>
                  <p className="text-xl font-bold" style={{ color: item.color }}>
                    {item.metric === 'Rating' ? `${item.value}/5` :
                      item.metric === 'Success Rate' ? `${item.value.toFixed(1)}%` :
                        item.value}
                  </p>
                </div>
              ))}
            </div>
          </ChartCard>
        )}
      </div>

      {/* Recent Bookings Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FaHistory className="text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">Recent Bookings</h3>
          </div>
          <button
            onClick={() => navigate('/agent/bookings')}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            View All <span className="text-lg">→</span>
          </button>
        </div>
        <BookingTable bookings={recentBookings} loading={false} limit={5} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/agent/create-booking')}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6 hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-4 shadow-lg shadow-blue-200"
        >
          <div className="p-3 bg-white/20 rounded-lg">
            <FaCar size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Create New Booking</h3>
            <p className="text-xs text-blue-100 mt-1">Book a ride for passenger</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/agent/wallet')}
          className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-6 hover:from-green-700 hover:to-green-800 transition-all flex items-center gap-4 shadow-lg shadow-green-200"
        >
          <div className="p-3 bg-white/20 rounded-lg">
            <FaWallet size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Wallet</h3>
            <p className="text-xs text-green-100 mt-1">Check balance & withdraw</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/agent/notifications')}
          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl p-6 hover:from-purple-700 hover:to-purple-800 transition-all flex items-center gap-4 shadow-lg shadow-purple-200"
        >
          <div className="p-3 bg-white/20 rounded-lg">
            <Bell size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-xs text-purple-100 mt-1">View updates & alerts</p>
          </div>
        </button>
      </div>
    </div>
  );
}