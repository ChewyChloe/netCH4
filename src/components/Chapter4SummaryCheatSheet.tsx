/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Printer,
  Sparkles,
  Award,
  ChevronRight,
  Info,
  CheckSquare,
  Square,
  Compass,
  FileText,
  RotateCcw,
  BookMarked,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface Flashcard {
  id: number;
  term: string;
  category: string;
  definition: string;
  relevance: string;
}

const TERM_FLASHCARDS: Flashcard[] = [
  {
    id: 1,
    term: '資料平面 (Data Plane)',
    category: '基礎觀念',
    definition: '路由器內部的本地功能。決定進入輸入埠（Input Port）的數據報如何橫越交換結構（Switch Fabric）移動到正確的輸出埠。的時間尺度為「微秒至奈秒級」（由硬體晶片高並行快速執行）。',
    relevance: '與控制平面（千毫秒級/軟體運算）形成對比，是路由器吞吐效能的物理守門人。'
  },
  {
    id: 2,
    term: '控制平面 (Control Plane)',
    category: '基礎觀念',
    definition: '端對端的全局行為。決定封包在源主機到目的主機之間的整條路由通路，時間尺度為「毫秒級」，由傳統路由協定（OSPF, BGP）或集中式 SDN 控制器負責路由計算。',
    relevance: '控制平面負責生成轉送表，資料平面負責搬運，兩者相輔相成。'
  },
  {
    id: 3,
    term: '線頭阻塞 (HOL Blocking)',
    category: '交換系統',
    definition: '在輸入埠佇列中，排在最前面的封包因為目的地輸出埠正忙而被堵住，進而迫使佇列後方其他原本可以立即送出的包也一併受阻的擁塞現象。',
    relevance: '是縱橫式交換結構中，輸入埠佇列管理必須依靠積極主動緩衝調度解決的核心痛點。'
  },
  {
    id: 4,
    term: '最長字首匹配 (LPM)',
    category: '定址編解碼',
    definition: 'Longest Prefix Matching。當轉送表有多個條目的 IP 位址遮罩重疊匹配到達封包時，路由器必須挑選「二進位匹配最長、最精準、最特定（More Specific）的那個遮罩條目」作為轉送出口。',
    relevance: '保證了網際網路定址的階層式聚合，使全球骨幹路由表得以瘦身合併。'
  },
  {
    id: 5,
    term: 'TCAM 記憶體',
    category: '硬體加速',
    definition: 'Ternary Content-Addressable Memory（三態內容定址記憶體）。能在單一晶片時脈週期（Clock Cycle）內，不論表項有幾百萬條，皆做到「不計表項長度的並行查表」硬體技術。',
    relevance: '最長字首匹配（LPM）在硬體高速路由查表的物理底座，代價是造價昂貴且高功耗。'
  },
  {
    id: 6,
    term: 'CIDR 表示法',
    category: '定址編解碼',
    definition: '無類別網域間路由 (Classless Inter-Domain Routing)。形式為 a.b.c.d/x，其中 /x 代表子網路的前置遮罩（Subnet Prefix）長度，拋棄了傳統 A, B, C 類別定址的粗糙分割。',
    relevance: '最大化靈活配額全球公網 IP 地址，是當代 IP 地址劃分與超網合併的核心工具。'
  },
  {
    id: 7,
    term: '隧道技術 (Tunneling)',
    category: '過渡過渡',
    definition: '將一種類型的協議數據報完整的作為 Payload 封裝塞入另一種類型的協議數據中。例：在 IPv4 骨幹島嶼中，將完整的 IPv6 封包包裝成一個 IPv4 的數據負載運送。',
    relevance: '解決了 IPv4 向 IPv6 過渡時期，沿途路由器不支持 IPv6 的「島嶼孤立」痛點。'
  },
  {
    id: 8,
    term: '端對端原則 (E2E Argument)',
    category: '網際哲學',
    definition: '網際網路最核心的哲學指導。主張「網路中間核心必須保持愚蠢與足夠底層，只負責中立搬運 bits；所有的應用智能與複雜可靠性設計，都應完全交由端點主機應用層去實現」。',
    relevance: '此原則賦予了 Internet 無限的包容度和極速，但也與中介設備（Middlebox）形成了本質衝突。'
  }
];

