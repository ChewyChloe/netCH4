/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle,
  Play,
  RotateCcw,
  Calculator,
  Sliders,
  AlertTriangle,
  Award,
  ArrowRight,
  Database,
  Search,
  CheckCircle2,
  XCircle,
  Plus
} from 'lucide-react';

interface HeaderField {
  id: string;
  name: string;
  bitLength: number;
  rowSpan?: number;
  colSpan: number; // 1 to 32 bits representation
  purpose: string;
  exampleValue: string;
  whyItMatters: string;
}

const HEADER_FIELDS: HeaderField[] = [
  {
    id: 'version',
    name: 'Version (版本)',
    bitLength: 4,
    colSpan: 4,
    purpose: '標識 IP 協定的版本。對於 IPv4，該欄位的值固定為 4 (0100二進位)。',
    exampleValue: '4 (0100)',
    whyItMatters: '路由器以此判斷解包時應採用 IPv4 還是 IPv6 格式。不相容的版本會直接丟棄。'
  },
  {
    id: 'ihl',
    name: 'Header Length (IHL 標頭長度)',
    bitLength: 4,
    colSpan: 4,
    purpose: '指出 IP 標頭以 32-bit (4位元組) 為單位的長度。最小為 5 (20 位元組)，最大為 15 (60 位元組)。',
    exampleValue: '5 (代表 20 Bytes 標頭)',
    whyItMatters: '因為 IP 標頭的 Options 欄位長度不固定，路由器依靠 IHL 來精確找出資料負載 (Payload) 從哪一個位元組開啟。'
  },
  {
    id: 'tos',
    name: 'Type of Service / DiffServ / ECN (服務類型)',
    bitLength: 8,
    colSpan: 8,
    purpose: '用以提供服務質量 (QoS)。前 6 bits 用於 Differentiated Services (DiffServ/DSCP) 來分類網路流量，後 2 bits 用於 Explicit Congestion Notification (ECN) 來通知路由器擁塞。',
    exampleValue: '0x00 (常規最優傳遞) 或 0xB8 (語音 VoIP DSCP EF)',
    whyItMatters: '在網路擁塞時，路由器可優先發送 TOS 等級高的語音/保證頻寬封包，並透過 ECN 讓端點主機降速而不用直接丟包。'
  },
  {
    id: 'total-len',
    name: 'Total Length (總長度)',
    bitLength: 16,
    colSpan: 16,
    purpose: '整個 IP 資料報的總長度，包含 IP 標頭與資料負載部分，以位元組為單位。最大為 65,535。',
    exampleValue: '1500 (Bytes)',
    whyItMatters: '這是接收端重組與緩衝區載入所需的重要指標。在 Fragmentation 中，它也是衡量每片碎片大小的依據。'
  },
  {
    id: 'ident',
    name: 'Identification (識別碼/標識)',
    bitLength: 16,
    colSpan: 16,
    purpose: '發送主機所賦予該資料報的識別碼。在傳輸時，同一個資料報被切割 (Fragmentation) 後的所有碎片都會複製、攜帶此識別碼。',
    exampleValue: '34567 (0x8707)',
    whyItMatters: '接收端在目的地進行重組時，依靠 Identification 判斷哪些碎片分子屬於同一個原始的 IP 數據報，絕對不能組錯。'
  },
  {
    id: 'flags',
    name: 'Flags (旗標)',
    bitLength: 3,
    colSpan: 3,
    purpose: '由三個位元組成。Bit 0 為保留(必須為 0)；Bit 1 為 DF (Don\'t Fragment)，若設為 1 則不准切割；Bit 2 為 MF (More Fragments)，代表後面還有碎片，設為 0 則代表此碎片是最後一片。',
    exampleValue: '010 (DF=1, 代表禁止切割) 或 001 (MF=1, 後續仍有碎片)',
    whyItMatters: '當封包過大但 DF 為 1 時，路由器無法轉發會將其丟棄並反饋 ICMP "Packet Too Big"。MF 則是重組結束的起終點標竿。'
  },
  {
    id: 'offset',
    name: 'Fragment Offset (碎片偏移量)',
    bitLength: 13,
    colSpan: 13,
    purpose: '標識當前碎片在原始封包中資料載荷的相對位置。以 8 位元組（8-byte）為一個最小測量單位。',
    exampleValue: '185 (代表實際資料偏移 185 × 8 = 1480 位元組)',
    whyItMatters: '接收端重組時，依靠 Offset 按順序重新拼接資料。若缺少它，接收方就無法判讀亂序到達的碎片的正確排布，導致資料毀損。'
  },
  {
    id: 'ttl',
    name: 'Time To Live (生存時間 / TTL)',
    bitLength: 8,
    colSpan: 8,
    purpose: '防止資料報在網路中因路由環路而無限循環。這是一個計數器，預設每次經過一台路由器，TTL 值減 1。當減到 0 時，封包硬性丟棄並回發 ICMP 逾時報文。',
    exampleValue: '64 (默認常見 TTL)',
    whyItMatters: '路由器如果設定環路錯誤，封包會永久在環圈內奔跑。有了 TTL 就算進入環路也會快速被丟棄，不會癱瘓 Internet 路由頻寬。'
  },
  {
    id: 'protocol',
    name: 'Upper-Layer Protocol (上層協定)',
    bitLength: 8,
    colSpan: 8,
    purpose: '指出該 IP 資料報所承載的資料是交給哪一個傳輸層協定或控制協定。常見值：6 為 TCP，17 為 UDP，1 為 ICMP。',
    exampleValue: '6 (TCP) 或 17 (UDP)',
    whyItMatters: 'IP 資料報到達目的地主機後，作業系統核心依靠此協定號碼將去頭後的資料負載分派給對應的傳輸層引擎處理編解。'
  },
  {
    id: 'checksum',
    name: 'Header Checksum (首部總和檢查碼)',
    bitLength: 16,
    colSpan: 16,
    purpose: '專用於保護 IP 標頭免受傳輸資料損毀的校驗碼。僅覆蓋 IP 標頭，不覆蓋資料部分（資料部分校驗由 TCP/UDP 自行處理）。',
    exampleValue: '0x3F2A',
    whyItMatters: '中途的每一台路由器在遞減 TTL 後，標頭欄位發生了改變，故每台路由器轉發前都必須重新計算 Header Checksum。若比對不符，立即默默丟棄。'
  },
  {
    id: 'src-ip',
    name: 'Source IP Address (來源端 IP 地址)',
    bitLength: 32,
    colSpan: 32,
    purpose: '發送網際網路封包之起點主機介面的 32 位元 IPv4 位址。',
    exampleValue: '192.168.1.10 或 223.1.1.1',
    whyItMatters: '接收方回信、回報 ICMP 錯誤、防火牆防禦過濾、連線審計和 NAT 對照都需要依靠 Source IP 位址。'
  },
  {
    id: 'dst-ip',
    name: 'Destination IP Address (目的端 IP 地址)',
    bitLength: 32,
    colSpan: 32,
    purpose: '接收此封包的目的地主機介面的 32 位元 IPv4 位址。',
    exampleValue: '128.119.40.186 或 8.8.8.8',
    whyItMatters: '這是路由器進行最長字首匹配 (LPM) 查尋路由表的主鍵，引導封包穿過 Internet 浩大子網到達對應的最後一個路由器。'
  },
  {
    id: 'options',
    name: 'Options (選項 - 可變長度)',
    bitLength: 0, // variable, up to 40 bytes
    colSpan: 32,
    purpose: '用於網路測試、特殊安全管控或源路由設定。最長可擴展 40 Bytes，但通常極少使用。',
    exampleValue: '無 或 錄製路由選項 (Record Route)',
    whyItMatters: '因為其長度隨意不定，會逼迫路由器在軟體層面以高開銷做額外處理，極大降低硬體 ASIC 的快速轉發效能。'
  },
  {
    id: 'payload',
    name: 'Payload (資料負載 / 上層數據)',
    bitLength: 0,
    colSpan: 32,
    purpose: '承載的實質上層協議資料（如 TCP 標頭 + 應用層 HTML/JSON 資料）。其長度由【總長度】減去【標頭長度】。',
    exampleValue: '40 至 1480 Bytes 的傳輸層數據片段',
    whyItMatters: '這是終端用戶通訊的真正信息主體，IP 標頭所做的一切轉發服務，都是為了安全和高效率地將 Payload 推到目的地。'
  }
];

