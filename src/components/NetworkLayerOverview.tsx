/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Cpu,
  Share2,
  ListFilter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
  Award,
  ChevronRight,
} from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const OVERVIEW_QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    question: '在網路層（Network Layer）的運作中，將封包從路由器（Router）的輸入埠（Input Port）移動至隨後核定合適的輸出埠（Output Port），此本地端、單一路由器內部的即時功能被稱為何者？',
    options: [
      '路由（Routing）',
      '轉送（Forwarding）',
      '封裝（Encapsulation）',
      '位址轉換（Address Translation）'
    ],
    correctIndex: 1,
    explanation: '轉送（Forwarding）指定的是「本地、單一路由器」層級之功能：當封包抵達輸入埠時，查表並決定其輸出的實體埠口；而路由（Routing）則是網路範圍（Network-wide）的端對端全局路徑規劃。'
  },
  {
    id: 2,
    question: '傳統路由器內部的「分佈式控制平面（Decentralized Control Plane）」與軟體定義網路（SDN）的「集中式控制平面（Centralized Control Plane）」最關鍵的區別在於？',
    options: [
      '傳統控制平面的路由器無法計算路由表',
      'SDN 控制平面的轉送工作完全不需要由硬體路由器執行',
      '傳統控制平面是由每台路由器內部的路由演算法自主交換資訊計算，而 SDN 則是由獨立的遠端中央控制器（Remote Controller）統一計算並下發安裝流表',
      '傳統控制平面執行時間在毫微秒級，而 SDN 控制平面完全在硬體電路上完成'
    ],
    correctIndex: 2,
    explanation: '控制平面（Control Plane）決定了封包沿途的路徑。傳統控制平面中，路由演算法運行在每台路由器內部（分散式自主交換）；在現代的 SDN 架構中則實施邏輯集中管理，遠端中央控制器統一計算，再下載轉送表（Forwarding Table）到各個設備中。'
  },
  {
    id: 3,
    question: '我們常說網路層資料平面（Data Plane）是在「奈秒（Nanosecond）」級尺度運行，而控制平面（Control Plane）通常在「毫秒（Millisecond）」級尺度運作。這主要歸因於何者？',
    options: [
      '資料平面完全依靠高效硬體晶片（如 TCAM、ASIC 與高速交換晶片）在資料通道並行直接轉送，而控制平面需要運行複雜的軟體協定與計算邏輯',
      '控制平面的網路頻寬大於資料平面',
      '控制平面不需要經過路由器的中央處理器（CPU）',
      '資料平面的所有封包都會自動被複製到系統主記憶體中'
    ],
    correctIndex: 0,
    explanation: '資料平面主要由路由器的硬體晶片（例如 ASICs、TCAM 內容可定址記憶體、互連交換結構）實現去中心化並行快送處理，只需幾十奈秒；而控制平面要運行 OSPF/BGP 或者是遠端控制器通訊軟體，涉及 CPU 軟體計算，處於毫秒級尺度。'
  },
  {
    id: 4,
    question: '網路層所提供的「最佳努力服務（Best-Effort Service）」模型中，網際網路（Internet）對資料傳遞給予了以下哪一項保證？',
    options: [
      '保證封包不被丟棄，百分之百抵達',
      '保證同一個流（Flow）中的封包不失序、按順序送達',
      '保證資料傳輸過程中的最低可用頻寬',
      '以上皆不保證（Best-Effort 代表不提供任何形式之服務品質保證）'
    ],
    correctIndex: 3,
    explanation: '最佳努力服務（Best-Effort Service）是網際網路最核心的服務模型，它十分誠實：既不保證封包成功送達（不失落）、不保證按序抵達，也不保證端對端時延或頻寬。這極簡的無狀態特質是 Internet 得以低成本、快速擴展成功的基石。'
  },
  {
    id: 5,
    question: '若將網路層的兩大功能用「日常旅行」作類比，以下哪一個配對和類比是最合理、最精確描述的？',
    options: [
      '路由（Routing）就像是車輛實際通過單一十字路口；轉送（Forwarding）則像是用智慧型手機地圖規劃全程旅行路線',
      '轉送（Forwarding）就像是車輛通過單一高架橋交流道（Interchange）；路由（Routing）則像是規劃一趟從台北開車到高雄的全程導航路線方案',
      '控制平面就像是加油站；資料平面就像是高速公路收費亭',
      '轉送就像是購買機票；路由則是把行李拿到傳送帶上打包'
    ],
    correctIndex: 1,
    explanation: '這是經典的運輸類比：轉送（Forwarding）是本地行為，猶如通過一個「單一交流道」；而路由（Routing）則是端對端的全局行為，正如「規劃整趟旅程」的完整行駛導航方案。'
  }
];