const MASTERY_MILESTONES = [
  { id: 'm1', text: '熟知路由器資料平面（快速/硬體/奈秒）與控制平面（全局/路由計算）本質區別。' },
  { id: 'm2', text: '掌握輸入埠 HOL 阻塞成因，並知曉輸出埠排程（FIFO, Priority, RR, WFQ）演算法。' },
  { id: 'm3', text: '熟練計算 RTT * C / sqrt(N) 斯坦福緩衝區大小經驗黄金公式。' },
  { id: 'm4', text: '能秒懂最長字首匹配（LPM）之二進位遮罩推導，並熟知 TCAM 平行查表地位。' },
  { id: 'm5', text: '精通 IPv4 / MTU 分段偏移量 Offset 計算（以 8 位元組為計量基底）。' },
  { id: 'm6', text: '熟記 DHCP DORA 四步驟方向與埠號（Server 67 ➔ Client 68）；精通 NAT 映射表。' },
  { id: 'm7', text: '熟知 IPv6 去除了 Checksum 與不支援中間 Fragmentation 的去蕪存菁設計美學。' },
  { id: 'm8', text: '掌握 OpenFlow 的 Match+Action 通用轉送，並知其對路由器、防火牆的完美抽象。' }
];

export function Chapter4SummaryCheatSheet() {
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);
  const [masteredItems, setMasteredItems] = useState<Record<string, boolean>>({});

  // Load checklist progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chapter4_mastery_list');
    if (saved) {
      try {
        setMasteredItems(JSON.parse(saved));
      } catch (e) {
        setMasteredItems({});
      }
    }
  }, []);

  const handleToggleFlashcard = (id: number) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleChecklist = (id: string) => {
    const newVal = !masteredItems[id];
    const updated = { ...masteredItems, [id]: newVal };
    setMasteredItems(updated);
    localStorage.setItem('chapter4_mastery_list', JSON.stringify(updated));
  };

  const handleResetChecklist = () => {
    setMasteredItems({});
    localStorage.removeItem('chapter4_mastery_list');
  };

  // Calculations checklist
  const totalCheckItems = MASTERY_MILESTONES.length;
  const completedCheckItems = Object.values(masteredItems).filter(Boolean).length;
  const masteryPercentage = Math.round((completedCheckItems / totalCheckItems) * 100);

  return (
    <div className={`space-y-8 select-none text-left ${isPrintMode ? 'bg-white p-6 rounded-2xl text-black' : ''}`}>
      
      {/* INTRO HERO CONTROLLER CARD */}
      <div className={`bg-white border rounded-2xl p-5 shadow-sm ${isPrintMode ? 'border-black border-2' : 'border-slate-200/60'}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b pb-4 gap-4">
          <div>
            <span className="text-[10px] bg-indigo-110 text-indigo-700 font-extrabold font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              RECOP STUDY SHEET (EXAM PREPARATION)
            </span>
            <h3 className="text-xl font-black text-slate-800 mt-1">第四章 最終備考：重點考點總整理與 LaTeX 公式速查金卡</h3>
            <p className="text-xs text-slate-400 mt-1">
              為您深度盤點本章重難點。切換<strong>【列印備考模式】</strong>將重製介面為高對比白紙黑字，供物理列印或轉存 PDF。
            </p>
          </div>

          <button
            onClick={() => setIsPrintMode(!isPrintMode)}
            className={`text-xs font-black py-2.5 px-4 rounded-xl border duration-200 cursor-pointer shadow-sm flex items-center gap-1 bg-white ${
              isPrintMode
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50 ring-2 ring-indigo-200'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Printer className="w-4 h-4" />
            {isPrintMode ? '重回彩色數位閱讀' : '切換為實體列印備考版'}
          </button>
        </div>
      </div>

      {/* BIG PICTURE PROGRESS TIMELINE */}
      <div className={`p-6 rounded-2xl border ${
        isPrintMode
          ? 'bg-white border-black border-2 text-black'
          : 'bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white border-slate-900 shadow-lg'
      }`}>
        <div className={`border-b pb-3 mb-5 flex justify-between items-center ${isPrintMode ? 'border-black' : 'border-slate-800'}`}>
          <div className="text-left">
            <h4 className="text-base font-black">第四章「一粒 Packet 的完整一生與技術全景路徑樹」</h4>
            <span className={`text-[10.5px] block mt-0.5 ${isPrintMode ? 'text-black font-semibold' : 'text-slate-405'}`}>
              從在 L3 含有 Headers 誕生、佇列、分段、映射、通用流表過濾到中介隔離的全流程考點脈絡：
            </span>
          </div>
        </div>

        {/* Roadmap list */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 text-xs text-left">
          {[
            {
              step: '1. 起程：封裝標頭',
              keypoint: 'IPv4 v.s IPv6 抉擇',
              desc: '在發送主機被添加上有方向的首部。IPv4含有 checksum 與 options；IPv6 去除中間分段與 checksum，硬體極致。'
            },
            {
              step: '2. 樞紐：並行交換',
              keypoint: '最長前綴 (LPM) 與 TCAM',
              desc: '路由器在輸入埠用最長首碼匹配。使用 TCAM 實質單週期萬用匹配；如果遇到出口堵塞，在佇列中引發 HOL 線頭阻塞。'
            },
            {
              step: '3. 躍遷：網域定址',
              keypoint: 'MTU分段、DHCP、NAT',
              desc: '當封包太長，在出口遭遇 MTU 限制被強行分片， Offset 必須計為 8-byte 倍數。NAT 在邊緣強行重寫 L4 Port 緩解 IP 枯竭。'
            },
            {
              step: '4. 大同：通用轉送',
              keypoint: 'OpenFlow Match-Action',
              desc: '通用轉送利用 Flow Table 統一所有規則。一次比對 L1 至 L4 欄位，大一統實現 L2 Switch, L3 Router與 L4 防火牆功能。'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${
                isPrintMode
                  ? 'border-black bg-white text-black'
                  : 'bg-slate-950 border-slate-850 bg-opacity-70 text-slate-300 hover:border-slate-700'
              } relative flex flex-col justify-between`}
            >
              <div className="space-y-1.5">
                <span className={`font-mono text-[9px] font-black uppercase ${isPrintMode ? 'text-black' : 'text-blue-400'}`}>PATH 0{idx + 1}</span>
                <h5 className={`font-black text-xs ${isPrintMode ? 'text-black' : 'text-white'}`}>{item.step}</h5>
                <strong className={`text-[10px] block ${isPrintMode ? 'text-black font-bold' : 'text-yellow-405'}`}>{item.keypoint}</strong>
                <p className="leading-relaxed text-[11px] font-sans text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CORE FORMULAS & CALC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formula 1 */}
        <div className={`p-5 rounded-2xl border bg-white ${isPrintMode ? 'border-2 border-black' : 'border-slate-200/60 shadow-sm'}`}>
          <span className="text-[9px] font-black text-indigo-600 block mb-1">MEMORIZE GOLD FORMULA 1</span>
          <h4 className="text-sm font-black text-slate-800">Stanford 經典骨幹佇列公式 (Buffer Sizing)</h4>
          <p className="text-[11px] text-slate-500 leading-normal font-sans mt-0.5">
            傳統的緩衝區公式會引發嚴重的「緩衝區膨脹」和高延遲。在有 N 個獨立 TCP 流的高速骨幹上，緩衝區大小 B 推薦分配為：
          </p>
          <div className="my-3.5 p-3.5 bg-slate-50 border rounded-xl text-center font-mono text-xs font-black text-indigo-700">
            {"$$B = \\frac{RTT \\times C}{\\sqrt{N}}$$"}
          </div>
          <span className="text-[9.5px] text-slate-400 font-semibold block leading-tight font-sans">
            * C: 出口物理帶寬容量；RTT: 往返延時常數；N: 獨立隨機 TCP 流的總數。
          </span>
        </div>

        {/* Formula 2 */}
        <div className={`p-5 rounded-2xl border bg-white ${isPrintMode ? 'border-2 border-black' : 'border-slate-200/60 shadow-sm'}`}>
          <span className="text-[9px] font-black text-indigo-600 block mb-1">MEMORIZE GOLD FORMULA 2</span>
          <h4 className="text-sm font-black text-slate-800">Weighted Fair Queueing (WFQ) 保障分享率</h4>
          <p className="text-[11px] text-slate-500 leading-normal font-sans mt-0.5">
            在加權公平佇列排程中，不同優先級類別 \( i \) 設定了分配權重 \( w_i \)，在鏈路塞飽滿時，其所能分到的最低物理頻寬佔比為：
          </p>
          <div className="my-3.5 p-3.5 bg-slate-50 border rounded-xl text-center font-mono text-xs font-black text-indigo-700">
            {"$$\\text{Traffic Share} = \\frac{w_i}{\\sum w_j}$$"}
          </div>
          <span className="text-[9.5px] text-slate-400 font-semibold block leading-tight font-sans">
            * 完美地確保低權重流量不會遭遇「完全飢餓 (Starvation)」，實現可控階層公平性。
          </span>
        </div>

        {/* Formula 3 */}
        <div className={`p-5 rounded-2xl border bg-white ${isPrintMode ? 'border-2 border-black' : 'border-slate-200/60 shadow-sm'}`}>
          <span className="text-[9px] font-black text-indigo-600 block mb-1">MEMORIZE GOLD FORMULA 3</span>
          <h4 className="text-sm font-black text-slate-800">IPv4 Fragment Offset 段位置偏移量換算</h4>
          <p className="text-[11px] text-slate-500 leading-normal font-sans mt-0.5">
            路由器因 MTU 強制對 IP 分片時，為了在 13 位元限制內塞下很大的長度，IPv4 協定規定 Offset 計算單位必須採用「3 bits 縮減」，也即：
          </p>
          <div className="my-3.5 p-3.5 bg-slate-50 border rounded-xl text-center font-mono text-xs font-black text-indigo-700">
            {"$$\\text{Offset Field} = \\frac{\\text{Physical Byte Offset}}{8}$$"}
          </div>
          <span className="text-[9.5px] text-slate-400 font-semibold block leading-tight font-sans">
            * 切記！物理字尾偏移位元組必須是 8 的正整數倍，否則將在此傳輸層發生拼裝格式錯誤。
          </span>
        </div>
      </div>

      {/* ACADEMIC FLASHCARDS SECTION */}
      <div className={`bg-white border rounded-2xl p-6 shadow-sm ${isPrintMode ? 'border-2 border-black' : 'border-slate-200/60'}`}>
        <div className="border-b pb-4 mb-5">
          <h4 className="text-base font-black text-slate-800 flex items-center gap-1.5">
            <BookMarked className="w-5 h-5 text-indigo-600" />
            二、高頻期末考直擊重點觀念記憶卡 (Interactive Flashcards)
          </h4>
          <span className="text-xs text-slate-400 block mt-0.5">點擊卡片即可實現「正反翻轉面」，重溫這 8 個最具標誌性的期末考高頻概念：</span>
        </div>

        {/* Grid cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TERM_FLASHCARDS.map((card) => {
            const isFlipped = !!flippedCards[card.id];

            return (
              <div
                key={card.id}
                onClick={() => handleToggleFlashcard(card.id)}
                className={`p-4 rounded-xl border h-44 cursor-pointer flex flex-col justify-between duration-300 transition-all text-left relative overflow-hidden select-none ${
                  isFlipped
                    ? isPrintMode
                      ? 'border-black border-2 bg-slate-100 text-black'
                      : 'border-indigo-400 bg-indigo-50/50 text-indigo-950 scale-102'
                    : 'border-slate-150 bg-white text-slate-800 hover:border-slate-350'
                }`}
              >
                {!isFlipped ? (
                  <div className="space-y-2 h-full flex flex-col justify-between">
                    <div>
                      <span className="bg-slate-100 py-0.5 px-2 rounded text-[9px] font-mono font-bold text-slate-450 block w-max uppercase">
                        {card.category}
                      </span>
                      <h5 className="font-black text-xs pt-1.5 text-slate-800 leading-snug">{card.term}</h5>
                    </div>
                    <span className="text-[9.5px] text-indigo-600 font-bold flex items-center gap-0.5 font-sans">
                      點擊翻看詳解 ➔
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5 h-full flex flex-col justify-between">
                    <div>
                      <span className="text-[8.5px] font-bold text-indigo-500 uppercase font-sans">定義 (Definition):</span>
                      <p className="text-[10px] text-slate-650 leading-relaxed font-sans">{card.definition}</p>
                    </div>
                    <div className="border-t border-indigo-150 pt-1 text-[9px] text-slate-450 italic leading-snug font-sans">
                      * 考點：{card.relevance}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ACADEMIC STUDY COMPARISON TABLES */}
      <div className={`bg-white border rounded-2xl p-6 shadow-sm ${isPrintMode ? 'border-2 border-black' : 'border-slate-200/60'}`}>
        <div className="border-b pb-4 mb-4">
          <h4 className="text-base font-black text-slate-800">三、終極網格協議對比總盤表 (Key Comparison Tables)</h4>
          <span className="text-xs text-slate-400 block mt-0.5">幫您一次整合，考前必須過溫的常規對比：</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-[11px] leading-relaxed font-sans text-slate-600">
          
          {/* Table 1: Forwarding vs Routing */}
          <div className="space-y-2 text-left">
            <span className="p-1 px-1.5 text-[9px] bg-blue-50 text-blue-800 rounded font-bold font-mono">1. 資料面 (Forwarding) V.S 控制面 (Routing)</span>
            <table className="w-full border rounded-xl overflow-hidden divide-y divide-slate-150">
              <thead className="bg-slate-50 font-bold">
                <tr>
                  <th className="p-2 border">維度</th>
                  <th className="p-2 border">轉送 (Forwarding)</th>
                  <th className="p-2 border">路由 (Routing)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                <tr>
                  <td className="p-2 border font-bold">平面歸屬</td>
                  <td className="p-2 border">資料平面 (Data Plane)</td>
                  <td className="p-2 border">控制平面 (Control Plane)</td>
                </tr>
                <tr>
                  <td className="p-2 border font-bold">時間尺標</td>
                  <td className="p-2 border font-mono text-rose-500 font-extrabold">奈秒至微秒級 (Nanoseconds)</td>
                  <td className="p-2 border font-mono text-blue-600">毫秒至秒級 (Milliseconds)</td>
                </tr>
                <tr>
                  <td className="p-2 border font-bold">運作本質</td>
                  <td className="p-2 border">硬體晶片查表 (LPM)，本地移動</td>
                  <td className="p-2 border">軟體演算法計算 (Dijkstra)，端對端路徑</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table 2: IPv4 vs IPv6 */}
          <div className="space-y-2 text-left">
            <span className="p-1 px-1.5 text-[9px] bg-purple-50 text-purple-800 rounded font-bold font-mono">2. IPv4 標頭 V.S IPv6 精巧簡裁標頭</span>
            <table className="w-full border rounded-xl overflow-hidden divide-y divide-slate-150">
              <thead className="bg-slate-50 font-bold">
                <tr>
                  <th className="p-2 border">功能要素</th>
                  <th className="p-2 border">IPv4 (32-bit Address)</th>
                  <th className="p-2 border">IPv6 (128-bit Address)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                <tr>
                  <td className="p-2 border font-bold">標頭長度</td>
                  <td className="p-2 border text-slate-500">20 ~ 60 位元組 (可變長度)</td>
                  <td className="p-2 border text-[11px] text-green-700 font-bold">固定為 40 位元組 (硬體提速)</td>
                </tr>
                <tr>
                  <td className="p-2 border font-bold">分段碎裂</td>
                  <td className="p-2 border">支援路由器中途進行 Fragmentation Offs</td>
                  <td className="p-2 border text-[11px] text-green-700 font-bold">路由器禁止中途分片，只允許端點分</td>
                </tr>
                <tr>
                  <td className="p-2 border font-bold">校驗校檢</td>
                  <td className="p-2 border">標頭內置 Checksum 欄位 (逐跳重算)</td>
                  <td className="p-2 border text-[11px] text-green-700 font-bold">徹底移除 Checksum 標記 (降載)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PERSISTENT MASTERY CHECKLIST */}
      <div className={`bg-white border rounded-2xl p-6 shadow-sm ${isPrintMode ? 'border-2 border-black' : 'border-slate-200/60'}`}>
        <div className="border-b pb-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-black text-slate-800 flex items-center gap-1.5">
              <Award className="w-5.5 h-5.5 text-blue-600" />
              四、第四章網路層期末核心里程碑通關檢核單 (Mastery Checklist)
            </h4>
            <span className="text-xs text-slate-400 block mt-0.5">利用下方 persistent 複選欄，在備考複習過關時手動勾選自我校驗（自動存儲進度）：</span>
          </div>

          {completedCheckItems > 0 && (
            <button
              onClick={handleResetChecklist}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border flex items-center gap-0.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              清空檢核紀錄
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Progress meter ticker circular box */}
          <div className="md:col-span-3 p-5 bg-slate-50 border rounded-2xl text-center space-y-3 shrink-0">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">第四章全域精熟掌控度</span>
            
            <div className="inline-flex items-center justify-center relative my-1">
              <div className="w-20 h-20 rounded-full border-4 border-slate-200 flex items-center justify-center relative">
                <div
                  className="absolute inset-0 rounded-full border-4 border-blue-500 transition-all duration-300"
                  style={{
                    clipPath: `polygon(50% 50%, -50% -50%, ${masteryPercentage >= 25 ? '150%' : '50%'} ${masteryPercentage >= 25 ? '-50%' : '-50%'}, ${masteryPercentage >= 50 ? '150%' : '150%'} ${masteryPercentage >= 50 ? '150%' : '-50%'}, ${masteryPercentage >= 75 ? '-50%' : '150%'} ${masteryPercentage >= 75 ? '150%' : '150%'}, -50% -50%)`,
                    transform: 'rotate(45deg)'
                  }}
                />
                <span className="text-xl font-black text-slate-800 font-mono relative z-10">
                  {masteryPercentage}%
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10.5px] font-bold text-slate-600 block">
                已精準攻破 {completedCheckItems} / {totalCheckItems} 條
              </span>
              {masteryPercentage === 100 ? (
                <span className="bg-yellow-50 text-amber-700 text-[9.5px] font-black py-0.5 px-2 rounded mt-1.5 inline-block border border-yellow-200">
                  🎉 考點精熟！榮膺學者徽章
                </span>
              ) : (
                <span className="text-[9.5px] text-slate-400 block mt-1 leading-snug">
                  勾選條目至 100% 即可解鎖章節榮譽勋章！
                </span>
              )}
            </div>
          </div>

          {/* Real Checklist */}
          <div className="md:col-span-9 space-y-2.5">
            {MASTERY_MILESTONES.map((item) => {
              const checked = !!masteredItems[item.id];

              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleChecklist(item.id)}
                  className={`p-3 border rounded-xl flex items-start gap-3 duration-150 cursor-pointer select-none ${
                    checked
                      ? isPrintMode
                        ? 'border-black bg-slate-50 text-black'
                        : 'border-green-200 bg-green-50/20 text-slate-800 shadow-sm'
                      : 'border-slate-150 bg-white hover:border-slate-250 text-slate-650'
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    {checked ? (
                      <CheckSquare className="w-4.5 h-4.5 text-green-600" />
                    ) : (
                      <Square className="w-4.5 h-4.5 text-slate-350" />
                    )}
                  </div>
                  <span className={`text-xs font-sans leading-normal ${checked ? 'line-through text-slate-400 font-medium' : 'font-semibold'}`}>
                    {item.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
