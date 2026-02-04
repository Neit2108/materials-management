
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppData, ImportRecord, ProductDefinition } from '../types';
import { Search, Filter, Calendar, ListTree, Package, DollarSign, ArrowDownWideNarrow, FileDown, Database, PieChart as PieChartIcon, LayoutGrid, ClipboardList } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  data: AppData;
}

type TimeFilterType = 'all' | 'month' | 'year' | 'range';

const InventorySection: React.FC<Props> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedManuf, setSelectedManuf] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState<'batch' | 'summary'>('batch');

  // Ràng buộc hãng theo loại hàng
  const manufacturersByCat = useMemo(() => {
    if (!selectedCat) return Array.from(new Set(data.manufacturers.map(m => m.name))).sort();
    const cat = data.categories.find(c => c.name === selectedCat);
    if (!cat) return [];
    return data.manufacturers
      .filter(m => m.categoryId === cat.id)
      .map(m => m.name)
      .sort();
  }, [data.manufacturers, data.categories, selectedCat]);

  // Gợi ý tìm kiếm
  const searchSuggestions = useMemo(() => {
    if (!searchTerm) return [];
    const text = searchTerm.toLowerCase();
    const allProducts = data.products;
    return allProducts
      .filter(p => p.code.toLowerCase().includes(text) || p.name.toLowerCase().includes(text))
      .slice(0, 5);
  }, [data.products, searchTerm]);

  const getFilterEndDate = () => {
    if (timeFilter === 'all') return new Date('9999-12-31');
    if (timeFilter === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number);
      return new Date(y, m, 0, 23, 59, 59);
    }
    if (timeFilter === 'year') {
      return new Date(selectedYear, 11, 31, 23, 59, 59);
    }
    if (timeFilter === 'range' && endDate) {
      return new Date(endDate + 'T23:59:59');
    }
    return new Date('9999-12-31');
  };

  const inventorySummary = useMemo(() => {
    const cutOffDate = getFilterEndDate();
    const batchItems = data.imports
      .filter(imp => new Date(imp.date) <= cutOffDate)
      .map(imp => {
        const product = data.products.find(p => p.id === imp.productId);
        const soldQty = data.sales
          .filter(s => s.importRecordId === imp.id && new Date(s.date) <= cutOffDate)
          .reduce((sum, s) => sum + s.quantity, 0);
        const remaining = imp.quantity - soldQty;
        const value = remaining * imp.importPrice;
        return { ...imp, product, remaining, soldQty, value };
      })
      .filter(item => {
        const matchesSearch = !searchTerm || 
          item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          item.product?.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = !selectedCat || item.product?.category === selectedCat;
        const matchesManuf = !selectedManuf || item.product?.manufacturer === selectedManuf;
        return matchesSearch && matchesCat && matchesManuf && item.remaining >= 0;
      });

    const categoryStats: { [key: string]: { name: string, qty: number, value: number, count: number } } = {};
    const templateStats: { [key: string]: { name: string, category: string, manuf: string, unit: string, qty: number, value: number } } = {};

    batchItems.forEach(item => {
      if (!item.product) return;
      const catName = item.product.category || 'Khác';
      if (!categoryStats[catName]) {
        categoryStats[catName] = { name: catName, qty: 0, value: 0, count: 0 };
      }
      categoryStats[catName].qty += item.remaining;
      categoryStats[catName].value += item.value;
      categoryStats[catName].count += 1;

      const tplKey = `${item.product.name}-${item.product.category}-${item.product.manufacturer}`;
      if (!templateStats[tplKey]) {
        templateStats[tplKey] = { 
          name: item.product.name, 
          category: item.product.category, 
          manuf: item.product.manufacturer,
          unit: item.product.unit,
          qty: 0, 
          value: 0 
        };
      }
      templateStats[tplKey].qty += item.remaining;
      templateStats[tplKey].value += item.value;
    });

    const totalValue = batchItems.reduce((sum, item) => sum + item.value, 0);
    const totalItems = batchItems.reduce((sum, item) => sum + item.remaining, 0);
    const categoryChartData = Object.values(categoryStats).map(c => ({ name: c.name, value: c.value }));

    return { 
      batchItems, 
      categoryStats: Object.values(categoryStats).sort((a, b) => b.value - a.value),
      templateStats: Object.values(templateStats).sort((a, b) => b.value - a.value),
      totalValue, 
      totalItems, 
      categoryChartData 
    };
  }, [data, searchTerm, selectedCat, selectedManuf, timeFilter, selectedMonth, selectedYear, endDate]);

  const exportCSV = () => {
    if (inventorySummary.batchItems.length === 0) return alert('Không có dữ liệu');
    let csv = '\uFEFF';
    csv += 'Mã SKU,Tên hàng,Loại hàng,Hãng sản xuất,ĐVT,Năm nhập,Tồn kho,Đơn giá nhập,Giá trị tồn\n';
    inventorySummary.batchItems.forEach(item => {
      const row = [
        item.product?.code || '',
        `"${item.product?.name || ''}"`,
        item.product?.category || '',
        item.product?.manufacturer || '',
        item.product?.unit || '',
        item.year,
        item.remaining,
        item.importPrice,
        item.value
      ].join(',');
      csv += row + '\n';
    });
    csv += `\n,,,,,,TỔNG CỘNG,,${inventorySummary.totalValue}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Ton_kho_chi_tiet_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#475569'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Báo cáo Tồn kho Chi tiết</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={exportCSV}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 transition-all shadow-md"
          >
            <FileDown size={18} /> Xuất Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-blue-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><DollarSign size={12}/> Tổng vốn tồn kho</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{inventorySummary.totalValue.toLocaleString()}đ</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-emerald-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Package size={12}/> Tổng số lượng tồn</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{inventorySummary.totalItems.toLocaleString()}</p>
        </div>
      </div>

      {/* Pie Chart & Quick Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <PieChartIcon size={14} className="text-blue-500" /> Cơ cấu tồn theo Loại
          </h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventorySummary.categoryChartData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {inventorySummary.categoryChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => value.toLocaleString() + 'đ'} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Filter size={14} className="text-blue-500" /> Bộ lọc báo cáo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    setShowSearchSuggestions(true);
                  }}
                  onFocus={() => setShowSearchSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                  placeholder="Gõ mã SKU hoặc tên hàng..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
                {showSearchSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
                    {searchSuggestions.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => {
                          setSearchTerm(p.code);
                          setShowSearchSuggestions(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0"
                      >
                        <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                        <div className="text-[10px] text-blue-600 font-black">Mã: {p.code}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={selectedCat} onChange={e => {
                  setSelectedCat(e.target.value);
                  setSelectedManuf('');
                }} className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none bg-slate-50 focus:ring-2 focus:ring-blue-500">
                  <option value="">Tất cả Loại</option>
                  {data.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <select value={selectedManuf} onChange={e => setSelectedManuf(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none bg-slate-50 focus:ring-2 focus:ring-blue-500">
                  <option value="">{selectedCat ? `Hãng của ${selectedCat}` : 'Tất cả Hãng'}</option>
                  {manufacturersByCat.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Xem tồn kho tại ngày</label>
              <div className="flex bg-white p-1 rounded-lg border border-slate-200 mb-2">
                {(['all', 'month', 'range'] as const).map(f => (
                  <button key={f} onClick={() => setTimeFilter(f)} className={`flex-1 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${timeFilter === f ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                    {f === 'all' ? 'Hiện tại' : f === 'month' ? 'Tháng' : 'Khoảng'}
                  </button>
                ))}
              </div>
              {timeFilter === 'month' && <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />}
              {timeFilter === 'range' && (
                <div className="flex gap-2 items-center">
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-slate-300">-</span>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for different views */}
      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-4">
        <button onClick={() => setViewMode('batch')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${viewMode === 'batch' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
          <LayoutGrid size={16} /> Chi tiết theo Lô hàng
        </button>
        <button onClick={() => setViewMode('summary')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${viewMode === 'summary' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
          <ClipboardList size={16} /> Tổng hợp theo Tên hàng
        </button>
      </div>

      {/* Category Summary Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest"><ListTree size={16} className="text-blue-400" /> Tồn kho theo Loại hàng</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
              <tr>
                <th className="px-6 py-4">Tên loại hàng</th>
                <th className="px-6 py-4 text-center">Số mặt hàng</th>
                <th className="px-6 py-4 text-center">Tổng số lượng</th>
                <th className="px-6 py-4 text-right">Tổng giá trị tồn</th>
                <th className="px-6 py-4 text-center">Tỷ trọng (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventorySummary.categoryStats.map((cat, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{cat.name}</td>
                  <td className="px-6 py-4 text-center text-slate-500">{cat.count}</td>
                  <td className="px-6 py-4 text-center font-medium text-slate-700">{cat.qty.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-black text-blue-700">{cat.value.toLocaleString()}đ</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded">
                      {inventorySummary.totalValue ? Math.round((cat.value / inventorySummary.totalValue) * 100) : 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main View Data */}
      {viewMode === 'summary' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-blue-900 border-b border-blue-800 flex justify-between items-center">
            <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest"><Database size={16} className="text-blue-300" /> Tồn kho theo Tên hàng (Gộp các lô)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
                <tr>
                  <th className="px-6 py-4">Tên mặt hàng</th>
                  <th className="px-6 py-4">Phân loại</th>
                  <th className="px-6 py-4">Hãng SX</th>
                  <th className="px-6 py-4 text-center">ĐVT</th>
                  <th className="px-6 py-4 text-center">Tổng tồn</th>
                  <th className="px-6 py-4 text-right">Tổng giá trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventorySummary.templateStats.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{item.name}</td>
                    <td className="px-6 py-4 text-xs text-blue-600 font-bold uppercase">{item.category}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">{item.manuf}</td>
                    <td className="px-6 py-4 text-center text-slate-500">{item.unit}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-black ${item.qty <= 20 ? 'text-orange-600' : 'text-emerald-600'}`}>{item.qty.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">{item.value.toLocaleString()}đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-widest"><ArrowDownWideNarrow size={16} /> Chi tiết tồn kho theo Lô hàng (FIFO)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
                <tr>
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4">Thông tin</th>
                  <th className="px-6 py-4">Tồn đầu</th>
                  <th className="px-6 py-4">Đã bán</th>
                  <th className="px-6 py-4">Tồn hiện tại</th>
                  <th className="px-6 py-4 text-right">Giá nhập</th>
                  <th className="px-6 py-4 text-right">Giá trị tồn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventorySummary.batchItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{item.product?.name}</span>
                        <span className="text-[10px] font-black text-blue-600">SKU: {item.product?.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{item.product?.category}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{item.product?.manufacturer} | Lô {item.year}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{item.quantity}</td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{item.soldQty}</td>
                    <td className="px-6 py-4">
                      <span className={`font-black ${item.remaining === 0 ? 'text-red-500' : item.remaining <= 10 ? 'text-orange-500' : 'text-emerald-600'}`}>
                        {item.remaining} {item.product?.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600">{item.importPrice.toLocaleString()}đ</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900 bg-slate-50/30 group-hover:bg-blue-50/50">{item.value.toLocaleString()}đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventorySection;
