/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cpu,
  Layers,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  Activity,
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Server,
  Zap,
  Sliders,
  ChevronRight,
} from 'lucide-react';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const ROUTER_ARCH_QUIZ: QuizQuestion[] = [
  {
    id: 1,
    question: '在路由器的輸入埠（Input Port）中，去中心化查表轉送（Decentralized Switching）之核心目的為何？',
    options: [
      '為了讓控制平面（Control Plane）能直接執行 OSPF 演算法',
      '為了避免所有抵達輸入埠的封包都必須交由中央路由處理器進行查表，防止其成為整個路由器的轉送效能瓶頸（Bottleneck）',
      '為了將封包物理重組為 IPv6 隧道封包',
      '為了給予高優先權佇列進行隨機早期檢測（Random Early Detection）'
    ],
    correctIndex: 1,
    explanation: '若每個封包都要經由中央處理器（CPU/Routing Processor）統一查表，中央處理器將在極速多埠口輸入流量下瞬間崩潰。因此，透過在每一排「輸入埠」上放置轉送表複本（FIB），能完全去中心化完成奈秒級查表轉送。'
  },
  {
    id: 2,
    question: '當多個輸入埠同時嘗試將封包送往同一個輸出埠，但在高速「匯流排交換結構（Switching via Bus）」中，其最大的頻寬限制與缺點在於？',
    options: [
      '匯流排每次只能允許「一個」封包橫越實體傳輸通路，產生嚴重的控制匯流排衝突競合（Bus Contention）',
      '匯流排需要將封包完全複製進中央主要記憶體（Switching via Memory）三次',
      '匯流排會強制將 IPv4 地址轉換為 128 位元的 IPv6 位址',
      '匯流排無法計算最長字首匹配（Longest Prefix Matching）'
    ],
    correctIndex: 0,
    explanation: '在匯流排交換結構（Switching via Bus）中，所有輸入跟輸出共用同一條公用線路。因為媒介共享，一次只能允許單一封包跨越匯流排。若有兩個以上輸入埠想送件，其中一個會被迫排隊等待阻隔，其交換速率上限受限於單一匯流排頻寬。'
  },
  {
    id: 3,
    question: '關於線頭阻塞（Head-of-the-Line, HOL Blocking），以下哪一項敘述是完全正確並反映實質物理架構的？',
    options: [
      'HOL 阻塞是發生在輸出埠（Output Port）因為實體傳輸線路斷線而不得不丢失封包的佇列現象',
      'HOL 阻塞指排在輸入佇列最前面的封包，因為遭遇輸出埠爭端而卡住，進而讓排在它後方、原本可以轉送至其他可用輸出埠的無衝突封包，也跟著被擋在輸入佇列後面無法前進',
      'HOL 阻塞完全可以藉由尾部丟棄（Tail Drop）擁塞控制原則解決',
      'HOL 阻塞是由於 DHCP Discover 訊息失落所致'
    ],
    correctIndex: 1,
    explanation: '線頭阻塞（HOL Blocking）是「輸入埠佇列（Input Port Queueing）」經典缺陷：縱使背後交換網格十分空閒，只要排在「佇列第一名（Head of line）」的封包因要去的輸出埠正忙而被堵在輸入口，後續所有封包（即使它們要去別的、完全空閒的輸出埠）都將遭受無辜阻擋。'
  },
  {
    id: 4,
    question: '排程原則中，加權公平佇列（Weighted Fair Queueing, WFQ）能為網絡流提供何種極具彈性的技術保證？',
    options: [
      '保證所有封包均能按百分之百順序、無時鐘抖動地一絲不差抵達',
      '透過賦予每個佇列 class 專屬之權重配比，保證各流在拥塞時能按比例分配鏈路頻寬，不會造成低優先權流徹底餓死（Starvation），提供強健的最低頻寬保障',
      '能夠保證在本地端直接自動消除並過濾掉所有 middleboxes 中介包',
      '保證在 RTT 極高時將緩衝區完全清空至零，免除 Bufferbloat 威脅'
    ],
    correctIndex: 1,
    explanation: '加權公平佇列（WFQ）是輪詢排程（Round Robin）的一般化與通式。透過給定权重限制，它能確保在擁塞下，每一類流在鏈路上最少保證能按自定義公式 \( \text{頻寬比例} = \frac{w_i}{\sum_j w_j} \) 得享運送服務。'
  },
  {
    id: 5,
    question: '如果存在 N 個獨立 TCP 連線流。傳統 RFC 3439 認為緩衝分配應為 B = RTT * C，而最新理論指出，在大型多鏈路骨幹中，可有效將緩衝大小縮減為以下哪項，以舒緩「緩衝區膨脹（Bufferbloat）」痛苦？',
    options: [
      '$$B = RTT \\times C \\times N$$',
      '$$B = \\frac{RTT \\times C}{\\sqrt{N}}$$',
      '$$B = \\frac{RTT \\times C}{N^2}$$',
      '$$B = RTT \\times C \\times \\log(N)$$'
    ],
    correctIndex: 1,
    explanation: '在多個獨立 TCP 流相互競合抗衡下，緩衝大小依最新大數法則，可顯著縮減為 \( B = \frac{RTT \times C}{\sqrt{N}} \)，這能減少封包因路由器排隊過大而帶來的排隊遲延（Queueing Delay），也是對抗 Bufferbloat 的主戰場。'
  },
  {
    id: 6,
    question: '在網路中立性（Network Neutrality）三大基本技術監管防線中，「無付費優先級（No Paid Prioritization）」之規範核心為以下哪者？',
    options: [
      '保證每個客戶的 IP 都是由 DHCP 即插即用動態發放',
      '不允許網路服務提供商（ISP）以收費為手段，利用排程或緩衝技術，為特定高價買方提供高速特權通道，確保大眾公共傳輸權中立',
      '要求所有路由器中途完全禁止實施 NAT 轉換',
      '要求所有對應的 OpenFlow 流表都不得包含 Drop 動作'
    ],
    correctIndex: 1,
    explanation: '付費優先級（Paid Prioritization）會造就網路「不公的歧視」。也就是說，ISP 不能透過加錢就把特定財團企業的封包改塞入高優先權佇列，而將大眾的鏈路改套入輪詢甚至丟包丟棄，確保資訊的高速平等流動。'
  }
];