const EXPLORER_QUIZ = [
  {
    question: '在 IPv4 標頭中，為什麼生存時間 (TTL) 欄位是必不可少的？',
    options: [
      '為了標記整個封包在網路上傳播花了幾毫秒',
      '防止封包在遇到路由環路 (Routing Loop) 時，無限在網路中轉發進而癱瘓頻寬',
      '用以判斷該封包在碎裂後是不是最後一片碎片',
      '為了給傳輸層 TCP 協定做超時重傳計時'
    ],
    correctIdx: 1,
    explanation: 'TTL 主要功能是破壞環路。每次經過路由器就減 1，到 0 直接丟包，確保封包不會在環路中無限打轉而擠爆線路。'
  },
  {
    question: '當一個 IP 數據報經過一台路由器轉發到下一個網段時，標頭中哪一組欄位必定會發生改變？',
    options: [
      'Source IP 與 Destination IP (除 NAT 之外)',
      'Identification 與 Option 欄位',
      'Version 與 Header Length 欄位',
      'TTL (生存時間) 與 Header Checksum (首部總和檢查碼)'
    ],
    correctIdx: 3,
    explanation: '每台路由器在轉發時必須將 TTL 遞減 1。因為 TTL 改了，完全基於標頭內容算出的 Header Checksum 也就必定需要被重新計算。'
  },
  {
    question: '如果 IP 標頭的 IHL (Header Length) 欄位值為 5 (十六進位或 decimal)，代表標頭長度為多少位元組？',
    options: [
      '5 個位元組',
      '10 個位元組',
      '20 個位元組',
      '40 個位元組'
    ],
    correctIdx: 2,
    explanation: 'IHL 的單位是 32-bit (即 4 位元組)。因此當 IHL = 5 時，實際標頭長度是 5 * 4 = 20 位元組（這也是 IPv4 的最小固定長度）。'
  },
  {
    question: 'IP 標頭中，DF (Don\'t Fragment) 是位於哪一個欄位內，當其被設為 1 且封包大於 MTU 時會發生何事？',
    options: [
      '位於 Flags 欄位；封包會立即在路由器被丟棄並發回 ICMP 報文',
      '位於 Type of Service 欄位；封包會被低優先級隊列慢慢發送',
      '位於 Protocol 欄位；封包會被路由改走別的高頻寬道路',
      '位於 Fragment Offset 欄位；封包可以直接無視 MTU 強行發送'
    ],
    correctIdx: 0,
    explanation: 'DF 是 Flags (旗標) 中的一位。若設為 1 (代表不准碎裂)，而鏈路 MTU 不足容納時，路由器便無法對其切片，只能被迫丟棄，並向來源端發射 ICMP 錯誤。'
  }
];

