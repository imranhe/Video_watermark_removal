import React, { useState, useRef, useEffect } from 'react';
import { Eraser, Trash2, CheckCircle, Download, Upload, ZoomIn, Sliders, ChevronLeft } from 'lucide-react';
import { HistoryItem } from '../types';

interface ImageWatermarkEditorProps {
  onClose: () => void;
  onAddHistory: (item: HistoryItem) => void;
}

const DEMO_IMAGE_URL = 'https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?auto=format&fit=crop&w=600&q=80';

export default function ImageWatermarkEditor({ onClose, onAddHistory }: ImageWatermarkEditorProps) {
  const [imageSrc, setImageSrc] = useState<string>(DEMO_IMAGE_URL);
  const [hasWatermark, setHasWatermark] = useState(true);
  const [brushSize, setBrushSize] = useState<number>(24);
  const [isDrawing, setIsDrawing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [percentCompleted, setPercentCompleted] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize Canvas over Image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match display size of parent or responsive box
    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      // Draw simulated watermark if loading default image for first time
      setHasWatermark(imageSrc === DEMO_IMAGE_URL);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [imageSrc]);

  // Handle drawing mask
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Check if touch or mouse
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (processing || processed) return;
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const pos = getMousePos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Semi-transparent red ink for drawing watermark block
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)'; 
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || processing || processed) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const pos = getMousePos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleApplyEraser = () => {
    setProcessing(true);
    setPercentCompleted(0);

    // Simulated parsing animation
    const interval = setInterval(() => {
      setPercentCompleted((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setProcessing(false);
          setProcessed(true);
          setHasWatermark(false);
          clearCanvas();

          // Save to history list
          const title = imageSrc === DEMO_IMAGE_URL 
            ? 'Image_watermark_removed.png' 
            : 'Custom_Image_No_Watermark_' + Math.floor(100+Math.random()*900) + '.png';

          const newItem: HistoryItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: title,
            type: 'image',
            date: new Date().toISOString().slice(0, 10),
            url: imageSrc,
            status: 'view',
            originalUrl: imageSrc
          };
          onAddHistory(newItem);

          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
        setProcessed(false);
        setHasWatermark(true);
        clearCanvas();
      }
    };
    reader.readAsDataURL(file);
  };

  const downloadProcessedImage = () => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = 'watermark_removed_' + (imageSrc === DEMO_IMAGE_URL ? 'ocean_girl' : 'custom') + '.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white select-none" id="image-watermark-editor">
      {/* Header bar matching exact mobile apps */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700/60 shrink-0">
        <button
          onClick={onClose}
          className="flex items-center text-gray-300 hover:text-white transition-colors cursor-pointer"
          id="editor-back-btn"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>返回</span>
        </button>
        <span className="font-semibold text-sm">智能图片消除去水印</span>
        <div className="w-8" /> {/* Balance spacer */}
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 bg-slate-950 flex flex-col justify-between overflow-hidden">
        {/* Main interactive canvas staging */}
        <div className="flex-1 w-full flex items-center justify-center p-3 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
          <div
            ref={containerRef}
            className="relative w-full max-w-[360px] aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800"
            id="editor-canvas-stage"
          >
            {/* The source image */}
            <img
              src={imageSrc}
              alt="Watermark target editor"
              className="w-full h-full object-cover select-none pointer-events-none"
              referrerPolicy="no-referrer"
              id="editor-target-image"
            />

            {/* Simulated Watermark Text (Overlay) */}
            {hasWatermark && imageSrc === DEMO_IMAGE_URL && (
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none text-2xl font-bold font-sans tracking-wider text-slate-800/60 filter drop-shadow backdrop-blur-[1px] px-3 py-1 bg-white/5 border border-slate-500/10 rounded"
                id="simulated-watermark-overlay"
              >
                Watermark.com
              </div>
            )}

            {/* Custom Watermark hint if uploaded and hasn't erased */}
            {hasWatermark && imageSrc !== DEMO_IMAGE_URL && (
              <div className="absolute top-1/3 left-1/4 select-none pointer-events-none text-sm bg-black/60 text-white/80 px-2 py-1 rounded backdrop-blur-sm animate-pulse flex items-center gap-1">
                <Sliders className="w-3 h-3" />
                <span>请在下方画笔涂抹水印区域</span>
              </div>
            )}

            {/* Touch/Mouse Mask Drawing Canvas */}
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className={`absolute inset-0 cursor-crosshair z-10 touch-none ${
                processing || processed ? 'pointer-events-none' : ''
              }`}
              id="editor-canvas-mask"
            />

            {/* Processing state display */}
            {processing && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-20 flex flex-col items-center justify-center p-4 text-center">
                <Eraser className="w-12 h-12 text-blue-400 rotate-12 animate-bounce mb-3" />
                <span className="text-sm font-semibold tracking-wide text-gray-200">AI 正在擦除选定水印...</span>
                <span className="text-xs text-gray-400 font-mono mt-1 mb-3">进行像素脱敏和渐变填充</span>
                <div className="w-[180px] bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-100"
                    style={{ width: `${percentCompleted}%` }}
                  />
                </div>
                <span className="text-[10px] text-blue-400 font-semibold mt-2">{percentCompleted}%</span>
              </div>
            )}

            {/* Complete state check overlay */}
            {processed && (
              <div className="absolute inset-0 bg-green-950/40 backdrop-blur-sm z-10 flex flex-col items-center justify-center pointer-events-none">
                <div className="bg-white/95 text-green-700 px-4 py-2 mt-40 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-lg animate-bounce">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>处理成功！水印已擦除</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Toolbar Area */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 select-none">
          {/* Sliders and Brush Sizing inside options view */}
          {!processed && !processing && (
            <div className="flex items-center gap-3 justify-between mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Eraser className="w-4 h-4" />
                <span>画笔大小:</span>
                <span className="font-mono text-white font-semibold">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="8"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-1/2 accent-blue-500 cursor-pointer"
                id="brush-size-slider"
              />
              <button
                onClick={clearCanvas}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                title="清除涂抹遮罩"
                id="clear-mask-btn"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>重绘</span>
              </button>
            </div>
          )}

          {/* Action buttons list */}
          <div className="flex gap-2.5">
            {/* Upload block if not finished */}
            {!processed && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-[2] py-3.5 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 active:scale-95 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="editor-upload-image-btn"
              >
                <Upload className="w-4 h-4" />
                <span>上传本地图</span>
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
              id="file-input-image-editor"
            />

            {/* Erase toggle trigger / processed download toggle trigger */}
            {processed ? (
              <div className="w-full flex gap-3">
                <button
                  onClick={() => {
                    setProcessed(false);
                    setHasWatermark(true);
                  }}
                  className="flex-1 py-3.5 border border-slate-800 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
                  id="reset-editor-btn"
                >
                  再次修改
                </button>
                <button
                  onClick={downloadProcessedImage}
                  className="flex-1 py-3.5 bg-blue-500 hover:bg-blue-600 font-bold text-xs text-white rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  id="download-processed-image-btn"
                >
                  <Download className="w-4 h-4" />
                  <span>下载净化图</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleApplyEraser}
                disabled={processing}
                className="flex-[3] py-3.5 bg-[#1CB0F6] hover:bg-[#199edc] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                id="apply-eraser-btn"
              >
                <Sliders className="w-4 h-4" />
                <span>开始智能抠图模糊擦除</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