export function RouterArchitecture() {
  // Selected interactive component in router architecture layout
  const [activeComponent, setActiveComponent] = useState<string>('input-port');

  // Step-by-step Simulation state
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const totalSimulationSteps = 6;

  // Table Data vs Control Plane tabs
  const [compareTab, setCompareTab] = useState<'table' | 'cards'>('table');

  // Quiz state
  const [selectedQuizIdx, setSelectedQuizIdx] = useState<number | undefined>(undefined);
  const [quizScores, setQuizScores] = useState<{ answered: number; correct: number }>({ answered: 0, correct: 0 });
  const [quizHistory, setQuizHistory] = useState<Record<number, number>>({});
  const [currentQuizPos, setCurrentQuizPos] = useState<number>(0);
  const [quizDone, setQuizDone] = useState<boolean>(false);

  // Click handler for Interactive parts
  const handleSelectComponent = (id: string) => {
    setActiveComponent(id);
  };

  // Stepper Simulation Next
  const handleNextSim = () => {
    if (simulationStep < totalSimulationSteps - 1) {
      setSimulationStep((prev) => prev + 1);
    }
  };

  const handlePrevSim = () => {
    if (simulationStep > 0) {
      setSimulationStep((prev) => prev - 1);
    }
  };

  const handleResetSim = () => {
    setSimulationStep(0);
  };

  // Mini Quiz logic
  const handleSelectQuizOptionLocal = (idx: number) => {
    if (selectedQuizIdx !== undefined) return;
    setSelectedQuizIdx(idx);

    const question = ROUTER_ARCH_QUIZ[currentQuizPos];
    const isCorrect = idx === question.correctIndex;

    setQuizHistory((prev) => ({ ...prev, [question.id]: idx }));
    setQuizScores((prev) => ({
      answered: prev.answered + 1,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
    }));
  };

  const handleNextQuizLocal = () => {
    if (currentQuizPos < ROUTER_ARCH_QUIZ.length - 1) {
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

  return (
    <div id="router-arch-suite" className="space-y-10">

      {/* 1. INTERACTIVE DESIGN DIAGRAM */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 text-left">
        <div className="space-y-1">
          <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-750 font-bold font-mono text-[10px] rounded tracking-wider uppercase">
            實體硬體解碼（Interactive Hardware Anatomy）
          </span>
          <h3 className="text-xl font-black text-slate-800">
            精準路由器微結構互動模型（High-Fidelity Interactive Router Microarchitecture）
          </h3>
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            這是一座高精度內部路由元件圖景。您可以<b>點擊下方圖中的任一實體區域</b>（如輸入埠、交換晶片、路由處理器等），即可一鍵召喚其底層最精密的運作機理分析：
          </p>
        </div>

        {/* Dynamic Interactive Diagram Board */}
        <div className="relative p-6 md:p-8 border border-slate-150 rounded-2xl bg-gradient-to-b from-slate-50/50 to-slate-100/30 flex flex-col items-center">
          
          {/* Main Visual box of the Router */}
          <div className="w-full max-w-4xl border border-slate-300 rounded-3xl bg-white shadow-lg p-6 md:p-8 relative space-y-6 overflow-hidden">
            
            {/* Top section: Control Plane / Routing Processor */}
            <div className="flex justify-center w-full">
              <button
                id="btn-arch-rp"
                onClick={() => handleSelectComponent('routing-processor')}
                className={`relative w-full max-w-lg p-4 border-2 rounded-2xl text-center duration-300 transition-all ${
                  activeComponent === 'routing-processor'
                    ? 'border-red-500 bg-red-50/60 shadow-md ring-4 ring-red-100'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-350'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Cpu className={`w-5 h-5 ${activeComponent === 'routing-processor' ? 'text-red-600' : 'text-slate-500'}`} />
                  <span className="text-xs font-black text-slate-800">路由處理器（Routing Processor — 軟體控制平面）</span>
                </div>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 border text-slate-500 rounded font-bold">慢速通道（Slow Path）</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 border text-slate-500 rounded font-mono font-bold">運行時間：毫秒級（ms）</span>
                </div>
                {/* Embedded Forwarding Table indicator */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectComponent('forwarding-table');
                  }}
                  className={`mt-2.5 mx-auto max-w-md p-2 border border-dashed rounded-lg text-[10px] font-mono duration-200 cursor-pointer ${
                    activeComponent === 'forwarding-table'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-bold'
                      : 'border-slate-300 hover:border-indigo-400 text-slate-500 bg-white'
                  }`}
                >
                  📡 管理與計算 ➝ 下載轉送表（LPM Forwarding Table）至輸入埠
                </div>
              </button>
            </div>

            {/* Connecting control arrows */}
            <div className="flex justify-center -my-3 h-6 relative z-10 select-none">
              <div className="h-full border-l-2 border-dashed border-red-400 flex items-center justify-center">
                <ArrowDown className="w-3.5 h-3.5 text-red-550 -mt-1 animate-bounce" />
              </div>
            </div>

            {/* Middle Section: Links Grid */}
            <div className="grid grid-cols-12 gap-4 items-stretch relative">
              
              {/* Left Column: Input Ports */}
              <div className="col-span-12 md:col-span-4 flex flex-col justify-between gap-4">
                <span className="text-[11px] font-black text-slate-400 tracking-wider text-center block mb-1">
                  📥 輸入埠組 (Input Ports)
                </span>
                
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    id={`btn-arch-ip-${num}`}
                    onClick={() => handleSelectComponent('input-port')}
                    className={`p-3.5 border-2 rounded-xl text-left duration-200 transition-all ${
                      activeComponent === 'input-port'
                        ? 'border-blue-500 bg-blue-50/50 shadow shadow-blue-100 ring-2 ring-blue-50'
                        : 'border-slate-205 bg-white hover:border-slate-350'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">輸入埠 0{num} (Input Port)</span>
                      <span className="text-[8px] px-1 bg-blue-100 text-blue-700 rounded font-bold uppercase">L1/L2/L3</span>
                    </div>
                    {/* Inner components inside input ports */}
                    <div className="mt-2 grid grid-cols-3 gap-1 text-[8px] text-center text-slate-400">
                      <div className="p-0.5 border bg-slate-50 rounded">實體層接收</div>
                      <div className="p-0.5 border bg-slate-50 rounded">連結層處理</div>
                      <div className="p-0.5 border border-dashed border-blue-300 bg-blue-50/20 text-blue-800 font-bold rounded">快速查表</div>
                    </div>
                    {/* Buffer inside */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectComponent('buffers-queues');
                      }}
                      className={`mt-2 p-1.5 border border-dashed rounded text-[9px] font-mono text-center cursor-pointer transition-colors ${
                        activeComponent === 'buffers-queues'
                          ? 'border-rose-500 bg-rose-50 text-rose-800 font-bold'
                          : 'border-slate-200 hover:border-rose-400 text-slate-500 bg-white'
                      }`}
                    >
                      🛑 緩衝佇列（Buffer Queue）
                    </div>
                  </button>
                ))}
              </div>

              {/* Center Column: Switching Fabric */}
              <div className="col-span-12 md:col-span-4 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 p-4 relative min-h-[220px]">
                <button
                  id="btn-arch-sf"
                  onClick={() => handleSelectComponent('switching-fabric')}
                  className={`w-full h-full flex flex-col items-center justify-center p-3 border-2 rounded-xl text-center duration-300 transition-all ${
                    activeComponent === 'switching-fabric'
                      ? 'border-amber-500 bg-amber-50/70 shadow-md ring-4 ring-amber-100'
                      : 'border-slate-200 bg-white hover:border-slate-350'
                  }`}
                >
                  <Zap className={`w-8 h-8 ${activeComponent === 'switching-fabric' ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
                  <span className="text-xs font-black text-slate-800 mt-2">高連通交換結構</span>
                  <span className="text-[9px] font-mono font-medium text-slate-400 block tracking-tight mt-0.5">（Switching Fabric — 快速通道）</span>
                  <div className="mt-2.5 space-y-1 w-full max-w-[150px]">
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-3/4 animate-pulse" />
                    </div>
                    <span className="text-[8px] text-zinc-400 font-mono font-bold block">交換頻寬最大化</span>
                  </div>
                </button>
              </div>

              {/* Right Column: Output Ports */}
              <div className="col-span-12 md:col-span-4 flex flex-col justify-between gap-4">
                <span className="text-[11px] font-black text-slate-400 tracking-wider text-center block mb-1">
                  📤 輸出埠組 (Output Ports)
                </span>
                
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    id={`btn-arch-op-${num}`}
                    onClick={() => handleSelectComponent('output-port')}
                    className={`p-3.5 border-2 rounded-xl text-left duration-200 transition-all ${
                      activeComponent === 'output-port'
                        ? 'border-indigo-500 bg-indigo-50/50 shadow shadow-indigo-100 ring-2 ring-indigo-50'
                        : 'border-slate-205 bg-white hover:border-slate-350'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">輸出埠 0{num} (Output Port)</span>
                      <span className="text-[8px] px-1 bg-indigo-100 text-indigo-700 rounded font-bold uppercase">TX/RX</span>
                    </div>
                    {/* Inner Buffer inside output */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectComponent('buffers-queues');
                      }}
                      className={`mt-2 p-1.5 border border-dashed rounded text-[9px] font-mono text-center cursor-pointer transition-colors ${
                        activeComponent === 'buffers-queues'
                          ? 'border-rose-500 bg-rose-50 text-rose-800 font-bold'
                          : 'border-slate-200 hover:border-rose-400 text-slate-505 bg-white'
                      }`}
                    >
                      🛑 緩衝區與排程排隊 (Buffers)
                    </div>
                    {/* Outer physical layers */}
                    <div className="mt-2 grid grid-cols-2 gap-1 text-[8px] text-center text-slate-400">
                      <div className="p-0.5 border bg-slate-50 rounded">連結層封裝</div>
                      <div className="p-0.5 border bg-slate-50 rounded">實體發送</div>
                    </div>
                  </button>
                ))}
              </div>

            </div>

            {/* Bottom text watermarks */}
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-4 border-t border-slate-100 select-none">
              <span>R_ENGINE: HARDWARE CORES v4.1</span>
              <span>⚡ 去中心化極速並行轉送架構</span>
            </div>
          </div>

          {/* Interactive details section details */}
          <div className="w-full max-w-4xl border border-slate-200 rounded-2xl p-5 bg-white shadow-sm mt-5 text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeComponent}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                {activeComponent === 'routing-processor' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 bg-red-100 rounded-lg text-red-700 shrink-0"><Cpu className="w-4 h-4" /></span>
                      <h4 className="text-sm font-black text-slate-800">控制平面核心：路由處理器（Routing Processor）</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      這是在硬體中的<b>大腦電腦（Routing CPU/Processor）</b>。它不直接運送高頻封包，而是負責在「毫秒級（Millisecond）」的時間刻度下，規劃網際網絡全景決策：
                    </p>
                    <ul className="list-disc pl-5 text-xs text-slate-550 space-y-1 font-normal">
                      <li><b>運行軟體協定：</b>自主運行 OSPF, BGP, RIP 等動態路徑演算法及 ICMP 交換、ARP 控制。</li>
                      <li><b>維護本地轉送表：</b>計算並產生轉送表，並將轉送表的副本安全下載（Install）至各個輸入埠的專屬記憶體上。</li>
                      <li><b>網路管理主控：</b>執行對應的設備指令（CLI 終端）、監控與安全防護、故障排除。</li>
                    </ul>
                  </div>
                )}

                {activeComponent === 'input-port' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 bg-blue-100 rounded-lg text-blue-700 shrink-0"><Layers className="w-4 h-4" /></span>
                      <h4 className="text-sm font-black text-slate-800">高通量入口：去中心化輸入埠（Input Port）</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      輸入埠是封包進入路由器的最前線，具備極其驚人的<b>去中心化（Decentralized）並行處理</b>晶片：
                    </p>
                    <ul className="list-disc pl-5 text-xs text-slate-550 space-y-1.5 font-normal">
                      <li><b>實體層線路端接（Line Termination）：</b>接收實體的光電、調變微波等位元流訊號。</li>
                      <li><b>連結層協定接收（Link-layer Protocol Receive）：</b>對接協定（如乙太網路 Ethernet 802.3 或 PPP），拆解出內部封裝的第 3 層 IP 資料報。</li>
                      <li><b>去中心化快速查表（Decentralized Lookup）：</b>這是最重要的革命！输入埠內建了轉送表的「影子副本」，封包一到立刻在本地獨立搜索最長字首匹配（LPM）。完全不需要經過路由處理器大腦，藉此在「奈秒級」直接扔進交換網格。</li>
                    </ul>
                  </div>
                )}

                {activeComponent === 'switching-fabric' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 bg-amber-100 rounded-lg text-amber-700 shrink-0"><Zap className="w-4 h-4" /></span>
                      <h4 className="text-sm font-black text-slate-800">資料平面骨幹：高連通交換結構（Switching Fabric）</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      交換結構是路由器的實體核心「心臟通道」，決定了路由器能處理的極限總頻寬，最常見的三大主流架構包括：
                    </p>
                    <ul className="list-disc pl-5 text-xs text-slate-550 space-y-1.5 font-normal">
                      <li><b>經由記憶體交換（via Memory）：</b>最原始的方法。封包直接由系統 CPU 親自從輸入緩衝區複製進記憶體，再複製到輸出埠。兩次橫越匯流排，效能極低。</li>
                      <li><b>經由匯流排交換（via Bus）：</b>輸入埠與輸出埠由一條專用高速共享匯流排相連。無需 CPU 干預，但因通道唯一，每次只准過一台封包，會產生競爭（Contention）。</li>
                      <li><b>經由互連網路交換（via Interconnection Network）：</b>也稱為縱橫交換機（Crossbar）。有多條垂直與水平線路交互組成並行網點。多個輸入埠可以同時送件至完全不同的輸出埠。能輕鬆提供數十至數百 Tbps 的超高頻寬支持，是現代骨幹交換之硬體天王。</li>
                    </ul>
                  </div>
                )}

                {activeComponent === 'output-port' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 bg-indigo-100 rounded-lg text-indigo-700 shrink-0"><Layers className="w-4 h-4" /></span>
                      <h4 className="text-sm font-black text-slate-800">流量溢出排班哨：佇列與輸出埠（Output Port）</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      輸出埠位於出口端。當多個輸入埠同時並行投遞封包至同一個輸出埠，且其抵達頻寬大於實體線路發送極限時，在這裡就會產生嚴重的聚集隊列：
                    </p>
                    <ul className="list-disc pl-5 text-xs text-slate-550 space-y-1.5 font-normal">
                      <li><b>資料緩衝與佇列（Buffering & Queueing）：</b>當緩衝佇列因過度擁塞而額滿時，面臨溢位抉擇，會依據「尾部丟棄（Tail Drop）」或「早期預檢（RED）」等機制抛棄部分封包，此爲封包遗失（Packet Loss）發生的主要溫床。</li>
                      <li><b>排程演算法（Packet Scheduling）：</b>依據 FIFO, Priority 或者是 WFQ 加權，排班決定佇列中哪一個封包應該下一個被送上實體連結。</li>
                      <li><b>連結與實體發送（Transmission）：</b>將 3 層 IP 包再度包好 2 層乙太網框架頭，調變為實體訊號打上外界實體線路。</li>
                    </ul>
                  </div>
                )}

                {activeComponent === 'forwarding-table' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 bg-violet-100 rounded-lg text-violet-700 shrink-0"><Sliders className="w-4 h-4" /></span>
                      <h4 className="text-sm font-black text-slate-800">路由對比映射表：最長首碼匹配轉送表（LPM Forwarding Table）</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      轉送表是去中心化快速查表的硬體對照基準。在傳統網路層，路由處理器利用軟體算出路由，更新下載至輸入埠的 Table，以便進行高效率二進位匹配尋找：
                    </p>
                    <div className="border border-slate-150 rounded-xl overflow-hidden text-xs my-2 max-w-xl">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 font-black">
                          <tr className="border-b border-slate-150 text-slate-700">
                            <th className="p-2">目的地 IP Prefix 位址範圍</th>
                            <th className="p-2">匹配長度</th>
                            <th className="p-2">輸出實體 Link 介面</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          <tr>
                            <td className="p-2 font-mono">11001000 00010111 00010000 00000000/23</td>
                            <td className="p-2 font-bold text-slate-800">23 bits</td>
                            <td className="p-2 text-blue-600 font-bold">Link 1</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-mono">11001000 00010111 00010010 00000000/24</td>
                            <td className="p-2 font-bold text-slate-800">24 bits</td>
                            <td className="p-2 text-amber-600 font-bold">Link 2</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-mono">Otherwise (預設閘道路線)</td>
                            <td className="p-2">0 bit</td>
                            <td className="p-2 text-indigo-650">Link 3</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">
                      💡 <b>最長匹配實戰：</b>若封包 Destination IP 為 <code className="bg-slate-100 px-1 font-mono">11001000 00010111 00010010 00000101</code>（即 200.23.18.5）。它同時符合 /23 與 /24，但由於 24 遮罩字首更長、更特定的去向，因此會被強制選擇經由 <b>Link 2</b> 轉送出去。
                    </p>
                  </div>
                )}

                {activeComponent === 'buffers-queues' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 bg-rose-100 rounded-lg text-rose-700 shrink-0"><Activity className="w-4 h-4" /></span>
                      <h4 className="text-sm font-black text-slate-800">物理瓶頸：佇列、延遲與擁塞（Buffers & Queues）</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      當路由器各埠口的抵達速度與交換速度、發送速度失衡時，佇列就會在實體緩衝區（Buffers）中產生：
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-3 border rounded-xl bg-slate-50">
                        <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">輸入埠佇列限制</span>
                        <p className="text-xs text-slate-600 font-normal mt-1 leading-relaxed">
                          如果交換結構的速度慢於所有輸入埠流量的總和，封包就會在輸入端開始排隊，極易引發<b>線頭阻塞（HOL Blocking）</b>，直接阻擋其他能去別埠口的空閒流。
                        </p>
                      </div>
                      <div className="p-3 border rounded-xl bg-slate-50">
                        <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">輸出埠佇列溢出</span>
                        <p className="text-xs text-slate-600 font-normal mt-1 leading-relaxed">
                          即使交換網格無限快，只要實體傳發出口連結被佔滿（如 10Gbps 的進口轉送到 100Mbps 的 WiFi 鏈路），封包就會在輸出埠瘋狂積壓，超出 Buffer 限度即被無情丟棄（Tail Drop 尾部丢棄）。
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* 2. "PACKET ENTERS ROUTER" STEP simulation */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 text-left">
        <div className="space-y-1">
          <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-705 font-bold font-mono text-[10px] rounded tracking-wider uppercase">
            微脈絡模擬（Packet Path Tracer Simulator）
          </span>
          <h3 className="text-xl font-black text-slate-800">
            封包穿透路由：全程流向步進模擬（Packet Enters Router: Step-by-Step Traversal）
          </h3>
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            親眼目睹一個 IP 資料報（IPv4 Datagram）大踏步穿透路由器各實體環節的全過程。點擊控制按鈕切換步驟，並追蹤封包在物理層和連結層的位移：
          </p>
        </div>

        {/* Trace Visual Canvas */}
        <div className="p-6 border border-slate-100 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white relative overflow-hidden min-h-[340px] flex flex-col justify-between">
          {/* Grid bg pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20 pointer-events-none" />

          {/* Graphical Nodes */}
          <div className="w-full max-w-3xl mx-auto flex items-center justify-between relative pt-8">
            
            {/* Step indicators mapping path */}
            <div className="absolute top-[37%] left-[6%] right-[6%] border-t-2 border-slate-700 pointer-events-none select-none z-0" />

            {/* Stage 1: Line In */}
            <div className={`relative z-10 flex flex-col items-center transition-all ${simulationStep === 0 ? 'scale-110' : 'scale-90 opacity-60'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold border-2 ${
                simulationStep === 0 ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/20' : 'bg-slate-850 border-slate-700'
              }`}>
                01
              </div>
              <span className="text-[10px] font-bold mt-2 font-sans text-center max-w-[70px]">實體接頭 (Line In)</span>
            </div>

            {/* Stage 2: Header Check */}
            <div className={`relative z-10 flex flex-col items-center transition-all ${simulationStep === 1 ? 'scale-110' : 'scale-90 opacity-60'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold border-2 ${
                simulationStep === 1 ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-500/20' : 'bg-slate-850 border-slate-700'
              }`}>
                02
              </div>
              <span className="text-[10px] font-bold mt-2 font-sans text-center max-w-[70px]">標頭校驗</span>
            </div>

            {/* Stage 3: LPM Lookup */}
            <div className={`relative z-10 flex flex-col items-center transition-all ${simulationStep === 2 ? 'scale-110' : 'scale-90 opacity-60'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold border-2 ${
                simulationStep === 2 ? 'bg-violet-600 border-violet-400 shadow-lg shadow-violet-500/20' : 'bg-slate-850 border-slate-700'
              }`}>
                03
              </div>
              <span className="text-[10px] font-bold mt-2 font-sans text-center max-w-[70px]">最長查表 (LPM)</span>
            </div>

            {/* Stage 4: Crossing Fabric */}
            <div className={`relative z-10 flex flex-col items-center transition-all ${simulationStep === 3 ? 'scale-110' : 'scale-90 opacity-60'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold border-2 ${
                simulationStep === 3 ? 'bg-amber-500 border-amber-300 shadow-lg shadow-amber-500/20' : 'bg-slate-850 border-slate-700'
              }`}>
                04
              </div>
              <span className="text-[10px] font-bold mt-2 font-sans text-center max-w-[70px]">越交換網 (Fabric)</span>
            </div>

            {/* Stage 5: Output buffering */}
            <div className={`relative z-10 flex flex-col items-center transition-all ${simulationStep === 4 ? 'scale-110' : 'scale-90 opacity-60'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold border-2 ${
                simulationStep === 4 ? 'bg-rose-600 border-rose-400 shadow-lg shadow-rose-500/20' : 'bg-slate-850 border-slate-700'
              }`}>
                05
              </div>
              <span className="text-[10px] font-bold mt-2 font-sans text-center max-w-[70px]">出口佇列排程</span>
            </div>

            {/* Stage 6: Packet Out */}
            <div className={`relative z-10 flex flex-col items-center transition-all ${simulationStep === 5 ? 'scale-110' : 'scale-90 opacity-60'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold border-2 ${
                simulationStep === 5 ? 'bg-green-600 border-green-400 shadow-lg shadow-green-500/20' : 'bg-slate-850 border-slate-700'
              }`}>
                06
              </div>
              <span className="text-[10px] font-bold mt-2 font-sans text-center max-w-[70px]">物理發送 (Line Out)</span>
            </div>

          </div>

          {/* Steps Explanation console */}
          <div className="mt-8 border border-slate-800 bg-slate-900/90 rounded-2xl p-5 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent pointer-events-none" />
            <AnimatePresence mode="wait">
              <motion.div
                key={simulationStep}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-2.5 text-xs text-slate-300"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 font-mono font-bold uppercase rounded text-[9px] tracking-widest">
                    STEP 0{simulationStep + 1}
                  </span>
                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200">
                    {simulationStep === 0 && '物理層位元解調接續'}
                    {simulationStep === 1 && '連結層解碼與標頭欄位校驗'}
                    {simulationStep === 2 && '去中心化轉送表 LPM 檢核'}
                    {simulationStep === 3 && '穿越縱橫網格交換結構'}
                    {simulationStep === 4 && '出口排班與排程抉擇'}
                    {simulationStep === 5 && '再度打包封裝實體發送'}
                  </span>
                </div>

                {simulationStep === 0 && (
                  <p className="leading-relaxed font-normal text-slate-400">
                    一組高速實體電子或微觀波導訊號抵達實體埠頭的 <b>Line Termination</b>。物理層對其進行放大、解調，完好轉換回純粹的二進位位元流（Bitstream），為後續鏈路傳輸做好充分的熱身。
                  </p>
                )}

                {simulationStep === 1 && (
                  <p className="leading-relaxed font-normal text-slate-400">
                    連結層解碼（Link-layer Protocol Receive）開始。解析二層乙太網 Frame 或 PPP，對照 Cyclic Redundancy Check（CRC 校驗）。提取出第 3 層的 IP 封包，查閱 IP 標頭長度與 Chekcsum 總和檢查碼，扣減其 survival time（TTL 生存時間）。
                  </p>
                )}

                {simulationStep === 2 && (
                  <p className="leading-relaxed font-normal text-slate-400">
                    這是一切處理的靈魂：<b>最長字首匹配（Longest Prefix Matching）</b>！輸入埠直接提取 packet 目的地 IP 地址，在其就地的 FIB（轉送表複本）中執行極速平行查表，完全不叨擾路由處理器。瞬息匹配出最合適的輸出埠對接連結。
                  </p>
                )}

                {simulationStep === 3 && (
                  <p className="leading-relaxed font-normal text-slate-400">
                    匹配完成。封包被分割為體積等重、易於並行的 Cell。在<b>交換結構（Switching Fabric）</b>垂直與橫向導通交錯點上，以數十 Gbps 的超凡頻寬物理高速橫越過交換網，瞬時抵達指定的目標輸出連結輸入緩衝區。
                  </p>
                )}

                {simulationStep === 4 && (
                  <p className="leading-relaxed font-normal text-slate-400">
                    封包抵達指定輸出埠的<b>緩衝佇列（Output Buffers）</b>。若出口此時由於多線併發而產生擁塞，封包在此進行排隊。排程大門守衛（如 FCFS, Priority 優先級或 WFQ 加權）按照各項排班规则，挑選該封包作為最優之選，通知其出列。
                  </p>
                )}

                {simulationStep === 5 && (
                  <p className="leading-relaxed font-normal text-slate-400">
                    大功告成！得選的 IP 封包最後再度在輸出埠綁上乙太網 Header 框架，遞送給實體層編碼器與電子晶片上，向著網際網路下一跳（Next Hop）設備，劃出完美流暢、疾風迅雷般的物理訊號！
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stepper controls */}
          <div className="flex items-center gap-2 self-center mt-5">
            <button
              id="btn-sim-prev"
              onClick={handlePrevSim}
              disabled={simulationStep === 0}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                simulationStep === 0
                  ? 'border-slate-800 text-slate-600 bg-transparent cursor-not-allowed'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 cursor-pointer'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>回前一步（Prev）</span>
            </button>

            <button
              id="btn-sim-reset"
              onClick={handleResetSim}
              className="p-1.5 bg-slate-805 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-lg cursor-pointer transition-colors"
              title="重設步進"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              id="btn-sim-next"
              onClick={handleNextSim}
              disabled={simulationStep === totalSimulationSteps - 1}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                simulationStep === totalSimulationSteps - 1
                  ? 'border-slate-800 text-slate-600 bg-transparent cursor-not-allowed'
                  : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-550 cursor-pointer shadow-sm shadow-blue-500/10'
              }`}
            >
              <span>下一跳步進（Next）</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* 3. SPEED COMPARISON GRID */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 text-left">
        <div className="space-y-1">
          <span className="px-2.5 py-1 bg-violet-50 border border-violet-200 text-violet-705 font-bold font-mono text-[10px] rounded tracking-wider uppercase">
            運作刻度解鎖（Timeframe Comparison Scale）
          </span>
          <h3 className="text-xl font-black text-slate-800">
            奈秒 vs 毫秒：資料平面與控制平面的速度鴻溝（Speed & Scalability Disparity）
          </h3>
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            為何必須在硬體中強固徹底劃分資料平面（Data plane）與控制平面（Control plane）？下表清晰揭露它們運作時在物理極限、涉及材質與處理時間上的巨幅差距：
          </p>
        </div>

        {/* Speed Comparison Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plane 1: Data Plane */}
          <div className="border border-blue-150 rounded-2xl p-5 bg-gradient-to-br from-blue-50/20 to-indigo-50/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rotate-45 pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1 px-2.5 bg-blue-105 border border-blue-200 text-blue-750 rounded font-mono text-[10px] font-bold">DATA PLANE 資料平面</span>
              <span className="text-xs font-black text-blue-600">⚡ 奈秒級尺度 (Nanoseconds)</span>
            </div>
            <ul className="space-y-3.5 text-xs text-slate-600 font-normal">
              <li>
                <strong className="text-slate-800">實現載體：硬體晶片（Hardware Level）</strong><br/>
                完全依託高度最佳化之硬體電路晶片、ASIC、FPGA、TCAM 內容可定址記憶體和並行交叉交換結構。
              </li>
              <li>
                <strong className="text-slate-800">運作量化（Throughput）：</strong><br/>
                每秒需處置、查照、篩選並輸送高達<b>數億個至數十億個（Gigabits/Terabits per second）</b>巨量封包。
              </li>
              <li>
                <strong className="text-slate-800">核心本質任務：</strong><br/>
                當封包在一端連入，必須在 10 ~ 50 奈秒內閃電完成最長匹配、改寫 TTL、重新計算 Checksum 並投遞出路由器，不容半分耽擱。
              </li>
            </ul>
          </div>

          {/* Plane 2: Control Plane */}
          <div className="border border-red-150 rounded-2xl p-5 bg-gradient-to-br from-red-50/20 to-rose-50/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rotate-45 pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1 px-2.5 bg-red-105 border border-red-200 text-red-750 rounded font-mono text-[10px] font-bold">CONTROL PLANE 控制平面</span>
              <span className="text-xs font-black text-red-600">⚙️ 毫秒級尺度 (Milliseconds)</span>
            </div>
            <ul className="space-y-3.5 text-xs text-slate-600 font-normal">
              <li>
                <strong className="text-slate-800">實現載體：軟體系統（Software Level）</strong><br/>
                由路由器的主要處理器 CPU 運行的進階 C/C++ 等協定軟體、記憶體模組與作業系統主核。
              </li>
              <li>
                <strong className="text-slate-800">運作量化（Throughput）：</strong><br/>
                按需、定時或拓撲劇變時，一秒內處理數千個 OSPF 動態同步通告或 BGP path update 路由更新。
              </li>
              <li>
                <strong className="text-slate-800">核心本質任務：</strong><br/>
                計算全局 Dijkstra 最小耗費路徑樹，與周圍上萬台鄰居取得路由共識。因涉及大量多點協同、網路漫遊通訊和軟體系統複雜計算，通常落在幾十至數百毫秒尺度。
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4. SIX QUESTIONS MINI QUIZ */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 text-left">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-4">
          <div className="space-y-1">
            <span className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-755 font-bold font-mono text-[10px] rounded tracking-wider uppercase flex items-center gap-1 w-max">
              <Award className="w-3.5 h-3.5" />
              <span>自我實力檢測（Interactive Diagnostic Centre）</span>
            </span>
            <h3 className="text-lg font-black text-slate-800">
              路由器微架構隨堂挑戰（Unit 2 Mini-Quiz Challenge）
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              精選 6 道經典路由器架構核心期末考與實務大考題。幫您在動態做題中排解觀念盲點！
            </p>
          </div>

          {/* Quick score card */}
          <div className="bg-slate-51 border border-slate-200 rounded-xl p-3 text-right">
            <span className="text-[10px] font-bold text-slate-400 block font-mono">作答統計</span>
            <span className="text-sm font-black text-slate-800 font-mono">
              {quizScores.correct} / {ROUTER_ARCH_QUIZ.length}
            </span>
          </div>
        </div>

        {/* Quiz Rendering */}
        {!quizDone ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 font-mono bg-blue-50 border border-blue-105 px-2.5 py-0.5 rounded-full">
                作答進行中：第 {currentQuizPos + 1} 題 / 共 {ROUTER_ARCH_QUIZ.length} 題
              </span>
              {selectedQuizIdx !== undefined && (
                <span className={`text-xs font-bold border rounded-full px-2.5 py-0.5 ${
                  selectedQuizIdx === ROUTER_ARCH_QUIZ[currentQuizPos].correctIndex
                    ? 'bg-green-50 text-green-750 border-green-200'
                    : 'bg-red-50 text-red-750 border-red-200'
                }`}>
                  {selectedQuizIdx === ROUTER_ARCH_QUIZ[currentQuizPos].correctIndex ? '回答正確！' : '作答有誤！'}
                </span>
              )}
            </div>

            {/* Question Text */}
            <h4 className="text-sm md:text-base font-bold text-slate-800 leading-relaxed bg-slate-50/50 p-4 border border-dashed border-slate-200 rounded-xl">
              {ROUTER_ARCH_QUIZ[currentQuizPos].question}
            </h4>

            {/* Options list */}
            <div className="space-y-3">
              {ROUTER_ARCH_QUIZ[currentQuizPos].options.map((opt, oIdx) => {
                const isSelected = selectedQuizIdx === oIdx;
                const isCorrect = oIdx === ROUTER_ARCH_QUIZ[currentQuizPos].correctIndex;

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
                    id={`router-quiz-btn-${currentQuizPos}-${oIdx}`}
                    disabled={selectedQuizIdx !== undefined}
                    onClick={() => handleSelectQuizOptionLocal(oIdx)}
                    className={`w-full text-left p-3.5 border rounded-xl flex items-start gap-3 transition-colors duration-200 cursor-pointer text-xs ${btnStyle}`}
                  >
                    <span className="w-5 h-5 rounded-full border border-slate-350 flex items-center justify-center font-mono text-[9px] font-bold mt-0.5 shrink-0 bg-slate-100 text-slate-600">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="flex-1 font-medium">{opt}</span>
                    {selectedQuizIdx !== undefined && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                    {selectedQuizIdx !== undefined && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Answers & review */}
            <AnimatePresence>
              {selectedQuizIdx !== undefined && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-5 border-t border-slate-110 pt-4"
                >
                  <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-200/40 space-y-2">
                    <div className="flex items-center gap-1.5 text-indigo-750 font-bold">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-[11px] font-black uppercase tracking-wider">
                        詳細觀念解析（Explanation Review）
                      </span>
                    </div>
                    <p className="text-xs text-slate-650 leading-normal font-normal">
                      {ROUTER_ARCH_QUIZ[currentQuizPos].explanation}
                    </p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      id="router-quiz-next"
                      onClick={handleNextQuizLocal}
                      className="flex items-center gap-1 bg-blue-600 text-white rounded-lg px-4 py-2 text-xs font-bold hover:bg-blue-700 cursor-pointer transition-colors shadow-sm"
                    >
                      <span>
                        {currentQuizPos === ROUTER_ARCH_QUIZ.length - 1 ? '完成測驗（Finish）' : '下一關卡（Next）'}
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
              <h4 className="text-base font-black text-slate-800">恭喜您！順利完成了「路由器架構」單元的挑戰！</h4>
              <p className="text-xs text-slate-500">
                答對題數：<b>{quizScores.correct}</b> 題 / 總計：<b>{ROUTER_ARCH_QUIZ.length}</b> 題。點擊下方按鈕以重新挑戰！
              </p>
            </div>

            {/* Analysis card based on correct responses */}
            <div className="p-3 border border-green-200 rounded-xl bg-white max-w-sm">
              <p className="text-[11px] text-green-700 font-bold">
                {quizScores.correct === ROUTER_ARCH_QUIZ.length
                  ? '🏅 太狂了！您完全精通了路由器架構、排程、佇列以及 HOL 阻塞的所有物理觀念！'
                  : quizScores.correct >= 4
                  ? '⭐ 表現非常優異！大部分精細的硬體轉送與控制層分工已被您完好掌握！'
                  : '💡 建議回頭重新點按一下最上方實體圖的各個區域，複習一下，您一定可以拿到滿分！'}
              </p>
            </div>

            <button
              id="router-quiz-restart"
              onClick={handleRestartQuizLocal}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 rounded-lg cursor-pointer shadow-sm transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重新開始挑戰（Restart Quiz）</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
