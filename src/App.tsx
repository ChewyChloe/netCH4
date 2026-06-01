/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  TrendingUp,
  Compass,
  HelpCircle,
  Activity,
  FileText,
  CheckCircle,
  Check,
  ChevronRight,
  Monitor,
  Server,
  Hash,
  ArrowRight,
  RotateCcw,
  Play,
  CheckCircle2,
  Award,
  Terminal,
  Sliders,
  Database,
  Layers,
  Lock,
  Unlock,
} from 'lucide-react';

import { CHAPTER_MODULES, QUIZ_QUESTIONS } from './data.ts';
import { ModuleId, ScoreState } from './types.ts';
import { ModuleCard } from './components/ModuleCard.tsx';
import { ConceptCard } from './components/ConceptCard.tsx';
import { InteractiveDiagram } from './components/InteractiveDiagram.tsx';
import { QuizCard } from './components/QuizCard.tsx';
import { StepTimeline } from './components/StepTimeline.tsx';
import { ComparisonTable } from './components/ComparisonTable.tsx';
import { MiniSimulatorContainer } from './components/MiniSimulatorContainer.tsx';
import { NetworkLayerOverview } from './components/NetworkLayerOverview.tsx';
import { RouterArchitecture } from './components/RouterArchitecture.tsx';
import { LongestPrefixMatcher } from './components/LongestPrefixMatcher.tsx';
import { QueueSchedulingPlayground } from './components/QueueSchedulingPlayground.tsx';
import { Ipv4HeaderExplorer } from './components/Ipv4HeaderExplorer.tsx';
import { Ipv4FragmentationSimulator } from './components/Ipv4FragmentationSimulator.tsx';
import { IpAddressingSubnets } from './components/IpAddressingSubnets.tsx';
import { DhcpDoraTimeline } from './components/DhcpDoraTimeline.tsx';
import { NatTranslationSimulator } from './components/NatTranslationSimulator.tsx';
import { Ipv6Explorer } from './components/Ipv6Explorer.tsx';
import { SdnOpenFlowBuilder } from './components/SdnOpenFlowBuilder.tsx';
import { MiddleboxesExplorer } from './components/MiddleboxesExplorer.tsx';
import { QuizCenter } from './components/QuizCenter.tsx';
import { Chapter4SummaryCheatSheet } from './components/Chapter4SummaryCheatSheet.tsx';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId | 'home'>('home');
  const [visitedModules, setVisitedModules] = useState<Record<string, boolean>>({
    overview: true,
  });
  const [isSequentialMode, setIsSequentialMode] = useState<boolean>(true);
  const [ipv4ActiveTab, setIpv4ActiveTab] = useState<'explorer' | 'fragmentation'>('explorer');

  // Quiz state
  const [quizScore, setQuizScore] = useState<ScoreState>({
    answeredCount: 0,
    correctCount: 0,
    completed: false,
    history: {},
  });
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);

  // Mark a module as read
  const handleMarkAsRead = (id: string) => {
    setVisitedModules((prev) => ({ ...prev, [id]: true }));
  };

  // Get reading progress
  const totalModules = CHAPTER_MODULES.length;
  const completedCount = Object.keys(visitedModules).length;
  const readingProgressPercent = Math.min(
    100,
    Math.round((completedCount / totalModules) * 100)
  );

  // Router architecture diagram hovered info state - handled in custom InteractiveDiagram
  const handleSelectModule = (id: ModuleId | 'home') => {
    setActiveModule(id);
    if (id !== 'home' && id !== 'quizzes' && id !== 'summary') {
      handleMarkAsRead(id);
    }
  };

  // Handle Quiz Submissions
  const handleSelectQuizOption = (questionId: number, selectedIdx: number) => {
    if (quizScore.history[questionId] !== undefined) return; // already answered

    const question = QUIZ_QUESTIONS.find((q) => q.id === questionId);
    if (!question) return;

    const isCorrect = question.correctIndex === selectedIdx;

    setQuizScore((prev) => {
      const nextHistory = { ...prev.history, [questionId]: selectedIdx };
      const nextAnswered = prev.answeredCount + 1;
      const nextCorrect = isCorrect ? prev.correctCount + 1 : prev.correctCount;
      const isQuizDone = nextAnswered === QUIZ_QUESTIONS.length;

      return {
        answeredCount: nextAnswered,
        correctCount: nextCorrect,
        completed: isQuizDone,
        history: nextHistory,
      };
    });
  };

  const handleNextQuiz = () => {
    if (currentQuizIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuizIndex((prev) => prev + 1);
    } else {
      // Completed!
      setQuizScore((prev) => ({ ...prev, completed: true }));
    }
  };

  const handleRestartQuiz = () => {
    setQuizScore({
      answeredCount: 0,
      correctCount: 0,
      completed: false,
      history: {},
    });
    setCurrentQuizIndex(0);
  };

  // Get module icon according to content
  const getModuleIcon = (id: ModuleId) => {
    switch (id) {
      case 'overview':
        return Compass;
      case 'router-arch':
        return Sliders;
      case 'prefix-match':
        return Hash;
      case 'queue-schedule':
        return Activity;
      case 'ipv4-datagram':
        return Database;
      case 'ip-addressing':
        return Layers;
      case 'dhcp':
        return TrendingUp;
      case 'nat':
        return Server;
      case 'ipv6':
        return Monitor;
      case 'sdn-openflow':
        return Terminal;
      case 'middleboxes':
        return BookOpen;
      default:
        return BookOpen;
    }
  };

  // Get module metadata according to id
  const getModuleMetadata = (id: string) => {
    switch (id) {
      case 'overview':
        return { difficulty: '易', duration: '10分鐘', color: 'text-green-600 bg-green-50 border-green-200' };
      case 'router-arch':
        return { difficulty: '中', duration: '15分鐘', color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'prefix-match':
        return { difficulty: '中', duration: '15分鐘', color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'queue-schedule':
        return { difficulty: '難', duration: '20分鐘', color: 'text-rose-600 bg-rose-50 border-rose-200' };
      case 'ipv4-datagram':
        return { difficulty: '中', duration: '15分鐘', color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'ip-addressing':
        return { difficulty: '難', duration: '25分鐘', color: 'text-rose-600 bg-rose-50 border-rose-200' };
      case 'dhcp':
        return { difficulty: '易', duration: '12分鐘', color: 'text-green-600 bg-green-50 border-green-200' };
      case 'nat':
        return { difficulty: '中', duration: '15分鐘', color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'ipv6':
        return { difficulty: '中', duration: '15分鐘', color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'sdn-openflow':
        return { difficulty: '難', duration: '20分鐘', color: 'text-rose-600 bg-rose-50 border-rose-200' };
      case 'middleboxes':
        return { difficulty: '易', duration: '10分鐘', color: 'text-green-600 bg-green-50 border-green-200' };
      default:
        return { difficulty: '中', duration: '15分鐘', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    }
  };

  // Find active module data
  const currentModuleData = CHAPTER_MODULES.find((m) => m.id === activeModule);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none" id="app">
      {/* HEADER SECTION */}
      <header className="bg-white border-b border-slate-150 px-6 py-4 sticky top-0 z-40 shadow-sm" id="header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                網路層：資料平面 互動式學習導航
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                電腦網路第八版第四章：電腦網路：由下而上方法（Computer Networking: A Top-Down Approach）第八版
              </p>
            </div>
          </div>

          {/* Reading progress ticker card */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-150/60 rounded-xl px-4 py-2 w-full sm:w-auto justify-between sm:justify-start">
            <div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  閱讀進度
                </span>
                <span className="font-mono text-xs font-bold text-blue-600">
                  {readingProgressPercent}%
                </span>
              </div>
              <div className="w-36 h-2 bg-slate-200 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${readingProgressPercent}%` }}
                />
              </div>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                學員卡片
              </span>
              <span className="text-xs font-bold text-slate-600 font-mono">
                {completedCount}/{totalModules} 章節已畢
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* DASHBOARD GRID BODY */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6" id="dashboard-body">
        {/* SIDEBAR NAVIGATION */}
        <aside className="lg:col-span-1 flex flex-col gap-5" id="sidebar">
          {/* General guide navigators */}
          <div className="bg-white border border-slate-150/60 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3 px-1">
              學習大盤引導 (Main Directory)
            </h3>
            <div className="space-y-1">
              <button
                id="btn-nav-home"
                onClick={() => handleSelectModule('home')}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition-colors duration-200 ${
                  activeModule === 'home'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>學堂首頁與前言</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                id="btn-nav-quizzes"
                onClick={() => handleSelectModule('quizzes')}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition-colors duration-200 ${
                  activeModule === 'quizzes'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>隨堂測驗中心</span>
                  {quizScore.completed && (
                    <span className="text-[9px] bg-green-500 text-white rounded-full px-1.5 font-bold">
                      {quizScore.correctCount}/{QUIZ_QUESTIONS.length}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                id="btn-nav-summary"
                onClick={() => handleSelectModule('summary')}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition-colors duration-200 ${
                  activeModule === 'summary'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>重點複習與備忘卡</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            </div>
          </div>

          {/* ROADMAP TRACKER PANEL */}
          <div className="bg-white border border-slate-150/60 rounded-xl p-4 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3 px-1">
                分單元學習地圖 (Learning Roadmap)
              </h3>
              <div className="space-y-1.5 overflow-y-auto max-h-[480px] pr-1">
                {CHAPTER_MODULES.map((m, i) => {
                  const isCurrent = activeModule === m.id;
                  const isRead = visitedModules[m.id];
                  const Icon = getModuleIcon(m.id);

                  return (
                    <button
                      key={m.id}
                      id={`sidebar-item-${m.id}`}
                      onClick={() => handleSelectModule(m.id)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center gap-2.5 transition-all duration-200 ${
                        isCurrent
                          ? 'bg-slate-800 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-650 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-md ${
                          isCurrent
                            ? 'bg-blue-500 text-white'
                            : isRead
                            ? 'bg-green-50 text-green-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isRead && !isCurrent ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Icon className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold truncate text-[11px]">{m.title}</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 block truncate">
                          {m.englishTitle}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Overall bottom notice block */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="p-3 bg-blue-50/50 rounded-xl text-[11px] text-blue-700/80 leading-normal font-medium">
                💡 點擊上方的任何章節地圖條目，即可自動切換至相應的互動學習單元。
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN VIEWPORT PANELS */}
        <main className="lg:col-span-3 flex flex-col gap-6" id="main-content">
          <AnimatePresence mode="wait">
            {/* 1. HOME WELCOME SCREEN */}
            {activeModule === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10 text-left"
              >
                {/* HERO SECTION */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 p-8 md:p-10 text-white border border-slate-800 shadow-xl">
                  {/* Decorative background grids */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25" />
                  
                  <div className="relative z-10 space-y-6 max-w-4xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold font-mono text-xs rounded-full tracking-wider uppercase">
                      ⚡ 第四章：網路層 — 資料平面（Chapter 4: Network Layer — Data Plane）
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                      網路層：資料平面
                      <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 text-xl font-medium tracking-normal mt-1 text-slate-350">
                        Network Layer: Data Plane — 端對端封包傳輸的奈秒級物理引擎
                      </span>
                    </h2>
                    
                    <p className="text-sm md:text-base text-slate-300 leading-relaxed font-normal">
                      傳統的網路層負責將封包從傳送端一路導流至接收端。而在本章中，我們將核心注意力放置在「資料平面（Data Plane）」。您將親自探索路由器如何依靠高度最佳化的硬體晶片，在微秒甚至「奈秒級（Nanosecond）」的時間尺度內，落實高通量、並行查表轉送（Lookup & Forwarding）的極致藝術。
                    </p>
                    
                    {/* CTA Buttons Grid */}
                    <div className="flex flex-wrap items-center gap-3 pt-4">
                      <button
                        id="btn-hero-start"
                        onClick={() => handleSelectModule('overview')}
                        className="flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all duration-150 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>開始探索單元（Start Learning）</span>
                      </button>
                      
                      <button
                        id="btn-hero-quizzes"
                        onClick={() => handleSelectModule('quizzes')}
                        className="flex items-center gap-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-650 px-6 py-3.5 rounded-xl transition-colors cursor-pointer"
                      >
                        <Award className="w-4 h-4" />
                        <span>打開隨堂測驗中心（Open Quiz Center）</span>
                      </button>
                      
                      <button
                        id="btn-hero-cheat"
                        onClick={() => handleSelectModule('summary')}
                        className="flex items-center gap-2 text-xs font-bold text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-400/20 px-6 py-3.5 rounded-xl transition-colors cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        <span>觀看終極備考備忘卡（View Cheat Sheet）</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* VISUAL LEARNING PATH */}
                <div className="bg-white border border-slate-150/85 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                  <div className="text-left space-y-1">
                    <h3 className="text-lg font-black text-slate-850 flex items-center gap-2">
                      <Compass className="w-5 h-5 text-blue-600 animate-spin-slow" />
                      封包資料流：視覺化全景導航路徑（Interactive Packet Flow & Architecture Evolution Path）
                    </h3>
                    <p className="text-xs text-slate-500 leading-normal">
                      這是一條連貫的封包傳遞與技術演化脈絡，展示一粒位元從在本地主機被封裝起、穿透複雜的中介路由，最後在軟體定義網路（SDN）與中介設備中被精準分流決策的宏大過程：
                    </p>
                  </div>

                  {/* Horizontal pathway on md+, vertical on mobile */}
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 relative pt-2">
                    {[
                      {
                        title: '封包起航（Packet Journey）',
                        subtitle: '端點主機層級封裝',
                        desc: '第三層網路層將傳動層封裝進含有源 IP（Source IP）與目的 IP（Destination IP）的資料報（Datagram）中。',
                        color: 'border-blue-500 text-blue-600 bg-blue-50/50'
                      },
                      {
                        title: '路由器處理（Router Processing）',
                        subtitle: '輸入解碼與並行交換',
                        desc: '輸入埠（Input Port）去中心化查表，採用最長字首匹配（LPM）與 TCAM 硬體加速，透過縱橫交換晶片送件至輸出埠。',
                        color: 'border-amber-500 text-amber-600 bg-amber-50/50'
                      },
                      {
                        title: '網域定址（IP Addressing）',
                        subtitle: '遮罩計算與子網路劃分',
                        desc: '基於無類別網域間路由（CIDR），路由器拆定子網部分與主機部分，落實分段、DHCP 發放或階層式聚合轉送。',
                        color: 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                      },
                      {
                        title: '位址映射（NAT & IPv6）',
                        subtitle: '埠重寫與歷史隧道對接',
                        desc: '使用網路位址轉換（NAT）緩解 IPv4 耗盡危機，或是直接將封包封裝入 IPv6 隧道過渡空間（Tunneling）。',
                        color: 'border-green-500 text-green-600 bg-green-50/50'
                      },
                      {
                        title: '通用轉送（SDN & OpenFlow）',
                        subtitle: '比較與動作一統硬體',
                        desc: '打破傳統依目的地轉送模式，依據 OpenFlow 流表進行多欄位「比較與動作（Match-plus-Action）」，整合路由器與防火牆。',
                        color: 'border-purple-500 text-purple-600 bg-purple-50/50'
                      },
                      {
                        title: '網際架構（Internet Arch.）',
                        subtitle: '中介隔離與極細 hourglass',
                        desc: '在網芯邊緣靈活部署防火牆、IDS 和負載平衡器（Middleboxes），對抗或捍衛中立的「IP 大沙漏細腰（Hourglass）」。',
                        color: 'border-slate-500 text-slate-600 bg-slate-50/50'
                      }
                    ].map((step, idx) => (
                      <div key={idx} className="relative flex flex-col justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-slate-300 duration-200 text-left">
                        {/* Connecting Line for desktop md+ */}
                        {idx < 5 && (
                          <div className="hidden md:block absolute top-1/2 -right-3.5 transform -translate-y-1/2 z-20">
                            <ArrowRight className="w-4 h-4 text-slate-300" />
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <span className="font-mono text-[10px] tracking-wider text-slate-400 font-bold block uppercase">
                            階段 0{idx + 1}
                          </span>
                          <h4 className="text-xs font-extrabold text-slate-800 leading-snug">
                            {step.title}
                          </h4>
                          <span className="text-[10px] text-zinc-400 font-semibold block leading-tight">
                            {step.subtitle}
                          </span>
                          <p className="text-[10px] text-slate-500 font-normal leading-normal">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CHAPTER ROADMAP CARDS */}
                <div className="bg-white border border-slate-150/85 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="text-left space-y-1">
                      <h3 className="text-lg font-black text-slate-850 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        第四章核心單元學習路線圖（Chronological Chapter 4 Study Roadmap）
                      </h3>
                      <p className="text-xs text-slate-500">
                        點擊下方任何卡片，即可自動「一鍵傳送（Teleport）」切換至該互動模組進行深度解碼與動態模擬。
                      </p>
                    </div>

                    {/* Mode Toggle Switch */}
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className="text-[11px] font-bold text-slate-400">研讀攻略規劃：</span>
                      <button
                        onClick={() => setIsSequentialMode(!isSequentialMode)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold duration-200 flex items-center gap-1.5 ${
                          isSequentialMode
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/65'
                            : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100/65'
                        }`}
                      >
                        {isSequentialMode ? (
                          <>
                            <Lock className="w-3 text-rose-600" />
                            <span>循序漸進解鎖模式（Sequential Lock ON）</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 text-green-600" />
                            <span>自由探索不設限模式（Free Mode ON）</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 11 Modules Grids */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {CHAPTER_MODULES.map((m, idx) => {
                      const isCompleted = !!visitedModules[m.id];
                      // Calculate sequential locking
                      // Module 0 is always open. Module i is locked in sequential mode if module i-1 was not visited.
                      const isPrevCompleted = idx === 0 || !!visitedModules[CHAPTER_MODULES[idx - 1].id];
                      const isLocked = isSequentialMode && !isCompleted && !isPrevCompleted;
                      const isCurrent = !isCompleted && isPrevCompleted; // next sequential target

                      const meta = getModuleMetadata(m.id);
                      const Icon = getModuleIcon(m.id);

                      // Design status badges
                      let statusText = '未開始（Not Started）';
                      let statusStyle = 'bg-zinc-50 text-zinc-400 border-zinc-150';
                      if (isCompleted) {
                        statusText = '已完成（Completed）';
                        statusStyle = 'bg-green-500 text-white border-green-600 shadow-sm shadow-green-100';
                      } else if (isCurrent) {
                        statusText = '學習中（In Progress）';
                        statusStyle = 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-100 animate-pulse';
                      } else if (isLocked) {
                        statusText = '已鎖定（Locked）';
                        statusStyle = 'bg-slate-100 text-slate-400 border-slate-200';
                      }

                      return (
                        <div
                          key={m.id}
                          onClick={() => handleSelectModule(m.id)}
                          className={`group relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 cursor-pointer text-left select-none ${
                            isCompleted
                              ? 'bg-white border-green-200 hover:border-green-300 hover:shaow-md'
                              : isCurrent
                              ? 'bg-white border-blue-400 hover:border-blue-500 shadow-md shadow-blue-50/80 ring-2 ring-blue-50'
                              : isLocked
                              ? 'bg-slate-50/50 border-slate-150 opacity-80 hover:bg-white duration-200'
                              : 'bg-white border-slate-100 hover:border-slate-350'
                          }`}
                        >
                          {/* Top row */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-4">
                              <span className="font-mono text-[10px] font-bold text-slate-400">
                                單元 0{idx + 1}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {/* DifficultyBadge */}
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${meta.color}`}>
                                  難度：{meta.difficulty}
                                </span>
                                {/* EstimatedTime */}
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-bold border border-slate-200">
                                  ⏳ {meta.duration}
                                </span>
                              </div>
                            </div>

                            {/* Module title with icon */}
                            <div className="flex items-start gap-3">
                              <div className={`p-2.5 rounded-xl border ${
                                isCompleted
                                  ? 'bg-green-50 border-green-200 text-green-600'
                                  : isCurrent
                                  ? 'bg-blue-50 border-blue-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white duration-300'
                                  : 'bg-slate-100 border-slate-200/60 text-slate-500'
                              }`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-black text-slate-800 tracking-tight leading-snug group-hover:text-blue-600 transition-colors">
                                  {m.title}
                                </h4>
                                <span className="text-[10px] font-mono font-medium text-slate-400 block truncate mt-0.5">
                                  {m.englishTitle}
                                </span>
                              </div>
                            </div>

                            {/* Module description */}
                            <p className="text-xs text-slate-500 leading-normal font-normal">
                              {m.description}
                            </p>
                          </div>

                          {/* Footer status row */}
                          <div className="mt-5 pt-3.5 border-t border-slate-100/70 flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all duration-300 flex items-center gap-1 ${statusStyle}`}>
                              {isLocked ? <Lock className="w-2.5 h-2.5" /> : null}
                              {isCompleted ? <CheckCircle2 className="w-2.5 h-2.5" /> : null}
                              <span>{statusText}</span>
                            </span>
                            
                            <span className="text-[10px] font-extrabold text-blue-600 flex items-center gap-0.5 group-hover:translate-x-1 duration-200 text-right">
                              <span>進入研讀</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* "WHAT YOU WILL BE ABLE TO DO" SECTION */}
                <div className="bg-white border border-slate-150/85 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                  <div className="text-left space-y-1">
                    <h3 className="text-lg font-black text-slate-850 flex items-center gap-2">
                      <Award className="w-5 h-5 text-indigo-600" />
                      您即將在第四章獲得的 09 大核心實戰能力（What You Will Be Able to Do Checklist）
                    </h3>
                    <p className="text-xs text-slate-500 leading-normal">
                      這是一套精密比照高頻期末考大綱與業界工程實戰設計的技能地圖（Skill Map）。學完本章的 11 座單元後，您將有底氣並輕鬆完成下述所有操作：
                    </p>
                  </div>

                  {/* Capabilities Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        title: '區分轉送（Forwarding）與路由（Routing）之差異',
                        desc: '精確辨析本地硬體純 3 層單節點快送行為（Forwarding）與全局分流路徑路由演算法決策規劃（Routing）的本質特徵。'
                      },
                      {
                        title: '解釋資料平面（Data Plane）與控制平面（Control Plane）之運作',
                        desc: '圖解區辨本地硬體在「奈秒（Nanosecond）」級執行的資料平面，與分散式傳統 IP 協定或軟體定義網路（SDN）中央控制器所掌控之控制平面。'
                      },
                      {
                        title: '動態模擬最長字首匹配（Longest Prefix Matching）演算法',
                        desc: '使用內核查表模擬器，親自輸入 IP 地址並目擊路由器如何比對最長首碼遮罩（Prefix Mask），理解 TCAM 硬體並行查表。'
                      },
                      {
                        title: '解讀 IPv4 標頭欄位（IPv4 Header Fields Layout）之物理意涵',
                        desc: '深入理解 TTL 降值丢棄與 ICMP 警報、上層傳輸層（Upper Layer）協定標示，及精準計算巨型封包在 MTU 限制下的 Fragmentation 分割，能推演偏移量：$$\\text{Offset}_k = \\frac{k \\times \\text{Payload Size}}{8}$$'
                      },
                      {
                        title: '精確計算無類別網域間路由（CIDR）及子網路範圍',
                        desc: '透過遮罩 bit 對比，在 $$a.b.c.d/x$$ 表示法下熟練切割子網路「孤島」，計算廣播位址與可分配主機最大容量規模。'
                      },
                      {
                        title: '追蹤並推演動態主機設定協定（DHCP）訊息交換步驟',
                        desc: '精確圖解新接入主機以 UDP 與本網 DHCP 伺服器，由廣播「尋求（Discover）」、「提供（Offer）」、「請求（Request）」和「應答確證（ACK）」的 D-O-R-A 四向握流交換（4-way Handshake）。'
                      },
                      {
                        title: '圖解網路位址轉換（NAT）Port號重寫對照表',
                        desc: '掌握 RFC 1918 專用保留私有地址如何對外映射共享單一公有 IPv4，精研 NAT 映射快取表（NAT Translation Table）重寫 4 層埠號。'
                      },
                      {
                        title: '對比分析 IPv4 與下一代協定 IPv6 標頭差距',
                        desc: '理解 IPv6 128 位元超大定址（$$2^{128}$$）之必然性，分析移除 Checksum、Router-side Fragmentation 減降開銷的「固定 40 位元組標頭」改進，及隧道包裝。'
                      },
                      {
                        title: '撰寫 OpenFlow 串接控制器與流表「比較與動作（Match-plus-Action）」規則',
                        desc: '脫離傳統目的地轉送桎梏，整合 12 欄比對條件（Matches）與發送/丢棄/改寫（Match-plus-Action）動作，完美用單一硬體整合防火牆與平衡器。'
                      }
                    ].map((item, idx) => (
                      <div key={idx} className="p-5 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 duration-200 text-left flex gap-3">
                        <div className="pt-0.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-slate-800 leading-relaxed">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 leading-normal font-normal">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. DYNAMIC CHAPTER CONTENT PANELS */}
            {currentModuleData && (
              <motion.div
                key={currentModuleData.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                {/* ================= EXTRA RICH INTERACTIVES RENDER ACCORDING TO CHAPTER ID ================= */}

                {currentModuleData.id === 'overview' ? (
                  <NetworkLayerOverview />
                ) : (
                  <>
                    {/* Intro Card */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <span className="font-mono text-xs font-extrabold text-blue-500 tracking-widest uppercase">
                          互動系列單元
                        </span>
                        <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200 font-bold">
                          狀態：正在閱讀中
                        </span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-800">
                        {currentModuleData.title}
                      </h2>
                      <p className="text-xs font-medium font-mono text-zinc-400 mt-0.5 card-eng-title">
                        （{currentModuleData.englishTitle}）
                      </p>
                      <p className="mt-2 text-sm text-slate-550 leading-normal font-normal">
                        {currentModuleData.description}
                      </p>
                    </div>

                    {/* Concepts cards stack */}
                    <div className="space-y-4">
                      {currentModuleData.concepts.map((concept, idx) => (
                        <ConceptCard
                          key={idx}
                          title={concept.title}
                          englishTitle={concept.englishTitle}
                          description={concept.description}
                          details={concept.details}
                          latexFormula={concept.latexFormula}
                        />
                      ))}
                    </div>

                    {/* Module Custom Interactive Visualizers */}
                    {currentModuleData.id === 'router-arch' && <RouterArchitecture />}
                    {currentModuleData.id === 'prefix-match' && <LongestPrefixMatcher />}
                    {currentModuleData.id === 'queue-schedule' && <QueueSchedulingPlayground />}
                    {currentModuleData.id === 'nat' && <NatTranslationSimulator />}

                    {/* Module 5: Reassembly steps illustration with visual blocks */}
                    {currentModuleData.id === 'ipv4-datagram' && (
                      <div className="space-y-6">
                        <div className="flex bg-slate-200/70 p-1 rounded-xl w-full justify-center md:max-w-md mx-auto shadow-inner">
                          <button
                            onClick={() => setIpv4ActiveTab('explorer')}
                            className={`flex-1 text-xs font-bold py-2.5 rounded-lg transition-all duration-200 ${
                              ipv4ActiveTab === 'explorer'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-605 hover:text-slate-800'
                            }`}
                          >
                            ① 標頭欄位與 TTL 探索器
                          </button>
                          <button
                            onClick={() => setIpv4ActiveTab('fragmentation')}
                            className={`flex-1 text-xs font-bold py-2.5 rounded-lg transition-all duration-200 ${
                              ipv4ActiveTab === 'fragmentation'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-605 hover:text-slate-800'
                            }`}
                          >
                            ② MTU 切割碎裂模擬器
                          </button>
                        </div>

                        {ipv4ActiveTab === 'explorer' ? (
                          <Ipv4HeaderExplorer onGoToSimulator={() => setIpv4ActiveTab('fragmentation')} />
                        ) : (
                          <Ipv4FragmentationSimulator />
                        )}
                      </div>
                    )}

                    {/* Module 6: IP Addressing, Subnets, and CIDR Calculator Suite */}
                    {currentModuleData.id === 'ip-addressing' && (
                      <IpAddressingSubnets />
                    )}

                    {/* Module 7: DHCP Timeline flow */}
                    {currentModuleData.id === 'dhcp' && (
                      <DhcpDoraTimeline />
                    )}

                    {/* Module 9: IPv6 Comparison */}
                    {currentModuleData.id === 'ipv6' && (
                      <Ipv6Explorer />
                    )}

                    {/* Module 10: SDN and OpenFlow Rule Builder */}
                    {currentModuleData.id === 'sdn-openflow' && (
                      <SdnOpenFlowBuilder />
                    )}

                    {/* Module 11: Middleboxes and Internet Architecture */}
                    {currentModuleData.id === 'middleboxes' && (
                      <MiddleboxesExplorer />
                    )}
                  </>
                )}

                {/* Quick actions box below course modules */}
                <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-500">
                    👍 已經精通本章節的觀念了嗎？點擊按鈕跳往下一階段！
                  </span>
                  <div className="flex gap-2">
                    <button
                      id="btn-goto-quizzes"
                      onClick={() => handleSelectModule('quizzes')}
                      className="text-xs font-bold text-slate-705 bg-slate-100 border border-slate-205 py-2.5 px-4 rounded-lg hover:bg-slate-200/80 duration-200"
                    >
                      前往測驗中心
                    </button>
                    {CHAPTER_MODULES.indexOf(currentModuleData) < CHAPTER_MODULES.length - 1 ? (
                      <button
                        id="btn-next-module"
                        onClick={() => {
                          const nextIdx = CHAPTER_MODULES.indexOf(currentModuleData) + 1;
                          handleSelectModule(CHAPTER_MODULES[nextIdx].id);
                        }}
                        className="text-xs font-bold text-white bg-blue-600 py-2.5 px-4 rounded-lg hover:bg-blue-700 duration-200 flex items-center gap-1 shadow-sm"
                      >
                        <span>前進下一講</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        id="btn-goto-review"
                        onClick={() => handleSelectModule('summary')}
                        className="text-xs font-bold text-white bg-green-600 py-2.5 px-4 rounded-lg hover:bg-green-700 duration-200 flex items-center gap-1 shadow-sm"
                      >
                        <span>前往重點考點複習</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. QUIZZES RENDER PANELS */}
            {activeModule === 'quizzes' && (
              <motion.div
                key="quizzes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <QuizCenter onModuleChange={handleSelectModule} />
              </motion.div>
            )}

            {/* 4. SUMMARY / CHEAT SHEET PANELS */}
            {activeModule === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Chapter4SummaryCheatSheet />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* FOOTER METRICS INFO */}
      <footer className="bg-white border-t border-slate-205 py-6 px-6 mt-12 text-center text-xs text-slate-400 select-none" id="footer">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-normal">
          <p>© 2026 電腦網路第四章互動式學習平台 - 網路層：資料平面. All rights reserved.</p>
          <div className="flex gap-4 font-semibold text-slate-500">
            <button onClick={() => handleSelectModule('home')} className="hover:text-blue-600 duration-150">
              前言首頁
            </button>
            <span className="text-slate-200">|</span>
            <button onClick={() => handleSelectModule('quizzes')} className="hover:text-blue-600 duration-150">
              隨堂測驗
            </button>
            <span className="text-slate-200">|</span>
            <button onClick={() => handleSelectModule('summary')} className="hover:text-blue-600 duration-150">
              考點備忘卡
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
