import React, { useState, useRef } from 'react';
import { Plus, Link, Image, Type, Sparkles, Sliders, ChevronRight } from 'lucide-react';

interface HomeViewProps {
  onTriggerLinkWatermark: () => void;
  onTriggerImageWatermark: () => void;
  onTriggerVideoSubtitle: () => void;
  onUploadImageFile: (src: string) => void;
  onUploadVideoFile: () => void;
}

export default function HomeView({
  onTriggerLinkWatermark,
  onTriggerImageWatermark,
  onTriggerVideoSubtitle,
  onUploadImageFile,
  onUploadVideoFile
}: HomeViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Before & After draggable comparison slider state
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const position = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) { // Left mouse button clicked
      handleSliderMove(e.clientX);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      onTriggerVideoSubtitle();
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUploadImageFile(event.target.result as string);
          onTriggerImageWatermark();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FCFCFD] text-[#333333] select-none" id="home-view-container">
      {/* Scroll View Scroller */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6" id="home-scroller">
        
        {/* BIG Upload Card matching Mockup 4 */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-[#E5F1FF]/60 hover:bg-[#E5F1FF]/80 active:scale-98 rounded-3xl p-8 border border-[#CCE3FF] flex flex-col items-center justify-center text-center cursor-pointer shadow-sm hover:shadow transition-all group shrink-0 relative"
          id="upload-blueprint-card"
        >
          {/* Subtle sparkles background inside blueprint card */}
          <Sparkles className="absolute top-4 right-4 w-5 h-5 text-blue-400 opacity-60 group-hover:animate-spin" />
          
          <div className="w-14 h-14 bg-white/95 rounded-2xl flex items-center justify-center text-[#1CB0F6] group-hover:scale-105 transition-transform shadow-md border border-[#CCE3FF]/50 mb-3.5">
            <Plus className="w-8 h-8 stroke-[3]" />
          </div>

          <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
            Upload Video or Image
          </h3>
          <p className="text-[10px] text-blue-400 font-semibold mt-1 font-mono uppercase tracking-widest leading-none">
            Drag drop or browse files
          </p>
        </div>

        {/* Hidden File Input handler */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*"
          className="hidden"
          id="home-media-file-picker"
        />

        {/* Triple Action Tools Sorter Grids, matching Screen 4 exact layout! */}
        <div className="grid grid-cols-3 gap-3 shrink-0" id="toolkit-action-grid">
          
          {/* Action 1: Link Watermark */}
          <button
            onClick={onTriggerLinkWatermark}
            className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-150/45 hover:shadow hover:border-gray-200 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group"
            id="tool-link-watermark"
          >
            <div className="w-11 h-11 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-2.5 border border-blue-100 group-hover:scale-105 transition-transform shadow-inner">
              <Link className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-black leading-tight text-gray-800">
              Link<br />Watermark
            </span>
          </button>

          {/* Action 2: Image Watermark */}
          <button
            onClick={onTriggerImageWatermark}
            className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-150/45 hover:shadow hover:border-gray-200 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group"
            id="tool-image-watermark"
          >
            <div className="w-11 h-11 bg-sky-50 text-[#1CB0F6] rounded-xl flex items-center justify-center mb-2.5 border border-sky-100 group-hover:scale-105 transition-transform shadow-inner">
              <Image className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-black leading-tight text-gray-800">
              Image<br />Watermark
            </span>
          </button>

          {/* Action 3: Video Subtitle */}
          <button
            onClick={onTriggerVideoSubtitle}
            className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-150/45 hover:shadow hover:border-gray-200 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group"
            id="tool-video-subtitle"
          >
            <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2.5 border border-blue-100 group-hover:scale-105 transition-transform shadow-inner">
              <Type className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-black leading-tight text-gray-800">
              Video<br />Subtitle
            </span>
          </button>

        </div>

        {/* Lower Block: "Before & After" Cases Demonstration */}
        <div id="before-after-cases-wrap" className="shrink-0 flex flex-col gap-3">
          <h4 className="text-base font-extrabold text-[#111111] px-1 flex items-center justify-between">
            <span>Before & After</span>
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Demo cases</span>
          </h4>

          {/* Draggable slider slider / Side-by-side matching Screen 4 */}
          <div className="flex flex-col gap-4">
            
            {/* Side-by-Side Visual Matching Screen 4 EXACTLY */}
            <div className="grid grid-cols-2 gap-3" id="side-by-side-mock-comparison">
              {/* Before Card */}
              <div className="flex flex-col gap-1.5 text-center">
                <div className="relative aspect-square bg-[#ECEFF1] rounded-2xl overflow-hidden shadow-inner border border-gray-100">
                  <img
                    src="https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?auto=format&fit=crop&w=300&q=80"
                    alt="Ocean Girl Before Watermark"
                    className="w-full h-full object-cover select-none pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle Text Overlaid mimicking real watermark */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none text-xs text-white/40 drop-shadow-sm border border-white/5 bg-slate-900/10 px-1 py-0.5 rounded backdrop-blur-[0.5px]">
                    Watermark.com
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray-500">Before</span>
              </div>

              {/* After Card */}
              <div className="flex flex-col gap-1.5 text-center">
                <div className="relative aspect-square bg-[#ECEFF1] rounded-2xl overflow-hidden shadow-inner border border-gray-100">
                  <img
                    src="https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?auto=format&fit=crop&w=300&q=80"
                    alt="Ocean Girl Clean"
                    className="w-full h-full object-cover select-none pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                  {/* Watermark is beautifully and cleanly absent here */}
                </div>
                <span className="text-xs font-semibold text-gray-500">After</span>
              </div>
            </div>

            {/* Interactive Curtain Scroller widget addition - Pure interactive joy */}
            <div className="p-3 bg-blue-50/40 rounded-2xl border border-blue-100/50 flex flex-col gap-2">
              <span className="text-[10px] font-extrabold text-blue-600 block uppercase tracking-wider">
                💡 Interactive Slider Case Structure (Drag Handle Below):
              </span>
              
              <div
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                className="relative w-full aspect-video bg-[#333] rounded-2xl overflow-hidden select-none cursor-ew-resize border border-gray-150 shadow-md ring-2 ring-white"
                id="interactive-curtain-drag"
              >
                {/* BEFORE LAYER (BACKGROUND) */}
                <div className="absolute inset-0">
                  <img
                    src="https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?auto=format&fit=crop&w=600&q=80"
                    alt="Background original girl beach"
                    className="w-full h-full object-cover pointer-events-none select-none"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle Text Overlaid watermark */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-black text-white/50 border border-white/10 px-4 py-2 bg-slate-900/15 rounded backdrop-blur-[0.5px]">
                    Watermark.com
                  </div>
                </div>

                {/* AFTER LAYER (SLIDING CLIP) */}
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <div className="absolute w-[600px] h-[340px]" style={{ width: '100%', height: '100%', minWidth: '340px' }}>
                    <img
                      src="https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?auto=format&fit=crop&w=600&q=80"
                      alt="Foreground clean girl beach"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                      style={{ width: containerRef.current?.clientWidth, height: containerRef.current?.clientHeight }}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* SLIDER SEPARATOR HANDLE BAR LINE */}
                <div
                  className="absolute inset-y-0 w-1 bg-white cursor-ew-resize z-10 shadow flex items-center justify-center"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white shadow-lg shadow-blue-500/30 transform -translate-x-1/2">
                    <Sliders className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