export function NetworkLayerOverview() {
  // Journey state
  const [journeyStep, setJourneyStep] = useState<number>(0);
  const totalJourneySteps = 5;

  // Comparison Tab state
  const [activePlaneTab, setActivePlaneTab] = useState<'data' | 'control'>('data');

  // Mini Quiz state
  const [selectedQuizIdx, setSelectedQuizIdx] = useState<number | undefined>(undefined);
  const [quizScores, setQuizScores] = useState<{ answered: number; correct: number }>({ answered: 0, correct: 0 });
  const [quizHistory, setQuizHistory] = useState<Record<number, number>>({});
  const [currentQuizPos, setCurrentQuizPos] = useState<number>(0);
  const [quizDone, setQuizDone] = useState<boolean>(false);

  // Restart Journey helper
  const handleResetJourney = () => {
    setJourneyStep(0);
  };

  const handleNextJourney = () => {
    if (journeyStep < totalJourneySteps - 1) {
      setJourneyStep((prev) => prev + 1);
    }
  };

  const handlePrevJourney = () => {
    if (journeyStep > 0) {
      setJourneyStep((prev) => prev - 1);
    }
  };

  // Mini Quiz logic
  const handleSelectQuizOptionLocal = (idx: number) => {
    if (selectedQuizIdx !== undefined) return;
    setSelectedQuizIdx(idx);

    const curQuestion = OVERVIEW_QUIZ_QUESTIONS[currentQuizPos];
    const isCorrect = idx === curQuestion.correctIndex;

    setQuizHistory((prev) => ({ ...prev, [curQuestion.id]: idx }));
    setQuizScores((prev) => ({
      answered: prev.answered + 1,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
    }));
  };

  const handleNextQuizLocal = () => {
    if (currentQuizPos < OVERVIEW_QUIZ_QUESTIONS.length - 1) {
      setCurrentQuizPos((prev) => prev + 1);
      setSelectedQuizIdx(undefined);
    } else {
      setQuizDone(true);
    }
  };

  const handleRestartQuizLocal = () => {
    setQuizScores({ answered: 0, correct: 0 });
    setQuizHistory({});
    setCurrentQuizPos(0);
    setSelectedQuizIdx(undefined);
    setQuizDone(false);
  };

  // Safe Math formula layout to avoid issues
  const latexMsgFraction = "Offset_k = \\frac{k \\times \\text{Payload Size}}{8}";

  return (
    <div id="overview-interactive-suite" className="space-y-10">
      
      {/* 1. CONCEPT INTRO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Network Layer */}
        <div id="overview-card-nl" className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-blue-100 transition-colors duration-300 text-left">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 rounded-l-2xl" />
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-1.5 flex-wrap">
                <span>網路層</span>
                <span className="text-xs font-semibold text-zinc-400 font-mono">
                  （Network Layer）
                </span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                網路層承載了將「段（Segment）」由傳送端主機一路運送至接收端主機的重要物理使命。其主要的工作機制如下：
              </p>
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="mt-1 bg-green-50 text-green-600 p-0.5 rounded-full block">&#10003;</span>
                  <span><strong>傳送端封裝（Sender Encapsulation）：</strong>在傳送端主機，網路層主動將來自第四傳輸層的 TCP/UDP 區段裝配好 3 層 IP 標頭，封裝成網路資料報（IP Datagram）發射出發。</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="mt-1 bg-green-50 text-green-600 p-0.5 rounded-full block">&#10003;</span>
                  <span><strong>數據傳輸介係（End-to-End Delivery）：</strong>一路上在網際網路核心（Network Core）可能穿越幾十個極其複雜的實體路由器（Routers）鏈路，確保跨子網路定址中繼通暢。</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="mt-1 bg-green-50 text-green-600 p-0.5 rounded-full block">&#10003;</span>
                  <span><strong>接收端交付（Receiver Deliver）：</strong>在封包抵達目的端主機時，網路層剝離 IP 標頭外殼，重構出段數據並完好安全地遞交給上層之傳輸層。</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Router */}
        <div id="overview-card-router" className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-amber-150 transition-colors duration-300 text-left">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 rounded-l-2xl" />
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-1.5 flex-wrap">
                <span>網路處理器與路由器</span>
                <span className="text-xs font-semibold text-zinc-400 font-mono">
                  （Router）
                </span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                路由器是網路層中，在網路核心層面最辛勤運作的實體樞紐。它的核心職能是：
              </p>
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="mt-1 bg-amber-50 text-amber-600 p-0.5 rounded-full block">&#10003;</span>
                  <span><strong>讀取封包標頭（Examine Datagram Header）：</strong>解讀抵達的每一个 IP 封包標頭，對比來源 IP 與目的地 IP、TTL、通訊類型等各個重要的第 3 層欄位。</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="mt-1 bg-amber-50 text-amber-600 p-0.5 rounded-full block">&#10003;</span>
                  <span><strong>轉送驅動機（Datagram Forwarder）：</strong>當一個資料報由路由器的某個實體輸入埠（Input Port）抵達後，進行奈秒級高度並行查表，轉移至最切合的實體輸出埠（Output Port）。</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="mt-1 bg-amber-50 text-amber-600 p-0.5 rounded-full block">&#10003;</span>
                  <span><strong>路由維護（Route Maintenance）：</strong>與周邊等其他路由器交流，運行如 OSPF、BGP 等動態演算法，動態在本地儲存體中更新最新的最長匹配轉送表資訊。</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE PACKET JOURNEY ANIMATION */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 text-left">
        <div className="space-y-1">
          <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-750 font-bold font-mono text-[10px] rounded tracking-wider uppercase">
            動態模擬實作（Interactive Packet Animation Simulator）
          </span>
          <h3 className="text-lg font-black text-slate-800">
            互動式封包全程傳輸路網軌跡（Step-by-Step Packet Journey Simulator）
          </h3>
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            封包在一路上到底經歷了路由器的哪些關鍵本質處理？請點擊下方的「下一跳步進」或「回前一歩」按鈕，逐步追蹤一個傳輸 IP 封包在網路中的實質軌跡！
          </p>
        </div>

        {/* Journey Graphic Panel */}
        <div className="p-6 md:p-8 border border-slate-100 rounded-2xl bg-gradient-to-b from-slate-50/50 to-slate-100/30 flex flex-col items-center justify-center relative overflow-hidden">
          
          {/* Node Connections Graphic */}
          <div className="w-full max-w-2xl flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4 relative pt-4 pb-6 select-none">
            {/* Horizontal Line background for big screen */}
            <div className="hidden sm:block absolute top-[44%] left-[10%] right-[10%] border-t-2 border-dashed border-slate-200" />

            {/* Node 0: Host A */}
            <div className={`z-10 flex flex-col items-center transition-all ${journeyStep === 0 ? 'scale-110' : 'scale-95 opacity-70'}`}>
              <div className={`p-4 rounded-full border-2 transition-all ${
                journeyStep === 0 ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-100' : 'bg-white border-slate-200 text-slate-600'
              }`}>
                <Compass className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-xs font-black text-slate-800 mt-2 block">Host A（傳送端）</span>
              <span className="text-[10px] font-mono text-slate-400">192.168.1.10</span>
            </div>

            {/* Link A */}
            <div className="h-4 sm:h-auto sm:flex-1 flex items-center justify-center">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border leading-none shrink-0 ${
                journeyStep === 1 ? 'bg-amber-100 border-amber-300 text-amber-700 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}>
                Link 1
              </span>
            </div>

            {/* Node 1: Router 1 */}
            <div className={`z-10 flex flex-col items-center transition-all ${journeyStep === 1 ? 'scale-110' : 'scale-95 opacity-70'}`}>
              <div className={`p-4 rounded-full border-2 transition-all ${
                journeyStep === 1 ? 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-100' : 'bg-white border-slate-200 text-slate-600'
              }`}>
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-slate-800 mt-2 block">Router 1（一跳路由）</span>
              <span className="text-[10px] font-mono text-slate-400">R1_Ingress</span>
            </div>

            {/* Link B */}
            <div className="h-4 sm:h-auto sm:flex-1 flex items-center justify-center">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border leading-none shrink-0 ${
                journeyStep === 2 ? 'bg-amber-100 border-amber-300 text-amber-700 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}>
                Link 2
              </span>
            </div>

            {/* Node 2: Router 2 */}
            <div className={`z-10 flex flex-col items-center transition-all ${journeyStep === 2 ? 'scale-110' : 'scale-95 opacity-70'}`}>
              <div className={`p-4 rounded-full border-2 transition-all ${
                journeyStep === 2 ? 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-100' : 'bg-white border-slate-200 text-slate-600'
              }`}>
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-slate-800 mt-2 block">Router 2（中間路由）</span>
              <span className="text-[10px] font-mono text-slate-400">R2_Core</span>
            </div>

            {/* Link C */}
            <div className="h-4 sm:h-auto sm:flex-1 flex items-center justify-center">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border leading-none shrink-0 ${
                journeyStep === 3 ? 'bg-amber-100 border-amber-300 text-amber-700 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}>
                Link 3
              </span>
            </div>

            {/* Node 3: Router 3 */}
            <div className={`z-10 flex flex-col items-center transition-all ${journeyStep === 3 ? 'scale-110' : 'scale-95 opacity-70'}`}>
              <div className={`p-4 rounded-full border-2 transition-all ${
                journeyStep === 3 ? 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-100' : 'bg-white border-slate-200 text-slate-600'
              }`}>
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-slate-800 mt-2 block">Router 3（後跳路由）</span>
              <span className="text-[10px] font-mono text-slate-400">R3_Egress</span>
            </div>

            {/* Link D */}
            <div className="h-4 sm:h-auto sm:flex-1 flex items-center justify-center">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border leading-none shrink-0 ${
                journeyStep === 4 ? 'bg-blue-100 border-blue-300 text-blue-700 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}>
                Link 4
              </span>
            </div>

            {/* Node 4: Host B */}
            <div className={`z-10 flex flex-col items-center transition-all ${journeyStep === 4 ? 'scale-110' : 'scale-95 opacity-70'}`}>
              <div className={`p-4 rounded-full border-2 transition-all ${
                journeyStep === 4 ? 'bg-green-600 text-white border-green-400 shadow-md shadow-green-100' : 'bg-white border-slate-200 text-slate-600'
              }`}>
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-slate-800 mt-2 block">Host B（接收端）</span>
              <span className="text-[10px] font-mono text-slate-400">192.168.2.100</span>
            </div>
          </div>

          {/* Current Info Panel */}
          <div className="w-full border border-slate-150 rounded-2xl p-5 bg-white shadow-sm mt-4 text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={journeyStep}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between border-b pb-2.5">
                  <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest font-mono">
                    步進狀態：第 0{journeyStep + 1} 步封包追蹤
                  </span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold border">
                    目的地 IP：192.168.2.100
                  </span>
                </div>

                {journeyStep === 0 && (
                  <div className="space-y-1.5 text-xs">
                    <p className="font-semibold text-slate-850 text-sm">
                      📍 封包源點：Host A（傳送端主機）
                    </p>
                    <p className="text-slate-600 font-normal leading-relaxed">
                      Host A 內的傳輸層正在利用 TCP/UDP 設計有價值的通訊資料。網路層拿到資料後將其視為「段（Segment）」，接著封裝（Encapsulate）上包含來源 IP 地址為 <code className="bg-slate-100 px-1 rounded">192.168.1.10</code>、目的地 IP 為 <code className="bg-slate-100 px-1 rounded">192.168.2.100</code> 的 3 層 IP 標頭，並賦予生存時間 TTL = 64。封包透過實體網路介面向它的第一跳路由器（First-Hop Router）出發發射。
                    </p>
                  </div>
                )}

                {journeyStep === 1 && (
                  <div className="space-y-2 text-xs">
                    <p className="font-semibold text-amber-600 text-sm">
                      📍 路由中繼站：Router 1（第一跳邊緣路由器）
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-150">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">目的地封包檢核</span>
                        <span className="font-bold text-slate-700 block mt-0.5">Dest IP: 192.168.2.100 / TTL {`->`} 63</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">最長字首匹配（LPM）</span>
                        <span className="font-semibold text-blue-600 block mt-0.5">匹配條目：192.168.2.0/24 {`->`} Link 2</span>
                      </div>
                    </div>
                    <p className="text-slate-600 font-normal leading-relaxed">
                      封包抵達 <b>Router 1</b> 的輸入埠。路由器取出封包後先校驗 Checksum，接著將存留生存時間（TTL）減 1（變更為 63）。它將目的地址 <code className="bg-slate-100 px-1 rounded">192.168.2.100</code> 與其內置最優的轉送表進行最長字首匹配（Longest Prefix Matching）查表查核，結果顯示最匹配的對應介面為 <b>Link 2</b>。隨後封包被交換晶片迅速送往 Link 2 輸出。
                    </p>
                  </div>
                )}

                {journeyStep === 2 && (
                  <div className="space-y-2 text-xs">
                    <p className="font-semibold text-amber-600 text-sm">
                      📍 核心網網脊樞紐：Router 2（中間骨幹交換節點）
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-150">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">目的地封包檢核</span>
                        <span className="font-bold text-slate-700 block mt-0.5">Dest IP: 192.168.2.100 / TTL {`->`} 62</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">匹配與動作（Match-plus-Action）</span>
                        <span className="font-semibold text-blue-600 block mt-0.5">Match: 192.168.2.0/24 {`->`} Forward to Link 3</span>
                      </div>
                    </div>
                    <p className="text-slate-600 font-normal leading-relaxed">
                      封包進入網際網路核心。<b>Router 2</b> 在此時擔負處理重任。它高速在硬體電路中對封包的目的地頭部進行解析，TTL 再次經扣減變為 62。查表匹配所得下一跳的最佳輸出連接線路為 <b>Link 3</b>。該交換只需一微秒即可完成，在硬體流中被直接轉送出去。
                    </p>
                  </div>
                )}

                {journeyStep === 3 && (
                  <div className="space-y-2 text-xs">
                    <p className="font-semibold text-amber-600 text-sm">
                      📍 出口邊緣站：Router 3（最後一跳邊緣路由器）
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-150">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">目的地子網比對</span>
                        <span className="font-bold text-slate-700 block mt-0.5">直連子網（Directly Connected Subnet）</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">位址解析（ARP）查核</span>
                        <span className="font-semibold text-blue-600 block mt-0.5">MAC 映射對接 {`->`} Host B MAC / Link 4</span>
                      </div>
                    </div>
                    <p className="text-slate-600 font-normal leading-relaxed">
                      封包抵達與目的端設備 Host B 直接相連通的 <b>Router 3</b> 的入口。路由器查閱遮罩匹配，發現 IP 的子網位址直接就是直連的子網路網段。路由器不再中繼轉送，而是直接運行 ARP 協定探查 Host B 的實體 MAC 網卡位址。接著將 IP 包封入乙太網路框架，並利用 <b>Link 4</b> 直接把信號推送交付目的主機。
                    </p>
                  </div>
                )}

                {journeyStep === 4 && (
                  <div className="space-y-1.5 text-xs">
                    <p className="font-semibold text-green-600 text-sm">
                      📍 成功終點站：Host B（接收端主機）
                    </p>
                    <p className="text-slate-600 font-normal leading-relaxed font-sans">
                      目的主機 <b>Host B</b> 的網路卡收到了該實體訊號，解碼並進行完整校驗檢查。主機的網路層接收了這枚完好的 IP 資料報。在仔細卸除剝下 20 bytes 的 IP 標頭之後，它把埋在裡頭的傳輸層承載「段（Segment）」安全妥善地往上推送交給了 Host B 内部活動的 TCP 或者是 UDP 傳輸層應用，端對端大功告成！
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stepper Buttons Controls */}
          <div className="flex items-center gap-2 mt-5">
            <button
              id="btn-journey-prev"
              onClick={handlePrevJourney}
              disabled={journeyStep === 0}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border rounded-lg transition-all ${
                journeyStep === 0
                  ? 'border-slate-100 text-slate-350 cursor-not-allowed bg-transparent'
                  : 'bg-white border-slate-205 text-slate-705 hover:bg-slate-50 cursor-pointer'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>回前一步（Prev）</span>
            </button>

            <button
              id="btn-journey-reset"
              onClick={handleResetJourney}
              className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
              title="重設模擬流程"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              id="btn-journey-next"
              onClick={handleNextJourney}
              disabled={journeyStep === totalJourneySteps - 1}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border rounded-lg transition-all ${
                journeyStep === totalJourneySteps - 1
                  ? 'border-slate-100 text-slate-350 cursor-not-allowed bg-transparent'
                  : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-550 shadow-sm cursor-pointer'
              }`}
            >
              <span>下一跳步進（Next）</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. FORWARDING VS ROUTING COMPARISON */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 text-left">
        <div className="space-y-1">
          <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-705 font-bold font-mono text-[10px] rounded tracking-wider uppercase">
            核心概念對比（Key Concept Comparison）
          </span>
          <h3 className="text-lg font-black text-slate-800">
            轉送與路由：看似雙子星、實質大不同的雙主幹功能（Forwarding vs. Routing）
          </h3>
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            初學者極易將「轉送（Forwarding）」與「路由（Routing）」兩個概念相混淆。下表精心釐清並呈現其本質差異與極具創意的生活化「日常旅行」類比：
          </p>
        </div>

        {/* Comparison Table */}
        <div className="border border-slate-150 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 font-black text-slate-700 border-b border-slate-150">
                <th className="p-4 uppercase tracking-wider font-extrabold w-1/4">對比維度</th>
                <th className="p-4 uppercase tracking-wider font-extrabold text-blue-600 bg-blue-50/20">轉送（Forwarding）</th>
                <th className="p-4 uppercase tracking-wider font-extrabold text-indigo-600 bg-indigo-50/20">路由（Routing）</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-normal">
              <tr className="hover:bg-slate-50/40">
                <td className="p-4 font-bold text-slate-800 bg-slate-50/25">定義與作用範疇（Scope）</td>
                <td className="p-4 leading-relaxed bg-blue-50/5">
                  <b>本地、路由器專用（Local Per-router）功能。</b>僅決定封包由當前路由器的哪一個輸入埠實體移動到哪一個合適的輸出埠。
                </td>
                <td className="p-4 leading-relaxed bg-indigo-50/5">
                  <b>跨越整個網路（Network-wide）功能。</b>決定封包在起點主機（Source）到目的端主機（Destination）之間，沿途所規劃經過的路網軌跡。
                </td>
              </tr>
              <tr className="hover:bg-slate-50/40">
                <td className="p-4 font-bold text-slate-800 bg-slate-50/25">執行的時間尺度（Timeframe）</td>
                <td className="p-4 leading-relaxed font-semibold text-blue-700 bg-blue-50/5">
                  在<b>奈秒級（Nanosecond）</b>時間刻度下疾速運作。全賴高頻去中心化硬體交換晶片直接並行處理。
                </td>
                <td className="p-4 leading-relaxed font-semibold text-indigo-700 bg-indigo-50/5">
                  在<b>微秒至毫秒級（Micro-to-Millisecond）</b>時間刻度下工作。需要經過軟體演算法的分析和交換流運作。
                </td>
              </tr>
              <tr className="hover:bg-slate-50/40">
                <td className="p-4 font-bold text-slate-800 bg-slate-50/25">涉及的核心對象（Mechanics）</td>
                <td className="p-4 leading-relaxed bg-blue-50/5">
                  查驗 IP 目的地、比對最長字首匹配、橫越縱橫網格（Crossbar Switching Fabric）或快速匯流排。
                </td>
                <td className="p-4 leading-relaxed bg-indigo-50/5">
                  傳輸動態路由封包路況、運行路徑最短路徑計算演算法（如 Dijkstra 或 Bellman-Ford），集中化控制器決策。
                </td>
              </tr>
              <tr className="hover:bg-slate-50/40">
                <td className="p-4 font-bold text-slate-800 bg-slate-50/25">日常旅行創意思維生活化類比</td>
                <td className="p-4 leading-relaxed font-medium text-slate-700 bg-blue-50/5">
                  🚗 <b>通過單一交流道（Interchange）：</b><br/>
                  車輛行駛到了某一特定的交流道或十字路口，決定在下一秒往左拐還是往右轉以穿越這個單一節點。
                </td>
                <td className="p-4 leading-relaxed font-medium text-slate-700 bg-indigo-50/5">
                  🗺️ <b>規劃整趟旅程（Plan the Full Trip）：</b><br/>
                  在出發前甚至是一路上，利用地圖規劃如何從台北（起點）開車、經由哪些國道公路，一路開往高雄（終點）的完整導航方案。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. DATA PLANE VS CONTROL PLANE */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 text-left">
        <div className="space-y-1">
          <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-750 font-bold font-mono text-[10px] rounded tracking-wider uppercase">
            系統架構剖析（Architecture Dissection）
          </span>
          <h3 className="text-lg font-black text-slate-800">
            拆解決策與落實：資料平面與控制平面的層級區分（Data Plane vs. Control Plane）
          </h3>
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            現代網路將網路層清楚地劃分為<b>資料平面（Data Plane）</b>與<b>控制平面（Control Plane）</b>。這可以理解為組織中「第一線實幹（Execution）」與「決策高層（Decision）」的分工邏輯：
          </p>
        </div>

        {/* Toggleable Tabs Design */}
        <div className="space-y-4">
          <div className="flex border-b border-slate-150 p-1 bg-slate-50 rounded-xl max-w-sm">
            <button
              onClick={() => setActivePlaneTab('data')}
              className={`flex-1 text-center py-2.5 rounded-lg text-xs font-black transition-all ${
                activePlaneTab === 'data'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              資料平面（Data Plane）
            </button>
            <button
              onClick={() => setActivePlaneTab('control')}
              className={`flex-1 text-center py-2.5 rounded-lg text-xs font-black transition-all ${
                activePlaneTab === 'control'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              控制平面（Control Plane）
            </button>
          </div>

          {/* Tab Contents */}
          <AnimatePresence mode="wait">
            {activePlaneTab === 'data' ? (
              <motion.div
                key="tab-data"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="p-5 border border-slate-150 bg-slate-50/40 rounded-xl space-y-3"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 px-2.5 bg-blue-100 text-blue-750 border border-blue-200 rounded font-mono text-[10px] font-bold uppercase">
                    本地路由器功能（Per-Router Local Function）
                  </div>
                </div>
                <h4 className="text-sm font-black text-slate-800">
                  實幹執行者：在奈秒級直接處理通訊資料
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  資料平面是<b>每一台路由器（Per-router）獨自具備的本地功能</b>。它主要決定一個在輸入埠（Input Port）抵達的 IP 資料報（IP Datagram）如何被直接分流、轉移、交換並傳送到路由器對應的哪個實體輸出埠（Output Port）。
                </p>
                <div className="space-y-1.5 pl-2 pt-1 border-l-2 border-blue-300">
                  <p className="text-xs text-slate-600 font-semibold">⚡ 資料平面之核心工作重點：</p>
                  <ul className="list-disc pl-4 text-xs text-slate-550 space-y-1 font-normal">
                    <li>屬於<b>硬體（Hardware）</b>級別的功能。由晶片和電路高速完成。</li>
                    <li>核心依據是<b>轉送表（Forwarding Table）</b>。</li>
                    <li>主要機制包括：查驗 3 層 IP 標頭、執行<b>最長字首匹配（Longest Prefix Matching）</b>解碼、運用縱橫線路晶片把封包送出。</li>
                    <li>在微小的「奈秒（Nanosecond）」高度極短時間尺度內即時完成。</li>
                  </ul>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="tab-control"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="p-5 border border-slate-150 bg-slate-50/40 rounded-xl space-y-3"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 px-2.5 bg-indigo-100 text-indigo-750 border border-indigo-200 rounded font-mono text-[10px] font-bold uppercase">
                    網路層全局決策（Network-Wide Global Logic）
                  </div>
                </div>
                <h4 className="text-sm font-black text-slate-800">
                  決策導航大腦：如何妥善規劃端到端傳輸大局
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  控制平面是<b>網路範圍的全局（Network-wide）智略與決策功能</b>。它旨在妥善確定一個 IP 封包在網絡核心的眾多路由器之間傳輸時，所應採行與沿途行經的最優端到端路徑。
                </p>
                <div className="space-y-1.5 pl-2 pt-1 border-l-2 border-indigo-300">
                  <p className="text-xs text-slate-600 font-semibold">⚡ 控制平面之兩大主流實現手段：</p>
                  <ul className="list-disc pl-4 text-xs text-slate-550 space-y-2 font-normal">
                    <li>
                      <b>傳統分散式路由演算法（Traditional Routing Algorithms）：</b><br/>
                      路由演算法元件分別運行在每台路由器內部。每台路由器之間交互發送動態路況封包（例如 OSPF LSA 或是 BGP updates），自主分析、收斂並計算生成各自本地的轉送表。
                    </li>
                    <li>
                      <b>軟體定義網路高度集中式控制員（Software-Defined Networking, SDN）：</b><br/>
                      利用一個邏輯上完全集中控制的<b>遠端中央控制器（Remote SDN Controller）</b>直接統一收集全局拓撲特徵。在控制器大腦中藉由軟體集中計算好最科學的流表條目，隨後直接動態下載安裝（Install）到每台相連的路由器硬體中。
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 5. MINI QUIZ */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 text-left">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-4">
          <div className="space-y-1">
            <span className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-750 font-bold font-mono text-[10px] rounded tracking-wider uppercase flex items-center gap-1 w-max">
              <Award className="w-3.5 h-3.5" />
              <span>觀念自我檢測（Interactive Knowledge Check）</span>
            </span>
            <h3 className="text-lg font-black text-slate-800">
              網路層概述單元隨堂挑戰（Unit 1 Mini-Quiz Challenge）
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              精選 5 題經典考題。做完即可獲得深度解析與實時反饋，是備考與釐清盲點的絕佳法寶！
            </p>
          </div>

          {/* Score Counter */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right">
            <span className="text-[10px] font-bold text-slate-400 block font-mono">挑戰成績</span>
            <span className="text-sm font-black text-slate-800 font-mono">
              {quizScores.correct} / {OVERVIEW_QUIZ_QUESTIONS.length}
            </span>
          </div>
        </div>

        {/* Quiz Panel rendering */}
        {!quizDone ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 font-mono bg-blue-50/50 border border-blue-100 px-2 rounded-full">
                當前作答進度：第 {currentQuizPos + 1} 題 / 共 {OVERVIEW_QUIZ_QUESTIONS.length} 題
              </span>
              {selectedQuizIdx !== undefined && (
                <span className={`text-xs font-bold border rounded-full px-2.5 py-0.5 ${
                  selectedQuizIdx === OVERVIEW_QUIZ_QUESTIONS[currentQuizPos].correctIndex
                    ? 'bg-green-50 text-green-750 border-green-200'
                    : 'bg-red-50 text-red-750 border-red-200'
                }`}>
                  {selectedQuizIdx === OVERVIEW_QUIZ_QUESTIONS[currentQuizPos].correctIndex ? '回答正確！' : '作答有誤！'}
                </span>
              )}
            </div>

            {/* Question Text */}
            <h4 className="text-sm md:text-base font-bold text-slate-800 leading-relaxed bg-slate-50/50 p-4 border border-dashed border-slate-200 rounded-xl">
              {OVERVIEW_QUIZ_QUESTIONS[currentQuizPos].question}
            </h4>

            {/* Option Buttons */}
            <div className="space-y-3">
              {OVERVIEW_QUIZ_QUESTIONS[currentQuizPos].options.map((opt, oIdx) => {
                const isSelected = selectedQuizIdx === oIdx;
                const isCorrect = oIdx === OVERVIEW_QUIZ_QUESTIONS[currentQuizPos].correctIndex;

                let btnStyle = 'border-slate-200 bg-white hover:bg-slate-50/60 text-slate-700';
                
                if (selectedQuizIdx !== undefined) {
                  if (isCorrect) {
                     btnStyle = 'border-green-500 bg-green-50/80 text-green-900 font-bold';
                  } else if (isSelected) {
                     btnStyle = 'border-red-400 bg-red-50 text-red-900 font-bold';
                  } else {
                     btnStyle = 'border-slate-100 bg-slate-50/30 text-slate-400 cursor-not-allowed';
                  }
                }

                return (
                  <button
                    key={oIdx}
                    id={`overview-quiz-btn-${currentQuizPos}-${oIdx}`}
                    disabled={selectedQuizIdx !== undefined}
                    onClick={() => handleSelectOption(oIdx)}
                    className={`w-full text-left p-3.5 border rounded-xl flex items-start gap-3 transition-colors duration-200 cursor-pointer text-xs ${btnStyle}`}
                  >
                    <span className="w-5 h-5 rounded-full border border-slate-350 flex items-center justify-center font-mono text-[9px] font-bold mt-0.5 select-none shrink-0 bg-slate-50 text-slate-600">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="flex-1 font-medium">{opt}</span>
                    {selectedQuizIdx !== undefined && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                    {selectedQuizIdx !== undefined && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Explanations block overlay */}
            <AnimatePresence>
              {selectedQuizIdx !== undefined && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-5 border-t border-slate-100 pt-4"
                >
                  <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-200/40 space-y-2">
                    <div className="flex items-center gap-1.5 text-indigo-700 font-bold">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-[11px] font-black uppercase tracking-wider">
                        詳細觀念精華分析（Explanation）
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-normal font-normal">
                      {OVERVIEW_QUIZ_QUESTIONS[currentQuizPos].explanation}
                    </p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      id="overview-quiz-btn-next"
                      onClick={handleNextQuizLocal}
                      className="flex items-center gap-1 bg-blue-600 text-white rounded-lg px-4 py-2 text-xs font-bold hover:bg-blue-700 cursor-pointer transition-colors"
                    >
                      <span>
                        {currentQuizPos === OVERVIEW_QUIZ_QUESTIONS.length - 1 ? '完成測驗（Finish）' : '下一道大題（Next）'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        ) : (
          <div className="p-6 md:p-8 border border-green-250 bg-green-50/15 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-3 bg-green-500 text-white rounded-full">
              <Award className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-800">恭喜您！順利完成了概述單元的隨堂挑戰！</h4>
              <p className="text-xs text-slate-500">
                答對題數：<b>{quizScores.correct}</b> 題 / 總計：<b>{OVERVIEW_QUIZ_QUESTIONS.length}</b> 題。點擊下方按鈕可立刻重新開始測試！
              </p>
            </div>

            {/* Score interpretation */}
            <div className="p-3 border border-green-200 rounded-xl bg-white max-w-sm">
              <p className="text-[11px] text-green-700 font-bold">
                {quizScores.correct === OVERVIEW_QUIZ_QUESTIONS.length
                  ? '🏅 太狂了！您完全精通了網路層核心概述的所有大考觀念！繼續保持！'
                  : quizScores.correct >= 3
                  ? '⭐ 表現優異！大部分核心概念都已經完好掌握。請繼續挑戰下個單元！'
                  : '💡 建議回頭重新複習一下本單元的兩個概念卡，讓觀念更加完備穩健！'}
              </p>
            </div>

            <button
              id="overview-quiz-restart"
              onClick={handleRestartQuizLocal}
              className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-white px-5 py-2.5 rounded-lg text-xs font-bold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重新進行挑戰（Restart Quiz）</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );

  function handleSelectOption(idx: number) {
    handleSelectOptionInternal(idx);
  }

  function handleSelectOptionInternal(idx: number) {
    handleSelectQuizOptionLocal(idx);
  }
}
