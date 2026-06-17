import React, { useState, useEffect } from 'react';
import { Home, User, Clock, CreditCard, Sparkles, Smartphone, Undo } from 'lucide-react';
import { HistoryItem, UserQuota } from './types';
import HomeView from './components/HomeView';
import UserProfile from './components/UserProfile';
import MembershipCenter from './components/MembershipCenter';
import HistoryList from './components/HistoryList';
import LinkWatermarkSheet from './components/LinkWatermarkSheet';
import ImageWatermarkEditor from './components/ImageWatermarkEditor';
import VideoSubtitleEditor from './components/VideoSubtitleEditor';

const LOCAL_KEY_HISTORY = 'watermark_app_history';
const LOCAL_KEY_QUOTA = 'watermark_app_quota';

const INITIAL_HISTORY: HistoryItem[] = [
  {
    id: 'h1',
    name: 'Video_20240521.mp4',
    type: 'video',
    date: '2024-05-21',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-breaking-in-the-sea-from-above-39986-large.mp4',
    status: 'download'
  },
  {
    id: 'h2',
    name: 'Image_watermark_removed.png',
    type: 'image',
    date: '2024-05-20',
    url: 'https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?auto=format&fit=crop&w=600&q=80',
    status: 'view',
    originalUrl: 'https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'h3',
    name: 'Presentation_Video.mov',
    type: 'video',
    date: '2024-05-19',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-keyboard-and-mouse-with-rgb-lighting-in-dark-42861-large.mp4',
    status: 'download'
  },
  {
    id: 'h4',
    name: 'Video_20240521.mp4',
    type: 'video',
    date: '2024-05-19',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-breaking-in-the-sea-from-above-39986-large.mp4',
    status: 'download'
  },
  {
    id: 'h5',
    name: 'Video_20240521.mp4',
    type: 'video',
    date: '2024-05-18',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-breaking-in-the-sea-from-above-39986-large.mp4',
    status: 'download'
  },
  {
    id: 'h6',
    name: 'Video_20240521.mp4',
    type: 'video',
    date: '2024-05-16',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-breaking-in-the-sea-from-above-39986-large.mp4',
    status: 'download'
  },
  {
    id: 'h7',
    name: 'Video_20240521.mp4',
    type: 'video',
    date: '2024-05-21',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-breaking-in-the-sea-from-above-39986-large.mp4',
    status: 'download'
  }
];

const INITIAL_QUOTA: UserQuota = {
  id: '9735634',
  remainingSeconds: 200,
  monthlyDays: 0,
  membershipLevel: 'free'
};

