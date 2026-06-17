import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RefreshCw, Plus, Trash2, Download, Subtitles, Upload, Sparkles, ChevronLeft } from 'lucide-react';
import { HistoryItem, SubtitleItem } from '../types';

interface VideoSubtitleEditorProps {
  onClose: () => void;
  onAddHistory: (item: HistoryItem) => void;
}

const DEMO_VIDEO_URL = 'https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-neon-lights-42935-large.mp4';

export default function VideoSubtitleEditor({ onClose, onAddHistory }: VideoSubtitleEditorProps) {
  const [videoSrc, setVideoSrc] = useState(DEMO_VIDEO_URL);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Default preset captions to load
  const presetCaptions: SubtitleItem[] = [
    { id: '1', startTime: '0.0', endTime: '4.5', text: '大家好，欢迎来到 AI 多媒体去水印与智能字幕工具箱！' },
    { id: '2', startTime: '5.0', endTime: '9.0', text: '现在演示的是智能字幕自动提取功能，完美对接高码率语音解析。' },
    { id: '3', startTime: '9.5', endTime: '14.0', text: '支持在线自定义编辑，您可以自由修改时间轴和字幕文案。' },
    { id: '4', startTime: '15.0', endTime: '20.0', text: '极简无残留！欢迎充值我们的高级包月会员开启无限提取。' },
  ];

  // Monitor playback time to overlay the correct subtitle line in the viewport
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);

      // Find if any subtitle is active
      const currentSub = subtitles.find(
        (sub) => time >= parseFloat(sub.startTime) && time <= parseFloat(sub.endTime)
      );
      setActiveSubtitle(currentSub ? currentSub.id : null);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [subtitles]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => {
        setIsPlaying(true);
      });
    }
  };

  const jumpToTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    setCurrentTime(seconds);
    if (!isPlaying) {
      video.play().then(() => setIsPlaying(true));
    }
  };

  const handleGenerateSubtitles = () => {
    setGenerating(true);
    setSubtitles([]);
    setIsPlaying(false);
    if (videoRef.current) videoRef.current.pause();

    const steps = [
      '正在分离音质轨道并提取音频采样率...',
      '正在连接智能 AI 声学语谱解码服务...',
      '开始中文普通话/英文语义断句解析...',
      '正在精确校对毫秒级别时间戳标记...',
      '整理字幕帧序列中...',
    ];

    let stepIdx = 0;
    setGenerationStep(steps[0]);

    const timer = setInterval(() => {
      stepIdx += 1;
      if (stepIdx < steps.length) {
        setGenerationStep(steps[stepIdx]);
      } else {
        clearInterval(timer);
        setGenerating(false);
        setSubtitles(presetCaptions);
        
        // Add to global user history
        const infoTitle = videoSrc === DEMO_VIDEO_URL 
          ? 'Presentation_Video_Subtitled.mp4' 
          : 'Custom_Video_Subtitles_' + Math.floor(100+Math.random()*900) + '.mp4';
        
        const newItem: HistoryItem = {
          id: Math.random().toString(36).substr(2, 9),
          name: infoTitle,
          type: 'video',
          date: new Date().toISOString().slice(0, 10),
          url: videoSrc,
          status: 'download',
          subtitleList: presetCaptions
        };
        onAddHistory(newItem);
      }
    }, 900);
  };

  const handleUploadVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    setVideoSrc(fileUrl);
    setSubtitles([]);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const updateSubtitleText = (id: string, text: string) => {
    setSubtitles((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, text } : sub))
    );
  };

  const updateSubtitleTimes = (id: string, field: 'startTime' | 'endTime', val: string) => {
    setSubtitles((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, [field]: val } : sub))
    );
  };

  const addSubtitleRow = () => {
    const lastSub = subtitles[subtitles.length - 1];
    const newStart = lastSub ? (parseFloat(lastSub.endTime) + 1.0).toFixed(1) : '0.0';
    const newEnd = lastSub ? (parseFloat(lastSub.endTime) + 4.0).toFixed(1) : '3.0';

    const newSub: SubtitleItem = {
      id: Math.random().toString(36).substr(2, 9),
      startTime: newStart,
      endTime: newEnd,
      text: '请在这里编写字幕内容...',
    };
    setSubtitles([...subtitles, newSub]);
  };

  const removeSubtitleRow = (id: string) => {
    setSubtitles(subtitles.filter((sub) => sub.id !== id));
  };

  const downloadSRTFile = () => {
    if (subtitles.length === 0) return;

    // Build .srt string formatting
    let srtText = '';
    subtitles.forEach((sub, idx) => {
      const startSec = parseFloat(sub.startTime);
      const endSec = parseFloat(sub.endTime);

      const formatTime = (totalSec: number) => {
        const hrs = Math.floor(totalSec / 3600).toString().padStart(2, '0');
        const mins = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
        const secs = Math.floor(totalSec % 60).toString().padStart(2, '0');
        const ms = Math.floor((totalSec % 1) * 1000).toString().padStart(3, '0');
        return `${hrs}:${mins}:${secs},${ms}`;
      };

      srtText += `${idx + 1}\n`;
      srtText += `${formatTime(startSec)} --> ${formatTime(endSec)}\n`;
      srtText += `${sub.text}\n\n`;
    });

    const blob = new Blob([srtText], { type: 'text/srt;charset=utf-8;' });
    const srtUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = srtUrl;
    link.download = 'video_caption_subtitles.srt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white select-none" id="video-subtitle-editor">
      {/* App Header Bar mimicking standard mobile viewports */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700/60 shrink-0">
        <button
          onClick={onClose}
          className="flex items-center text-gray-300 hover:text-white transition-colors cursor-pointer"
          id="subtitle-back-btn"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>返回</span>
        </button>
        <span className="font-semibold text-sm">AI 视频智能提取字幕</span>
        <div className="w-8" />
      </div>

      {/* Editor Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950">
        {/* Left Side: Video Output Window */}
        <div className="flex-1 flex flex-col justify-center items-center p-3 relative border-b md:border-b-0 md:border-r border-slate-800 shrink-0 md:w-1/2">
          {/* Main Video Box Wrapper */}
          <div className="relative w-full max-w-[340px] aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800" id="video-container-box">
            <video
              ref={videoRef}
              src={videoSrc}
              onClick={handlePlayPause}
              className="w-full h-full object-cover"
              playsInline
              id="subtitle-video-player"
            />

            {/* Custom Overlay Subtitle Display */}
            {activeSubtitle && (
              <div
                className="absolute bottom-5 left-1/2 -translate-x-1/2 w-4/5 text-center text-white text-xs leading-relaxed bg-black/60 backdrop-blur-sm border border-white/5 py-1.5 px-3 rounded-lg pointer-events-none select-none z-10 animate-fade-in"
                id="active-subtitle-rendered"
              >
                {subtitles.find((sub) => sub.id === activeSubtitle)?.text}
              </div>
            )}

            {/* Simulated generation loading cover */}
            {generating && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-4 text-center">
                <Subtitles className="w-10 h-10 text-blue-400 animate-pulse mb-3" />
                <span className="text-xs font-semibold tracking-wide text-gray-200">正在调用智能 AI 云引擎解析...</span>
                <span className="text-[10px] text-blue-400 font-mono mt-1 mb-3 animate-pulse">{generationStep}</span>
                <div className="w-[120px] bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 animate-slide-wide rounded-full w-2/3" />
                </div>
              </div>
            )}
          </div>

          {/* Simple video control stats bar */}
          <div className="w-full max-w-[340px] flex items-center justify-between mt-3 text-[10px] text-slate-400 px-1 font-mono">
            {/* Play pause icon indicator */}
            <button
              onClick={handlePlayPause}
              className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-lg flex items-center gap-1 cursor-pointer"
              id="subtitle-play-pause-btn"
            >
              {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
              <span>{isPlaying ? '暂停' : '播放'}</span>
            </button>

            <span>
              {currentTime.toFixed(1)}s / {duration ? duration.toFixed(1) : '0.0'}s
            </span>
          </div>
        </div>

        {/* Right Side: Interactive captions timeline editing list */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
          <div className="p-3 bg-slate-800/50 border-b border-slate-800 shrink-0 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300">对齐时间轴文本</span>
            {subtitles.length > 0 && (
              <button
                onClick={downloadSRTFile}
                className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-[10px] font-bold text-white shadow cursor-pointer transition-colors"
                id="export-srt-btn"
              >
                <Download className="w-3 h-3" />
                <span>导出 SRT 字幕</span>
              </button>
            )}
          </div>

          {/* Subtitles Items List Table Container */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5" id="subtitles-list-scroll">
            {subtitles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500" id="subtitles-empty-state">
                <Subtitles className="w-12 h-12 stroke-[1.5] text-slate-600 mb-2" />
                <p className="text-xs">暂无字幕时间线数据</p>
                <p className="text-[10px] text-slate-600 mt-1">请上传视频或直接点击一键提取生成字幕</p>
              </div>
            ) : (
              subtitles.map((sub, idx) => (
                <div
                  key={sub.id}
                  className={`p-2.5 rounded-xl border transition-all ${
                    activeSubtitle === sub.id
                      ? 'bg-blue-950/40 border-blue-500/80 shadow-md shadow-blue-500/5'
                      : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70'
                  }`}
                  id={`subtitle-item-row-${sub.id}`}
                >
                  {/* Headline item and times */}
                  <div className="flex items-center justify-between mb-1.5 shrink-0 gap-2">
                    <button
                      onClick={() => jumpToTime(parseFloat(sub.startTime))}
                      className="flex items-center gap-1 hover:text-blue-400 text-left cursor-pointer"
                      id={`subtitle-jump-btn-${sub.id}`}
                    >
                      <span className="text-[10px] text-zinc-500 font-mono">序号: {idx + 1}</span>
                      <Play className="w-2.5 h-2.5 text-blue-500 fill-current" />
                    </button>

                    <div className="flex items-center gap-1 font-mono text-[10px] text-gray-300">
                      <input
                        type="text"
                        value={sub.startTime}
                        onChange={(e) => updateSubtitleTimes(sub.id, 'startTime', e.target.value)}
                        className="w-10 text-center bg-slate-900 border border-slate-700 rounded py-0.5"
                        placeholder="0.0"
                      />
                      <span className="text-gray-500">→</span>
                      <input
                        type="text"
                        value={sub.endTime}
                        onChange={(e) => updateSubtitleTimes(sub.id, 'endTime', e.target.value)}
                        className="w-10 text-center bg-slate-900 border border-slate-700 rounded py-0.5"
                        placeholder="3.0"
                      />
                      <span className="text-gray-500">秒</span>
                    </div>

                    <button
                      onClick={() => removeSubtitleRow(sub.id)}
                      className="text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors"
                      id={`delete-subtitle-row-${sub.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Text value field */}
                  <textarea
                    value={sub.text}
                    onChange={(e) => updateSubtitleText(sub.id, e.target.value)}
                    rows={1}
                    className="w-full text-xs p-1.5 focus:outline-none bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg text-white"
                    placeholder="在此编写本段字幕的对白文字..."
                  />
                </div>
              ))
            )}
          </div>

          {/* Subtitles actions bar */}
          <div className="p-3 bg-slate-850 border-t border-slate-800 flex gap-2 shrink-0">
            {subtitles.length > 0 ? (
              <>
                <button
                  onClick={addSubtitleRow}
                  className="flex-1 py-2.5 border border-slate-700 hover:border-slate-500 text-xs font-semibold text-gray-300 hover:text-white rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all"
                  id="add-blank-subtitle-btn"
                >
                  <Plus className="w-4 h-4" />
                  <span>添加空行</span>
                </button>

                <button
                  onClick={handleGenerateSubtitles}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-755 text-xs text-blue-400 border border-blue-500/20 font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all"
                  id="recalculate-subtitles-btn"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>重新提取</span>
                </button>
              </>
            ) : (
              <div className="w-full flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 border border-slate-755 hover:border-slate-600 bg-slate-900 text-xs text-silver font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  id="subtitle-select-local-video"
                >
                  <Upload className="w-4 h-4" />
                  <span>载入本地视频</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadVideo}
                  accept="video/*"
                  className="hidden"
                  id="file-input-subtitles-video"
                />

                <button
                  onClick={handleGenerateSubtitles}
                  disabled={generating}
                  className="flex-[2] py-3 bg-[#1CB0F6] hover:bg-[#199edc] text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  id="subtitle-trigger-ai-btn"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>一键智能语音生成字幕</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
