/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  Settings,
  ShieldAlert,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Shuffle,
  Columns,
  Cpu,
  ArrowRight,
  Database,
  Award,
  BookOpen,
  RotateCcw
} from 'lucide-react';

interface Ipv6Field {
  name: string;
  bitLength: number;
  rowWidthClass: string; // Tailwind representation
  purpose: string;
  example: string;
  whyItMatters: string;
}

const IPV6_FIELDS: Ipv6Field[] = [
  {
    name: 'Version (版本)',
    bitLength: 4,
    rowWidthClass: 'col-span-1',
    purpose: '標識網際網路協定之版本號。對於 IPv6 而言，其值恆定設定為二進位 0110 (十進位 6)。',
    example: '6 (二進位 0110)',
    whyItMatters: '供實體網卡底層硬體解碼電路第一時間區分，決定將此封包流向 IPv4 的解套引擎還是 IPv6 的專有处理隊列。'
  },
  {
    name: 'Traffic Class (流量類別)',
    bitLength: 8,
    rowWidthClass: 'col-span-2',
    purpose: '類似於 IPv4 中的 Type of Service (TOS) / DiffServ 服務差別。用於設定資料流量之傳輸優先度。',
    example: '0x00 (預設常規傳輸品質)',
    whyItMatters: '骨幹網路擁塞時，高優先權流量（例如即時網路電話 VoIP）的 Traffic Class 標記會被優先排程轉送。'
  },
  {
    name: 'Flow Label (流標籤)',
    bitLength: 20,
    rowWidthClass: 'col-span-5',
    purpose: '這是 IPv6 全新引入的 20-bit 欄位。用於標記同一特定來源與目的地、需要特定路由政策對待之一序列封包。',
    example: '0x3F91A',
    whyItMatters: '路由器不需要深度解析 L4 協定（如 TCP/UDP 埠號），僅憑 Flow Label 即可將同一組即時多媒體流包，綁定於完全相同的最速線路上轉送，保證不發生亂序。'
  },
  {
    name: 'Payload Length (載荷長度)',
    bitLength: 16,
    rowWidthClass: 'col-span-4',
    purpose: '標識緊隨於該 40 位元組固定標頭（Fixed Header）之後部其餘實體載荷、附加屬性（Payload+Extension Headers）的總位元組數。',
    example: '1440 Bytes',
    whyItMatters: 'IPv4 標頭的 Total Length 是「標頭+載荷」總合；而 IPv6 因為標頭固定為 40 位元組，其 Payload Length 純粹指的是其後的負載本身，解析計算極度精平。'
  },
  {
    name: 'Next Header (下一個標頭)',
    bitLength: 8,
    rowWidthClass: 'col-span-2',
    purpose: '標誌緊隨本 IPv6 固定標頭後面的協定種類。類似於 IPv4 的 Protocol 欄位（TCP=6, UDP=17, ICMPv6=58），亦指涉其後是否串接了擴展標頭。',
    example: '6 (代表下部緊接著 TCP 標頭)',
    whyItMatters: '極致的模組化拆卸設計！若需要加密安全或選項防範，僅需串入擴展標頭（Extension Headers）並利用 Next Header 鏈表式往後指配，主標頭格式保持固定不動。'
  },
  {
    name: 'Hop Limit (躍點限制)',
    bitLength: 8,
    rowWidthClass: 'col-span-2',
    purpose: '這本質上就是 IPv4 中的 TTL (Time-to-Live)。每經過一個路由器，該值便遞減 1；當其衰減降為 0 時，此封包將被路由器直接丟棄，並回傳 ICMPv6。',
    example: '64',
    whyItMatters: '防止因為路由拓撲形成環路 (Routing Loop) 時，孤立無援的失控封包在 Internet 骨幹中無窮迴圈而耗盡頻寬。'
  },
  {
    name: 'Source Address (來源 IPv6 位址)',
    bitLength: 128,
    rowWidthClass: 'col-span-12 py-3 bg-indigo-50/50',
    purpose: '標識發起該資料報傳輸的主機其全物理介面對應之 128 位元（16 位元組）全球唯一的 IPv6 網路位址。',
    example: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
    whyItMatters: '高達 128 bits。徹底解決了 IPv4 位址匱乏！不僅不再需要 NAT 進程中途扭轉重寫，更為地球上的每粒沙塵設備，都配發足額公用定址空間。'
  },
  {
    name: 'Destination Address (目的地 IPv6 位址)',
    bitLength: 128,
    rowWidthClass: 'col-span-12 py-3 bg-blue-50/50',
    purpose: '標識該封包最終指定抵達並接收的主機介面之 128 位元（16 位元組）IPv6 位址。',
    example: '2001:4860:4860:0000:0000:0000:0000:8888',
    whyItMatters: '128 bits address. 支援超大規模無痛路由、多播宣告與階層優雅聚合。'
  }
];

