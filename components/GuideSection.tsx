
import React from 'react';
import { 
  BookOpen, Settings, Import, ShoppingCart, Box, LayoutDashboard, 
  CheckCircle, HelpCircle, Save, Download, 
  Filter, AlertCircle, Lightbulb, Zap, ShieldCheck, Camera,
  ListTree, Bell, Heart, Database, Tag, Layers, TrendingUp, History
} from 'lucide-react';

const GuideSection: React.FC = () => {
  const steps = [
    {
      title: "1. Thêm dữ liệu gốc",
      icon: <Database className="text-blue-600" size={24} />,
      desc: "Khai báo nền tảng cho hệ thống tại tab Quản Trị > Dữ liệu gốc.",
      details: [
        "Loại hàng: Phân nhóm chính (Điện, Nước, Kim khí...).",
        "Hãng sản xuất: Các thương hiệu cung cấp sản phẩm.",
        "Đơn vị tính: Cách đo lường (Cái, Mét, Cuộn, Bộ...)."
      ],
      color: "bg-blue-50 border-blue-100"
    },
    {
      title: "2. Thêm Tên hàng",
      icon: <Layers className="text-indigo-600" size={24} />,
      desc: "Tạo danh mục sản phẩm tổng quát tại tab Quản Trị > Tên hàng.",
      details: [
        "Kết nối Tên sản phẩm với Loại hàng, Hãng và ĐVT tương ứng.",
        "Giúp chuẩn hóa tên gọi để tránh trùng lặp khi nhập kho."
      ],
      color: "bg-indigo-50 border-indigo-100"
    },
    {
      title: "3. Thêm mã hàng (SKU)",
      icon: <Tag className="text-purple-600" size={24} />,
      desc: "Định danh cụ thể từng mặt hàng tại tab Quản Trị > Mã hàng.",
      details: [
        "Mã SKU là duy nhất cho mỗi quy cách (Ví dụ: Dây 1.5 đỏ, Dây 1.5 xanh).",
        "Mã SKU được dùng xuyên suốt trong quá trình Nhập và Bán."
      ],
      color: "bg-purple-50 border-purple-100"
    },
    {
      title: "4. Nhập hàng",
      icon: <Import className="text-cyan-600" size={24} />,
      desc: "Ghi nhận hàng về kho tại tab Nhập Hàng.",
      details: [
        "Chọn mã SKU, nhập số lượng, đơn giá mua và giá bán dự kiến.",
        "Sử dụng tính năng Camera để lưu ảnh hóa đơn đối soát."
      ],
      color: "bg-cyan-50 border-cyan-100"
    },
    {
      title: "5. Bán hàng",
      icon: <ShoppingCart className="text-emerald-600" size={24} />,
      desc: "Xuất kho và tạo hóa đơn tại tab Bán Hàng.",
      details: [
        "Hệ thống tự động lọc các mặt hàng còn tồn kho.",
        "Có thể sửa đổi giá bán trực tiếp tùy theo khách hàng."
      ],
      color: "bg-emerald-50 border-emerald-100"
    },
    {
      title: "6. Kiểm tra Tồn kho",
      icon: <Box className="text-orange-600" size={24} />,
      desc: "Theo dõi số lượng thực tế tại tab Tồn Kho.",
      details: [
        "Xem tồn kho hiện tại hoặc quay ngược thời gian xem tồn kho cũ.",
        "Hệ thống cảnh báo màu đỏ/cam khi hàng sắp hết (dưới 20 đơn vị)."
      ],
      color: "bg-orange-50 border-orange-100"
    },
    {
      title: "7. Thống kê & Báo cáo",
      icon: <TrendingUp className="text-rose-600" size={24} />,
      desc: "Phân tích hiệu quả kinh doanh tại tab Dashboard.",
      details: [
        "Theo dõi Doanh thu, Lợi nhuận và Vốn hàng tồn theo thời gian.",
        "Xuất báo cáo chi tiết ra file Excel (CSV) để lưu trữ."
      ],
      color: "bg-rose-50 border-rose-100"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl text-blue-600 mb-2">
          <BookOpen size={40} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">
          Quy Trình Vận Hành Hệ Thống
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">
          Hướng dẫn 7 bước chuẩn để quản lý kho vật tư thiết bị điện nước hiệu quả nhất.
        </p>
      </div>

      {/* Main Workflow Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className={`p-6 md:p-8 rounded-3xl border ${step.color} shadow-sm transition-all hover:shadow-md flex flex-col md:flex-row gap-6 relative overflow-hidden`}>
             {/* Large background number */}
             <span className="absolute -bottom-4 -right-2 text-9xl font-black text-slate-900/5 select-none pointer-events-none">
              {index + 1}
            </span>

            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-inherit">
              {step.icon}
            </div>
            
            <div className="flex-1 space-y-3 relative z-10">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">{step.title}</h3>
              <p className="text-slate-600 font-medium">{step.desc}</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                {step.details.map((detail, dIdx) => (
                  <li key={dIdx} className="flex items-start gap-2 text-sm text-slate-500">
                    <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Key Tips Section */}
      <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white overflow-hidden relative">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-black flex items-center gap-3">
              <Lightbulb className="text-yellow-400" size={32} /> Lưu ý quan trọng
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Bảo mật dữ liệu</h4>
                  <p className="text-slate-400 text-sm">Toàn bộ dữ liệu lưu tại trình duyệt máy tính của bạn. Hãy sao lưu ra file .zip mỗi ngày để tránh mất mát khi dọn dẹp trình duyệt.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <History className="text-orange-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Đối soát lịch sử</h4>
                  <p className="text-slate-400 text-sm">Bạn có thể sửa hoặc xóa bất kỳ bản ghi Nhập/Xuất nào trong lịch sử nếu phát hiện sai sót, hệ thống sẽ tự động cập nhật lại tồn kho.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
            <h4 className="text-yellow-400 font-black uppercase text-xs tracking-widest">Mẹo vận hành nhanh</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Khi tạo <strong>Mã hàng (SKU)</strong>, hãy quy ước cách đặt tên mã để tìm kiếm nhanh. 
              Ví dụ: <code className="bg-white/10 px-1.5 py-0.5 rounded text-blue-300">CP-30A-PANA</code> (Sản phẩm: Aptomat - Loại: 30 Ampe - Hãng: Panasonic).
            </p>
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-slate-500 italic">Mọi thắc mắc vui lòng kiểm tra phần Câu hỏi thường gặp phía dưới.</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black text-slate-800 text-center">Câu hỏi thường gặp (FAQs)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { q: 'Làm thế nào để đổi giá bán của lô hàng cũ?', a: 'Vào tab Nhập hàng, tìm bản ghi cũ trong danh sách lịch sử và nhấn biểu tượng Sửa (Edit).' },
            { q: 'Tại sao SKU không hiển thị khi bán hàng?', a: 'Có thể do SKU đó đã hết tồn kho (stock = 0) hoặc bạn chưa từng nhập hàng cho mã SKU đó.' },
            { q: 'Xóa Loại hàng thì các sản phẩm liên quan có mất không?', a: 'Dữ liệu sản phẩm không mất nhưng liên kết loại sẽ bị trống. Nên dùng chức năng Sửa thay vì Xóa.' },
            { q: 'Phần mềm có chạy được khi không có mạng?', a: 'Có, phần mềm hoạt động hoàn toàn Offline. Chỉ cần mạng khi bạn muốn tải file sao lưu lên Google Drive.' },
          ].map((faq, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2 shadow-sm">
              <p className="font-bold text-slate-800 flex items-start gap-2">
                <HelpCircle size={18} className="text-blue-500 mt-1 flex-shrink-0" />
                {faq.q}
              </p>
              <p className="text-sm text-slate-500 pl-7">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Copyright Footer */}
      <div className="pt-8 border-t border-slate-200 text-center space-y-2 pb-10">
        <p className="text-slate-400 text-sm flex items-center justify-center gap-1 font-medium">
          Hệ thống được phát triển với <Heart size={14} className="text-red-500 fill-red-500" /> bởi
        </p>
        <p className="text-slate-800 font-black text-xl tracking-tight">ThiemLV</p>
        <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">Warehouse Management System &copy; 2025</p>
      </div>
    </div>
  );
};

export default GuideSection;
