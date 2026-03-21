// src/pages/agent/AgentReport.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentService } from '../../api/agentApi';
import { toast } from 'sonner';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import {
  FaChartLine, FaChartBar, FaChartPie, FaChartArea,
  FaCar, FaWallet, FaMoneyBillWave, FaCalendarAlt,
  FaSync, FaDownload, FaPrint, FaEye, FaStar,
  FaCheckCircle, FaClock, FaBan
} from 'react-icons/fa';
import {
  TrendingUp, DollarSign, Activity, Target, Gauge,
  Download, Filter, Printer, MoreVertical, Calendar,
  Award, Medal, PieChart, BarChart3, LineChart
} from 'lucide-react';

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
  lightGray: '#E5E7EB'
};

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

// Main Component
export default function AgentReport() {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dateRange, setDateRange] = useState('week');
  const [selectedChart, setSelectedChart] = useState('all');

  const fetchReport = async () => {
    try {
      setRefreshing(true);
      const data = await agentService.getReport();
      setReportData(data?.report || data || {});
    } catch (err) {
      toast.error(err?.message || 'Failed to load report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDownload = async (format) => {
    try {
      setDownloading(true);
      toast.loading(`Downloading ${format.toUpperCase()} report...`);
      
      const response = await agentService.downloadReport(format);
      
      // Create blob and download
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `agent-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success(`${format.toUpperCase()} report downloaded successfully!`);
    } catch (err) {
      toast.dismiss();
      toast.error(err?.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const bookingStats = reportData?.bookingStats || {};
  const financials = reportData?.financials || {};
  const dailyEarnings = reportData?.dailyEarningsHistory || [];

  // Stats
  const stats = useMemo(() => ({
    totalBookings: bookingStats.total || 0,
    completed: bookingStats.completed || 0,
    pending: bookingStats.pending || 0,
    ongoing: bookingStats.ongoing || 0,
    cancelled: bookingStats.cancelled || 0,
    expired: bookingStats.expired || 0,
    walletBalance: financials.walletBalance || 0,
    totalEarnings: financials.totalEarnings || 0,
    totalWithdrawn: financials.totalWithdrawn || 0,
    commission: financials.commissionPercentage || 0,
    successRate: bookingStats.total ? ((bookingStats.completed / bookingStats.total) * 100).toFixed(1) : 0,
    completionRate: bookingStats.total ? ((bookingStats.completed / bookingStats.total) * 100).toFixed(1) : 0
  }), [bookingStats, financials]);

  // Chart 1: Booking Status Distribution
  const statusData = [
    { name: 'Completed', value: stats.completed, color: CHART_COLORS.success },
    { name: 'Pending', value: stats.pending, color: CHART_COLORS.warning },
    { name: 'Ongoing', value: stats.ongoing, color: CHART_COLORS.primary },
    { name: 'Cancelled', value: stats.cancelled, color: CHART_COLORS.danger },
    { name: 'Expired', value: stats.expired, color: CHART_COLORS.gray }
  ].filter(item => item.value > 0);

  // Chart 2: Financial Overview
  const financialData = [
    { name: 'Total Earnings', value: stats.totalEarnings, color: CHART_COLORS.success },
    { name: 'Wallet Balance', value: stats.walletBalance, color: CHART_COLORS.primary },
    { name: 'Withdrawn', value: stats.totalWithdrawn, color: CHART_COLORS.warning }
  ].filter(item => item.value > 0);

  // Chart 3: Daily Earnings Trend (Line Chart)
  const dailyData = dailyEarnings.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    earnings: d.earnings || 0
  }));

  // Chart 4: Weekly Earnings (Bar Chart) - from API weeklyTrend
  const weeklyData = useMemo(() => {
    if (reportData?.weeklyTrend) {
      const trend = reportData.weeklyTrend;
      return [
        { week: 'Last Week', bookings: trend.bookings?.lastWeek || 0, earnings: trend.earnings?.lastWeek || 0 },
        { week: 'This Week', bookings: trend.bookings?.thisWeek || 0, earnings: trend.earnings?.thisWeek || 0 }
      ];
    }
    return [];
  }, [reportData]);

  // Chart 5: Monthly Trend - from API
  const monthlyData = useMemo(() => {
    if (reportData?.monthlyTrend && Array.isArray(reportData.monthlyTrend)) {
      return reportData.monthlyTrend.map(item => ({
        month: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
        bookings: item.bookings || 0,
        earnings: item.earnings || 0
      }));
    }
    return [];
  }, [reportData]);

  // Chart 6: Peak Hours - from API
  const peakHoursChartData = useMemo(() => {
    if (reportData?.peakHours && Array.isArray(reportData.peakHours)) {
      return reportData.peakHours.map(item => ({
        hour: item.label || `${item.hour}:00`,
        count: item.count || 0
      }));
    }
    return [];
  }, [reportData]);

  // Chart 5: Success Rate Gauge
  const gaugeOptions = {
    chart: { type: 'solidgauge', height: 180, style: { fontFamily: 'inherit' } },
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
          format: '<div style="text-align:center"><span style="font-size:28px">{point.y:.0f}%</span><br/><span style="font-size:10px">Success Rate</span></div>'
        }
      }
    },
    series: [{
      name: 'Success Rate',
      data: [parseFloat(stats.successRate)],
      dataLabels: { format: '<div style="text-align:center"><span style="font-size:28px">{y:.0f}%</span><br/><span style="font-size:10px">Success Rate</span></div>' }
    }],
    credits: { enabled: false }
  };

  // Chart 6: Booking Performance Radar
  const radarData = [
    { metric: 'Completion', value: parseFloat(stats.completionRate), fullMark: 100 },
    { metric: 'Success', value: parseFloat(stats.successRate), fullMark: 100 },
    { metric: 'Activity', value: stats.totalBookings > 0 ? Math.min((stats.totalBookings / 20) * 100, 100) : 0, fullMark: 100 }
  ];

  const radarOptions = {
    chart: { type: 'radar', height: 220, style: { fontFamily: 'inherit' } },
    title: { text: null },
    xAxis: { categories: radarData.map(d => d.metric), tickmarkPlacement: 'on', lineWidth: 0 },
    yAxis: { gridLineInterpolation: 'polygon', lineWidth: 0, min: 0, max: 100 },
    legend: { enabled: false },
    series: [{
      name: 'Performance',
      data: radarData.map(d => d.value),
      pointPlacement: 'on',
      color: CHART_COLORS.purple,
      fillOpacity: 0.3,
      marker: { radius: 4 }
    }],
    credits: { enabled: false }
  };

  // Chart 7: Booking Completion vs Expiry (Pie)
  const completionData = [
    { name: 'Completed', value: stats.completed, color: CHART_COLORS.success },
    { name: 'Expired', value: stats.expired, color: CHART_COLORS.gray },
    { name: 'Cancelled', value: stats.cancelled, color: CHART_COLORS.danger }
  ].filter(item => item.value > 0);

  // === HIGHCHARTS CONFIG ===
  const pieOptions = (data, title) => ({
    chart: { type: 'pie', height: 200, style: { fontFamily: 'inherit' } },
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
    chart: { type: 'column', height: 200, style: { fontFamily: 'inherit' } },
    title: { text: null },
    xAxis: { categories: weeklyData.map(d => d.week) },
    yAxis: [{ title: { text: 'Bookings' }, labels: { style: { fontSize: '10px' } } }],
    legend: { enabled: true, itemStyle: { fontSize: '10px' } },
    tooltip: { shared: true },
    plotOptions: { column: { borderRadius: 4 } },
    series: [
      { name: 'Bookings', data: weeklyData.map(d => d.bookings), color: CHART_COLORS.primary },
      { name: 'Earnings', data: weeklyData.map(d => d.earnings), color: CHART_COLORS.success, yAxis: 1 }
    ],
    yAxis: [
      { title: { text: 'Bookings' }, opposite: false },
      { title: { text: 'Earnings (₹)' }, opposite: true }
    ],
    credits: { enabled: false }
  };

  const monthlyBarOptions = {
    chart: { type: 'column', height: 200, style: { fontFamily: 'inherit' } },
    title: { text: null },
    xAxis: { categories: monthlyData.map(d => d.month) },
    yAxis: [{ title: { text: 'Bookings' }, labels: { style: { fontSize: '10px' } } }],
    legend: { enabled: true, itemStyle: { fontSize: '10px' } },
    tooltip: { shared: true },
    plotOptions: { column: { borderRadius: 4 } },
    series: [
      { name: 'Bookings', data: monthlyData.map(d => d.bookings), color: CHART_COLORS.primary },
      { name: 'Earnings', data: monthlyData.map(d => d.earnings), color: CHART_COLORS.success, yAxis: 1 }
    ],
    yAxis: [
      { title: { text: 'Bookings' }, opposite: false },
      { title: { text: 'Earnings (₹)' }, opposite: true }
    ],
    credits: { enabled: false }
  };

  const peakHoursOptions = {
    chart: { type: 'column', height: 200, style: { fontFamily: 'inherit' } },
    title: { text: null },
    xAxis: { categories: peakHoursChartData.map(d => d.hour) },
    yAxis: { title: { text: 'Bookings' }, labels: { style: { fontSize: '10px' } } },
    legend: { enabled: false },
    tooltip: { pointFormat: '{point.y} bookings' },
    plotOptions: { column: { borderRadius: 4, color: CHART_COLORS.orange } },
    series: [{ name: 'Bookings', data: peakHoursChartData.map(d => d.count) }],
    credits: { enabled: false }
  };

  const lineOptions = {
    chart: { type: 'spline', height: 200, style: { fontFamily: 'inherit' } },
    title: { text: null },
    xAxis: { categories: dailyData.map(d => d.date) },
    yAxis: { title: { text: 'Earnings (₹)' }, labels: { style: { fontSize: '10px' } } },
    legend: { enabled: false },
    tooltip: { pointFormat: '₹{point.y}' },
    plotOptions: {
      spline: {
        marker: { radius: 4 },
        color: CHART_COLORS.success,
        lineWidth: 2,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(16, 185, 129, 0.3)'],
            [1, 'rgba(16, 185, 129, 0.0)']
          ]
        }
      }
    },
    series: [{ name: 'Earnings', data: dailyData.map(d => d.earnings) }],
    credits: { enabled: false }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500">Generating report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 px-0 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-gray-900">
            <FaChartLine className="text-blue-600 text-lg sm:text-xl" />
            Agent Performance Report
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Complete analytics of your booking performance and earnings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Download Dropdown */}
          <div className="relative group">
            <button
              disabled={downloading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              <FaDownload size={14} />
              Download
            </button>
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleDownload('pdf')}
                disabled={downloading}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-t-lg flex items-center gap-2 disabled:opacity-50"
              >
                <FaDownload size={12} className="text-red-600" />
                Download PDF
              </button>
              <button
                onClick={() => handleDownload('csv')}
                disabled={downloading}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-b-lg flex items-center gap-2 disabled:opacity-50"
              >
                <FaDownload size={12} className="text-green-600" />
                Download CSV
              </button>
            </div>
          </div>
          
          <button
            onClick={fetchReport}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all"
            disabled={refreshing}
          >
            <FaSync className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 px-4">
        <StatCard
          label="Total Bookings"
          value={stats.totalBookings}
          icon={FaCar}
          color={CHART_COLORS.primary}
          trend={12}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={FaCheckCircle}
          color={CHART_COLORS.success}
          trend={8}
        />
        <StatCard
          label="Success Rate"
          value={`${stats.successRate}%`}
          icon={Target}
          color={stats.successRate >= 50 ? CHART_COLORS.success : CHART_COLORS.warning}
        />
        <StatCard
          label="Total Earnings"
          value={`₹${stats.totalEarnings}`}
          icon={DollarSign}
          color={CHART_COLORS.success}
          trend={15}
        />
        <StatCard
          label="Wallet Balance"
          value={`₹${stats.walletBalance}`}
          icon={FaWallet}
          color={stats.walletBalance > 0 ? CHART_COLORS.success : CHART_COLORS.warning}
        />
        <StatCard
          label="Commission"
          value={`${stats.commission}%`}
          icon={Award}
          color={CHART_COLORS.purple}
        />
      </div>

      {/* Chart Selector */}
      <div className="flex flex-wrap gap-2 px-4">
        {['all', 'status', 'earnings', 'trends', 'performance'].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedChart(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedChart === type
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)} Charts
          </button>
        ))}
      </div>

      {/* Charts Section - 7 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 px-4">

        {/* Chart 1: Booking Status Distribution */}
        {(selectedChart === 'all' || selectedChart === 'status') && (
          <ChartCard title="Booking Status" icon={PieChart} subtitle="Distribution by status">
            {statusData.length > 0 ? (
              <HighchartsReact highcharts={Highcharts} options={pieOptions(statusData, 'Bookings')} />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                No booking data available
              </div>
            )}
          </ChartCard>
        )}

        {/* Chart 2: Financial Overview */}
        {(selectedChart === 'all' || selectedChart === 'earnings') && (
          <ChartCard title="Financial Overview" icon={BarChart3} subtitle="Earnings vs Wallet vs Withdrawn">
            {financialData.length > 0 ? (
              <HighchartsReact highcharts={Highcharts} options={pieOptions(financialData, 'Finance')} />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                No financial data available
              </div>
            )}
          </ChartCard>
        )}

        {/* Chart 3: Daily Earnings Trend */}
        {(selectedChart === 'all' || selectedChart === 'trends') && dailyData.length > 0 && (
          <ChartCard title="Daily Earnings Trend" icon={LineChart} subtitle="Last 7 days earnings">
            <HighchartsReact highcharts={Highcharts} options={lineOptions} />
          </ChartCard>
        )}

        {/* Chart 4: Weekly Trend - Bookings & Earnings */}
        {(selectedChart === 'all' || selectedChart === 'trends') && weeklyData.length > 0 && (
          <ChartCard title="Weekly Trend" icon={BarChart3} subtitle="This week vs Last week">
            <HighchartsReact highcharts={Highcharts} options={barOptions} />
          </ChartCard>
        )}

        {/* Chart 5: Monthly Trend - Bookings & Earnings */}
        {(selectedChart === 'all' || selectedChart === 'trends') && monthlyData.length > 0 && (
          <ChartCard title="Monthly Trend" icon={BarChart3} subtitle="Last 6 months performance">
            <HighchartsReact highcharts={Highcharts} options={monthlyBarOptions} />
          </ChartCard>
        )}

        {/* Chart 6: Peak Hours */}
        {(selectedChart === 'all' || selectedChart === 'performance') && peakHoursChartData.length > 0 && (
          <ChartCard title="Peak Hours" icon={Activity} subtitle="Busiest booking hours">
            <HighchartsReact highcharts={Highcharts} options={peakHoursOptions} />
          </ChartCard>
        )}

        {/* Chart 7: Booking Completion Analysis */}
        {(selectedChart === 'all' || selectedChart === 'status') && (
          <ChartCard title="Booking Analysis" icon={Target} subtitle="Completed vs Expired vs Cancelled">
            {completionData.length > 0 ? (
              <HighchartsReact highcharts={Highcharts} options={pieOptions(completionData, 'Analysis')} />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                No data available
              </div>
            )}
          </ChartCard>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <FaCalendarAlt size={16} className="text-white/80" />
            <span className="text-xs text-white/80">Report Period</span>
          </div>
          <p className="text-lg font-bold">{dateRange === 'week' ? 'Last 7 Days' : dateRange === 'month' ? 'This Month' : 'This Year'}</p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <FaMoneyBillWave size={16} className="text-white/80" />
            <span className="text-xs text-white/80">Average per Booking</span>
          </div>
          <p className="text-lg font-bold">₹{stats.totalBookings ? (stats.totalEarnings / stats.totalBookings).toFixed(2) : 0}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <FaStar size={16} className="text-white/80" />
            <span className="text-xs text-white/80">Performance Score</span>
          </div>
          <p className="text-lg font-bold">{stats.successRate}%</p>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <FaClock size={16} className="text-white/80" />
            <span className="text-xs text-white/80">Pending Actions</span>
          </div>
          <p className="text-lg font-bold">{stats.pending + stats.ongoing}</p>
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mx-4">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
          <FaChartBar className="text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Detailed Statistics</h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Booking Statistics</h4>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Bookings</span>
                  <span className="font-bold text-gray-900">{stats.totalBookings}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="font-bold text-green-600">{stats.completed}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="font-bold text-yellow-600">{stats.pending}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Ongoing</span>
                  <span className="font-bold text-blue-600">{stats.ongoing}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Cancelled</span>
                  <span className="font-bold text-red-600">{stats.cancelled}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Expired</span>
                  <span className="font-bold text-gray-600">{stats.expired}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Financial Statistics</h4>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Earnings</span>
                  <span className="font-bold text-green-600">₹{stats.totalEarnings}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Wallet Balance</span>
                  <span className="font-bold text-blue-600">₹{stats.walletBalance}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Withdrawn</span>
                  <span className="font-bold text-orange-600">₹{stats.totalWithdrawn}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Commission Rate</span>
                  <span className="font-bold text-purple-600">{stats.commission}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className="font-bold text-green-600">{stats.successRate}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Avg. Booking Value</span>
                  <span className="font-bold text-blue-600">₹{stats.totalBookings ? (stats.totalEarnings / stats.totalBookings).toFixed(2) : 0}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Performance Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="font-bold text-green-600">{stats.completionRate}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Cancellation Rate</span>
                  <span className="font-bold text-red-600">{stats.totalBookings ? ((stats.cancelled / stats.totalBookings) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Expiry Rate</span>
                  <span className="font-bold text-gray-600">{stats.totalBookings ? ((stats.expired / stats.totalBookings) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Active Bookings</span>
                  <span className="font-bold text-blue-600">{stats.ongoing + stats.pending}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Footer */}
      <div className="text-center text-xs text-gray-400 py-4 border-t border-gray-200 px-4">
        Report generated on {new Date().toLocaleString('en-IN')} • Agent Performance Report
      </div>
    </div>
  );
}