
import React, { useMemo, useState } from 'react';
import { AppData, SaleRecord, ProductDefinition } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, Package, DollarSign, ArrowUpRight, ArrowDownRight, Activity, 
  Search, Filter, Calendar, ListTree, Tag, ChevronDown, ChevronUp, AlertTriangle, Bell,
  FileDown, PackageX
} from 'lucide-react';

interface Props {
  data: AppData;
}

type FilterType = 'all' | 'day' | 'month' | 'year' | 'range';

const StatsSection: React.FC<Props> = ({ data }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');

  const filteredSales = useMemo(() => {
    return (data.sales || []).filter(sale => {
      const saleDate = new Date(sale.date);
      const saleDateStr = sale.date.split('T')[0];
      const prod = data.products.find(p => p.id === sale.productId);

      let timeMatch = true;
      if (filterType === 'day') {
        timeMatch = saleDateStr === selectedDate;
      } else if (filterType === 'month') {
        const monthStr = sale.date.slice(0, 7);
        timeMatch = monthStr === selectedMonth;
      } else if (filterType === 'year') {
        timeMatch = saleDate.getFullYear() === selectedYear;
      } else if (filterType === 'range') {
        if (startDate && endDate) {
          timeMatch = saleDateStr >= startDate && saleDateStr <= endDate;
        }
      }

      const searchMatch = !searchQuery || 
        prod?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        prod?.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const categoryObj = selectedCatId ? data.categories.find(c => c.id === selectedCatId) : null;
      const catMatch = !selectedCatId || (categoryObj && prod?.category === categoryObj.name);

      return timeMatch && searchMatch && catMatch;
    });
  }, [data.sales, data.products, data.categories, filterType, selectedDate, selectedMonth, selectedYear, startDate, endDate, searchQuery, selectedCatId]);

  const summary = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.quantity * sale.price), 0);
    const cogs = filteredSales.reduce((sum, sale) => {
      const imp = data.imports.find(i => i.id === sale.importRecordId);
      return sum + (sale.quantity * (imp?.importPrice || 0));
    }, 0);
    const profit = totalSales - cogs;

    const stockCapital = (data.imports || []).reduce((sum, imp) => {
      const prod = data.products.find(p => p.id === imp.productId);
      const searchMatch = !searchQuery || 
        prod?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        prod?.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const categoryObj = selectedCatId ? data.categories.find(c => c.id === selectedCatId) : null;
      const catMatch = !selectedCatId || (categoryObj && prod?.category === categoryObj.name);

      if (!searchMatch || !catMatch) return sum;

      const soldQty = (data.sales || []).filter(s => s.importRecordId === imp.id).reduce((q, s) => q + s.quantity, 0);
      return sum + ((imp.quantity - soldQty) * imp.importPrice);
    }, 0);

    return { totalSales, profit, stockCapital, salesCount: filteredSales.length };
  }, [filteredSales, data.imports, data.sales, data.products, data.categories, searchQuery, selectedCatId]);

  const chartData = useMemo(() => {
    const map: { [key: string]: { label: string, revenue: number, profit: number } } = {};
    
    // Create an empty sorting label map if data exists but is sparse
    filteredSales.forEach(sale => {
      let key = '';
      let label = '';
      const d = new Date(sale.date);

      if (filterType === 'day') {
        key = d.getHours().toString().padStart(2, '0') + ':00';
        label = key;
      } else if (filterType === 'month' || filterType === 'range') {
        key = d.toISOString().split('T')[0];
        label = d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth()+1).toString().padStart(2, '0');
      } else {
        key = (d.getMonth() + 1).toString().padStart(2, '0');
        label = 'T' + key;
      }

      if (!map[key]) map[key] = { label, revenue: 0, profit: 0 };
      map[key].revenue += sale.quantity * sale.price;
      const imp = data.imports.find(i => i.id === sale.importRecordId);
      map[key].profit += (sale.quantity * sale.price) - (sale.quantity * (imp?.importPrice || 0));
    });

    const result = Object.values(map).sort((a, b) => a.label.localeCompare(b.label));
    // Return at least one empty record for Recharts to not error out
    return result.length > 0 ? result : [{ label: 'N/A', revenue: 0, profit: 0 }];
  }, [filteredSales, filterType, data.imports]);

  const categoryDistribution = useMemo(() => {
    const cats: { [key: string]: number } = {};
    filteredSales.forEach(sale => {
      const prod = data.products.find(p => p.id === sale.productId);
      const cat = prod?.category || 'Khác';
      cats[cat] = (cats[cat] || 0) + (sale.quantity * sale.price);
    });
    const result = Object.entries(cats).map(([name, value]) => ({ name, value }));
    return result.length > 0 ? result : [{ name: 'Trống', value: 0 }];
  }, [filteredSales, data.products]);

  const topSellers = useMemo(() => {
    const soldMap: { [key: string]: { name: string, qty: number, revenue: number } } = {};
    filteredSales.forEach(sale => {
      const prod = data.products.find(p => p.id === sale.productId);
      if (!prod) return;
      if (!soldMap[prod.id]) soldMap[prod.id] = { name: prod.name, qty: 0, revenue: 0 };
      soldMap[prod.id].qty += sale.quantity;
      soldMap[prod.id].revenue += sale.quantity * sale.price;
    });
    return Object.values(soldMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredSales, data.products]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  const exportCSV = () => {
    if (filteredSales.length === 0) {
      alert('Không có dữ liệu để xuất báo cáo');
      return;
    }
    let csv = '\uFEFF';
    csv += 'Ngày,Mã hàng,Tên hàng,Loại hàng,Hãng sản xuất,Số lượng,Đơn giá bán,Thành tiền,Giá nhập,Lợi nhuận\n';
    filteredSales.forEach(sale => {
      const prod = data.products.find(p => p.id === sale.productId);
      const imp = data.imports.find(i => i.id === sale.importRecordId);
      const row = [
        new Date(sale.date).toLocaleString('vi-VN'),
        prod?.code || '',
        `"${prod?.name || ''}"`,
        prod?.category || '',
        prod?.manufacturer || '',
        sale.quantity,
        sale.price,
        sale.quantity * sale.price,
        imp?.importPrice || 0,
        (sale.quantity * sale.price) - (sale.quantity * (imp?.importPrice || 0))
      ].join(',');
      csv += row + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_cao_kinh_doanh_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const warningItems = useMemo(() => {
    return (data.imports || [])
      .map(imp => {
        const prod = data.products.find(p => p.id === imp.productId);
        const sold = (data.sales || []).filter(s => s.importRecordId === imp.id).reduce((sum, s) => sum + s.quantity, 0);
        const stock = imp.quantity - sold;

        const searchMatch = !searchQuery || 
          prod?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          prod?.code.toLowerCase().includes(searchQuery.toLowerCase());
        
        const categoryObj = selectedCatId ? data.categories.find(c => c.id === selectedCatId) : null;
        const catMatch = !selectedCatId || (categoryObj && prod?.category === categoryObj.name);

        if (stock <= 20 && searchMatch && catMatch) {
          return { ...imp, prod, stock };
        }
        return null;
      })
      .filter((item): item is any => item !== null)
      .sort((a, b) => a.stock - b.stock);
  }, [data.imports, data.products, data.sales, searchQuery, selectedCatId, data.categories]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard & Thống kê</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={exportCSV} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-all shadow-md"><FileDown size={18} /> Xuất Báo cáo</button>
          <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${isFilterOpen ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200'}`}><Filter size={16} /> {isFilterOpen ? 'Đóng bộ lọc' : 'Lọc Dữ liệu'}</button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={12} /> Khoảng thời gian</label>
              <div className="grid grid-cols-2 gap-1">
                {(['all', 'day', 'month', 'year', 'range'] as const).map(t => (
                  <button key={t} onClick={() => setFilterType(t)} className={`px-2 py-1.5 rounded text-[10px] font-black uppercase transition-all ${filterType === t ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{t === 'all' ? 'Tất cả' : t === 'day' ? 'Ngày' : t === 'month' ? 'Tháng' : t === 'year' ? 'Năm' : 'Khoảng'}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chi tiết thời gian</label>
              {filterType === 'day' && <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />}
              {filterType === 'month' && <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />}
              {filterType === 'year' && <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">{[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>}
              {filterType === 'range' && <div className="flex items-center gap-2"><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-slate-200 rounded-lg p-1.5 text-xs outline-none" /><span className="text-slate-300">-</span><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-slate-200 rounded-lg p-1.5 text-xs outline-none" /></div>}
              {filterType === 'all' && <div className="p-2 text-xs text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">Toàn bộ lịch sử</div>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Tag size={12} /> Sản phẩm / SKU</label>
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Tìm kiếm..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><ListTree size={12} /> Loại hàng</label>
              <select value={selectedCatId} onChange={e => setSelectedCatId(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"><option value="">Tất cả loại hàng</option>{data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Doanh thu" value={summary.totalSales} icon={<DollarSign className="text-blue-600" />} trend="+%" color="blue" subtitle={`${summary.salesCount} đơn hàng`} />
        <StatCard title="Lợi nhuận" value={summary.profit} icon={<TrendingUp className="text-emerald-600" />} trend="+%" color="emerald" subtitle={`Tỉ suất: ${summary.totalSales ? Math.round((summary.profit/summary.totalSales)*100) : 0}%`} />
        <StatCard title="Vốn hàng tồn" value={summary.stockCapital} icon={<Package className="text-orange-600" />} trend="Stock" color="orange" subtitle="Giá trị kho hiện tại" />
        <StatCard title="Hiệu suất" value={summary.salesCount} icon={<Activity className="text-indigo-600" />} trend="Mới" color="indigo" subtitle="Giao dịch ghi nhận" isCurrency={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-6 uppercase text-xs tracking-widest">Biểu đồ tăng trưởng Doanh thu & Lợi nhuận</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {filterType === 'day' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => value.toLocaleString() + 'đ'} />
                  <Bar name="Doanh thu" dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar name="Lợi nhuận" dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => value.toLocaleString() + 'đ'} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Line name="Doanh thu" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6'}} />
                  <Line name="Lợi nhuận" type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-6 uppercase text-xs tracking-widest">Cơ cấu doanh thu theo Loại</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {categoryDistribution.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: any) => value.toLocaleString() + 'đ'} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 uppercase text-xs tracking-widest"><TrendingUp size={16} className="text-emerald-500" /> Top sản phẩm bán chạy</h3>
          <div className="space-y-4">
            {topSellers.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">{idx + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1"><div className="bg-blue-600 h-full rounded-full" style={{ width: `${(item.revenue / (topSellers[0]?.revenue || 1)) * 100}%` }}></div></div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{item.revenue.toLocaleString()}đ</p>
                  <p className="text-[10px] text-slate-400">{item.qty} bán</p>
                </div>
              </div>
            ))}
            {topSellers.length === 0 && <p className="text-center text-slate-400 py-10 italic text-sm">Chưa có dữ liệu giao dịch trong kỳ</p>}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 uppercase text-xs tracking-widest"><AlertTriangle size={16} className="text-orange-500" /> Cảnh báo tồn kho</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {warningItems.map(item => (
              <div key={item.id} className={`p-3 border rounded-lg flex justify-between items-center group transition-all ${item.stock === 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-sm'}`}>
                <div className="flex items-center gap-3">
                  {item.stock === 0 ? <PackageX size={18} className="text-red-500" /> : <Bell size={18} className="text-orange-500" />}
                  <div>
                    <p className={`text-sm font-bold ${item.stock === 0 ? 'text-red-700' : 'text-slate-800'}`}>{item.prod?.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Mã: {item.prod?.code} | Còn <span className={item.stock === 0 ? 'text-red-600 font-black' : 'text-slate-700 font-black'}>{item.stock} {item.prod?.unit}</span></p>
                  </div>
                </div>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase border ${item.stock === 0 ? 'bg-red-600 text-white border-red-600' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{item.stock === 0 ? 'Hết hàng' : 'Sắp hết'}</span>
              </div>
            ))}
            {warningItems.length === 0 && <div className="p-10 text-center text-slate-400 italic text-sm">Tất cả mặt hàng đều đủ tồn kho an toàn</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Fix: Define StatCardProps
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend: string;
  color: 'blue' | 'emerald' | 'orange' | 'indigo';
  subtitle: string;
  isCurrency?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color, subtitle, isCurrency = true }) => {
  const colorClasses = {
    blue: 'border-blue-100 text-blue-600',
    emerald: 'border-emerald-100 text-emerald-600',
    orange: 'border-orange-100 text-orange-600',
    indigo: 'border-indigo-100 text-indigo-600',
  };
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border-b-4 ${colorClasses[color]} hover:shadow-md transition-all group`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white transition-colors">{icon}</div>
        <span className={`text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1 ${trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>{trend}</span>
      </div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
      <p className="text-xl font-black text-slate-900 mt-1">{isCurrency ? value.toLocaleString() + 'đ' : value.toLocaleString()}</p>
      <p className="text-[10px] text-slate-400 mt-2 font-medium">{subtitle}</p>
    </div>
  );
};

export default StatsSection;
