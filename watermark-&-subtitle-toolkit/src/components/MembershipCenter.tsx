import React, { useState } from 'react';
import { ChevronLeft, MoreHorizontal, Check, QrCode, Sparkles, Trophy, RefreshCw } from 'lucide-react';
import { MembershipPackage, UserQuota } from '../types';

interface MembershipCenterProps {
  quota: UserQuota;
  onUpdateQuota: (updated: UserQuota) => void;
  onBack: () => void;
}

const PACKAGES: MembershipPackage[] = [
  {
    id: 'trial_year',
    title: '体验版 (一年会员)',
    price: 99,
    duration: '1年',
    description: '每天时长300秒',
    dailyQuota: '300s',
    tag: '限时出售',
    badge: '最划算'
  },
  {
    id: 'basic_30',
    title: '基础版 (30天)',
    price: 28,
    duration: '30天',
    description: '每天时长900秒 (15分钟)',
    dailyQuota: '900s'
  },
  {
    id: 'premium_30',
    title: '高级版 (30天)',
    price: 48,
    duration: '30天',
    description: '每天时长1800秒 (30分钟)',
    dailyQuota: '1800s',
    badge: '高频推荐'
  }
];

export default function MembershipCenter({ quota, onUpdateQuota, onBack }: MembershipCenterProps) {
  const [selectedId, setSelectedId] = useState<string>('trial_year');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [paying, setPaying] = useState(false);

  const selectedPkg = PACKAGES.find(p => p.id === selectedId) || PACKAGES[0];

  const handlePurchaseSubmit = () => {
    setShowPayModal(true);
  };

  const handleSimulatePaymentSuccess = () => {
    setPaying(true);

    setTimeout(() => {
      // Create new quota state
      let updatedQuota: UserQuota = { ...quota };

      if (selectedPkg.id === 'trial_year') {
        updatedQuota.monthlyDays = (quota.monthlyDays || 0) + 365;
        updatedQuota.remainingSeconds = quota.remainingSeconds + 300;
        updatedQuota.membershipLevel = 'experience';
      } else if (selectedPkg.id === 'basic_30') {
        updatedQuota.monthlyDays = (quota.monthlyDays || 0) + 30;
        updatedQuota.remainingSeconds = quota.remainingSeconds + 900;
        updatedQuota.membershipLevel = 'basic';
      } else if (selectedPkg.id === 'premium_30') {
        updatedQuota.monthlyDays = (quota.monthlyDays || 0) + 30;
        updatedQuota.remainingSeconds = quota.remainingSeconds + 1800;
        updatedQuota.membershipLevel = 'premium';
      }

      onUpdateQuota(updatedQuota);
      setPaying(false);
      setShowPayModal(false);

      alert(`🎉 恭喜！购买【${selectedPkg.title}】成功！\n会员有效期已增加相应时长！`);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-[#F3F4F6] text-gray-950 overflow-hidden" id="membership-center-view">
      {/* Navigation bar matching Screen 2 */}
      <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100 shrink-0 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="p-1 text-gray-800 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
          id="membership-back-btn"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-semibold text-lg text-gray-800">会员中心</span>
        <button className="p-1 text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* Scroller page content container */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 pb-24" id="membership-page-scroller">
        {/* Remaining Quota Header Card (Fidelity matching Screen 2!) */}
        <div className="bg-gradient-to-br from-[#8050EF] via-[#945BF3] to-[#4FA1F7] rounded-3xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between border border-white/10" id="membership-quota-badge-card">
          {/* Subtle abstract background shape */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          {/* Monthly stats header */}
          <div className="flex items-center gap-3 text-white mb-5 shrink-0">
            <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center shadow-md shadow-amber-500/20">
              <span className="text-xl">👑</span>
            </div>
            <div>
              <div className="text-[11px] text-purple-100/80 font-medium tracking-wider uppercase">Subscription State</div>
              <h3 className="text-xl font-bold tracking-tight text-white leading-tight">
                包月剩余 <span className="text-amber-300 font-extrabold">{quota.monthlyDays}</span> 天
              </h3>
            </div>
          </div>

          {/* Permanent Seconds Panel */}
          <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-purple-100/10">
            <div>
              <span className="text-[10px] text-gray-400 block font-medium">Permanent Access Duration</span>
              <span className="text-base font-bold text-gray-800">永久时长剩余</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-mono">
                {quota.remainingSeconds}
              </span>
              <span className="text-xs text-gray-500 font-bold ml-1">秒</span>
            </div>
          </div>
        </div>

        {/* Section Packages Card Title */}
        <div id="packages-section-wrapper">
          <h4 className="text-base font-bold text-gray-850 mb-3 px-1 flex items-center gap-1.5 leading-none shrink-0">
            <Sparkles className="w-4 h-4 text-blue-500" />
            包月套餐
          </h4>

          {/* Cards List matching exact visual styles of Screen 2 */}
          <div className="flex flex-col gap-3">
            {PACKAGES.map((pkg) => {
              const isActive = selectedId === pkg.id;

              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedId(pkg.id)}
                  className={`bg-white rounded-2xl p-4 border transition-all relative flex flex-col justify-between cursor-pointer ${
                    isActive
                      ? 'border-blue-500 ring-2 ring-blue-500/15 shadow-md transform scale-[1.01]'
                      : 'border-transparent shadow-sm hover:shadow hover:border-gray-150'
                  }`}
                  id={`pkg-card-${pkg.id}`}
                >
                  {/* Decorative badge corner */}
                  {pkg.badge && (
                    <span className="absolute top-0 right-0 py-0.5 px-2 bg-gradient-to-r from-amber-500 to-orange-500 text-[9px] font-bold text-white rounded-tr-xl rounded-bl-xl shadow-sm uppercase tracking-wider">
                      {pkg.badge}
                    </span>
                  )}

                  {/* Pricing row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-bold text-sm text-gray-850 flex items-center gap-1">
                        {pkg.title}
                        {pkg.tag && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                            {pkg.tag}
                          </span>
                        )}
                      </h5>
                      <span className="text-xs text-slate-500 mt-1 block">
                        {pkg.description}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono font-semibold">价格</span>
                      <div className="text-lg font-black text-gray-900 font-sans">
                        ¥{pkg.price}
                      </div>
                    </div>
                  </div>

                  {/* Tick check indicator */}
                  {isActive && (
                    <div className="absolute right-4 bottom-4 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md shadow-blue-500/20">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Bottom Pay Button Sheet */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-gray-100 z-10 flex flex-col shrink-0">
        <button
          onClick={handlePurchaseSubmit}
          className="w-full max-w-md mx-auto py-3.5 bg-gradient-to-r from-cyan-500 via-[#1CB0F6] to-blue-500 hover:from-cyan-600 hover:to-blue-600 active:scale-98 text-white font-black text-sm rounded-full shadow-lg hover:shadow-xl transition-all transition-colors tracking-widest text-center cursor-pointer"
          id="membership-checkout-btn"
        >
          立即开通
        </button>
      </div>

      {/* Simulated WeChat/Alipay QR Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-[320px] shadow-2xl relative border border-gray-100 animate-zoom-in" id="pay-flow-modal">
            <h3 className="text-base font-bold text-center text-gray-800 mb-4 flex items-center justify-center gap-1.5">
              <QrCode className="w-5 h-5 text-blue-500" />
              <span>扫码签约收银台</span>
            </h3>

            {/* Price display inside checkout */}
            <div className="bg-gray-50 rounded-2xl p-4 text-center mb-4">
              <span className="text-[10px] text-gray-400 block font-medium">确认购买</span>
              <span className="text-xs font-black text-slate-700 block mt-0.5 truncate">{selectedPkg.title}</span>
              <div className="text-2xl font-black text-gray-900 mt-2">
                ¥{selectedPkg.price}.00
              </div>
            </div>

            {/* Method Sorter Tabs */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setPayMethod('wechat')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  payMethod === 'wechat'
                    ? 'border-green-500 bg-green-50 text-green-600'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
                id="select-wechat-pay"
              >
                <span className="text-green-500">微信支付</span>
              </button>
              <button
                onClick={() => setPayMethod('alipay')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  payMethod === 'alipay'
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
                id="select-alipay-pay"
              >
                <span className="text-blue-500">支付宝</span>
              </button>
            </div>

            {/* Mock QR Code scan visualization */}
            <div className="flex flex-col items-center justify-center p-3 relative h-[140px]" id="qr-code-holder">
              {paying ? (
                <div className="flex flex-col items-center justify-center animate-pulse">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                  <span className="text-xs font-semibold text-gray-500">正在与银行接口结算中...</span>
                </div>
              ) : (
                <>
                  <div className="w-32 h-32 bg-gray-50 border border-gray-150 rounded-xl relative flex items-center justify-center shadow-inner overflow-hidden">
                    <QrCode className="w-24 h-24 text-slate-800" />
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/0 via-blue-500/10 to-blue-500/0 h-full animate-slide-wide pointer-events-none" />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-2 font-medium">请长按或截图扫码进行测试支付</span>
                </>
              )}
            </div>

            {/* Action controls list bottom */}
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowPayModal(false)}
                className="flex-1 py-2.5 border border-zinc-200 hover:border-zinc-300 text-xs font-bold text-gray-500 rounded-xl cursor-pointer hover:bg-slate-50 transition-all text-center"
                id="cancel-pay-btn"
              >
                取消
              </button>
              <button
                onClick={handleSimulatePaymentSuccess}
                disabled={paying}
                className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                id="simulate-success-pay"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>模拟支付成功</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add simple CSS animations for QR slide-wide bar
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-wide {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }
  .animate-slide-wide {
    animation: slide-wide 2s infinite linear;
  }
`;
document.head.appendChild(style);
