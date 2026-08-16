import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  BarChart3,
  PieChart,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import type { CustomerOrder, RetailProduct } from '../../types/fashion';

interface RetailerAnalyticsProps {
  orders: CustomerOrder[];
  products: RetailProduct[];
}

export const RetailerAnalytics: React.FC<RetailerAnalyticsProps> = ({
  orders,
  products,
}) => {
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'ytd'>('month');

  // Business calculations based on time period
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.totalAmount : 0), 0) * (timePeriod === 'today' ? 0.12 : timePeriod === 'week' ? 0.35 : timePeriod === 'month' ? 1.0 : timePeriod === 'quarter' ? 2.4 : 8.5);
  const totalOrders = Math.round(orders.length * (timePeriod === 'today' ? 0.15 : timePeriod === 'week' ? 0.4 : timePeriod === 'month' ? 1.0 : timePeriod === 'quarter' ? 2.6 : 9.0));
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Sales by Occasion data breakdown
  const occasionSales = [
    { occasion: 'Work', percentage: 38, revenue: Math.round(totalRevenue * 0.38), color: 'from-amber-500 to-amber-600' },
    { occasion: 'Casual', percentage: 26, revenue: Math.round(totalRevenue * 0.26), color: 'from-emerald-500 to-emerald-600' },
    { occasion: 'Date night', percentage: 20, revenue: Math.round(totalRevenue * 0.20), color: 'from-rose-500 to-rose-600' },
    { occasion: 'Formal', percentage: 11, revenue: Math.round(totalRevenue * 0.11), color: 'from-purple-500 to-purple-600' },
    { occasion: 'Party', percentage: 5, revenue: Math.round(totalRevenue * 0.05), color: 'from-blue-500 to-blue-600' },
  ];

  // Top Categories breakdown
  const categorySales = [
    { category: 'Coats & Jackets', share: 42, count: 68 },
    { category: 'Dresses', share: 28, count: 45 },
    { category: 'Pants', share: 18, count: 29 },
    { category: 'Shirts & Tops', share: 12, count: 19 },
  ];

  // Sales Trend Chart Data
  const trendPoints = {
    today: [
      { label: '8 AM', value: 450 },
      { label: '10 AM', value: 1200 },
      { label: '12 PM', value: 2100 },
      { label: '2 PM', value: 1800 },
      { label: '4 PM', value: 2900 },
      { label: '6 PM', value: 3400 },
    ],
    week: [
      { label: 'Mon', value: 4200 },
      { label: 'Tue', value: 5800 },
      { label: 'Wed', value: 6400 },
      { label: 'Thu', value: 5100 },
      { label: 'Fri', value: 8900 },
      { label: 'Sat', value: 11200 },
      { label: 'Sun', value: 9500 },
    ],
    month: [
      { label: 'Wk 1', value: 14500 },
      { label: 'Wk 2', value: 18200 },
      { label: 'Wk 3', value: 16900 },
      { label: 'Wk 4', value: 24800 },
    ],
    quarter: [
      { label: 'Month 1', value: 48000 },
      { label: 'Month 2', value: 54000 },
      { label: 'Month 3', value: 68000 },
    ],
    ytd: [
      { label: 'Q1', value: 120000 },
      { label: 'Q2', value: 154000 },
      { label: 'Q3', value: 142000 },
      { label: 'Q4', value: 198000 },
    ],
  }[timePeriod];

  const maxTrendVal = Math.max(...trendPoints.map((t) => t.value));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Retail Business Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-theme-heading">
            Sales & Analytics Hub
          </h1>
          <p className="text-xs text-theme-muted mt-1">
            In-depth financial reports, category conversion rates, occasion analytics, and revenue trends.
          </p>
        </div>

        {/* Time Period Filter Switcher */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-surface-theme rounded-2xl border border-theme-main text-xs">
          {(['today', 'week', 'month', 'quarter', 'ytd'] as const).map((tp) => (
            <button
              key={tp}
              onClick={() => setTimePeriod(tp)}
              className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                timePeriod === tp
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-xs'
                  : 'text-theme-muted hover:text-theme-heading'
              }`}
            >
              {tp === 'today' ? 'Today' : tp === 'week' ? 'This Week' : tp === 'month' ? 'This Month' : tp === 'quarter' ? 'This Quarter' : 'YTD'}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="glass-card rounded-2xl p-5 border border-theme-main space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Total Revenue</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-theme-heading">${totalRevenue.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.4% growth rate</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="glass-card rounded-2xl p-5 border border-theme-main space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Total Orders</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-theme-heading">{totalOrders}</div>
          <div className="flex items-center gap-1 text-xs text-purple-400 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12.1% repeat order rate</span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="glass-card rounded-2xl p-5 border border-theme-main space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Average Order Value</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">${averageOrderValue}</div>
          <div className="text-xs text-theme-muted">Per single checkout basket</div>
        </div>

        {/* Top Occasion Driver */}
        <div className="glass-card rounded-2xl p-5 border border-theme-main space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Top Occasion Driver</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-theme-heading">Work & Business</div>
          <div className="text-xs text-rose-400 font-semibold">38% of total gross sales</div>
        </div>
      </div>

      {/* Main Revenue Trend Chart */}
      <div className="glass-panel rounded-3xl p-6 space-y-6 border border-theme-main">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme-subtle pb-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-theme-heading flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Revenue & Sales Trends ({timePeriod.toUpperCase()})</span>
            </h2>
            <p className="text-xs text-theme-muted">Visual breakdown of earnings performance over time</p>
          </div>
        </div>

        <div className="h-64 flex items-end justify-between gap-4 pt-8 px-4">
          {trendPoints.map((pt, idx) => {
            const heightPct = Math.round((pt.value / maxTrendVal) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-xs font-mono font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  ${pt.value.toLocaleString()}
                </div>
                <div className="w-full max-w-[56px] bg-surface-theme rounded-t-xl overflow-hidden h-full flex items-end border border-theme-subtle p-1">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-600 via-teal-500 to-amber-400 rounded-t-lg transition-all duration-500 group-hover:brightness-125 shadow-lg"
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-theme-muted group-hover:text-theme-heading transition-colors">
                  {pt.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Occasion Sales & Top Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales by Occasion (Left 7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 space-y-4 border border-theme-main">
          <div className="border-b border-theme-subtle pb-3">
            <h2 className="text-base font-serif font-bold text-theme-heading flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Sales by Occasion Attribute</span>
            </h2>
            <p className="text-xs text-theme-muted">Customer demand distribution filtered across fashion occasions</p>
          </div>

          <div className="space-y-3 pt-2">
            {occasionSales.map((occ) => (
              <div key={occ.occasion} className="space-y-1.5 bg-surface-theme p-3 rounded-2xl border border-theme-main">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-theme-heading flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span>{occ.occasion} Wear</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-theme-muted">{occ.percentage}%</span>
                    <span className="font-mono text-amber-300">${occ.revenue.toLocaleString()}</span>
                  </div>
                </div>

                <div className="w-full h-2.5 bg-surface-subtle-theme rounded-full overflow-hidden border border-theme-subtle">
                  <div className={`h-full bg-gradient-to-r ${occ.color} rounded-full`} style={{ width: `${occ.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories Breakdown (Right 5 Cols) */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 space-y-4 border border-theme-main">
          <div className="border-b border-theme-subtle pb-3">
            <h2 className="text-base font-serif font-bold text-theme-heading flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-400" />
              <span>Top Category Breakdown</span>
            </h2>
            <p className="text-xs text-theme-muted">Sales volume split by clothing categories</p>
          </div>

          <div className="space-y-3 pt-2">
            {categorySales.map((cat) => (
              <div key={cat.category} className="p-3 rounded-2xl bg-surface-theme border border-theme-main flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-theme-heading">{cat.category}</div>
                  <div className="text-[10px] text-theme-muted">{cat.count} total units sold</div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-purple-400">{cat.share}%</span>
                  <div className="text-[10px] text-theme-muted">Catalog Share</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Sales by Product Table */}
      <div className="glass-panel rounded-3xl p-6 space-y-4 border border-theme-main">
        <div className="border-b border-theme-subtle pb-3">
          <h2 className="text-base font-serif font-bold text-theme-heading">Sales Performance by Product</h2>
          <p className="text-xs text-theme-muted">Revenue contribution per individual store product</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-theme-main text-theme-muted uppercase tracking-wider font-bold text-[10px]">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Occasion</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Units Sold</th>
                <th className="py-3 px-4 text-right">Total Product Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-subtle">
              {products.map((p, idx) => {
                const units = Math.round(18 - idx * 2.2 + 4);
                const rev = units * p.price;
                return (
                  <tr key={p.id} className="hover:bg-surface-subtle-theme/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={p.imageUrl} alt={p.title} className="w-9 h-11 object-cover rounded-lg border border-theme-subtle" />
                        <div>
                          <div className="font-bold text-theme-heading text-xs">{p.title}</div>
                          <div className="text-[10px] text-theme-muted">{p.brand}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-theme-secondary font-semibold">{p.category}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 border border-amber-400/30 text-amber-300">
                        {p.occasion || 'Casual'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-theme-heading">${p.price}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">{units} Units</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-300 text-sm">
                      ${rev.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