export function Ipv4HeaderExplorer({ onGoToSimulator }: { onGoToSimulator: () => void }) {
  const [selectedField, setSelectedField] = useState<HeaderField>(HEADER_FIELDS[7]); // Default select TTL
  
  // TTL Animation States
  const [startTtl, setStartTtl] = useState<number>(5);
  const [isPlayingTtl, setIsPlayingTtl] = useState<boolean>(false);
  const [ttlStep, setTtlStep] = useState<number>(-1); // -1: Init. 0..5: Routers. 6: Done.
  const [ttlLog, setTtlLog] = useState<string[]>([]);
  
  // Overhead States
  const [appDataSize, setAppDataSize] = useState<number>(1000);
  const [tcpHeaderSize, setTcpHeaderSize] = useState<number>(20);
  const [ipHeaderSize, setIpHeaderSize] = useState<number>(20);

  // Quiz States
  const [quizIdx, setQuizIdx] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Run TTL Simulation
  const handleStartTtlAnimation = () => {
    setIsPlayingTtl(true);
    setTtlStep(0);
    setTtlLog([`🚀 封包發射！初始 TTL 設為 ${startTtl}。`]);

    let stepCounter = 0;
    const interval = setInterval(() => {
      stepCounter++;
      if (stepCounter <= 5) {
        setTtlStep(stepCounter);
        const remainingTtl = Math.max(0, startTtl - stepCounter);
        
        if (remainingTtl === 0 && stepCounter <= 5) {
          setTtlLog(prev => [
            ...prev,
            `❌ [路由器 R${stepCounter}] 收到封包。TTL 減 1 變 0！封包在此被丟棄！並發射 ICMP 逾時。`
          ]);
          clearInterval(interval);
          setIsPlayingTtl(false);
          setTtlStep(99); // 99 means dead before R5
        } else {
          setTtlLog(prev => [
            ...prev,
            `📥 [路由器 R${stepCounter}] 收到。將 TTL 減 1 (即：${startTtl - stepCounter + 1} ➔ ${remainingTtl})。重新校驗快取並進行最長匹配，轉發給下一個 Router。`
          ]);
        }
      } else {
        // Reached destination
        setTtlLog(prev => [
          ...prev,
          `🏁 [目的端宿主] 恭喜！封包順利在 TTL = ${startTtl - 5} 時送達！上載 TCP 層拆箱。`
        ]);
        clearInterval(interval);
        setIsPlayingTtl(false);
      }
    }, 1500);
  };

  const handleResetTtlAnimation = () => {
    setIsPlayingTtl(false);
    setTtlStep(-1);
    setTtlLog([]);
  };

  // Overhead Calculations
  const totalPacketSize = Number(appDataSize) + Number(tcpHeaderSize) + Number(ipHeaderSize);
  const overheadBytes = Number(tcpHeaderSize) + Number(ipHeaderSize);
  const overheadPercentage = totalPacketSize > 0 
    ? ((overheadBytes / totalPacketSize) * 100).toFixed(1) 
    : '0.0';

  // Quiz Handlers
  const handleAnswerQuiz = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    setShowExplanation(true);
    if (idx === EXPLORER_QUIZ[quizIdx].correctIdx) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuiz = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    if (quizIdx < EXPLORER_QUIZ.length - 1) {
      setQuizIdx(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleResetQuiz = () => {
    setQuizIdx(0);
    setSelectedAnswer(null);
    setQuizCompleted(false);
    setScore(0);
    setShowExplanation(false);
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: VISUAL HEADER DIAGRAM */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold font-mono px-2 py-0.5 rounded-full uppercase tracking-widest">
              32-BIT-WIDE HEADER LAYOUT
            </span>
            <h3 className="text-lg font-black text-slate-800">IPv4 數據報標頭視覺模型拆解</h3>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          如下代表一個 32 bits 寬的 IPv4 標頭結構。請<strong>點擊任意欄位區塊</strong>，右側或下方會即時顯示其對應的位元長度、作用詳解及為什麼它是網際網路轉送的核心：
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 32 bit layout */}
          <div className="lg:col-span-8 space-y-1">
            {/* Bit Markers */}
            <div className="grid grid-cols-32 text-[9px] font-mono font-bold text-slate-400 pb-1 px-1 border-b select-none">
              <span className="col-span-1 text-left">0</span>
              <span className="col-span-3 text-center">3</span>
              <span className="col-span-1 text-left">4</span>
              <span className="col-span-3 text-center">7</span>
              <span className="col-span-1 text-left">8</span>
              <span className="col-span-7 text-center">15</span>
              <span className="col-span-1 text-left">16</span>
              <span className="col-span-15 text-right">31 bits</span>
            </div>

            {/* Row 1: Version, IHL, TOS, Total Len */}
            <div className="grid grid-cols-32 gap-1 h-12">
              <button
                id="btn-version"
                onClick={() => setSelectedField(HEADER_FIELDS[0])}
                className={`col-span-4 rounded-lg font-semibold text-xs border flex flex-col items-center justify-center transition-all duration-200 ${
                  selectedField.id === 'version' ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="scale-90 font-mono">Version</span>
                <span className="text-[9px] opacity-75">4b</span>
              </button>

              <button
                id="btn-ihl"
                onClick={() => setSelectedField(HEADER_FIELDS[1])}
                className={`col-span-4 rounded-lg font-semibold text-xs border flex flex-col items-center justify-center transition-all duration-200 ${
                  selectedField.id === 'ihl' ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="scale-85 font-mono">IHL</span>
                <span className="text-[9px] opacity-75">4b</span>
              </button>

              <button
                id="btn-tos"
                onClick={() => setSelectedField(HEADER_FIELDS[2])}
                className={`col-span-8 rounded-lg font-semibold text-xs border flex flex-col items-center justify-center transition-all duration-200 ${
                  selectedField.id === 'tos' ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="scale-85 font-mono">Type of Service</span>
                <span className="text-[9px] opacity-75">8b</span>
              </button>

              <button
                id="btn-total-len"
                onClick={() => setSelectedField(HEADER_FIELDS[3])}
                className={`col-span-16 rounded-lg font-semibold text-xs border flex flex-col items-center justify-center transition-all duration-200 ${
                  selectedField.id === 'total-len' ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono">Total Length</span>
                <span className="text-[9px] opacity-75">16 bits</span>
              </button>
            </div>

            {/* Row 2: Ident, Flags, Offset */}
            <div className="grid grid-cols-32 gap-1 h-12">
              <button
                id="btn-ident"
                onClick={() => setSelectedField(HEADER_FIELDS[4])}
                className={`col-span-16 rounded-lg font-semibold text-xs border flex flex-col items-center justify-center transition-all duration-200 ${
                  selectedField.id === 'ident' ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono">Identification (標識碼)</span>
                <span className="text-[9px] opacity-75">16 bits</span>
              </button>

              <button
                id="btn-flags"
                onClick={() => setSelectedField(HEADER_FIELDS[5])}
                className={`col-span-3 rounded-lg font-semibold text-xs border flex flex-col items-center justify-center transition-all duration-200 ${
                  selectedField.id === 'flags' ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="scale-85 font-mono">Flags</span>
                <span className="text-[9px] opacity-75">3b</span>
              </button>

              <button
                id="btn-offset"
                onClick={() => setSelectedField(HEADER_FIELDS[6])}
                className={`col-span-13 rounded-lg font-semibold text-xs border flex flex-col items-center justify-center transition-all duration-200 ${
                  selectedField.id === 'offset' ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono">Fragment Offset</span>
                <span className="text-[9px] opacity-75">13 bits</span>
              </button>
            </div>

            {/* Row 3: TTL, Protocol, Checksum */}
            <div className="grid grid-cols-32 gap-1 h-12">
              <button
                id="btn-ttl"
                onClick={() => setSelectedField(HEADER_FIELDS[7])}
                className={`col-span-8 rounded-lg font-semibold text-xs border flex flex-col items-center justify-center transition-all duration-200 ${
                  selectedField.id === 'ttl' ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono">TTL (生存限制)</span>
                <span className="text-[9px] opacity-75">8 bits</span>
              </button>

              <button
                id="btn-protocol"
                onClick={() => setSelectedField(HEADER_FIELDS[8])}
                className={`col-span-8 rounded-lg font-semibold text-xs border flex flex-col items-center justify-center transition-all duration-200 ${
                  selectedField.id === 'protocol' ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono">Protocol (協議)</span>
                <span className="text-[9px] opacity-75">8 bits</span>
              </button>

              <button
                id="btn-checksum"
                onClick={() => setSelectedField(HEADER_FIELDS[9])}
                className={`col-span-16 rounded-lg font-semibold text-xs border flex flex-col items-center justify-center transition-all duration-200 ${
                  selectedField.id === 'checksum' ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono">Header Checksum</span>
                <span className="text-[9px] opacity-75">16 bits</span>
              </button>
            </div>

            {/* Row 4: Src IP */}
            <div className="h-12 flex">
              <button
                id="btn-src-ip"
                onClick={() => setSelectedField(HEADER_FIELDS[10])}
                className={`w-full rounded-lg font-bold text-xs border flex flex-col items-center justify-center transition-all duration-200 ${
                  selectedField.id === 'src-ip' ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono tracking-wide">Source IP Address (32 bits 代表來源 IP)</span>
              </button>
            </div>

            {/* Row 5: Dst IP */}
            <div className="h-12 flex">
              <button
                id="btn-dst-ip"
                onClick={() => setSelectedField(HEADER_FIELDS[11])}
                className={`w-full rounded-lg font-bold text-xs border flex flex-col items-center justify-center transition-all duration-200 ${
                  selectedField.id === 'dst-ip' ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono tracking-wide">Destination IP Address (32 bits 代表目的 IP)</span>
              </button>
            </div>

            {/* Row 6: Options */}
            <div className="h-11 flex">
              <button
                id="btn-options"
                onClick={() => setSelectedField(HEADER_FIELDS[12])}
                className={`w-full rounded-lg font-semibold text-xs border border-dashed flex flex-col items-center justify-center transition-all duration-200 ${
                  selectedField.id === 'options' ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono">Options (常見長度：0 ~ 40 Bytes / 可變，選填欄位)</span>
              </button>
            </div>

            {/* Row 7: Payload */}
            <div className="h-14 flex pt-2">
              <button
                id="btn-payload"
                onClick={() => setSelectedField(HEADER_FIELDS[13])}
                className={`w-full rounded-xl font-bold text-xs border-2 border-indigo-200 flex flex-col items-center justify-center transition-all duration-200 ${
                  selectedField.id === 'payload' ? 'bg-indigo-600 text-white border-indigo-750 shadow-md' : 'bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100/60'
                }`}
              >
                <div className="flex items-center gap-1.5 justify-center">
                  <Database className="w-4 h-4" />
                  <span>DATA PAYLOAD (實際承載載荷，如 TCP / UDP 通訊協議的實質傳輸物件)</span>
                </div>
              </button>
            </div>
          </div>

          {/* Right: Detailed Sidebar */}
          <div className="lg:col-span-4 bg-slate-50 border border-slate-150 rounded-2xl p-5 flex flex-col justify-between min-h-[350px]">
            <div>
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded-md font-mono">
                  {selectedField.bitLength === 0 ? '可變長度' : `${selectedField.bitLength} Bits`}
                </span>
                <span className="text-xs font-bold text-slate-400">位元細節</span>
              </div>
              
              <h4 className="text-base font-black text-slate-800 mb-2.5">
                {selectedField.name}
              </h4>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block mb-0.5">欄位功能 (Purpose):</span>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    {selectedField.purpose}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block mb-0.5">位元範例值 (Example):</span>
                  <p className="text-xs font-mono font-bold text-blue-600 p-2 bg-blue-50/50 rounded-lg">
                    {selectedField.exampleValue}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block mb-0.5">為什麼重要 (Why it matters):</span>
                  <p className="text-xs text-slate-600 leading-relaxed italic bg-emerald-50/40 border border-emerald-100 p-2.5 rounded-lg">
                    {selectedField.whyItMatters}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 mt-4 flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>點選其它區塊來比對</span>
              <span className="text-blue-500 font-mono font-black animate-pulse">● 互動中</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: TTL MINI ANIMATION */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl">
            <Play className="w-5 h-5 fill-yellow-500/20" />
          </div>
          <div>
            <span className="text-[10px] bg-yellow-105 text-yellow-850 font-extrabold font-mono px-2 py-0.5 rounded-full uppercase tracking-widest">
              TTL SURVIVAL SIMULATION
            </span>
            <h3 className="text-lg font-black text-slate-800">Time To Live (生存壽命) 逐點減免模擬實演</h3>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          為了防止路由環路引發網絡坍方，每過一個路由器，TTL 就會扣除 1。請在下面設定該封包的<strong>初始 TTL 生存值</strong>，並按下啟動播放觀察封包的命運軌跡：
        </p>

        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-6">
          {/* Controls: Starter TTL selection */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-600">初始生存年齡 (Start TTL):</span>
              <div className="flex bg-slate-200/60 p-1 rounded-xl">
                {[1, 2, 3, 4, 5, 8].map(val => (
                  <button
                    key={val}
                    onClick={() => {
                      if (isPlayingTtl) return;
                      setStartTtl(val);
                      handleResetTtlAnimation();
                    }}
                    disabled={isPlayingTtl}
                    className={`px-3 py-1 text-xs font-bold font-mono rounded-lg transition-all duration-200 ${
                      startTtl === val
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-100'
                        : 'text-slate-600 hover:text-slate-800'
                    } disabled:opacity-50`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                id="btn-ttl-animate"
                onClick={handleStartTtlAnimation}
                disabled={isPlayingTtl}
                className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl shadow-sm disabled:opacity-50 duration-200"
              >
                <Play className="w-3.5 h-3.5" />
                <span>啟動模擬播放</span>
              </button>
              <button
                id="btn-ttl-reset"
                onClick={handleResetTtlAnimation}
                className="p-2.5 border border-slate-205 rounded-xl bg-white hover:bg-slate-100 text-slate-500"
                title="重置"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Router Path Graphic */}
          <div className="relative py-8 overflow-x-auto min-h-[140px] flex items-center justify-center">
            <div className="flex items-center justify-between w-full max-w-4xl relative min-w-[650px] px-8">
              {/* Central horizontal line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-250 -translate-y-1/2 rounded" />

              {/* Host Sender */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-slate-850 text-white flex items-center justify-center font-bold text-xs shadow">
                  Host
                </div>
                <span className="text-[10px] font-bold text-slate-400 mt-1">發送端</span>
              </div>

              {/* 5 Routers */}
              {[1, 2, 3, 4, 5].map((idx) => {
                const isActive = ttlStep === idx;
                const isPassed = ttlStep > idx;
                const isDeadHere = ttlStep === 99 && startTtl === idx;

                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center">
                    {/* Path line highlighter */}
                    {isPassed && (
                      <div className="absolute top-1/2 -left-16 right-0 h-1 bg-blue-500 -translate-y-1/2 rounded" />
                    )}

                    <div
                      className={`w-11 h-11 rounded-full flex flex-col items-center justify-center border font-mono text-xs font-black shadow-md duration-300 ${
                        isActive
                          ? 'bg-blue-600 border-blue-700 text-white scale-110 ring-4 ring-blue-100'
                          : isDeadHere
                          ? 'bg-red-500 border-red-700 text-white scale-110'
                          : isPassed
                          ? 'bg-emerald-500 border-emerald-600 text-white'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <span>R{idx}</span>
                      {isDeadHere && <XCircle className="w-3 h-3 text-white absolute -top-1 -right-1 fill-red-800" />}
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 mt-1">第 {idx} 站</span>
                    
                    {/* Remaining TTL tag */}
                    {isActive && (
                      <div className="absolute -top-7 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-blue-600 shadow-sm animate-bounce">
                        TTL: {Math.max(0, startTtl - idx)}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Host Receiver */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-md duration-300 ${
                    ttlStep === 5 && startTtl >= 5
                      ? 'bg-emerald-600 border-emerald-700 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  Dest
                </div>
                <span className="text-[10px] font-bold text-slate-400 mt-1">目的端</span>
              </div>
            </div>
          </div>

          {/* Tracer steps logs */}
          <div className="bg-slate-900 border border-slate-950 rounded-xl p-4 font-mono text-[11px] text-green-400 min-h-[100px] max-h-[150px] overflow-y-auto leading-relaxed space-y-1.5">
            {ttlLog.length === 0 ? (
              <span className="text-slate-500 italic">等待發射...</span>
            ) : (
              ttlLog.map((log, i) => <div key={i}>{log}</div>)
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: OVERHEAD CALCULATOR */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] bg-indigo-100 text-indigo-805 font-extrabold font-mono px-2 py-0.5 rounded-full uppercase tracking-widest">
              OVERHEAD METRIC CALCULATOR
            </span>
            <h3 className="text-lg font-black text-slate-800">數據報標頭開銷與比率傳載計算機</h3>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          每一個傳輸的封包，除承載應用數據外，TCP 和 IP 標頭都構成了<strong>「發送開銷 (Overhead)」</strong>。在此填入引數數據，即刻分析開銷權重與有效承載率：
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Inputs */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                應用層數據大小 (Application Payload - Bytes)
              </label>
              <input
                type="number"
                min="10"
                max="65000"
                value={appDataSize}
                onChange={e => setAppDataSize(Math.max(1, Number(e.target.value)))}
                className="w-full font-mono text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                TCP 標頭長度 (TCP Header - Bytes, 預設 20)
              </label>
              <input
                type="number"
                min="20"
                max="60"
                value={tcpHeaderSize}
                onChange={e => setTcpHeaderSize(Math.max(20, Number(e.target.value)))}
                className="w-full font-mono text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                IP 標頭長度 (IP Header - Bytes, 預設 20)
              </label>
              <input
                type="number"
                min="20"
                max="60"
                value={ipHeaderSize}
                onChange={e => setIpHeaderSize(Math.max(20, Number(e.target.value)))}
                className="w-full font-mono text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Visualization Output */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 border rounded-xl bg-slate-50/70">
                <span className="text-[10px] font-bold text-slate-400 block tracking-wider">總傳輸長度</span>
                <span className="text-xl font-mono font-black text-slate-700">{totalPacketSize}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Bytes</span>
              </div>
              <div className="p-3.5 border rounded-xl bg-slate-50/70">
                <span className="text-[10px] font-bold text-slate-400 block tracking-wider">標頭開銷積累</span>
                <span className="text-xl font-mono font-black text-slate-700">{overheadBytes}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Bytes</span>
              </div>
              <div className="p-3.5 border border-amber-250 rounded-xl bg-amber-50/30">
                <span className="text-[10px] font-bold text-amber-500 block tracking-wider">開銷佔比</span>
                <span className="text-xl font-mono font-black text-red-500">{overheadPercentage}%</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Overhead %</span>
              </div>
            </div>

            {/* Visual breakdown progress bar */}
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1.5">封包位元配置特點 (Payload vs. Headers):</span>
              <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden flex font-mono text-[10px] text-white font-bold select-none text-center">
                <div
                  style={{ width: `${(ipHeaderSize / totalPacketSize) * 100}%` }}
                  className="bg-red-500 h-full flex items-center justify-center leading-none min-w-[30px]"
                  title="IP Header"
                >
                  IP
                </div>
                <div
                  style={{ width: `${(tcpHeaderSize / totalPacketSize) * 100}%` }}
                  className="bg-amber-500 h-full flex items-center justify-center leading-none min-w-[30px]"
                  title="TCP Header"
                >
                  TCP
                </div>
                <div
                  style={{ width: `${(appDataSize / totalPacketSize) * 100}%` }}
                  className="bg-emerald-500 h-full flex items-center justify-center leading-none"
                  title="User Data"
                >
                  Payload ({(100 - parseFloat(overheadPercentage)).toFixed(1)}%)
                </div>
              </div>

              <div className="flex gap-4 mt-3 justify-center text-[10px] font-semibold">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded block" />IP 標頭 ({ipHeaderSize}B)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded block" />TCP 標頭 ({tcpHeaderSize}B)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded block" />使用者資料 ({appDataSize}B)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: FRAGMENTATION PREVIEW */}
      <div className="bg-slate-50 border border-slate-205 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left space-y-1">
          <span className="inline-flex items-center gap-1 bg-indigo-150 text-indigo-750 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
            IP Fragmentation Link
          </span>
          <h4 className="text-sm font-black text-slate-800">
            物理連結層 MTU 超大數據拆包運作預覽
          </h4>
          <p className="text-xs text-slate-500 max-w-xl">
            若這台計算出的總封包長度（例如 {totalPacketSize} Bytes）超過了中途乙太網的 <strong>最大傳輸單元 MTU (常見為 1500 位元組)</strong>，路由器必須在無類別網路中對該封包進行切割解包，再移往終端主機進行一統重編重組。
          </p>
        </div>
        <button
          onClick={onGoToSimulator}
          className="flex items-center gap-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-3 px-5 rounded-xl shadow duration-200 shrink-0"
        >
          <span>進入 IPv4 碎裂計算模擬器</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* SECTION 5: HEADER EXPLORER QUIZ */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5 border-b pb-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800">IPv4 標頭欄位與功能自我速診</h4>
            <span className="text-[10px] text-slate-400 font-bold block">評定您是否熟悉 TTL / Checks / Offset 等核心特徵</span>
          </div>
        </div>

        {!quizCompleted ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
              <span>進度：{quizIdx + 1} / {EXPLORER_QUIZ.length} 題</span>
              <span>累計分數：{score} 答對</span>
            </div>

            <div className="p-4 bg-slate-50 border rounded-xl">
              <h5 className="text-xs font-black text-slate-700 leading-relaxed font-mono">
                Q{quizIdx + 1}: {EXPLORER_QUIZ[quizIdx].question}
              </h5>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXPLORER_QUIZ[quizIdx].options.map((option, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrect = idx === EXPLORER_QUIZ[quizIdx].correctIdx;
                let btnStyle = 'border-slate-200 bg-white hover:bg-slate-50';

                if (selectedAnswer !== null) {
                  if (isCorrect) {
                     btnStyle = 'border-green-400 bg-green-50 text-green-800';
                  } else if (isSelected) {
                     btnStyle = 'border-red-400 bg-red-50 text-red-800';
                  } else {
                     btnStyle = 'border-slate-100 bg-slate-50/50 text-slate-400 cursor-not-allowed';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={selectedAnswer !== null}
                    onClick={() => handleAnswerQuiz(idx)}
                    className={`p-3 text-left text-xs font-semibold border rounded-xl duration-200 leading-relaxed ${btnStyle}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] mt-0.5">{String.fromCharCode(65 + idx)}</span>
                      <span>{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-blue-50/50 border border-blue-150 text-xs leading-relaxed font-mono text-blue-700"
              >
                <strong>解析提示：</strong> {EXPLORER_QUIZ[quizIdx].explanation}
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleNextQuiz}
                    className="flex items-center gap-1 text-[11px] font-black bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg"
                  >
                    <span>{quizIdx === EXPLORER_QUIZ.length - 1 ? '完成挑戰🏆' : '下一題'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto shadow-md">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h5 className="text-sm font-black text-slate-800">IPv4 標頭隨堂小考挑戰告成！</h5>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                你答對了 <strong>{score} / {EXPLORER_QUIZ.length}</strong> 題。這對理解路由器解包、轉發和開銷控制極有裨益！
              </p>
            </div>
            <button
              onClick={handleResetQuiz}
              className="text-xs font-black bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl"
            >
              重新作答
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
