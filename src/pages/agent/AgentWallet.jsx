// src/pages/agent/AgentWallet.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentService } from '../../api/agentApi';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import Highcharts from 'highcharts';
import HighchartsMore from 'highcharts/highcharts-more';
import SolidGauge from 'highcharts/modules/solid-gauge';
import HighchartsReact from 'highcharts-react-official';

// Initialize Highcharts modules
if (typeof HighchartsMore === 'function') {
  HighchartsMore(Highcharts);
}
if (typeof SolidGauge === 'function') {
  SolidGauge(Highcharts);
}
import {
  FaWallet, FaHistory, FaArrowUp, FaArrowDown,
  FaSync, FaCheckCircle, FaClock, FaExclamationCircle,
  FaMoneyBillWave, FaDownload, FaPrint, FaFilter,
  FaTimes, FaSearch, FaChevronLeft, FaChevronRight,
  FaChartPie, FaChartBar, FaChartLine, FaChartArea
} from 'react-icons/fa';
import {
  DollarSign, TrendingUp, TrendingDown, Calendar,
  CreditCard, Banknote, Wallet, Activity, Target,
  Gauge, Zap, Shield, Eye, MoreVertical, ArrowUpRight,
  ArrowDownRight, PieChart, BarChart3, LineChart, Clock,
  ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight
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
  lightGray: '#E5E7EB',
  gold: '#F59E0B',
  silver: '#94A3B8'
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

// Transaction Row Component
const TransactionRow = ({ transaction, index }) => {
  const getStatusBadge = () => {
    switch (transaction.status?.toLowerCase()) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Completed</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pending</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Failed</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{transaction.status}</span>;
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-all items-center">
      <div className="col-span-3">
        <p className="text-xs text-gray-500">{new Date(transaction.createdAt).toLocaleDateString('en-IN')}</p>
        <p className="text-xs text-gray-400">{new Date(transaction.createdAt).toLocaleTimeString('en-IN')}</p>
      </div>
      <div className="col-span-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${transaction.type === 'Credit' ? 'bg-green-50' : 'bg-red-50'}`}>
            {transaction.type === 'Credit' ? (
              <ArrowUpRight size={12} className="text-green-600" />
            ) : (
              <ArrowDownRight size={12} className="text-red-600" />
            )}
          </div>
          <span className={`text-sm font-medium ${transaction.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
            {transaction.type}
          </span>
        </div>
      </div>
      <div className="col-span-3">
        <p className="text-sm font-medium text-gray-900">{transaction.category}</p>
        <p className="text-xs text-gray-500 truncate">{transaction.description}</p>
      </div>
      <div className="col-span-2">
        <p className={`text-sm font-bold ${transaction.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
          {transaction.type === 'Credit' ? '+' : '-'} ₹{transaction.amount?.toLocaleString()}
        </p>
      </div>
      <div className="col-span-2">
        {getStatusBadge()}
      </div>
    </div>
  );
};

// Main AgentWallet Component
export default function AgentWallet() {
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDesc, setWithdrawDesc] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedChart, setSelectedChart] = useState('all');

  const fetchWallet = async () => {
    try {
      setRefreshing(true);
      const data = await agentService.getWalletBalance();
      setWalletData(data?.wallet || data || {});
    } catch (err) {
      toast.error(err?.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const walletBalance = walletData?.walletBalance || 0;
  const totalEarnings = walletData?.totalEarnings || 0;
  const commissionPercentage = walletData?.commissionPercentage || 0;
  const transactions = walletData?.transactions || [];

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (filter !== 'all') {
      filtered = filtered.filter(t => t.type?.toLowerCase() === filter);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(t =>
        t.category?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t._id?.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [transactions, filter, search]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const displayedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Stats
  const stats = useMemo(() => {
    const totalCredits = transactions.filter(t => t.type === 'Credit').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalDebits = transactions.filter(t => t.type === 'Debit').reduce((sum, t) => sum + (t.amount || 0), 0);
    const pendingAmount = transactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + (t.amount || 0), 0);
    const completedCount = transactions.filter(t => t.status === 'Completed').length;
    const pendingCount = transactions.filter(t => t.status === 'Pending').length;
    const successRate = transactions.length ? (completedCount / transactions.length) * 100 : 0;

    return {
      totalCredits,
      totalDebits,
      netFlow: totalCredits - totalDebits,
      pendingAmount,
      completedCount,
      pendingCount,
      successRate
    };
  }, [transactions]);

  // Chart 1: Balance Distribution - Donut Chart
  const balanceData = [
    { name: 'Wallet Balance', value: walletBalance, color: CHART_COLORS.primary },
    { name: 'Pending Withdrawals', value: stats.pendingAmount, color: CHART_COLORS.warning },
    { name: 'Completed Withdrawals', value: stats.totalDebits - stats.pendingAmount, color: CHART_COLORS.gray }
  ].filter(item => item.value > 0);

  // Chart 2: Transaction Types - Pie Chart
  const typeData = [
    { name: 'Credits', value: stats.totalCredits, color: CHART_COLORS.success },
    { name: 'Debits', value: stats.totalDebits, color: CHART_COLORS.danger }
  ].filter(item => item.value > 0);

  // Chart 3: Status Distribution - Pie Chart
  const statusData = [
    { name: 'Completed', value: stats.completedCount, color: CHART_COLORS.success },
    { name: 'Pending', value: stats.pendingCount, color: CHART_COLORS.warning }
  ].filter(item => item.value > 0);

  // Chart 4: Monthly Trend - Bar Chart
  const monthlyData = useMemo(() => {
    const months = {};
    transactions.forEach(t => {
      const month = new Date(t.createdAt).toLocaleString('default', { month: 'short' });
      if (!months[month]) months[month] = { credits: 0, debits: 0 };
      if (t.type === 'Credit') months[month].credits += t.amount || 0;
      else months[month].debits += t.amount || 0;
    });
    return Object.entries(months).map(([month, data]) => ({
      month,
      credits: data.credits,
      debits: data.debits
    }));
  }, [transactions]);

  // Chart 5: Weekly Trend - Line Chart (from API)
  const weeklyData = useMemo(() => {
    if (walletData?.weeklyTrend && Array.isArray(walletData.weeklyTrend)) {
      return walletData.weeklyTrend;
    }
    return [];
  }, [walletData]);

  // Chart 6: Success Rate - Gauge
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
      data: [stats.successRate],
      dataLabels: { format: '<div style="text-align:center"><span style="font-size:28px">{y:.0f}%</span><br/><span style="font-size:10px">Success Rate</span></div>' }
    }],
    credits: { enabled: false }
  };

  // === HIGHCHARTS CONFIG ===
  const pieOptions = (data, title) => ({
    chart: { type: 'pie', height: 200, style: { fontFamily: 'inherit' } },
    title: { text: null },
    tooltip: { pointFormat: '{point.name}: <b>₹{point.y}</b> ({point.percentage:.1f}%)' },
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
    xAxis: { categories: monthlyData.map(d => d.month) },
    yAxis: { title: { text: 'Amount (₹)' }, labels: { style: { fontSize: '10px' } } },
    legend: { enabled: true, itemStyle: { fontSize: '10px' } },
    tooltip: { pointFormat: '{series.name}: ₹{point.y}' },
    plotOptions: { column: { borderRadius: 4 } },
    series: [
      { name: 'Credits', data: monthlyData.map(d => d.credits), color: CHART_COLORS.success },
      { name: 'Debits', data: monthlyData.map(d => d.debits), color: CHART_COLORS.danger }
    ],
    credits: { enabled: false }
  };

  const lineOptions = {
    chart: { type: 'spline', height: 200, style: { fontFamily: 'inherit' } },
    title: { text: null },
    xAxis: { categories: weeklyData.map(d => d.day) },
    yAxis: { title: { text: 'Amount (₹)' }, labels: { style: { fontSize: '10px' } } },
    legend: { enabled: false },
    tooltip: { pointFormat: '₹{point.y}' },
    plotOptions: {
      spline: {
        marker: { radius: 4 },
        color: CHART_COLORS.primary,
        lineWidth: 2
      }
    },
    series: [{ name: 'Weekly Trend', data: weeklyData.map(d => d.amount) }],
    credits: { enabled: false }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      return toast.error('Enter a valid amount');
    }

    if (amount > walletBalance) {
      return Swal.fire({
        icon: 'error',
        title: 'Insufficient Balance',
        text: `Your wallet balance is ₹${walletBalance.toLocaleString()}`,
        confirmButtonColor: '#3B82F6'
      });
    }

    const result = await Swal.fire({
      title: 'Confirm Withdrawal',
      text: `Request withdrawal of ₹${amount.toLocaleString()}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#94A3B8',
      confirmButtonText: 'Yes, Withdraw',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setWithdrawing(true);
    try {
      const res = await agentService.requestWithdrawal(amount, withdrawDesc);
      if (res.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Request Submitted',
          text: 'Your withdrawal request has been sent for approval',
          confirmButtonColor: '#10B981'
        });
        setWithdrawAmount('');
        setWithdrawDesc('');
        fetchWallet();
      }
    } catch (err) {
      toast.error(err?.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500">Loading wallet...</p>
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
              <FaWallet className="text-blue-600 text-lg sm:text-xl" />
              My Wallet
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage your earnings and withdrawals
            </p>
          </div>
          <button
            onClick={fetchWallet}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all sm:hidden"
            disabled={refreshing}
          >
            <FaSync className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={fetchWallet}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all"
            disabled={refreshing}
          >
            <FaSync className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Wallet size={24} />
            </div>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Available Balance</span>
          </div>
          <p className="text-4xl font-bold">₹{walletBalance.toLocaleString()}</p>
          <p className="text-blue-100 text-sm mt-2">Ready for withdrawal</p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <DollarSign size={24} />
            </div>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Lifetime</span>
          </div>
          <p className="text-4xl font-bold">₹{totalEarnings.toLocaleString()}</p>
          <p className="text-green-100 text-sm mt-2">Total earnings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Credits"
          value={`₹${stats.totalCredits.toLocaleString()}`}
          icon={TrendingUp}
          color={CHART_COLORS.success}
          trend={12}
        />
        <StatCard
          label="Total Debits"
          value={`₹${stats.totalDebits.toLocaleString()}`}
          icon={TrendingDown}
          color={CHART_COLORS.danger}
          trend={-5}
        />
        <StatCard
          label="Pending Amount"
          value={`₹${stats.pendingAmount.toLocaleString()}`}
          icon={Clock}
          color={CHART_COLORS.warning}
        />
        <StatCard
          label="Net Flow"
          value={`₹${stats.netFlow.toLocaleString()}`}
          icon={Activity}
          color={stats.netFlow >= 0 ? CHART_COLORS.success : CHART_COLORS.danger}
          trend={stats.netFlow >= 0 ? 15 : -8}
        />
      </div>

      {/* Chart Selector */}
      <div className="flex flex-wrap gap-2">
        {['all', 'distribution', 'trends', 'monthly'].map((type) => (
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

      {/* Charts Section - 6 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Chart 1: Balance Distribution */}
        {(selectedChart === 'all' || selectedChart === 'distribution') && (
          <ChartCard title="Balance Distribution" icon={PieChart} subtitle="Wallet breakdown">
            {balanceData.length > 0 ? (
              <HighchartsReact highcharts={Highcharts} options={pieOptions(balanceData, 'Balance')} />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                No data available
              </div>
            )}
          </ChartCard>
        )}

        {/* Chart 2: Transaction Types */}
        {(selectedChart === 'all' || selectedChart === 'distribution') && (
          <ChartCard title="Transaction Types" icon={CreditCard} subtitle="Credits vs Debits">
            {typeData.length > 0 ? (
              <HighchartsReact highcharts={Highcharts} options={pieOptions(typeData, 'Types')} />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                No data available
              </div>
            )}
          </ChartCard>
        )}

        {/* Chart 3: Status Distribution */}
        {(selectedChart === 'all' || selectedChart === 'distribution') && (
          <ChartCard title="Status Distribution" icon={Target} subtitle="Completed vs Pending">
            {statusData.length > 0 ? (
              <HighchartsReact highcharts={Highcharts} options={pieOptions(statusData, 'Status')} />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                No data available
              </div>
            )}
          </ChartCard>
        )}

        {/* Chart 4: Monthly Trend */}
        {(selectedChart === 'all' || selectedChart === 'monthly') && monthlyData.length > 0 && (
          <ChartCard title="Monthly Trend" icon={BarChart3} subtitle="Credits vs Debits over time">
            <HighchartsReact highcharts={Highcharts} options={barOptions} />
          </ChartCard>
        )}

        {/* Chart 5: Weekly Trend */}
        {(selectedChart === 'all' || selectedChart === 'trends') && weeklyData.length > 0 && (
          <ChartCard title="Weekly Trend" icon={LineChart} subtitle="Last 7 days activity">
            <HighchartsReact highcharts={Highcharts} options={lineOptions} />
          </ChartCard>
        )}
      </div>

      {/* Withdraw Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Withdrawal Form */}
        <div className="space-y-4">
          {/* User Balance Summary */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-xl p-6 text-white shadow-lg border border-yellow-500/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-yellow-400 text-xs mb-1 font-medium">Available Balance</p>
                <p className="text-4xl font-bold text-white">₹{walletBalance.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-yellow-500 rounded-xl shadow-lg">
                <Wallet size={28} className="text-black" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-yellow-500/30">
              <div>
                <p className="text-yellow-400 text-xs font-medium">Total Earnings</p>
                <p className="text-lg font-semibold text-white">₹{totalEarnings.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-yellow-400 text-xs font-medium">Commission</p>
                <p className="text-lg font-semibold text-white">{commissionPercentage}%</p>
              </div>
            </div>
          </div>

          {/* Withdrawal Form Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Banknote size={18} className="text-green-600" />
              Request Withdrawal
            </h2>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">₹</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full pl-8 pr-24 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="0"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(walletBalance.toString())}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium"
                  >
                    Max
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={withdrawDesc}
                  onChange={(e) => setWithdrawDesc(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  rows="3"
                  placeholder="Add a note..."
                />
              </div>

              <button
                type="submit"
                disabled={withdrawing}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-lg shadow-green-200"
              >
                {withdrawing ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <FaArrowUp size={16} />
                    Request Withdrawal
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Withdrawal Info */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <FaWallet className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Withdrawal Guidelines</h3>
              <p className="text-xs text-gray-500 mt-1">Important information for agents</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">1</div>
                Minimum Withdrawal Amount
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Aap minimum ₹500 withdraw kar sakte ho. Isse kam amount ke liye withdrawal request accept nahi hogi.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs font-bold">2</div>
                Processing Time
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Withdrawal request submit karne ke baad 2-3 business days me aapke bank account me amount transfer ho jayega. Weekend aur holidays me thoda delay ho sakta hai.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs font-bold">3</div>
                Bank Details Verification
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Pehli baar withdrawal karne se pehle apne bank details verify karwa lein. Profile section me jaake bank details update kar sakte ho.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xs font-bold">4</div>
                Transaction Charges
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Withdrawal pe koi extra charges nahi lagte. Jo amount aap request karoge, wahi amount aapke account me aayega.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs font-bold">!</div>
                Important Note
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Agar withdrawal request 5 days ke baad bhi pending hai toh support team se contact karein. Transaction history me aap apni saari withdrawal requests dekh sakte ho.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <FaHistory className="text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">Transaction History</h3>
            <span className="text-xs text-gray-500">({transactions.length} total)</span>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Filter */}
            <div className="flex items-center gap-2 p-1 bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => { setFilter('all'); setCurrentPage(1); }}
                className={`px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-all ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                All
              </button>
              <button
                onClick={() => { setFilter('credit'); setCurrentPage(1); }}
                className={`px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-all ${filter === 'credit' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Credits
              </button>
              <button
                onClick={() => { setFilter('debit'); setCurrentPage(1); }}
                className={`px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-all ${filter === 'debit' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Debits
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes size={10} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {displayedTransactions.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              No transactions found
            </div>
          ) : (
            displayedTransactions.map((transaction, idx) => (
              <div key={transaction._id || idx} className="border-b border-gray-100 p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${transaction.type === 'Credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                      {transaction.type === 'Credit' ? (
                        <ArrowUpRight size={12} className="text-green-600" />
                      ) : (
                        <ArrowDownRight size={12} className="text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.category}</p>
                      <p className="text-xs text-gray-500">{transaction.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${transaction.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'Credit' ? '+' : '-'} ₹{transaction.amount?.toLocaleString()}
                    </p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                      transaction.status?.toLowerCase() === 'completed' ? 'bg-green-100 text-green-700' :
                      transaction.status?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                  <span>{new Date(transaction.createdAt).toLocaleDateString('en-IN')}</span>
                  <span>{new Date(transaction.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
            <div className="col-span-3">Date & Time</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Status</div>
          </div>

          {/* Transactions */}
          {displayedTransactions.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              No transactions found
            </div>
          ) : (
            displayedTransactions.map((transaction, idx) => (
              <TransactionRow key={transaction._id || idx} transaction={transaction} />
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <div className="px-4 sm:px-6 py-4 border-t bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs sm:text-sm">
              <span className="text-gray-500">
                Showing {Math.min(filteredTransactions.length, (currentPage - 1) * itemsPerPage + 1)}-
                {Math.min(filteredTransactions.length, currentPage * itemsPerPage)} of {filteredTransactions.length}
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="text-xs sm:text-sm border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {[10, 20, 50, 100].map(v => <option key={v} value={v}>{v} per page</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 sm:p-2 rounded-lg border hover:bg-white disabled:opacity-30"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 sm:p-2 rounded-lg border hover:bg-white disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 sm:p-2 rounded-lg border hover:bg-white disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 sm:p-2 rounded-lg border hover:bg-white disabled:opacity-30"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}