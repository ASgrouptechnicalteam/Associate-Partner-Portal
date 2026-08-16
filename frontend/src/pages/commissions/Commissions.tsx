import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { IndianRupee, CheckCircle2, Clock, Calendar, Filter } from 'lucide-react';
import CommissionPolicyManager from '../../components/commissions/CommissionPolicyManager';
import { formatCurrency } from '../../utils/currency';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface CommissionTransaction {
  id: string;
  amountCalculated: number;
  amountReceived: number;
  amountDue: number;
  status: string;
  createdAt: string;
  project: { name: string };
  booking: { customerName: string };
}

export default function Commissions() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState({ totalCommission: 0, received: 0, pending: 0 });
  const [ledger, setLedger] = useState<CommissionTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('');
  const [showManager, setShowManager] = useState(false);

  useEffect(() => {
    fetchData();
  }, [timeFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpiRes, ledgerRes] = await Promise.all([
        api.get('/v1/commissions/dashboard'),
        api.get(`/v1/commissions/ledger${timeFilter ? `?timeFilter=${timeFilter}` : ''}`)
      ]);
      setKpis(kpiRes.data.data);
      setLedger(ledgerRes.data.data);
    } catch (error) {
      console.error('Failed to load commissions', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data (Group by month)
  const chartData = ledger.reduce((acc: any[], tx: any) => {
    const month = new Date(tx.createdAt).toLocaleString('default', { month: 'short' });
    const existing = acc.find(d => d.name === month);
    if (existing) {
      existing.earned += Number(tx.amountCalculated);
    } else {
      acc.push({ name: month, earned: Number(tx.amountCalculated) });
    }
    return acc;
  }, []).reverse(); // Reverse if ledger is descending, so chart is chronological

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Commissions</h1>
          <p className="text-muted-text mt-1 text-sm font-medium">Track your earnings, ledger, and payment status.</p>
        </div>
        {(user?.role === 'MD' || user?.role === 'ASSOCIATE_MANAGER') && (
          <Button onClick={() => setShowManager(true)}>
            Manage Policy Rates
          </Button>
        )}
      </div>

      {showManager && <CommissionPolicyManager onClose={() => setShowManager(false)} />}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card padding="md" className="flex flex-col justify-between h-36 hover:-translate-y-1 transition-transform border-l-4 border-l-action-blue">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-muted-text uppercase tracking-wider">Total Commission</h3>
            <div className="bg-action-blue/10 p-2.5 rounded-xl">
              <IndianRupee className="text-action-blue" size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold text-primary-navy">
            {loading ? '...' : formatCurrency(kpis.totalCommission)}
          </div>
        </Card>

        <Card padding="md" className="flex flex-col justify-between h-36 hover:-translate-y-1 transition-transform border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-muted-text uppercase tracking-wider">Received</h3>
            <div className="bg-green-100 p-2.5 rounded-xl">
              <CheckCircle2 className="text-green-600" size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold text-primary-navy">
            {loading ? '...' : formatCurrency(kpis.received)}
          </div>
        </Card>

        <Card padding="md" className="flex flex-col justify-between h-36 hover:-translate-y-1 transition-transform border-l-4 border-l-brand-gold">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-muted-text uppercase tracking-wider">Pending Due</h3>
            <div className="bg-brand-gold/10 p-2.5 rounded-xl">
              <Clock className="text-brand-gold" size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold text-primary-navy">
            {loading ? '...' : formatCurrency(kpis.pending)}
          </div>
        </Card>
      </div>

      {/* Chart */}
      {ledger.length > 0 && (
        <Card padding="md">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-primary-navy">Earnings Overview</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Earned']}
                  cursor={{fill: '#F3F4F6'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="earned" fill="#C5A859" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Ledger */}
      <Card padding="none" className="overflow-hidden bg-white shadow-sm">
        <div className="p-6 border-b border-border-subtle flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-primary-navy">Commission Ledger</h2>
            <p className="text-sm text-muted-text mt-0.5">History of all commission calculations and payouts.</p>
          </div>
          <div className="flex items-center space-x-2 bg-white rounded-lg border border-border-subtle px-3 py-1.5 focus-within:ring-2 focus-within:ring-action-blue/20">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-primary-text focus:outline-none"
            >
              <option value="">All Time</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">This Week</option>
              <option value="MONTH">This Month</option>
              <option value="YEAR">This Year</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-muted-text uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-text uppercase tracking-wider">Booking / Project</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-text uppercase tracking-wider">Commission</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-text uppercase tracking-wider">Received</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-text uppercase tracking-wider">Due</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-text uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-text font-medium">Loading ledger...</td>
                </tr>
              ) : ledger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-text font-medium border-2 border-dashed border-gray-100 m-4 rounded-xl">No commission records found.</td>
                </tr>
              ) : (
                ledger.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-primary-text">{new Date(tx.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-primary-navy">{tx.booking.customerName}</p>
                      <p className="text-xs font-medium text-muted-text mt-0.5">{tx.project.name}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-navy">{formatCurrency(tx.amountCalculated)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">{formatCurrency(tx.amountReceived)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-gold">{formatCurrency(tx.amountDue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Badge variant={
                        tx.status === 'RECEIVED' ? 'success' :
                        tx.status === 'PARTIAL' ? 'info' :
                        'warning'
                      }>
                        {tx.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
