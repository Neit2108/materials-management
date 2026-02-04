
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppData, ImportRecord, ProductDefinition } from '../types';
import { PackageOpen, Camera, Save, ListChecks, Edit2, Trash2, X, Search, CheckCircle2 } from 'lucide-react';

interface Props {
  data: AppData;
  updateData: (data: AppData) => void;
}

const ImportSection: React.FC<Props> = ({ data, updateData }) => {
  const [selectedProductCode, setSelectedProductCode] = useState('');
  const [skuSearchText, setSkuSearchText] = useState('');
  const [showSkuSuggestions, setShowSkuSuggestions] = useState(false);
  const [formData, setFormData] = useState<Partial<ImportRecord>>({
    quantity: 0,
    importPrice: 0,
    sellingPrice: 0,
    year: new Date().getFullYear(),
    invoiceNumber: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<ImportRecord | null>(null);

  const selectedProduct = useMemo(() => 
    data.products.find(p => p.code === selectedProductCode),
    [data.products, selectedProductCode]
  );

  const skuSuggestions = useMemo(() => {
    if (!skuSearchText) return [];
    const text = skuSearchText.toLowerCase();
    return data.products.filter(p => 
      p.code.toLowerCase().includes(text) || 
      p.name.toLowerCase().includes(text)
    ).slice(0, 8);
  }, [data.products, skuSearchText]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!selectedProduct || !formData.quantity || !formData.importPrice || !formData.sellingPrice || !formData.invoiceNumber) {
      alert('Vui lòng điền đầy đủ các trường thông tin bắt buộc');
      return;
    }

    const newRecord: ImportRecord = {
      id: crypto.randomUUID(),
      productId: selectedProduct.id,
      quantity: Number(formData.quantity),
      importPrice: Number(formData.importPrice),
      sellingPrice: Number(formData.sellingPrice),
      year: Number(formData.year),
      invoiceNumber: String(formData.invoiceNumber),
      invoiceImage: imagePreview || undefined,
      date: new Date().toISOString(),
    };

    updateData({
      ...data,
      imports: [newRecord, ...data.imports]
    });

    // Reset form
    setSelectedProductCode('');
    setSkuSearchText('');
    setFormData({
      quantity: 0,
      importPrice: 0,
      sellingPrice: 0,
      year: new Date().getFullYear(),
      invoiceNumber: '',
    });
    setImagePreview(null);
    alert('Nhập hàng thành công!');
  };

  const startEdit = (record: ImportRecord) => {
    setEditingRecord(record);
  };

  const saveEdit = () => {
    if (!editingRecord) return;
    updateData({
      ...data,
      imports: data.imports.map(r => r.id === editingRecord.id ? editingRecord : r)
    });
    setEditingRecord(null);
    alert('Cập nhật bản ghi thành công!');
  };

  const deleteRecord = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bản ghi nhập hàng này? Điều này sẽ ảnh hưởng đến tồn kho.')) {
      updateData({
        ...data,
        imports: data.imports.filter(r => r.id !== id)
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Quản lý Nhập hàng</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <PackageOpen size={18} className="text-blue-600" /> Chọn mặt hàng nhập
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="relative">
                <label className="block text-sm font-medium text-slate-600 mb-1">Tìm kiếm Mã hàng hoặc Tên hàng</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text"
                    className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Gõ mã SKU hoặc tên hàng để tìm..."
                    value={skuSearchText || selectedProduct?.code || ''}
                    onChange={e => {
                      setSkuSearchText(e.target.value);
                      setShowSkuSuggestions(true);
                      if (!e.target.value) setSelectedProductCode('');
                    }}
                    onFocus={() => setShowSkuSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSkuSuggestions(false), 200)}
                  />
                  {showSkuSuggestions && skuSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                      {skuSuggestions.map(p => (
                        <button 
                          key={p.id}
                          onClick={() => {
                            setSelectedProductCode(p.code);
                            setSkuSearchText(p.code);
                            setShowSkuSuggestions(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-slate-50 last:border-0 transition-colors"
                        >
                          <div className="font-black text-blue-700 text-sm">[{p.code}]</div>
                          <div className="text-xs text-slate-600 font-bold">{p.name}</div>
                          <div className="text-[10px] text-slate-400 uppercase">{p.category} | {p.manufacturer}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-400 italic">* Hệ thống sẽ gợi ý các mặt hàng khớp với từ khóa của bạn.</p>
              </div>
              
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center min-h-[100px]">
                {selectedProduct ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="col-span-2 flex items-center gap-2 text-blue-700 font-bold mb-1">
                      <CheckCircle2 size={16} /> Thông tin mặt hàng:
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs uppercase font-bold">Loại hàng</span>
                      <span className="text-slate-800 font-medium">{selectedProduct.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs uppercase font-bold">Hãng sản xuất</span>
                      <span className="text-slate-800 font-medium">{selectedProduct.manufacturer}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-xs uppercase font-bold">Tên hàng & ĐVT</span>
                      <span className="text-slate-800 font-medium">{selectedProduct.name} ({selectedProduct.unit})</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-sm text-slate-400 italic">Vui lòng tìm và chọn mặt hàng</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Số lượng nhập</label>
                <div className="relative">
                  <input 
                    type="number"
                    className="w-full border border-slate-300 rounded-lg p-2.5 pr-12 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{selectedProduct?.unit || '-'}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Đơn giá nhập (đ)</label>
                <input 
                  type="number"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.importPrice}
                  onChange={e => setFormData({...formData, importPrice: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Đơn giá bán dự kiến (đ)</label>
                <input 
                  type="number"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.sellingPrice}
                  onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <ListChecks size={18} className="text-blue-600" /> Thông tin hóa đơn & Thời gian
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Số hóa đơn mua hàng</label>
                <input 
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nhập số hóa đơn..."
                  value={formData.invoiceNumber}
                  onChange={e => setFormData({...formData, invoiceNumber: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Năm nhập</label>
                <input 
                  type="number"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.year}
                  onChange={e => setFormData({...formData, year: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Image & Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Camera size={18} className="text-blue-600" /> Ảnh đính kèm hóa đơn
            </h3>
            <div className="aspect-square bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden relative group">
              {imagePreview ? (
                <>
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Hóa đơn" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => setImagePreview(null)}
                      className="bg-red-500 text-white p-2 rounded-full shadow-lg"
                    >
                      Xóa ảnh
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <PackageOpen className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-xs text-slate-500 mb-4">Tải lên ảnh hóa đơn minh chứng</p>
                  <label className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-blue-700 shadow-md">
                    CHỌN ẢNH
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleImport}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Save size={20} />
            LƯU NHẬP KHO
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest flex items-center gap-2">
            Lịch sử nhập hàng gần đây
          </h3>
          <span className="text-xs text-slate-400">Tất cả thông tin được liên kết chính xác với SKU</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
              <tr>
                <th className="px-6 py-4">Ngày nhập</th>
                <th className="px-6 py-4">Mặt hàng</th>
                <th className="px-6 py-4">Số lượng</th>
                <th className="px-6 py-4">Giá nhập/bán</th>
                <th className="px-6 py-4">Hóa đơn</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.imports.map(rec => {
                const prod = data.products.find(p => p.id === rec.productId);
                return (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(rec.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{prod?.name || 'N/A'}</span>
                        <span className="text-[10px] font-black text-blue-600">Mã: {prod?.code} | Hãng: {prod?.manufacturer}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {rec.quantity} {prod?.unit}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-emerald-600 font-bold">N: {rec.importPrice.toLocaleString()}đ</span>
                        <span className="text-blue-600 font-bold">B: {rec.sellingPrice.toLocaleString()}đ</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-700 font-medium">{rec.invoiceNumber}</span>
                        <span className="text-xs text-slate-400">Năm {rec.year}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => startEdit(rec)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Sửa bản ghi"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => deleteRecord(rec.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Xóa bản ghi"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {data.imports.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">Chưa có lịch sử nhập hàng nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Cập nhật thông tin nhập hàng</h3>
                <p className="text-slate-400 text-sm">
                  Cập nhật cho mã: {data.products.find(p => p.id === editingRecord.productId)?.code}
                </p>
              </div>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Số hóa đơn</label>
                  <input 
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingRecord.invoiceNumber}
                    onChange={e => setEditingRecord({...editingRecord, invoiceNumber: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Số lượng</label>
                  <input 
                    type="number"
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingRecord.quantity}
                    onChange={e => setEditingRecord({...editingRecord, quantity: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Năm nhập</label>
                  <input 
                    type="number"
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingRecord.year}
                    onChange={e => setEditingRecord({...editingRecord, year: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Giá nhập (đ)</label>
                  <input 
                    type="number"
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingRecord.importPrice}
                    onChange={e => setEditingRecord({...editingRecord, importPrice: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Giá bán (đ)</label>
                  <input 
                    type="number"
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingRecord.sellingPrice}
                    onChange={e => setEditingRecord({...editingRecord, sellingPrice: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all"
                >
                  HỦY BỎ
                </button>
                <button 
                  onClick={saveEdit}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                >
                  CẬP NHẬT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportSection;
