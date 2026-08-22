import React, { useState } from 'react';
import {
  Users,
  Search,
  Mail,
  Phone,
  Award,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import type { RetailerCustomer } from '../../types/fashion';

interface RetailerCustomersProps {
  customers: RetailerCustomer[];
}

export const RetailerCustomers: React.FC<RetailerCustomersProps> = ({
  customers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const vipCount = customers.filter((c) => c.status === 'VIP').length;
  const activeCount = customers.filter((c) => c.status === 'Active' || c.status === 'VIP').length;
  const avgLifetimeSpend = Math.round(
    customers.reduce((acc, c) => acc + c.totalSpent, 0) / (customers.length || 1)
  );

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'VIP':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      case 'Active':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'New':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'Inactive':
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
      default:
        return 'bg-surface-theme border-theme-subtle text-theme-muted';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Customer Relationship Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-theme-heading">
            Customers Directory
          </h1>
          <p className="text-xs text-theme-muted mt-1">
            Track customer purchase history, total lifetime spend, order frequency, and VIP tier statuses.
          </p>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-theme-main flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Active Client Accounts</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">{activeCount} Clients</div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-theme-main flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">VIP Tier Members</div>
            <div className="text-2xl font-bold font-mono text-purple-400 mt-0.5">{vipCount} VIPs</div>
          </div>
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-theme-main flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Average Lifetime Value</div>
            <div className="text-2xl font-bold font-mono text-amber-300 mt-0.5">${avgLifetimeSpend.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel rounded-3xl p-5 space-y-4 border border-theme-main">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-theme-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers by name or email address..."
              className="w-full h-10 pl-10 pr-4 bg-surface-theme border border-theme-main focus:border-amber-400/50 rounded-xl text-xs text-theme-heading placeholder:text-theme-muted outline-none transition-all"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-surface-theme rounded-xl border border-theme-main text-xs">
            {['All', 'VIP', 'Active', 'New', 'Inactive'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-xs'
                    : 'text-theme-muted hover:text-theme-heading'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-theme-main shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-theme-main bg-surface-theme/50 text-theme-muted uppercase tracking-wider font-bold text-[10px]">
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Total Orders</th>
                <th className="py-3.5 px-4">Total Purchase Value</th>
                <th className="py-3.5 px-4">Recent Order</th>
                <th className="py-3.5 px-4">Customer Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-subtle">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-surface-subtle-theme/60 transition-colors">
                  {/* Customer Avatar & Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={cust.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                        alt={cust.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400/30 flex-shrink-0"
                      />
                      <div>
                        <div className="font-bold text-theme-heading text-xs">{cust.name}</div>
                        <div className="text-[10px] text-theme-muted font-mono">ID: {cust.id}</div>
                      </div>
                    </div>
                  </td>

                  {/* Contact Info */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <div className="text-theme-heading font-semibold flex items-center gap-1">
                        <Mail className="w-3 h-3 text-theme-muted" />
                        <span>{cust.email}</span>
                      </div>
                      <div className="text-[10px] text-theme-muted flex items-center gap-1">
                        <Phone className="w-3 h-3 text-theme-muted" />
                        <span>{cust.phone}</span>
                      </div>
                    </div>
                  </td>

                  {/* Total Orders */}
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-theme-heading">
                    {cust.ordersCount} Orders
                  </td>

                  {/* Total Purchase Value */}
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-300 text-sm">
                    ${cust.totalSpent.toLocaleString()}
                  </td>

                  {/* Recent Order */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-xs font-semibold text-amber-400">{cust.recentOrderId}</div>
                    <div className="text-[10px] text-theme-muted">{cust.recentOrderDate}</div>
                  </td>

                  {/* Customer Status */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(cust.status)}`}
                    >
                      {cust.status === 'VIP' && <Award className="w-3 h-3" />}
                      <span>{cust.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
