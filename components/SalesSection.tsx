
import React, { useState, useMemo } from 'react';
import { AppData, SaleRecord, ImportRecord, ProductDefinition } from '../types';
import { Search, ShoppingCart, AlertTriangle, TrendingUp, X, Bell, Database } from 'lucide-react';

interface Props {
  data: AppData;
  updateData: (data: AppData) => void;
}

// Define interface for inventory items that include joined product and stock info
interface InventoryItem extends ImportRecord {
  product?: ProductDefinition;
  stock: number;
  soldQty: number;
}

const SalesSection: React.FC<Props> = ({ data, updateData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  // Use InventoryItem type to include stock and product info
  const [sellingItem, setSellingItem] = useState<InventoryItem | null>(null);
  const [saleQty, setSaleQty] = useState(1);
  const [overridePrice, setOverridePrice] = useState<number | null>(null);

  // Calculate inventory status for each import batch
  const inventoryList = useMemo(() => {
    return data.imports.map(imp => {
      const product = data.products.find(p => p.id === imp.productId);
      const soldQty = data.sales
        .filter(s => s.importRecordId === imp.id)
        .reduce((sum, s) => sum + s.quantity, 0);
      const stock = imp.quantity - soldQty;
      return {
        ...imp,
        product,
        stock,
        soldQty
      } as InventoryItem;
    });
  }, [data.imports, data.sales, data.products]);

  // Unique manufacturers for the filter, constrained by category
  const availableManufacturers = useMemo(() => {
    let filtered = data.manufacturers;
    if (selectedCategory) {
      const cat = data.categories.find(c => c.name === selectedCategory);
      if (cat) {
        filtered = data.manufacturers.filter(m => m.categoryId === cat.id);
      }
    }
    const set = new Set<string>();
    filtered.forEach(m => set.add(m.name));
    return Array.from(set).sort();
  }, [data.manufacturers, data.categories, selectedCategory]);

  const filteredInventory = inventoryList.filter(item => {
    const matchesSearch = 
      item.product?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product?.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCat = !selectedCategory || item.product?.category === selectedCategory;
    const matchesManuf = !selectedManufacturer || item.product?.manufacturer === selectedManufacturer;
    
    return matchesSearch && matchesCat && matchesManuf && item.stock > 0;
  });

  const handleSale = () => {
    if (!sellingItem) return;
    if (saleQty > sellingItem.stock) {
      alert('Số lượng bán vượt quá tồn kho!');
      return;
    }

    const sale: SaleRecord = {
      id: crypto.randomUUID(),
      productId: sellingItem.productId,
      importRecordId: sellingItem.id,
      quantity: saleQty,
      price: overridePrice ?? sellingItem.sellingPrice,
      date: new Date().toISOString()
    };

    updateData({
      ...data,
      sales: [...data.sales, sale]
    });

    setSellingItem(null);
    setSaleQty(1);
    setOverridePrice(null);
    alert('Bán hàng thành công!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Quản lý Bán hàng</h2>
        <div className="flex flex-col md:flex-row w-full xl:w-auto gap-2">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
              placeholder="Mã SKU, tên hàng..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            {/* Category Filter */}
            <select 
              className="flex-1 md:w-48 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setSelectedManufacturer(''); // Reset manufacturer when category changes
              }}
            >
              <option value="">Tất cả loại</option>
              {data.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>

            {/* Manufacturer Filter - Constrained by Category */}
            <select 
              className="flex-1 md:w-48 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              value={selectedManufacturer}
              onChange={e => setSelectedManufacturer(e.target.value)}
            >
              <option value="">{selectedCategory ? `Hãng của ${selectedCategory}` : 'Tất cả hãng SX'}</option>
              {availableManufacturers.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInventory.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group hover:shadow-md transition-shadow relative">
            {item.stock <= 20 && (
              <div className="absolute top-2 right-2 z-10 animate-pulse">
                <Bell size={18} className="text-orange-500" />
              </div>
            )}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full mb-1 inline-block uppercase tracking-widest">
                  {item.product?.category}
                </span>
                <h3 className="font-bold text-slate-800 text-base leading-tight mt-1">{item.product?.name}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1">Mã: {item.product?.code} | Lô {item.year}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-emerald-600">{item.sellingPrice.toLocaleString()}đ</span>
              </div>
            </div>
            
            <div className="p-4 flex-1 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 flex items-center gap-1"><Database size={12} /> Hãng SX:</span>
                <span className="font-bold text-slate-700">{item.product?.manufacturer}</span>
              </div>
              <div className="flex justify-between items-end pt-2 border-t border-slate-50">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Tồn thực tế</p>
                  <p className={`text-sm font-black flex items-center gap-1 ${item.stock <= 20 ? 'text-orange-600' : 'text-slate-700'}`}>
                    {item.stock} {item.product?.unit}
                    {item.stock <= 20 && <span className="text-[9px] bg-orange-100 px-1 rounded uppercase font-black">Sắp hết</span>}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setSellingItem(item);
                    setOverridePrice(item.sellingPrice);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-all active:scale-95 shadow-sm text-sm font-bold"
                >
                  <ShoppingCart size={16} /> Bán hàng
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredInventory.length === 0 && (
          <div className="col-span-full py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-center">
            <AlertTriangle className="mx-auto text-slate-300 mb-2" size={48} />
            <p className="text-slate-400 italic">Không tìm thấy mặt hàng phù hợp hoặc hết hàng</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedManufacturer('');
              }}
              className="mt-4 text-blue-600 text-sm font-bold hover:underline"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Sale Modal */}
      {sellingItem && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Xác nhận bán hàng</h3>
                <p className="text-slate-400 text-sm">{sellingItem.product?.name} ({sellingItem.product?.code})</p>
              </div>
              <button onClick={() => setSellingItem(null)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Số lượng bán (Tối đa {sellingItem.stock} {sellingItem.product?.unit})</label>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSaleQty(Math.max(1, saleQty - 1))}
                    className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-xl font-bold hover:bg-slate-50 transition-colors"
                  >-</button>
                  <input 
                    type="number"
                    className="flex-1 text-center text-xl font-bold border-b-2 border-slate-200 py-2 outline-none focus:border-blue-500"
                    value={saleQty}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (val > 0) setSaleQty(val);
                    }}
                  />
                  <button 
                    onClick={() => setSaleQty(Math.min(sellingItem.stock, saleQty + 1))}
                    className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-xl font-bold hover:bg-slate-50 transition-colors"
                  >+</button>
                </div>
              </div>

              {sellingItem.stock <= 20 && (
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 text-orange-800 text-xs flex items-center gap-2">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  <span>Chú ý: Mặt hàng này đang sắp hết (còn {sellingItem.stock} {sellingItem.product?.unit}).</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Đơn giá bán hiện tại (đ)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">đ</span>
                  <input 
                    type="number"
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-lg font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={overridePrice || 0}
                    onChange={e => setOverridePrice(Number(e.target.value))}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic">* Hệ thống cho phép cập nhật lại giá bán tại thời điểm hiện tại.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500 font-medium">Tổng cộng</span>
                  <span className="text-slate-400 text-xs">SL {saleQty} x { (overridePrice || 0).toLocaleString()}đ</span>
                </div>
                <div className="text-2xl font-black text-slate-900 text-right">
                  {(saleQty * (overridePrice || 0)).toLocaleString()}đ
                </div>
              </div>

              <button 
                onClick={handleSale}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <TrendingUp size={20} />
                XUẤT HÀNG & GHI SỔ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesSection;