export function Ipv6Explorer() {
  const [selectedFieldName, setSelectedFieldName] = useState<string>('Source Address (來源 IPv6 位址)');
  const [tunnelState, setTunnelState] = useState<number>(0); // 0..5 for tunneling animation steps
  const [compareMetric, setCompareMetric] = useState<'all' | 'header-size' | 'checksum' | 'frag'>('all');

  // Quiz States
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizChecked, setQuizChecked] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});

  const activeField = IPV6_FIELDS.find(f => f.name === selectedFieldName) || IPV6_FIELDS[6];

  const ipv6Questions = [
    {
      id: 1,
      question: '相較於 IPv4，IPv6 標頭格式最重大的「精簡」和效率優化設計是下列何者？',
      options: [
        '長度由 20 位元組變為可變長度 60 位元組',
        '完全移除了標頭檢查碼 (Checksum)，中途路由器不需要再反覆重新計算 Checksum',
        '增加了更多的路由選項位元',
        '強迫中間所有轉送路由器都必須代替客戶端進行分段工作'
      ],
      correctIndex: 1,
      explanation: 'IPv6 移除了標頭檢查碼 (Checksum)。因為 L2 連結層有強大的 CRC 校驗，L4 傳輸層（TCP/UDP）亦有 Checksum 保護。移除 Checksum 能免除中途路由器每躍點（Hop）降 TTL 時重新計算 CPU 的時間消耗。'
    },
    {
      id: 2,
      question: '當一個 IPv6 資料報大於中途路由島嶼的 MTU 實體界限時，IPv6 路由器會如何處理？',
      options: [
        '路由器主動幫其切割為更小的 Fragment（與 IPv4 相同）',
        '直接丟棄封包，並返送 "Packet Too Big" 的 ICMPv6 差錯指令，由來源設備縮減重發',
        '自動將其升速轉送',
        '暫時快取於緩衝區中，等待線路拓寬'
      ],
      correctIndex: 1,
      explanation: 'IPv6 規定路由器不進行 Fragmentation（不允許分段）。如果尺寸大於 MTU，路由器直接丟包並回傳 ICMPv6，逼使發送端執行 "Path MTU Discovery" 探查，在源端先分段好，減少中途路由器負擔。'
    },
    {
      id: 3,
      question: '過渡過渡期「隧道技術（Tunneling）」的運作原理中，在 IPv4 骨幹網路島嶼中傳輸時：',
      options: [
        '整個 IPv6 資料報被重新壓縮成二進位文字',
        '整個 IPv6 資料報被包裝（Encapsulated）在一個標準 IPv4 封包的 Payload 負載部分',
        'IPv6 被迫直接拋棄，只使用 IPv4 重播資料',
        '修改實體網卡的 MAC 地址使其符合 L2 路由'
      ],
      correctIndex: 1,
      explanation: '隧道（Tunneling）是將「IPv6 封包整體」包裝在一個標準「IPv4 封包的資料承載區（Payload）」內。中途尚未升級的 IPv4 路由器只將其視為一般的 IPv4 負載轉送，藉此無缝度過混合時代。'
    }
  ];

  const handleNextTunnelStep = () => {
    if (tunnelState === 5) {
      setTunnelState(0);
      return;
    }
    setTunnelState(prev => prev + 1);
  };

  const handleTunnelReset = () => {
    setTunnelState(0);
  };

  const handleSelectAnswer = (qId: number, oIdx: number) => {
    if (quizChecked) return;
    setUserAnswers(prev => ({ ...prev, [qId]: oIdx }));
  };

  const handleValidateQuiz = () => {
    let score = 0;
    ipv6Questions.forEach(q => {
      if (userAnswers[q.id] === q.correctIndex) {
        score += 33; // ~100 max
      }
    });
    if (score === 99) score = 100; // round up
    setQuizScore(score);
    setQuizChecked(true);
  };

  const handleQuizReset = () => {
    setUserAnswers({});
    setQuizScore(null);
    setQuizChecked(false);
  };

  return (
    <div className="space-y-8 select-none">
      {/* SECTION 1: HEADER FORMAT EXPLORER */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="border-b pb-4 mb-6">
          <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
            IPV6 FIXED HEADER STRUCTURE (40 BYTES)
          </span>
          <h3 className="text-xl font-black text-slate-800 mt-1">IPv6 固定標頭格式探索器</h3>
          <p className="text-xs text-slate-400 mt-1">
            下圖代表一個 1-indexed、寬度 32-bit (4位元組) 排列形式的 IPv6 
            固定標頭布局。點擊各個色塊欄位，在下方查看各欄位位元設計細節與硬體優化核心：
          </p>
        </div>

        {/* The 32-bit Interactive Diagram Grid */}
        <div className="max-w-4xl mx-auto space-y-1 bg-slate-50 border p-4 rounded-2xl shadow-inner mb-6">
          
          {/* Header Bits Scale */}
          <div className="grid grid-cols-32 text-[8px] font-mono text-slate-400 font-bold mb-1 px-1">
            <div className="col-span-1 text-left">0</div>
            <div className="col-span-3 text-right">3</div>
            <div className="col-span-1 pl-1">4</div>
            <div className="col-span-7 text-right">11</div>
            <div className="col-span-1 pl-1">12</div>
            <div className="col-span-19 text-right">31 (Bits)</div>
          </div>

          {/* Row 1: Version (4b), Traffic Class (8b), Flow Label (20b) */}
          <div className="grid grid-cols-12 gap-1 px-1">
            <div
              onClick={() => setSelectedFieldName('Version (版本)')}
              className={`col-span-2 p-2 px-1 border rounded-lg text-center font-mono text-[10px] font-black cursor-pointer duration-200 ${
                activeField.name.startsWith('Version')
                  ? 'bg-indigo-600 text-white shadow ring-2 ring-indigo-200 scale-102'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50'
              }`}
            >
              Version (4b)
            </div>
            <div
              onClick={() => setSelectedFieldName('Traffic Class (流量類別)')}
              className={`col-span-2 p-2 px-1 border rounded-lg text-center font-mono text-[10px] font-black cursor-pointer duration-200 ${
                activeField.name.startsWith('Traffic Class')
                  ? 'bg-indigo-600 text-white shadow ring-2 ring-indigo-200 scale-102'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50'
              }`}
            >
              Traffic Class (8b)
            </div>
            <div
              onClick={() => setSelectedFieldName('Flow Label (流標籤)')}
              className={`col-span-8 p-2 px-1 border rounded-lg text-center font-mono text-[10px] font-black cursor-pointer duration-200 ${
                activeField.name.startsWith('Flow Label')
                  ? 'bg-indigo-600 text-white shadow ring-2 ring-indigo-200 scale-102'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50'
              }`}
            >
              Flow Label (20b)
            </div>
          </div>

          {/* Row 2: Payload Length (16b), Next Header (8b), Hop Limit (8b) */}
          <div className="grid grid-cols-12 gap-1 px-1">
            <div
              onClick={() => setSelectedFieldName('Payload Length (載荷長度)')}
              className={`col-span-6 p-2 px-1 border rounded-lg text-center font-mono text-[10px] font-black cursor-pointer duration-200 ${
                activeField.name.startsWith('Payload Length')
                  ? 'bg-indigo-600 text-white shadow ring-2 ring-indigo-200 scale-102'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50'
              }`}
            >
              Payload Length (16b)
            </div>
            <div
              onClick={() => setSelectedFieldName('Next Header (下一個標頭)')}
              className={`col-span-3 p-2 px-1 border rounded-lg text-center font-mono text-[10px] font-black cursor-pointer duration-200 ${
                activeField.name.startsWith('Next Header')
                  ? 'bg-indigo-600 text-white shadow ring-2 ring-indigo-200 scale-102'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50'
              }`}
            >
              Next Header (8b)
            </div>
            <div
              onClick={() => setSelectedFieldName('Hop Limit (躍點限制)')}
              className={`col-span-3 p-2 px-1 border rounded-lg text-center font-mono text-[10px] font-black cursor-pointer duration-200 ${
                activeField.name.startsWith('Hop Limit')
                  ? 'bg-indigo-600 text-white shadow ring-2 ring-indigo-200 scale-102'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50'
              }`}
            >
              Hop Limit (8b)
            </div>
          </div>

          {/* Row 3: Source IP Address (128 bits) */}
          <div className="px-1">
            <div
              onClick={() => setSelectedFieldName('Source Address (來源 IPv6 位址)')}
              className={`p-3.5 border rounded-lg text-center font-mono text-[10px] font-black cursor-pointer duration-200 ${
                activeField.name.startsWith('Source Address')
                  ? 'bg-indigo-650 text-white shadow ring-2 ring-indigo-200 scale-101'
                  : 'bg-indigo-50/20 border-indigo-100 text-slate-750 hover:bg-indigo-50'
              }`}
            >
              Source Address (來源 128-bit IPv6 地址)
            </div>
          </div>

          {/* Row 4: Destination IP Address (128 bits) */}
          <div className="px-1">
            <div
              onClick={() => setSelectedFieldName('Destination Address (目的地 IPv6 位址)')}
              className={`p-3.5 border rounded-lg text-center font-mono text-[10px] font-black cursor-pointer duration-200 ${
                activeField.name.startsWith('Destination Address')
                  ? 'bg-blue-650 text-white shadow ring-2 ring-blue-200 scale-101'
                  : 'bg-blue-50/20 border-blue-100 text-slate-750 hover:bg-blue-50'
              }`}
            >
              Destination Address (目的地 128-bit IPv6 地址)
            </div>
          </div>
        </div>

        {/* Detailed Inspector Field Data Card */}
        <div className="bg-slate-900 border border-slate-950 rounded-2xl p-5 text-slate-300">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
            <span className="p-1 px-2 text-[9.5px] bg-indigo-900 text-indigo-200 rounded font-bold font-mono">
              FIELD CONFIG ANALYSIS
            </span>
            <h4 className="text-sm font-black text-white">
              核查 IPv6 欄位： <span className="text-indigo-400">{activeField.name}</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 leading-relaxed text-xs">
            <div className="md:col-span-4 space-y-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-500 font-mono block">欄位長度 (Size)</span>
                <strong className="text-white text-sm font-mono">{activeField.bitLength} 位元 (Bits)</strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-500 font-mono block">範例值 (Example Value)</span>
                <strong className="text-emerald-400 text-xs font-mono">{activeField.example}</strong>
              </div>
            </div>

            <div className="md:col-span-8 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-mono block uppercase">基本職責功能 (Purpose)：</span>
                <p className="text-[11.5px] text-slate-350 leading-relaxed font-sans">{activeField.purpose}</p>
              </div>
              <div className="bg-slate-950/40 p-3.5 border border-slate-850 rounded-xl leading-normal text-[11px] text-emerald-400/90 font-mono">
                🚀 <strong className="text-slate-300">為何做此優化、好處是什麼？</strong><br />
                <p className="mt-1 leading-relaxed text-slate-400">{activeField.whyItMatters}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: TUNNELING ANIMATION MODULE */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 mb-5 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Shuffle className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800">二、歷史過渡：IPv6-in-IPv4 「虛擬網絡隧道 (Tunneling)」封裝模擬器</h4>
              <span className="text-[10px] text-slate-400 font-bold block">
                全球不可能一夕之間全部升級 IPv6。當 IPv6 封包行進至未升級的普通「IPv4 專屬路由器島嶼」時，展示如何進行中途信封包裝 (Encapsulation)：
              </span>
            </div>
          </div>

          <div className="flex gap-1">
            <button
              id="btn-tunnel-step"
              onClick={handleNextTunnelStep}
              className="text-xs font-black bg-indigo-650 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg shadow-sm duration-150"
            >
              {tunnelState === 0 ? '開始隧道傳輸 🎬' : tunnelState === 5 ? '重歸起點' : '前進下一站 ➔'}
            </button>
            <button
              id="btn-tunnel-reset"
              onClick={handleTunnelReset}
              className="p-1 px-2 border rounded-md text-slate-400 hover:text-slate-600 font-mono bg-white hover:bg-slate-50"
              title="重置"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Topology visual area */}
        <div className="bg-slate-50/60 border border-dashed rounded-2xl p-6 min-h-[300px] flex flex-col justify-between relative overflow-hidden">
          
          <div className="grid grid-cols-12 items-center gap-1.5 relative mt-4">
            {/* 1. Host IPv6 A */}
            <div className="col-span-2 text-center p-3.5 bg-white border rounded-xl shadow-sm">
              <Cpu className="w-6 h-6 mx-auto mb-1 text-indigo-600" />
              <strong className="text-[10px] block">IPv6 Source</strong>
              <span className="text-[8px] font-mono text-slate-400">2001:DB8::1</span>
            </div>

            {/* Link 1 */}
            <div className="col-span-1 h-[2px] bg-dashed border-b border-indigo-400 relative">
              {tunnelState === 1 && (
                <motion.div
                  animate={{ x: ['-20%', '120%'] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-2.5 h-2.5 bg-indigo-600 rounded-full absolute -top-1"
                />
              )}
            </div>

            {/* 2. Dual Stack Router B (Encapsulator) */}
            <div className={`col-span-2 text-center p-3 bg-slate-900 text-white rounded-xl duration-350 ${
              tunnelState === 2 ? 'ring-4 ring-indigo-500/20 border border-indigo-500 bg-slate-950 scale-102' : ''
            }`}>
              <Settings className={`w-5 h-5 mx-auto mb-1 ${tunnelState === 2 ? 'text-indigo-400 animate-spin' : 'text-slate-400'}`} />
              <strong className="text-[9.5px] block">Dual-Stack R_B</strong>
              <span className="text-[7.5px] font-mono text-indigo-300 block">Encapsulates Envelope</span>
              <span className="text-[7.5px] font-mono text-slate-500 block">WAN IP: 10.0.0.10 (IPv4)</span>
            </div>

            {/* Tunnel path (V4 bone) */}
            <div className="col-span-4 h-16 relative flex items-center justify-around">
              <div className="h-5 border-y-2 border-dashed border-blue-200 bg-blue-100/30 text-blue-800 text-[8px] font-bold flex items-center justify-center w-full select-none">
                {tunnelState === 3 ? '🔒 TUNNEL ISLAND (IPv4 ONLY REGION)' : 'IPv4 Transit Carrier'}
              </div>

              {/* Encapsulated Packet moving across the V4 Core (Step 3) */}
              <AnimatePresence>
                {tunnelState === 3 && (
                  <motion.div
                    initial={{ x: '-150%', scale: 0.8 }}
                    animate={{ x: '150%', scale: 1 }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    className="bg-blue-600 border border-blue-500 text-white font-mono text-[8px] px-2 py-1.5 rounded shadow-lg z-10 flex flex-col absolute items-center leading-none text-center"
                  >
                    <span className="bg-amber-500 text-[6.5px] text-white px-1 py-0.2 rounded font-black block scale-90 mb-0.5">IPv4 ENVELOPE</span>
                    <span>Src: 10.0.0.10 ➔ Dst: 10.0.0.22</span>
                    <span className="opacity-75 text-[7px] mt-0.5 mt-0.5">[Payload: Inner IPv6]</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Dual Stack Router C (De-capsulator) */}
            <div className={`col-span-2 text-center p-3 bg-slate-900 text-white rounded-xl duration-350 ${
              tunnelState === 4 ? 'ring-4 ring-indigo-500/20 border border-indigo-500 bg-slate-950 scale-102' : ''
            }`}>
              <Settings className={`w-5 h-5 mx-auto mb-1 ${tunnelState === 4 ? 'text-indigo-400 animate-spin' : 'text-slate-400'}`} />
              <strong className="text-[9.5px] block">Dual-Stack R_C</strong>
              <span className="text-[7.5px] font-mono text-emerald-300 block">Strips IPv4 Envelope</span>
              <span className="text-[7.5px] font-mono text-slate-500 block">WAN IP: 10.0.0.22 (IPv4)</span>
            </div>

            {/* Link 2 */}
            <div className="col-span-1 h-[2px] bg-dashed border-b border-indigo-400 relative">
              {tunnelState === 5 && (
                <motion.div
                  animate={{ x: ['-20%', '120%'] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-2.5 h-2.5 bg-indigo-600 rounded-full absolute -top-1"
                />
              )}
            </div>

            {/* 4. Host IPv6 B */}
            <div className="col-span-2 text-center p-3.5 bg-white border rounded-xl shadow-sm">
              <Cpu className="w-6 h-6 mx-auto mb-1 text-indigo-600" />
              <strong className="text-[10px] block">IPv6 Dest</strong>
              <span className="text-[8px] font-mono text-slate-400">2001:DB8::2</span>
            </div>
          </div>

          {/* Current Tunneling Log explaining step details */}
          <div className="bg-slate-900 border border-slate-950 p-4 rounded-xl text-xs font-mono text-slate-350 flex items-start gap-3">
            <span className="p-1 px-1.5 bg-indigo-900 text-indigo-200 font-extrabold rounded select-none shrink-0">躍遷狀態 #{tunnelState}</span>
            <div className="leading-relaxed">
              {tunnelState === 0 && '等待啟動虛擬隧道傳輸。請點擊上方「開始隧道傳輸」在網路跳閘拓撲圖中追蹤其多棧協定之包裝演繹機制。'}
              {tunnelState === 1 && '原生 IPv6 資料報從來源端 (2001:DB8::1) 流出。它在到達網格路由內核的過程中，一切皆依照順暢的 IPv6 鏈路發送。'}
              {tunnelState === 2 && '資料包抵達第一個雙棧（Dual-Stack）路由器 R_B。R_B 查明其下一跳通訊島嶼屬於不支援任何 IPv6 報頭的原始 IPv4 骨幹。為了安全通過，R_B 「動態封裝 (Encapsulate)」：將該完整的 IPv6 報文整體包裝進一個傳統 IPv4 封包之 payload 數據體中、並建立外層信封。'}
              {tunnelState === 3 && '封裝完畢的新型複合封包穿行在 IPv4 Core 島嶼中。此島嶼中的所有老式 IPv4 骨幹中轉路由器，在解析讀取標頭時，只將其視作普通的、Src 為 10.0.0.10、Dst 為 10.0.0.22 的常規 IPv4 傳輸數據。封包安全地得到了傳送，完美相容！'}
              {tunnelState === 4 && '大包裹抵達隧道出口之雙協定堆疊路由器 R_C (10.0.0.22)。R_C 解析識別外層 IP 標頭，隨即做出「剥離/解包 (De-capsulate)」代作：撤除包裹的外層整個 IPv4 大信封，重新吐出包裹內部原汁原味、未有任何損壞的原生 IPv6 封包。'}
              {tunnelState === 5 && '原裝的 IPv6 資料包重新回到純粹的 IPv6 網段快車道。並順利安全抵達最终目的地電腦主機 (2001:DB8::2)。Tunneling 技術巧妙地解決了全球網絡跨世紀升級換代過程中的相容互通死鎖。'}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: SPECIFICATIONS COMPARISON GRID */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b pb-4 mb-5">
          <Columns className="w-5 h-5 text-indigo-600 animate-pulse" />
          <div>
            <h3 className="text-base font-black text-slate-800">三、規格演化：IPv4 與 IPv6 標頭深度對比表</h3>
            <span className="text-xs text-slate-400 block">直觀感受 IPv6 對標頭冗餘欄位的大刀闊斧精簡優化：</span>
          </div>
        </div>

        {/* Comparison filter toggles */}
        <div className="flex gap-1.5 mb-4 max-w-md bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'all', label: '全部對比' },
            { id: 'header-size', label: '標頭長度與選項' },
            { id: 'checksum', label: 'Checksum 優化' },
            { id: 'frag', label: '分段處理原則' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setCompareMetric(btn.id as any)}
              className={`flex-1 text-xs py-2 rounded-lg font-bold transition duration-200 ${
                compareMetric === btn.id
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="border rounded-2xl overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-105 border-b text-slate-700 font-black">
                <th className="p-3 w-1/4">比較特徵項目</th>
                <th className="p-3 bg-red-50/20 text-red-800 w-3/8">網際網路協定第四版 (IPv4)</th>
                <th className="p-3 bg-green-50/20 text-green-800 w-3/8">網際網路協定第六版 (IPv6)</th>
              </tr>
            </thead>
            <tbody>
              {/* Feature 1 */}
              {(compareMetric === 'all' || compareMetric === 'header-size') && (
                <tr className="border-b bg-white hover:bg-slate-50/40">
                  <td className="p-4 font-bold text-slate-705">定址空間長度</td>
                  <td className="p-4">32 位元 (32 bits, 約 <strong>43 億個 IP</strong>)。如今配發已耗盡。</td>
                  <td className="p-4 font-semibold text-green-700 bg-green-50/5">128 位元 (128 bits, 約 <strong>3.4 × 10³⁸ 個</strong>)。多到無窮無盡。</td>
                </tr>
              )}

              {/* Feature 2 */}
              {(compareMetric === 'all' || compareMetric === 'header-size') && (
                <tr className="border-b bg-white hover:bg-slate-50/40">
                  <td className="p-4 font-bold text-slate-705">基本標頭長度特徵</td>
                  <td className="p-4"><strong>可變長度</strong>（20 位元組至 60 位元組，含有可選 Options）。路由器解析緩慢。</td>
                  <td className="p-4 font-semibold text-green-700 bg-green-50/5"><strong>固定 40 位元組</strong>（40-byte Fixed Header）。大大省去了路由器解析排定的計算消耗。</td>
                </tr>
              )}

              {/* Feature 3 */}
              {(compareMetric === 'all' || compareMetric === 'checksum') && (
                <tr className="border-b bg-white hover:bg-slate-50/40">
                  <td className="p-4 font-bold text-slate-705">標頭檢查碼 (Checksum)</td>
                  <td className="p-4"><strong>有</strong>。因為 TTL 遞減，中途每個路由器均必須重新計算並寫入 Checksum。</td>
                  <td className="p-4 font-semibold text-green-700 bg-green-50/5"><strong>無 / 完全移除</strong>。完全交由第二層與第四層校驗，解脫中途處理器重新算 Checksum 的負擔。</td>
                </tr>
              )}

              {/* Feature 4 */}
              {(compareMetric === 'all' || compareMetric === 'frag') && (
                <tr className="border-b bg-white hover:bg-slate-50/40">
                  <td className="p-4 font-bold text-slate-705">分段處理 (Fragmentation)</td>
                  <td className="p-4"><strong>支援中途切割</strong>。主機與中繼路由器都可以根據 MTU 調查直接在 L3 進行封包分段。</td>
                  <td className="p-4 font-semibold text-green-700 bg-green-50/5"><strong>路由器完全不准分段</strong>。若包大於 MTU 直接丟棄，強迫源端在出發前就封裝妥帖，保障硬體快線吞吐。</td>
                </tr>
              )}

              {/* Feature 5 */}
              {(compareMetric === 'all' || compareMetric === 'header-size') && (
                <tr className="hover:bg-slate-50/40 bg-white">
                  <td className="p-4 font-bold text-slate-705">選項欄位 (Options)</td>
                  <td className="p-4">內置於標頭中，因而導致了報文長度不確定，妨礙硬體解編電路。</td>
                  <td className="p-4 font-semibold text-green-700 bg-green-50/5">移出固定標頭。改用<strong>「擴展標頭链 (Extension Headers)」</strong>鏈表形式掛載，主格式安全固定。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: ASSESSMENT QUIZ */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="border-b pb-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800">隨堂演練四：IPv6 規格特徵與隧道機制評測</h4>
              <span className="text-[10px] text-slate-400 font-bold block">利用 3 道精選多重理解選擇題，驗證您對下一代網際網路協定的深度認知：</span>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {ipv6Questions.map((q, idx) => {
            const chosenIdx = userAnswers[q.id];

            return (
              <div key={q.id} className="p-4 bg-slate-50/50 border rounded-2xl space-y-3">
                <div className="font-bold text-slate-800 leading-relaxed text-xs">
                  <span className="bg-indigo-100 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded mr-1.5 font-mono">Q{idx + 1}</span>
                  {q.question}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, oIdx) => {
                    const isChosen = chosenIdx === oIdx;
                    const isCorrect = q.correctIndex === oIdx;

                    let btnClass = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
                    if (isChosen && !quizChecked) {
                      btnClass = 'border-indigo-500 bg-indigo-50/80 text-indigo-805 font-bold';
                    } else if (quizChecked) {
                      if (isCorrect) {
                        btnClass = 'border-green-400 bg-green-50 text-green-800 font-bold ring-2 ring-green-150';
                      } else if (isChosen) {
                        btnClass = 'border-red-400 bg-red-50 text-red-805 font-bold';
                      } else {
                        btnClass = 'border-slate-100 bg-white text-slate-400 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={quizChecked}
                        onClick={() => handleSelectAnswer(q.id, oIdx)}
                        className={`p-3 text-left rounded-xl border duration-150 flex items-center justify-between ${btnClass}`}
                      >
                        <span>{opt}</span>
                        {quizChecked && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 ml-1" />}
                        {quizChecked && isChosen && !isCorrect && <XCircle className="w-4 h-4 text-red-605 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>

                {quizChecked && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-white border border-slate-100 rounded-xl text-[11px] text-slate-500 leading-relaxed"
                  >
                    💡 <strong>精析解讀：</strong> {q.explanation}
                  </motion.p>
                )}
              </div>
            );
          })}

          <div className="flex gap-2 justify-end pt-2">
            {quizChecked && (
              <button
                onClick={handleQuizReset}
                className="text-xs font-bold text-slate-707 bg-slate-100 border px-4 py-2 rounded-xl hover:bg-slate-200"
              >
                重校測驗
              </button>
            )}
            <button
              disabled={quizChecked || Object.keys(userAnswers).length < ipv6Questions.length}
              onClick={handleValidateQuiz}
              className="text-xs font-black bg-indigo-650 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl disabled:opacity-50 transition"
            >
              提交 IPv6 核對結果
            </button>
          </div>

          {quizScore !== null && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="p-4 bg-slate-900 text-white font-mono text-xs rounded-xl flex items-center justify-between"
            >
              <div>
                <span className="text-indigo-400 block font-bold text-[10px] tracking-wider uppercase">IPV6 CONCEPT VERIFICATION</span>
                <strong className="text-sm">IPv6 規格考核綜合評分：<span className="text-emerald-400 font-extrabold">{quizScore} / 100</span></strong>
              </div>
              <span className="text-2xl">
                {quizScore === 100 ? '🎉 大獲全勝！完美通關！' : '✍ 再接再厲，查閱對照表可以輕易拿滿分歐！'}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