export default function App() {
  // Navigation active state
  const [activeTab, setActiveTab] = useState<'home' | 'profile'>('home');
  const [subView, setSubView] = useState<'none' | 'history' | 'membership'>('none');
  
  // Active tool overlays
  const [activeTool, setActiveTool] = useState<'none' | 'link-watermark' | 'image-watermark' | 'video-subtitle'>('none');

  // State
  const [quota, setQuota] = useState<UserQuota>(INITIAL_QUOTA);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);

  // Frame toggle: On desktop let's frame the app beautifully as a phone viewport by default, but allow full-width toggle.
  const [useDeviceFrame, setUseDeviceFrame] = useState(true);

  // Load persistent storage
  useEffect(() => {
    const cachedHistory = localStorage.getItem(LOCAL_KEY_HISTORY);
    if (cachedHistory) {
      try {
        setHistoryItems(JSON.parse(cachedHistory));
      } catch (e) {
        setHistoryItems(INITIAL_HISTORY);
      }
    } else {
      setHistoryItems(INITIAL_HISTORY);
      localStorage.setItem(LOCAL_KEY_HISTORY, JSON.stringify(INITIAL_HISTORY));
    }

    const cachedQuota = localStorage.getItem(LOCAL_KEY_QUOTA);
    if (cachedQuota) {
      try {
        setQuota(JSON.parse(cachedQuota));
      } catch (e) {
        setQuota(INITIAL_QUOTA);
      }
    } else {
      setQuota(INITIAL_QUOTA);
      localStorage.setItem(LOCAL_KEY_QUOTA, JSON.stringify(INITIAL_QUOTA));
    }
  }, []);

  // Sync state helpers
  const handleUpdateQuota = (updated: UserQuota) => {
    setQuota(updated);
    localStorage.setItem(LOCAL_KEY_QUOTA, JSON.stringify(updated));
  };

  const handleAddHistory = (item: HistoryItem) => {
    const updated = [item, ...historyItems];
    setHistoryItems(updated);
    localStorage.setItem(LOCAL_KEY_HISTORY, JSON.stringify(updated));

    // Log credit consumption
    if (quota.remainingSeconds > 0) {
      const consumption = item.type === 'video' ? 30 : 15;
      const nextSecs = Math.max(0, quota.remainingSeconds - consumption);
      handleUpdateQuota({ ...quota, remainingSeconds: nextSecs });
    }
  };

  const handleRemoveHistoryItem = (id: string) => {
    const updated = historyItems.filter((item) => item.id !== id);
    setHistoryItems(updated);
    localStorage.setItem(LOCAL_KEY_HISTORY, JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    setHistoryItems([]);
    localStorage.setItem(LOCAL_KEY_HISTORY, JSON.stringify([]));
  };

  // Render sub-view screen overlays (History, Membership packets)
  const renderSubView = () => {
    switch (subView) {
      case 'history':
        return (
          <HistoryList
            historyItems={historyItems}
            onClearHistory={handleClearHistory}
            onRemoveItem={handleRemoveHistoryItem}
            onBack={() => setSubView('none')}
          />
        );
      case 'membership':
        return (
          <MembershipCenter
            quota={quota}
            onUpdateQuota={handleUpdateQuota}
            onBack={() => setSubView('none')}
          />
        );
      default:
        return null;
    }
  };

  // Render tools overlays (link parse, brush removal, subtitles AI)
  const renderActiveTool = () => {
    switch (activeTool) {
      case 'link-watermark':
        return (
          <div className="absolute inset-0 bg-white z-40 overflow-y-auto">
            <LinkWatermarkSheet
              onClose={() => setActiveTool('none')}
              onAddHistory={handleAddHistory}
            />
          </div>
        );
      case 'image-watermark':
        return (
          <div className="absolute inset-0 bg-slate-900 z-40">
            <ImageWatermarkEditor
              onClose={() => setActiveTool('none')}
              onAddHistory={handleAddHistory}
            />
          </div>
        );
      case 'video-subtitle':
        return (
          <div className="absolute inset-0 bg-slate-900 z-40">
            <VideoSubtitleEditor
              onClose={() => setActiveTool('none')}
              onAddHistory={handleAddHistory}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center py-0 md:py-8 font-sans antialiased" id="main-root-container">
      {/* Top Banner on Desktop for Viewport Toggle Mode */}
      <div className="hidden md:flex items-center gap-3 mb-4 text-xs font-semibold text-zinc-500 shrink-0">
        <button
          onClick={() => setUseDeviceFrame(!useDeviceFrame)}
          className="px-4 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-full shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          id="toggle-device-frame"
        >
          <Smartphone className="w-4 h-4 text-zinc-400" />
          <span>{useDeviceFrame ? '切换全宽视图 (Full Screen)' : '切回手机样板 (Phone Frame)'}</span>
        </button>
        
        <button
          onClick={() => {
            if (confirm('是否重置应用状态到初始数据（恢复 200秒 及原始 7 条历史记录）？')) {
              localStorage.removeItem(LOCAL_KEY_QUOTA);
              localStorage.removeItem(LOCAL_KEY_HISTORY);
              setQuota(INITIAL_QUOTA);
              setHistoryItems(INITIAL_HISTORY);
            }
          }}
          className="px-4 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-red-500 rounded-full shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          id="reset-demo-storage"
        >
          <Undo className="w-4 h-4" />
          <span>重置演示数据</span>
        </button>
      </div>

      {/* Frame wrapper sizing wrapper */}
      <div
        className={`w-full bg-white relative overflow-hidden transition-all duration-300 ${
          useDeviceFrame
            ? 'max-w-[380px] h-[780px] md:h-[780px] md:rounded-[36px] md:border-8 md:border-slate-800 md:shadow-2xl'
            : 'max-w-5xl min-h-[90vh] md:rounded-2xl md:border border-gray-150 md:shadow'
        }`}
        id="device-viewport-frame"
      >
        {/* Inside Simulated iPhone Notch details (Only when frame is active) */}
        {useDeviceFrame && (
          <div className="hidden md:flex bg-slate-800 h-6 w-full justify-center items-center gap-1.5 select-none shrink-0 border-b border-slate-900">
            <div className="w-16 h-3.5 bg-black rounded-b-xl absolute top-0 z-50 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-zinc-900 rounded-full mr-2" />
              <div className="w-8 h-1 bg-zinc-900 rounded-full" />
            </div>
          </div>
        )}

        {/* Global screen router content box */}
        <div className="w-full h-full relative flex flex-col bg-white">
          
          {/* Render Active View Panels */}
          <div className="flex-1 overflow-hidden relative">
            {/* Overlay drawers for Tool Panels */}
            {renderActiveTool()}

            {/* Overlay drawers for subview lists */}
            {subView !== 'none' ? (
              <div className="absolute inset-0 bg-white z-30">
                {renderSubView()}
              </div>
            ) : (
              /* Toggle standard main body active view tab */
              activeTab === 'home' ? (
                <HomeView
                  onTriggerLinkWatermark={() => setActiveTool('link-watermark')}
                  onTriggerImageWatermark={() => setActiveTool('image-watermark')}
                  onTriggerVideoSubtitle={() => setActiveTool('video-subtitle')}
                  onUploadImageFile={(src) => setCustomImageSrc(src)}
                  onUploadVideoFile={() => setActiveTool('video-subtitle')}
                />
              ) : (
                <UserProfile
                  quota={quota}
                  onNavigateToMembership={() => setSubView('membership')}
                  onNavigateToHistory={() => setSubView('history')}
                />
              )
            )}
          </div>

          {/* Persistent global bottom bar menu navigation (Only when not viewing full-editor mode or subviews) */}
          {subView === 'none' && activeTool === 'none' && (
            <div className="h-16 bg-white border-t border-gray-150 flex items-center justify-around shrink-0 relative z-20" id="bottom-bar-navigator">
              
              {/* Tab 1: Home button */}
              <button
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center gap-1 py-1.5 px-6 transition-colors cursor-pointer ${
                  activeTab === 'home' ? 'text-[#1CB0F6]' : 'text-gray-400 hover:text-gray-600'
                }`}
                id="bottom-tab-home"
              >
                <Home className={`w-5.5 h-5.5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] font-bold">Home</span>
              </button>

              {/* Tab 2: Profile button */}
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex flex-col items-center gap-1 py-1.5 px-6 transition-colors cursor-pointer ${
                  activeTab === 'profile' ? 'text-[#1CB0F6]' : 'text-gray-400 hover:text-gray-600'
                }`}
                id="bottom-tab-profile"
              >
                <User className={`w-5.5 h-5.5 ${activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] font-bold">Profile</span>
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
