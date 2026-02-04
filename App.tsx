
import React, { useState, useEffect } from 'react';
import { AppData, Tab } from './types';
import { loadData, saveData } from './utils/storage';
import AdminSection from './components/AdminSection';
import ImportSection from './components/ImportSection';
import SalesSection from './components/SalesSection';
import StatsSection from './components/StatsSection';
import InventorySection from './components/InventorySection';
import GuideSection from './components/GuideSection';
import { LayoutDashboard, Import, ShoppingCart, Settings, Box, BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<Tab>('stats');

  useEffect(() => {
    saveData(data);
  }, [data]);

  const updateData = (newData: AppData) => {
    setData(newData);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'admin':
        return <AdminSection data={data} updateData={updateData} />;
      case 'import':
        return <ImportSection data={data} updateData={updateData} />;
      case 'sales':
        return <SalesSection data={data} updateData={updateData} />;
      case 'inventory':
        return <InventorySection data={data} />;
      case 'stats':
        return <StatsSection data={data} />;
      case 'guide':
        return <GuideSection />;
      default:
        return <StatsSection data={data} />;
    }
  };

  const navItems = [
    { id: 'stats', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Tồn Kho', icon: Box },
    { id: 'import', label: 'Nhập Hàng', icon: Import },
    { id: 'sales', label: 'Bán Hàng', icon: ShoppingCart },
    { id: 'admin', label: 'Quản Trị', icon: Settings },
    { id: 'guide', label: 'Hướng Dẫn', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800">
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-64 bg-slate-900 text-white p-4 flex flex-col shadow-xl">
        <div className="mb-8 p-2">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-blue-600 p-1 rounded-md">WMS</span>
            <span>WareHouse</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Vật Tư Điện Nước</p>
        </div>
        
        <div className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-800 space-y-1">
          <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">Hệ thống được phát triển bởi</p>
          <p className="text-sm text-blue-400 font-black text-center">ThiemLV</p>
          <p className="text-[9px] text-slate-600 text-center mt-2">Version 1.0.0</p>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
