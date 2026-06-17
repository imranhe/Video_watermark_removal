import React, { useState } from 'react';
import { Play, Download, CheckCircle, AlertCircle, Sparkles, Clipboard, RefreshCw } from 'lucide-react';
import { HistoryItem } from '../types';

interface LinkWatermarkSheetProps {
  onClose: () => void;
  onAddHistory: (item: HistoryItem) => void;
}

export default function LinkWatermarkSheet({ onClose, onAddHistory }: LinkWatermarkSheetProps) {
  const [url, setUrl] = useState('');
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mockPreloadedLinks = [
    { title: '抖音/TikTok 运动教学', url: 'https://v.douyin.com/JyH89sk/ Video_Sport_Tutorial.mp4' },
    { title: '小红书 唯美风景视频', url: 'https://www.xhs.com/explore/65e921bc000 Scenic_Nature.mp4' },
    { title: '剪映/CapCut 模板剪辑', url: 'https://v.kuaishou.com/s/9a7Klb0f Tech_Presentation.mp4' },
  ];

  const handlePasteDemo = (demoUrl: string) => {
    setUrl(demoUrl);
    setError(null);
  };

  const handleParse = () => {
    if (!url.trim()) {
      setError('请输入有效的短视频或图片分享链接');
      return;
    }

    setParsing(true);
    setProgress(0);
    setResultVideo(null);
    setError(null);

    // Simulated parsing steps
    const steps = [
      '正在建立与服务器的加密通道...',
      '正在检测社交平台所属 API (抖音/小红书/TikTok)...',
      'API 连接成功，正在解析无水印原视频数据...',
      '提取原始音轨与高码率视频轨道...',
      '消除发布自媒体平台尾部水印帧...',
      '水印脱圈融合，生成高清无损视频...',
    ];

    let currentStepIdx = 0;
    setCurrentStep(steps[0]);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setParsing(false);
          
          // Generate a high-quality video link using standard beautiful stock loops
          let demoVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-keyboard-and-mouse-with-rgb-lighting-in-dark-42861-large.mp4';
          let title = 'Parsed_Video_' + Math.floor(100000 + Math.random() * 900000) + '.mp4';
          
          if (url.includes('xhs') || url.includes('explore')) {
            demoVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4';
            title = 'Image_watermark_removed.png';
          } else if (url.includes('douyin') || url.includes('CapCut')) {
            demoVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-waves-breaking-in-the-sea-from-above-39986-large.mp4';
            title = 'Video_' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '.mp4';
          } else {
            demoVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-neon-lights-42935-large.mp4';
            title = 'Creative_Presentation_Video.mov';
          }

          setResultVideo(demoVideoUrl);
          setVideoTitle(title);

          // Add to history
          const isImg = title.endsWith('.png');
          const newItem: HistoryItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: title,
            type: isImg ? 'image' : 'video',
            date: new Date().toISOString().slice(0, 10),
            url: demoVideoUrl,
            status: isImg ? 'view' : 'download',
            originalUrl: isImg ? 'https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?auto=format&fit=crop&w=600&q=80' : demoVideoUrl
          };
          onAddHistory(newItem);
          return 100;
        }
        
        const nextProgress = prev + Math.floor(Math.random() * 12) + 5;
        const stepIdx = Math.floor((nextProgress / 100) * steps.length);
        if (stepIdx < steps.length && stepIdx > currentStepIdx) {
          currentStepIdx = stepIdx;
          setCurrentStep(steps[stepIdx]);
        }
        return nextProgress > 100 ? 100 : nextProgress;
      });
    }, 280);
  };

  const downloadVideo = () => {
    if (!resultVideo) return;
    // Simulate browser download
    const link = document.createElement('a');
    link.href = resultVideo;
    link.setAttribute('download', videoTitle);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4" id="link-watermark-sheet">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          链接提取去水印 (Link Extractor)
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 text-sm font-medium rounded-full hover:bg-gray-100"
          id="close-link-sheet-btn"
        >
          关闭
        </button>
      </div>

      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        支持 抖音、快手、小红书、TikTok、Youtube Shorts 等平台的分享链接。系统会自动匹配原画接口，绕过所有流媒体水印。
      </p>

      {/* Input container */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-1.5">输入或粘贴分享链接</label>
        <div className="relative">
          <textarea
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="例如: http://v.douyin.com/abcde123/ 或选中文字分享..."
            className="w-full h-24 p-3 pr-10 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none resize-none placeholder:text-gray-400 text-gray-800 bg-gray-50/50"
            id="link-watermark-textarea"
          />
          <button
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                if (text) {
                  setUrl(text);
                  setError(null);
                }
              } catch (e) {
                // Clipboard fallback
              }
            }}
            className="absolute right-2 bottom-2 text-gray-400 hover:text-blue-500 p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-100"
            title="贴纸剪贴板中的内容"
            id="paste-clipboard-btn"
          >
            <Clipboard className="w-4 h-4" />
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500" id="link-error-msg">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}
      </div>

      {/* Quick demo links */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-gray-500 mb-2">💡 快捷点击模板进行测试：</label>
        <div className="flex flex-col gap-2">
          {mockPreloadedLinks.map((link, idx) => (
            <button
              key={idx}
              onClick={() => handlePasteDemo(link.url)}
              className="flex items-center justify-between p-2.5 text-left text-xs bg-gray-50 hover:bg-blue-50/60 active:bg-blue-100/60 text-gray-700 rounded-lg border border-gray-100 hover:border-blue-200 transition-all cursor-pointer group"
              id={`demo-link-btn-${idx}`}
            >
              <span className="font-medium group-hover:text-blue-600">{link.title}</span>
              <span className="text-[10px] text-gray-400 group-hover:text-blue-400 truncate max-w-[200px] font-mono">
                {link.url.slice(0, 30)}...
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Processing Animation */}
      {parsing && (
        <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl mb-6 flex flex-col items-center justify-center animate-fade-in" id="parsing-progress-box">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-2">
            <div
              className="bg-blue-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between w-full text-xs text-gray-400 mb-2 font-mono">
            <span>正在解析...</span>
            <span>{progress}%</span>
          </div>
          <span className="text-xs font-medium text-blue-700 text-center animate-pulse">
            {currentStep}
          </span>
        </div>
      )}

      {/* Done State Display */}
      {resultVideo && !parsing && (
        <div className="p-4 bg-green-50/70 border border-green-200/50 rounded-2xl mb-6 text-center animate-fade-in" id="parsing-result-box">
          <div className="flex items-center justify-center gap-2 text-green-700 font-bold mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>无水印视频解析成功！</span>
          </div>

          <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-black aspect-video mb-4 relative group" id="parsing-preview-player-box">
            <video
              src={resultVideo}
              controls
              className="w-full h-full object-contain"
              playsInline
              id="parsed-video-preview"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-xs text-gray-500 font-mono truncate max-w-full px-2">
              文件名: {videoTitle}
            </div>
            <button
              onClick={downloadVideo}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#1CB0F6] hover:bg-[#199edc] active:scale-[0.98] text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
              id="download-parsed-video-btn"
            >
              <Download className="w-5 h-5" />
              立即下载无水印视频
            </button>
          </div>
        </div>
      )}

      {/* Parse trigger button */}
      {!parsing && !resultVideo && (
        <button
          onClick={handleParse}
          className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          id="trigger-parsing-btn"
        >
          <Play className="w-4 h-4 fill-current" />
          立即解析去水印
        </button>
      )}
    </div>
  );
}
