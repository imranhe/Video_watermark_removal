import React, { useState } from 'react';
import { ChevronLeft, MoreHorizontal, Download, Eye, Play, X, Trash2, Calendar, FileText } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryListProps {
  historyItems: HistoryItem[];
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
  onBack: () => void;
}

export default function HistoryList({ historyItems, onClearHistory, onRemoveItem, onBack }: HistoryListProps) {
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const handleDownload = (item: HistoryItem) => {
    // Standard mock download flow
    const link = document.createElement('a');
    link.href = item.url;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (item: HistoryItem) => {
    setSelectedItem(item);
  };

  return (
    <div className="flex flex-col h-full bg-[#F3F4F6] text-gray-900 overflow-hidden" id="history-list-view">
      {/* Title bar of history center, matching the mockup */}
      <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100 shrink-0 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="p-1 text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          id="history-back-btn"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-semibold text-lg text-gray-800">历史记录</span>
        <button
          onClick={() => {
            if (confirm('确认清空所有历史处理记录吗？此操作无法撤销。')) {
              onClearHistory();
            }
          }}
          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          title="清空历史"
          id="clear-all-history-btn"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main List Scroller */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" id="history-items-container">
        {historyItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-gray-400" id="history-empty-status">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-4">
              <Calendar className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium">暂无处理记录</p>
            <p className="text-xs text-gray-400 mt-1">返回主页上传文件，秒级擦除水印</p>
          </div>
        ) : (
          historyItems.map((item) => {
            const isVideo = item.type === 'video';
            const isPng = item.name.endsWith('.png');

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/60 flex items-center justify-between gap-3 hover:shadow-md transition-all duration-200"
                id={`history-card-${item.id}`}
              >
                {/* Left: Interactive Media Thumbnail */}
                <div
                  onClick={() => handleView(item)}
                  className="w-14 h-14 bg-gray-900 rounded-xl overflow-hidden relative shrink-0 cursor-pointer border border-gray-100 group shadow-inner"
                >
                  {/* Photo or stock cover */}
                  {isVideo ? (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                      <img
                        src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=120&q=80"
                        alt="Video Thumbnail"
                        className="w-full h-full object-cover opacity-60 pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-white/90 group-hover:bg-white group-hover:scale-105 rounded-full flex items-center justify-center shadow transition-all">
                          <Play className="w-2.5 h-2.5 text-slate-800 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full relative">
                      <img
                        src={item.url}
                        alt="Image Thumbnail"
                        className="w-full h-full object-cover pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 flex items-center justify-center transition-all">
                        <div className="w-6 h-6 bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-sm">
                          <Eye className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Center: File meta detail text */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-800 truncate leading-snug group-hover:text-blue-600 transition-colors">
                    {item.name}
                  </h4>
                  <span className="text-xs text-gray-400 block mt-1 font-mono">
                    {item.date}
                  </span>
                </div>

                {/* Right Action Trigger, maps directly to mockup styles */}
                <div className="shrink-0">
                  {item.status === 'view' ? (
                    <button
                      onClick={() => handleView(item)}
                      className="px-5 py-1.5 bg-[#1B72E8] hover:bg-blue-600 active:scale-95 text-white text-xs font-bold rounded-full shadow-sm cursor-pointer transition-all"
                      id={`history-btn-view-${item.id}`}
                    >
                      查看
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDownload(item)}
                      className="px-5 py-1.5 bg-[#4B8AF4] hover:bg-blue-600 active:scale-95 text-white text-xs font-bold rounded-full shadow-sm cursor-pointer transition-all"
                      id={`history-btn-down-${item.id}`}
                    >
                      下载
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Interactive Lightbox Popup / Custom Player Drawer */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col justify-center items-center p-4" id="history-lightbox">
          {/* Close trigger to exit lightbox */}
          <button
            onClick={() => setSelectedItem(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 text-white hover:text-white rounded-full transition-colors cursor-pointer"
            id="lightbox-close-btn"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Frame card box */}
          <div className="bg-white rounded-2xl overflow-hidden w-full max-w-[360px] shadow-2xl relative border border-gray-150 animate-zoom-in" id="lightbox-card">
            {/* Metadata filename badge */}
            <div className="p-3 bg-zinc-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 truncate max-w-[200px]">
                {selectedItem.name}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {selectedItem.date}
              </span>
            </div>

            {/* Media playback canvas frame */}
            <div className="aspect-video bg-black flex items-center justify-center relative">
              {selectedItem.type === 'video' ? (
                <video
                  src={selectedItem.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  playsInline
                />
              ) : (
                <img
                  src={selectedItem.url}
                  alt="Full preview image"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Subtitles timing list block inside lightbox if present */}
            {selectedItem.subtitleList && (
              <div className="p-3 bg-slate-50 border-t border-gray-100 max-h-[140px] overflow-y-auto">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">
                  附带提取的智能字幕:
                </span>
                <div className="flex flex-col gap-1 text-[11px] text-slate-600">
                  {selectedItem.subtitleList.map((sub, idx) => (
                    <div key={idx} className="flex gap-2 justify-between">
                      <span className="text-blue-500 font-mono shrink-0">{sub.startTime}s</span>
                      <span className="truncate flex-1 text-left">{sub.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Down or delete selector footer */}
            <div className="p-4 bg-white flex gap-2 border-t border-gray-100">
              <button
                onClick={() => {
                  onRemoveItem(selectedItem.id);
                  setSelectedItem(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                id="lightbox-delete-btn"
              >
                <Trash2 className="w-4 h-4" />
                <span>删除记录</span>
              </button>

              <button
                onClick={() => handleDownload(selectedItem)}
                className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 font-bold text-xs text-white rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                id="lightbox-download-action-btn"
              >
                <Download className="w-4 h-4" />
                <span>立即保存到本地</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
