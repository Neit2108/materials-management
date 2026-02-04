
import React, { useState, useMemo } from 'react';
import { AppData, ProductDefinition, ProductTemplate, Category } from '../types';
import { backupData, restoreData, generateId } from '../utils/storage';
import { Plus, Save, Download, Upload, Trash2, Database, Tag, Box, ListTree, Layers, Edit2, Check, X, Search, Filter, ArrowRight } from 'lucide-react';

interface Props {
  data: AppData;
  updateData: (data: AppData) => void;
}

const AdminSection: React.FC<Props> = ({ data, updateData }) => {
  const [activeSubTab, setActiveSubTab] = useState<'master' | 'templates' | 'products'>('master');

  // --- Master Data State ---
  const [newCatName, setNewCatName] = useState('');
  const [newUnitName, setNewUnitName] = useState('');
  const [newManufName, setNewManufName] = useState('');
  const [manufCatId, setManufCatId] = useState('');
  
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitName, setEditingUnitName] = useState('');
  const [editingManufId, setEditingManufId] = useState<string | null>(null);
  const [editingManufName, setEditingManufName] = useState('');
  const [editingManufCatId, setEditingManufCatId] = useState('');

  const [manufSearch, setManufSearch] = useState('');

  // --- Templates State ---
  const [newTpl, setNewTpl] = useState({ name: '', categoryId: '', manufacturerId: '', unitId: '' });
  const [editingTplId, setEditingTplId] = useState<string | null>(null);
  const [editingTplData, setEditingTplData] = useState({ name: '', categoryId: '', manufacturerId: '', unitId: '' });
  const [tplFilterCatId, setTplFilterCatId] = useState('');
  const [showTplSuggestions, setShowTplSuggestions] = useState(false);

  // --- SKU State ---
  const [newSkuCode, setNewSkuCode] = useState('');
  const [skuTplId, setSkuTplId] = useState('');
  const [editingSkuId, setEditingSkuId] = useState<string | null>(null);
  const [editingSkuCode, setEditingSkuCode] = useState('');
  const [editingSkuTplId, setEditingSkuTplId] = useState('');

  // Lọc hãng theo loại khi tạo Template
  const manufacturersForTpl = useMemo(() => 
    data.manufacturers.filter(m => m.categoryId === newTpl.categoryId),
    [data.manufacturers, newTpl.categoryId]
  );

  const manufacturersForEditingTpl = useMemo(() => 
    data.manufacturers.filter(m => m.categoryId === editingTplData.categoryId),
    [data.manufacturers, editingTplData.categoryId]
  );

  // Nhóm Hãng theo Loại để hiển thị trong Master Data
  const groupedManufacturers = useMemo(() => {
    const groups: { [catId: string]: { catName: string, items: any[] } } = {};
    
    data.manufacturers.forEach(m => {
      if (!groups[m.categoryId]) {
        const cat = data.categories.find(c => c.id === m.categoryId);
        groups[m.categoryId] = { catName: cat?.name || 'Chưa phân loại', items: [] };
      }
      if (!manufSearch || m.name.toLowerCase().includes(manufSearch.toLowerCase())) {
        groups[m.categoryId].items.push(m);
      }
    });

    return Object.entries(groups).filter(([_, group]) => group.items.length > 0);
  }, [data.manufacturers, data.categories, manufSearch]);

  const tplSuggestions = useMemo(() => {
    const text = (editingTplId ? editingTplData.name : newTpl.name).toLowerCase();
    if (!text) return [];
    return Array.from(new Set(data.productTemplates
      .map(t => t.name)
      .filter(name => name.toLowerCase().includes(text))))
      .slice(0, 5);
  }, [data.productTemplates, newTpl.name, editingTplData.name, editingTplId]);

  const filteredTemplates = useMemo(() => {
    if (!tplFilterCatId) return data.productTemplates;
    return data.productTemplates.filter(t => t.categoryId === tplFilterCatId);
  }, [data.productTemplates, tplFilterCatId]);

  // Actions
  const addCategory = () => {
    if (!newCatName.trim()) return;
    updateData({ ...data, categories: [...data.categories, { id: generateId(), name: newCatName.trim() }] });
    setNewCatName('');
  };

  const addUnit = () => {
    if (!newUnitName.trim()) return;
    updateData({ ...data, units: [...data.units, { id: generateId(), name: newUnitName.trim() }] });
    setNewUnitName('');
  };

  const addManufacturer = () => {
    if (!newManufName.trim() || !manufCatId) return alert('Vui lòng nhập tên hãng và chọn Loại hàng liên kết');
    updateData({
      ...data,
      manufacturers: [...data.manufacturers, { id: generateId(), name: newManufName.trim(), categoryId: manufCatId }]
    });
    setNewManufName('');
  };

  const saveCategory = () => {
    if (!editingCatId || !editingCatName.trim()) return;
    const oldName = data.categories.find(c => c.id === editingCatId)?.name;
    const newName = editingCatName.trim();
    const newData = { ...data };
    newData.categories = data.categories.map(c => c.id === editingCatId ? { ...c, name: newName } : c);
    newData.productTemplates = newData.productTemplates.map(t => t.categoryId === editingCatId ? { ...t, categoryName: newName } : t);
    newData.products = newData.products.map(p => p.category === oldName ? { ...p, category: newName } : p);
    updateData(newData);
    setEditingCatId(null);
  };

  const saveUnit = () => {
    if (!editingUnitId || !editingUnitName.trim()) return;
    const oldName = data.units.find(u => u.id === editingUnitId)?.name;
    const newName = editingUnitName.trim();
    const newData = { ...data };
    newData.units = data.units.map(u => u.id === editingUnitId ? { ...u, name: newName } : u);
    newData.productTemplates = newData.productTemplates.map(t => t.unitId === editingUnitId ? { ...t, unitName: newName } : t);
    newData.products = newData.products.map(p => p.unit === oldName ? { ...p, unit: newName } : p);
    updateData(newData);
    setEditingUnitId(null);
  };

  const saveManufacturer = () => {
    if (!editingManufId || !editingManufName.trim() || !editingManufCatId) return;
    const oldName = data.manufacturers.find(m => m.id === editingManufId)?.name;
    const newName = editingManufName.trim();
    const newData = { ...data };
    newData.manufacturers = data.manufacturers.map(m => m.id === editingManufId ? { ...m, name: newName, categoryId: editingManufCatId } : m);
    newData.productTemplates = newData.productTemplates.map(t => t.manufacturerId === editingManufId ? { ...t, manufacturerName: newName } : t);
    newData.products = newData.products.map(p => p.manufacturer === oldName ? { ...p, manufacturer: newName } : p);
    updateData(newData);
    setEditingManufId(null);
  };

  const addTemplate = () => {
    const { name, categoryId, manufacturerId, unitId } = newTpl;
    if (!name.trim() || !categoryId || !manufacturerId || !unitId) return alert('Vui lòng điền đủ tên hàng và các ràng buộc (Loại/Hãng/ĐVT)');
    const cat = data.categories.find(c => c.id === categoryId);
    const man = data.manufacturers.find(m => m.id === manufacturerId);
    const uni = data.units.find(u => u.id === unitId);
    const template: ProductTemplate = {
      id: generateId(),
      name: name.trim(),
      categoryId,
      manufacturerId,
      unitId,
      categoryName: cat?.name || '',
      manufacturerName: man?.name || '',
      unitName: uni?.name || ''
    };
    updateData({ ...data, productTemplates: [...data.productTemplates, template] });
    setNewTpl({ name: '', categoryId: '', manufacturerId: '', unitId: '' });
  };

  const saveTemplate = () => {
    if (!editingTplId || !editingTplData.name.trim() || !editingTplData.categoryId || !editingTplData.manufacturerId || !editingTplData.unitId) return;
    const cat = data.categories.find(c => c.id === editingTplData.categoryId);
    const man = data.manufacturers.find(m => m.id === editingTplData.manufacturerId);
    const uni = data.units.find(u => u.id === editingTplData.unitId);
    const newData = { ...data };
    newData.productTemplates = data.productTemplates.map(t => t.id === editingTplId ? {
      ...t,
      name: editingTplData.name.trim(),
      categoryId: editingTplData.categoryId,
      manufacturerId: editingTplData.manufacturerId,
      unitId: editingTplData.unitId,
      categoryName: cat?.name || '',
      manufacturerName: man?.name || '',
      unitName: uni?.name || ''
    } : t);
    newData.products = newData.products.map(p => p.templateId === editingTplId ? {
      ...p,
      name: editingTplData.name.trim(),
      category: cat?.name || '',
      manufacturer: man?.name || '',
      unit: uni?.name || ''
    } : p);
    updateData(newData);
    setEditingTplId(null);
  };

  const addSku = () => {
    if (!newSkuCode.trim() || !skuTplId) return alert('Vui lòng nhập mã hàng và chọn tên hàng');
    if (data.products.some(p => p.code === newSkuCode.toUpperCase())) return alert('Mã hàng đã tồn tại');
    const tpl = data.productTemplates.find(t => t.id === skuTplId);
    if (!tpl) return;
    const product: ProductDefinition = {
      id: generateId(),
      code: newSkuCode.toUpperCase(),
      templateId: tpl.id,
      name: tpl.name,
      category: tpl.categoryName,
      manufacturer: tpl.manufacturerName,
      unit: tpl.unitName
    };
    updateData({ ...data, products: [...data.products, product] });
    setNewSkuCode('');
    setSkuTplId('');
  };

  const saveSku = () => {
    if (!editingSkuId || !editingSkuCode.trim() || !editingSkuTplId) return;
    const upperCode = editingSkuCode.toUpperCase();
    if (data.products.some(p => p.code === upperCode && p.id !== editingSkuId)) return alert('Mã hàng đã tồn tại');
    const tpl = data.productTemplates.find(t => t.id === editingSkuTplId);
    if (!tpl) return;
    const newData = { ...data };
    newData.products = data.products.map(p => p.id === editingSkuId ? {
      ...p,
      code: upperCode,
      templateId: tpl.id,
      name: tpl.name,
      category: tpl.categoryName,
      manufacturer: tpl.manufacturerName,
      unit: tpl.unitName
    } : p);
    updateData(newData);
    setEditingSkuId(null);
  };

  const deleteItem = (type: 'cat' | 'man' | 'unit' | 'tpl' | 'prod', id: string) => {
    if (!confirm('Xóa dữ liệu này? Các dữ liệu liên kết (nhập hàng, bán hàng) có thể bị ảnh hưởng.')) return;
    const newData = { ...data };
    if (type === 'cat') newData.categories = data.categories.filter(c => c.id !== id);
    if (type === 'man') newData.manufacturers = data.manufacturers.filter(m => m.id !== id);
    if (type === 'unit') newData.units = data.units.filter(u => u.id !== id);
    if (type === 'tpl') newData.productTemplates = data.productTemplates.filter(t => t.id !== id);
    if (type === 'prod') newData.products = data.products.filter(p => p.id !== id);
    updateData(newData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Quản trị Hệ thống</h2>
        <div className="flex gap-2">
          <button onClick={() => backupData(data)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 shadow-sm transition-all text-sm font-bold"><Download size={18} /> Sao lưu</button>
          <label className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 shadow-sm cursor-pointer transition-all text-sm font-bold">
            <Upload size={18} /> Khôi phục
            <input type="file" className="hidden" accept=".zip" onChange={async (e) => {
              if (e.target.files?.[0]) {
                const res = await restoreData(e.target.files[0]);
                if (res) updateData(res);
              }
            }} />
          </label>
        </div>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto bg-white rounded-t-2xl px-2">
        <button onClick={() => setActiveSubTab('master')} className={`px-6 py-4 font-bold text-xs tracking-widest transition-all ${activeSubTab === 'master' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-slate-400'}`}>1. DỮ LIỆU GỐC</button>
        <button onClick={() => setActiveSubTab('templates')} className={`px-6 py-4 font-bold text-xs tracking-widest transition-all ${activeSubTab === 'templates' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-slate-400'}`}>2. TÊN HÀNG</button>
        <button onClick={() => setActiveSubTab('products')} className={`px-6 py-4 font-bold text-xs tracking-widest transition-all ${activeSubTab === 'products' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-slate-400'}`}>3. MÃ HÀNG (SKU)</button>
      </div>

      <div className="bg-white p-6 rounded-b-2xl border border-t-0 border-slate-200 shadow-sm min-h-[600px]">
        {activeSubTab === 'master' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Categories column */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2 uppercase text-[10px] tracking-widest bg-slate-100 p-3 rounded-lg"><ListTree size={14} className="text-blue-600"/> 1. Loại hàng</h3>
              <div className="flex gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 shadow-inner">
                <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Tên loại..." className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                <button onClick={addCategory} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Plus size={18} /></button>
              </div>
              <div className="divide-y border border-slate-100 rounded-xl max-h-[400px] overflow-y-auto custom-scrollbar shadow-sm bg-white">
                {data.categories.map(c => (
                  <div key={c.id} className="p-3 hover:bg-slate-50 group">
                    {editingCatId === c.id ? (
                      <div className="flex gap-2">
                        <input value={editingCatName} onChange={e => setEditingCatName(e.target.value)} className="flex-1 border border-blue-300 rounded-lg p-1.5 text-sm outline-none" />
                        <button onClick={saveCategory} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded-lg"><Check size={16}/></button>
                        <button onClick={() => setEditingCatId(null)} className="text-red-500 hover:bg-red-50 p-1 rounded-lg"><X size={16}/></button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-slate-700">{c.name}</span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingCatId(c.id); setEditingCatName(c.name); }} className="text-slate-400 hover:text-blue-600"><Edit2 size={14} /></button>
                          <button onClick={() => deleteItem('cat', c.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Manufacturers column - Strictly linked to Categories */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2 uppercase text-[10px] tracking-widest bg-slate-100 p-3 rounded-lg"><Database size={14} className="text-indigo-600"/> 2. Hãng SX (Liên kết Loại)</h3>
              <div className="space-y-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 shadow-inner">
                <select value={manufCatId} onChange={e => setManufCatId(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none bg-white">
                  <option value="">-- Thuộc Loại hàng nào? --</option>
                  {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <input value={newManufName} onChange={e => setNewManufName(e.target.value)} placeholder="Tên hãng..." className="flex-1 border border-slate-300 rounded-lg p-2 text-sm outline-none bg-white" />
                  <button onClick={addManufacturer} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700"><Plus size={18} /></button>
                </div>
              </div>

              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  value={manufSearch}
                  onChange={e => setManufSearch(e.target.value)}
                  placeholder="Lọc tên hãng..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-[10px] outline-none bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="divide-y border border-slate-100 rounded-xl max-h-[350px] overflow-y-auto custom-scrollbar shadow-sm bg-white">
                {groupedManufacturers.map(([catId, group]) => (
                  <div key={catId} className="bg-white">
                    <div className="bg-slate-50 px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100">
                      {group.catName}
                    </div>
                    {group.items.map(m => (
                      <div key={m.id} className="p-3 hover:bg-slate-50 group border-b border-slate-50 last:border-0">
                        {editingManufId === m.id ? (
                          <div className="space-y-2">
                            <select value={editingManufCatId} onChange={e => setEditingManufCatId(e.target.value)} className="w-full border border-blue-300 rounded-lg p-1.5 text-[10px] outline-none">
                              {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <div className="flex gap-2">
                              <input value={editingManufName} onChange={e => setEditingManufName(e.target.value)} className="flex-1 border border-blue-300 rounded-lg p-1.5 text-sm outline-none" />
                              <button onClick={saveManufacturer} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg"><Check size={16}/></button>
                              <button onClick={() => setEditingManufId(null)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><X size={16}/></button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-slate-700">{m.name}</span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingManufId(m.id); setEditingManufName(m.name); setEditingManufCatId(m.categoryId); }} className="text-slate-400 hover:text-blue-600"><Edit2 size={14} /></button>
                              <button onClick={() => deleteItem('man', m.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Units column */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2 uppercase text-[10px] tracking-widest bg-slate-100 p-3 rounded-lg"><Tag size={14} className="text-emerald-600"/> 3. Đơn vị tính</h3>
              <div className="flex gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 shadow-inner">
                <input value={newUnitName} onChange={e => setNewUnitName(e.target.value)} placeholder="Tên ĐVT..." className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={addUnit} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Plus size={18} /></button>
              </div>
              <div className="divide-y border border-slate-100 rounded-xl max-h-[400px] overflow-y-auto custom-scrollbar shadow-sm bg-white">
                {data.units.map(u => (
                  <div key={u.id} className="p-3 hover:bg-slate-50 group">
                    {editingUnitId === u.id ? (
                      <div className="flex gap-2">
                        <input value={editingUnitName} onChange={e => setEditingUnitName(e.target.value)} className="flex-1 border border-blue-300 rounded-lg p-1.5 text-sm outline-none" />
                        <button onClick={saveUnit} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg"><Check size={16}/></button>
                        <button onClick={() => setEditingUnitId(null)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><X size={16}/></button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-slate-700">{u.name}</span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingUnitId(u.id); setEditingUnitName(u.name); }} className="text-slate-400 hover:text-blue-600"><Edit2 size={14} /></button>
                          <button onClick={() => deleteItem('unit', u.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'templates' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-inner">
              <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3 uppercase text-xs tracking-widest">
                <Layers className="text-blue-600" size={20} /> 
                {editingTplId ? "Cập nhật Tên hàng" : "Thiết lập Tên hàng mới"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                <div className="relative">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Tên sản phẩm</label>
                  <input 
                    value={editingTplId ? editingTplData.name : newTpl.name} 
                    onChange={e => {
                      const val = e.target.value;
                      if (editingTplId) setEditingTplData({...editingTplData, name: val});
                      else setNewTpl({...newTpl, name: val});
                      setShowTplSuggestions(true);
                    }} 
                    onFocus={() => setShowTplSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowTplSuggestions(false), 200)}
                    placeholder="VD: Ống nhựa PPR 25" 
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold" 
                  />
                  {showTplSuggestions && tplSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                      {tplSuggestions.map((s, idx) => (
                        <button 
                          key={idx}
                          onClick={() => {
                            if (editingTplId) setEditingTplData({...editingTplData, name: s});
                            else setNewTpl({...newTpl, name: s});
                            setShowTplSuggestions(false);
                          }}
                          className="w-full px-4 py-3 text-left text-xs hover:bg-blue-50 text-slate-700 font-bold border-b border-slate-50 last:border-0"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Loại hàng</label>
                  <select 
                    value={editingTplId ? editingTplData.categoryId : newTpl.categoryId} 
                    onChange={e => editingTplId ? setEditingTplData({...editingTplData, categoryId: e.target.value, manufacturerId: ''}) : setNewTpl({...newTpl, categoryId: e.target.value, manufacturerId: ''})} 
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                  >
                    <option value="">-- Chọn Loại --</option>
                    {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Hãng sản xuất</label>
                  <select 
                    value={editingTplId ? editingTplData.manufacturerId : newTpl.manufacturerId} 
                    onChange={e => editingTplId ? setEditingTplData({...editingTplData, manufacturerId: e.target.value}) : setNewTpl({...newTpl, manufacturerId: e.target.value})} 
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium disabled:bg-slate-100 disabled:text-slate-400" 
                    disabled={editingTplId ? !editingTplData.categoryId : !newTpl.categoryId}
                  >
                    <option value="">-- Chọn Hãng (Theo Loại) --</option>
                    {(editingTplId ? manufacturersForEditingTpl : manufacturersForTpl).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Đơn vị tính</label>
                  <select 
                    value={editingTplId ? editingTplData.unitId : newTpl.unitId} 
                    onChange={e => editingTplId ? setEditingTplData({...editingTplData, unitId: e.target.value}) : setNewTpl({...newTpl, unitId: e.target.value})} 
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                  >
                    <option value="">-- Chọn ĐVT --</option>
                    {data.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                {editingTplId ? (
                  <>
                    <button onClick={saveTemplate} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center gap-2 uppercase text-xs">
                      <Save size={18} /> Cập nhật thay đổi
                    </button>
                    <button onClick={() => setEditingTplId(null)} className="bg-white border border-slate-300 text-slate-600 px-10 py-4 rounded-2xl font-black hover:bg-slate-50 transition-all text-xs uppercase">
                      Hủy bỏ
                    </button>
                  </>
                ) : (
                  <button onClick={addTemplate} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center gap-2 uppercase text-xs">
                    <Save size={18} /> Lưu tên mặt hàng
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-2">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Filter size={16} className="text-blue-500" /> Danh sách Tên hàng chuẩn hóa
                </h3>
                <div className="w-full md:w-72">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <select 
                      value={tplFilterCatId} 
                      onChange={e => setTplFilterCatId(e.target.value)} 
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs outline-none bg-slate-50 focus:bg-white font-bold"
                    >
                      <option value="">Lọc theo tất cả loại hàng</option>
                      {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black">
                    <tr>
                      <th className="px-6 py-4">Tên hàng</th>
                      <th className="px-6 py-4">Mối liên kết (Loại & Hãng)</th>
                      <th className="px-6 py-4 text-center">ĐVT</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTemplates.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 group transition-colors">
                        <td className="px-6 py-4 font-black text-slate-800">{t.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold">
                            <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase">{t.categoryName}</span>
                            <ArrowRight size={10} className="text-slate-300" />
                            <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase">{t.manufacturerName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-500 font-medium">{t.unitName}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingTplId(t.id); setEditingTplData({ name: t.name, categoryId: t.categoryId, manufacturerId: t.manufacturerId, unitId: t.unitId }); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                            <button onClick={() => deleteItem('tpl', t.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredTemplates.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Chưa có tên hàng nào. Vui lòng khai báo ở trên.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl">
              <h3 className="font-black mb-6 flex items-center gap-3 uppercase text-xs tracking-widest text-blue-400">
                <Box size={20} /> 
                {editingSkuId ? "Sửa Mã định danh SKU" : "Phát hành Mã hàng SKU mới"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Mã SKU duy nhất</label>
                  <input 
                    value={editingSkuId ? editingSkuCode : newSkuCode} 
                    onChange={e => editingSkuId ? setEditingSkuCode(e.target.value) : setNewSkuCode(e.target.value)} 
                    placeholder="VD: PPR-25-TIENPHONG" 
                    className="w-full bg-white/10 border border-white/10 rounded-xl p-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 uppercase font-black text-white placeholder:text-slate-500" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Liên kết Tên hàng & Quy cách</label>
                  <select 
                    value={editingSkuId ? editingSkuTplId : skuTplId} 
                    onChange={e => editingSkuId ? setEditingSkuTplId(e.target.value) : setSkuTplId(e.target.value)} 
                    className="w-full bg-white/10 border border-white/10 rounded-xl p-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-white"
                  >
                    <option value="" className="text-slate-900">-- Chọn tên hàng để gán mã --</option>
                    {data.productTemplates.map(t => (
                      <option key={t.id} value={t.id} className="text-slate-900">{t.name} ({t.manufacturerName} - {t.unitName})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                {editingSkuId ? (
                  <>
                    <button onClick={saveSku} className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-900/40 transition-all uppercase text-xs">
                      Xác nhận thay đổi
                    </button>
                    <button onClick={() => setEditingSkuId(null)} className="bg-white/10 text-white px-12 py-4 rounded-2xl font-black hover:bg-white/20 transition-all uppercase text-xs">
                      Hủy bỏ
                    </button>
                  </>
                ) : (
                  <button onClick={addSku} className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-900/40 transition-all uppercase text-xs">
                    Phát hành SKU
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.products.map(p => (
                <div key={p.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                    <button onClick={() => { setEditingSkuId(p.id); setEditingSkuCode(p.code); setEditingSkuTplId(p.templateId); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => deleteItem('prod', p.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={14} /></button>
                  </div>
                  <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4 bg-blue-50 px-3 py-1.5 rounded-full inline-block">
                    SKU: {p.code}
                  </div>
                  <h4 className="font-black text-slate-800 text-lg mb-2 leading-tight">{p.name}</h4>
                  <div className="space-y-2 pt-4 border-t border-slate-50">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase">Phân loại:</span>
                      <span className="text-slate-700 font-black">{p.category}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase">Thương hiệu:</span>
                      <span className="text-indigo-600 font-black uppercase">{p.manufacturer}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase">Đơn vị:</span>
                      <span className="text-slate-700 font-black">{p.unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSection;
