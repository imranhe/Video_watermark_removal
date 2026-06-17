import React, { useState } from 'react';
import { ChevronRight, CreditCard, Clock, Share2, Headphones, Sparkles, X, Send, Copy, ThumbsUp } from 'lucide-react';
import { UserQuota, SupportMessage } from '../types';

interface UserProfileProps {
  quota: UserQuota;
  onNavigateToMembership: () => void;
  onNavigateToHistory: () => void;
}

export default function UserProfile({ quota, onNavigateToMembership, onNavigateToHistory }: UserProfileProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Live support chat state
  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([
    {
      id: 'init_1',
      sender: 'bot',
      text: '您好！我是极简去水印智能客服助理。请问您在使用过程中遇到了什么问题？',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 'init_2',
      sender: 'bot',
      text: '💡 推荐热点问题回复：\n1. 如何消除短视频水印？\n2. 每日免费时长是多少，怎么充值增加？\n3. 画笔涂抹不均匀如何精细化去除？',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleCopyShareLink = () => {
    // Mock write to copy
    const shareUrl = `${window.location.origin}/?referral=9735634`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMsg: SupportMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    const lowerTxt = inputMessage.toLowerCase();
    setInputMessage('');

    // Simulated Smart Response generator after a short timeout
    setTimeout(() => {
      let reply = '抱歉，我未能完全理解您的问题。您可以尝试输入：“充值”、“短视频”、“图片”或联系人工客服邮箱 gimlanhe@gmail.com 获得深度支持。';

      if (lowerTxt.includes('充值') || lowerTxt.includes('会员') || lowerTxt.includes('价格') || lowerTxt.includes('包月') || lowerTxt.includes('时长')) {
        reply = '💳 充值与会员说明：\n您可以点击菜单中的【Top-up】或前往“会员中心”选择体验套餐、基础版或高级版。体验版一年仅需99元（每天赠送300秒时长），购买成功后系统会即时为您增加时长和包月剩余天数！';
      } else if (lowerTxt.includes('视频') || lowerTxt.includes('链接') || lowerTxt.includes('抖音') || lowerTxt.includes('小红书') || lowerTxt.includes('tiktok')) {
        reply = '🎥 短视频平台提取教程：\n1. 在视频平台复制分享链接（如抖音中的“分享-复制链接”）。\n2. 打开首页，点击“Link Watermark”（链接提取）。\n3. 粘贴链接并点击解析。一键分析成功后即可直接把去水印原片保存到手机！';
      } else if (lowerTxt.includes('图片') || lowerTxt.includes('水印') || lowerTxt.includes('画笔') || lowerTxt.includes('涂抹') || lowerTxt.includes('擦除')) {
        reply = '🖼️ 图片修补精细化说明：\n点击首页的“Image Watermark”进入编辑器。使用画笔涂红色轨迹完全捂盖住文字/Logo水印，接着点击“智能一键消除去水印”。AI 会结合周围画布进行自动中和，如果擦除不够完美，您可以选择重绘再次操作。';
      } else if (lowerTxt.includes('字幕') || lowerTxt.includes('音轨') || lowerTxt.includes('提取字幕')) {
        reply = '📝 智能语音提取字幕介绍：\n您可以上传人声视频，点击“AI字幕”按钮。云引擎会快速分离人声音频并识别出普通话或英文，生成可自定义编辑的时间线输入卡片，最后支持导出标准 SRT 格式字幕供剪辑使用！';
      }

      const botMsg: SupportMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'bot',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, botMsg]);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full bg-[#FBFBFC] text-[#333333]" id="user-profile-view">
      {/* Scroll View Wrapper */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col items-center gap-6 pb-20" id="profile-container-scroller">
        
        {/* Top Header User Profile Card */}
        <div className="flex flex-col items-center gap-3 mt-4 shrink-0" id="profile-identity-card">
          {/* Avatar Graphic matches mockup style */}
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center shadow-md relative border-4 border-white">
            <svg viewBox="0 0 100 100" className="w-full h-full text-zinc-300">
              <circle cx="50" cy="50" r="48" fill="#E8EBED" />
              {/* Glasses guy avatar matching mock */}
              <g id="glasses-guy-face">
                {/* Hair */}
                <path d="M22,35 Q50,15 78,35 Q60,18 40,18 Q30,18 22,35" fill="#1C1E21" />
                <path d="M22,35 C20,40 22,45 28,45 C35,45 35,40 37,35 C38,35 45,34 50,34 C55,34 62,35 63,35 C65,40 65,45 72,45 C78,45 80,40 78,35" fill="#1C1E21" />
                {/* Glasses rims */}
                <circle cx="36" cy="48" r="8" fill="none" stroke="#222" strokeWidth="2.5" />
                <circle cx="64" cy="48" r="8" fill="none" stroke="#222" strokeWidth="2.5" />
                <line x1="44" y1="48" x2="56" y2="48" stroke="#222" strokeWidth="2.5" />
                <line x1="28" y1="48" x2="22" y2="45" stroke="#222" strokeWidth="2" />
                <line x1="72" y1="48" x2="78" y2="45" stroke="#222" strokeWidth="2" />
                {/* Nose and mouth */}
                <path d="M48,48 Q50,56 52,48" fill="none" stroke="#222" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M44,65 Q50,70 56,65" fill="none" stroke="#222" strokeWidth="1.5" strokeLinecap="round" />
                {/* Shoulders */}
                <path d="M20,95 C25,80 40,75 50,75 C60,75 75,80 80,95" fill="none" stroke="#222" strokeWidth="1.5" />
              </g>
            </svg>
          </div>
          <span className="text-zinc-600 font-mono text-sm tracking-wider font-semibold">
            ID: 9735634
          </span>
        </div>

        {/* Diagonal purple to blue quota badge card */}
        <div className="w-full bg-gradient-to-r from-[#905DFA] to-[#59B2F2] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col items-center justify-center text-center border border-white/5 shrink-0" id="quota-gradient-card">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <h2 className="text-3xl font-black font-sans leading-none tracking-tight py-1" id="quota-seconds-lbl">
            {quota.remainingSeconds}s remaining
          </h2>
          <span className="text-xs text-[#E9F0FD] tracking-wide mt-2 block font-medium uppercase font-sans">
            Daily Quota
          </span>
        </div>

        {/* Main List Menu Cards Groups, matching screenshot visual patterns perfectly */}
        <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-150/55 overflow-hidden flex flex-col divide-y divide-gray-100/80 shrink-0" id="profile-menu-container">
          
          {/* Menu item 1: Top-up */}
          <div
            onClick={onNavigateToMembership}
            className="flex items-center justify-between p-4.5 hover:bg-slate-50 transition-colors cursor-pointer group"
            id="profile-menu-topup"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center border border-orange-100">
                <CreditCard className="w-4.5 h-4.5 stroke-[2.5]" />
              </div>
              <span className="font-bold text-sm text-gray-800">Top-up</span>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Menu item 2: History */}
          <div
            onClick={onNavigateToHistory}
            className="flex items-center justify-between p-4.5 hover:bg-slate-50 transition-colors cursor-pointer group"
            id="profile-menu-history"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center border border-blue-100">
                <Clock className="w-4.5 h-4.5 stroke-[2.5]" />
              </div>
              <span className="font-bold text-sm text-gray-800">History</span>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Menu item 3: Share */}
          <div
            onClick={() => setShowShareModal(true)}
            className="flex items-center justify-between p-4.5 hover:bg-slate-50 transition-colors cursor-pointer group"
            id="profile-menu-share"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 bg-purple-50 text-[#8254EE] rounded-xl flex items-center justify-center border border-purple-100">
                <Share2 className="w-4.5 h-4.5 stroke-[2.5]" />
              </div>
              <span className="font-bold text-sm text-gray-800">Share</span>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Menu item 4: Contact Support */}
          <div
            onClick={() => setShowSupportModal(true)}
            className="flex items-center justify-between p-4.5 hover:bg-slate-50 transition-colors cursor-pointer group"
            id="profile-menu-support"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 bg-green-50 text-green-500 rounded-xl flex items-center justify-center border border-green-100">
                <Headphones className="w-4.5 h-4.5 stroke-[2.5]" />
              </div>
              <span className="font-bold text-sm text-gray-800">Contact Support</span>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
          </div>

        </div>

      </div>

      {/* Share popup frame modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-[320px] shadow-2xl relative border border-gray-100 animate-zoom-in" id="share-modal">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mt-2 flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-3 border border-blue-100">
                <Share2 className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">邀请好友 共享时长</h3>
              <p className="text-xs text-gray-400 px-3 mt-1.5 leading-relaxed">
                分享给好友，只要好友通过您的专属链接访问注册，双方均可立即额外解锁 <span className="text-blue-500 font-bold">100秒</span> 永久使用时长！
              </p>

              {/* Share block link container */}
              <div className="w-full mt-5 bg-gray-50 border border-gray-150 rounded-xl p-3 text-left">
                <span className="text-[10px] text-zinc-400 font-medium block">测试专属推广链接</span>
                <span className="text-xs text-gray-700 font-mono select-all block truncate mt-1">
                  {window.location.origin}/?ref=9735634
                </span>
              </div>

              {/* Press button to copy */}
              <button
                onClick={handleCopyShareLink}
                className="w-full mt-4 py-3 bg-[#1CB0F6] hover:bg-[#199edc] active:scale-95 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                id="copy-share-hyperlink"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedLink ? '链接复制成功！' : '一键复制分享链接'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support customer chat popup dialog */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-[350px] h-[480px] shadow-2xl relative border border-gray-100 flex flex-col overflow-hidden animate-zoom-in" id="support-active-chat">
            {/* Modal header details */}
            <div className="p-4 bg-slate-800 text-white shrink-0 flex items-center justify-between border-b border-slate-700/60 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
                <span className="text-sm font-bold">技术客服助理 (在线中)</span>
              </div>
              <button
                onClick={() => setShowSupportModal(false)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                id="close-support-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation list box */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50" id="chat-messages-scroll">
              {chatMessages.map((msg) => {
                const isBot = msg.sender === 'bot';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${
                      isBot ? 'self-start items-start' : 'self-end items-end'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isBot
                          ? 'bg-white border border-gray-150 text-gray-800 shadow-sm rounded-tl-none'
                          : 'bg-blue-500 text-white shadow rounded-tr-none'
                      } whitespace-pre-line`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-zinc-400 font-mono mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom active chat message box */}
            <div className="p-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="在此输入您的问题描述..."
                className="flex-1 border border-zinc-200 focus:outline-none focus:border-blue-500 font-normal py-2 px-3 text-xs rounded-xl bg-gray-50 text-gray-800"
                id="chat-input-text"
              />
              <button
                onClick={handleSendMessage}
                className="p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow cursor-pointer transition-colors"
                id="chat-send-btn"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
