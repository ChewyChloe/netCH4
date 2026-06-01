/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Database,
  Cpu,
  Monitor,
  Server,
  Zap,
  HelpCircle,
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  Settings,
  ShieldCheck,
  Smartphone,
  Globe
} from 'lucide-react';

interface NatEntry {
  id: string;
  wanIp: string;
  wanPort: number;
  lanIp: string;
  lanPort: number;
}

export function NatTranslationSimulator() {
  const [hostIp, setHostIp] = useState<string>('10.0.0.1');
  const [hostPort, setHostPort] = useState<number>(3345);
  const [destIp] = useState<string>('128.119.40.186');
  const [destPort] = useState<number>(80);

  // Simulation steps
  // 0: Standby / Idle
  // 1: Packet leaves Client (Inside LAN)
  // 2: Packet arrives at NAT Router, rewriting occurs, Table row is registered.
  // 3: Packet leaves Router towards Web Server (Outbox to Internet)
  // 4: Web Server receives packet, processes, and transmits Reply back.
  // 5: Reply arrives at Router WAN interface, gets audited, rewrites back.
  // 6: Rewrite completed, packet delivered to inside Client.
  const [simStep, setSimStep] = useState<number>(0);
  const [allocatedPort, setAllocatedPort] = useState<number>(5001);
  const [natTable, setNatTable] = useState<NatEntry[]>([
    { id: '1', wanIp: '138.76.29.7', wanPort: 4892, lanIp: '10.0.0.2', lanPort: 52101 },
    { id: '2', wanIp: '138.76.29.7', wanPort: 4893, lanIp: '10.0.0.3', lanPort: 49132 }
  ]);

  // Concept cards expanded states
  const [activeConceptTab, setActiveConceptTab] = useState<'why-nat' | 'private-ranges' | 'pro-con' | 'traversal'>('why-nat');

  // Quiz states
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  const quizQuestions = [
    {
      id: 1,
      question: '依據 RFC 1918 私有地址規範，下列哪一個 IP 位址可以在公網（Public Internet）上被路由器直接路由轉送？',
      options: [
        '10.12.80.1 (Private Class A)',
        '172.24.110.15 (Private Class B)',
        '192.168.1.254 (Private Class C)',
        '138.76.29.7 (Public WAN IP)'
      ],
      correctIndex: 3,
      explanation: '10.0.0.0/8, 172.16.0.0/12 以及 192.168.0.0/16 均為 RFC 1918 保留之私有地址（Private Addresses），公網骨幹路由器會主動丟棄來源或目的為此範圍的封包。138.76.29.7 為合法的公網 IP。'
    },
    {
      id: 2,
      question: '當一個 LAN 內部主機 10.0.0.1:4000 發送封包經由 NAT 改寫。若對外配置 WAN IP 為 138.76.29.7，分配公網埠為 6000。則網際網路上之伺服器收到該請求時，看到之「來源（Source）IP 及 Port」為？',
      options: [
        '10.0.0.1 : 4000',
        '138.76.29.7 : 6000',
        '138.76.29.7 : 4000',
        '10.0.0.1 : 6000'
      ],
      correctIndex: 1,
      explanation: 'NAT 路由器會將來源 IP 重寫為公網 IP (138.76.29.7) 且將來源 Port 重寫為分配的公網埠 (6000)，使外部伺服器能夠以此公網網址回复。'
    },
    {
      id: 3,
      question: '在網路系統設計架構中，為什麼「NAT 違反了端對端原則 (End-to-End Argument)」？',
      options: [
        '因為它不需要使用實體網線進行傳輸',
        '因為路由器本應專司第三層（網路層），卻干涉與修改了第四層（傳輸層）的 Port 資訊，且破壞了端對端直接連接性',
        '因為私有 IP 會造成硬體伺服器損壞',
        '因為它不支援任何 TCP 傳輸保護模式'
      ],
      correctIndex: 1,
      explanation: '傳統網際網路架構倡導中間節點（路由器）應保持單純（僅負責 L3 轉送），複雜性與應用狀態交給端點。藉由修改 L4 埠號，NAT 使得外網無法直接連入內網，並引入 Layer Violations，背離了原始端點自治原則。'
    },
    {
      id: 4,
      question: '若要讓外網設備主動發起 TCP 連接，與身處于 NAT 後方的局域網伺服器（例如 10.0.0.1:80）直接通訊，最常見的基礎手動設定方案是？',
      options: [
        '直接在內網主機上關閉防火牆',
        '在 NAT 路由器上配置 埠號轉送 (Port Forwarding / 靜態映射)',
        '使用雙绞線直接連接公網',
        '更換路由器之實體 MAC 地址'
      ],
      correctIndex: 1,
      explanation: '埠號轉送（Port Forwarding）會在 NAT 路由器中登錄一條靜態映射規則。例如，凡是送往公網 138.76.29.7:8080 的資料，一律無條件重寫並轉給內網 10.0.0.1:80。'
    }
  ];

  const handleNextSim = () => {
    if (simStep === 6) {
      // Clear current simulation effects and reset
      setSimStep(0);
      return;
    }

    const next = simStep + 1;
    setSimStep(next);

    if (next === 2) {
      // When reaching NAT router on way out: allocate a random port and add to table if not matching current host profile
      const testPort = hostPort === 3345 ? 5001 : hostPort + 2000;
      setAllocatedPort(testPort);

      // Add route mapping to NAT Table if not already registered
      const hasExist = natTable.some(row => row.lanIp === hostIp && row.lanPort === hostPort);
      if (!hasExist) {
        setNatTable(prev => [
          ...prev,
          {
            id: String(prev.length + 3),
            wanIp: '138.76.29.7',
            wanPort: testPort,
            lanIp: hostIp,
            lanPort: hostPort
          }
        ]);
      }
    }
  };

  const handleResetSim = () => {
    setSimStep(0);
    setNatTable([
      { id: '1', wanIp: '138.76.29.7', wanPort: 4892, lanIp: '10.0.0.2', lanPort: 52101 },
      { id: '2', wanIp: '138.76.29.7', wanPort: 4893, lanIp: '10.0.0.3', lanPort: 49132 }
    ]);
  };

  // Check quiz answers
  const handleAnswerSelect = (qid: number, idx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qid]: idx }));
  };

  const handleCheckQuiz = () => {
    let score = 0;
    quizQuestions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        score += 25;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setQuizScore(null);
    setQuizSubmitted(false);
  };

  return (
    <div className="space-y-8 select-none">
      {/* SECTION 1: NAT ANIMATED ROUTING PANEL */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Zap className="w-5 h-5 text-blue-600 fill-blue-500/20" />
            </div>
            <div>
              <span className="text-[10px] bg-blue-100 text-blue-850 font-extrabold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
                NAT REWRITE SIMULATOR
              </span>
              <h3 className="text-xl font-black text-slate-800">NAT 中途埠改寫與狀態轉譯引擎</h3>
            </div>
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            {/* Host selectors */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border p-1 rounded-lg">
              <span className="pl-1.5 font-bold">來源IP:</span>
              <select
                disabled={simStep !== 0}
                value={hostIp}
                onChange={e => setHostIp(e.target.value)}
                className="font-mono bg-white border border-slate-200 text-xs py-0.5 px-1.5 rounded focus:outline-none"
              >
                <option value="10.0.0.1">10.0.0.1</option>
                <option value="10.0.0.2">10.0.0.2</option>
                <option value="10.0.0.3">10.0.0.3</option>
                <option value="10.0.0.4">10.0.0.4</option>
              </select>

              <span className="pl-1.5 border-l font-bold">Port:</span>
              <input
                type="number"
                disabled={simStep !== 0}
                value={hostPort}
                onChange={e => setHostPort(Number(e.target.value))}
                className="w-16 font-mono text-xs bg-white border border-slate-200 py-0.5 px-1 rounded text-center focus:outline-none"
              />
            </div>

            <div className="flex gap-1">
              <button
                id="btn-nat-step"
                onClick={handleNextSim}
                className="text-xs font-black bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg shadow-sm duration-200"
              >
                {simStep === 0 ? '發射封包 🚀' : simStep === 6 ? '重新配置封包' : '推進物理躍點 ➔'}
              </button>
              <button
                id="btn-nat-reset-sim"
                onClick={handleResetSim}
                className="p-1.5 rounded-lg border text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-50"
                title="重置模擬器"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Visual network routing track */}
        <div className="bg-slate-50/50 p-6 rounded-2xl border border-dashed relative min-h-[300px] flex flex-col justify-between overflow-hidden gap-6">

          {/* Core Topology Box */}
          <div className="grid grid-cols-12 items-center gap-4 relative">
            
            {/* L1: LAN Client Area */}
            <div className="col-span-3 space-y-4">
              <span className="text-[10px] bg-indigo-150 text-indigo-700 font-extrabold block text-center py-0.5 rounded-full uppercase tracking-wider border border-indigo-200/50 font-mono">
                Inside Private LAN
              </span>
              
              <div className="flex flex-col gap-3">
                {[
                  { ip: '10.0.0.1', label: 'PC A' },
                  { ip: '10.0.0.2', label: 'PC B' },
                  { ip: '10.0.0.3', label: 'PC C' },
                  { ip: '10.0.0.4', label: 'PC D' }
                ].map((cli) => {
                  const isSender = hostIp === cli.ip;
                  const activeClass = isSender
                    ? 'border-indigo-500 bg-indigo-50 font-black shadow-md ring-4 ring-indigo-100 scale-102'
                    : 'border-slate-202 bg-white/50 opacity-60';

                  return (
                    <div
                      key={cli.ip}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 duration-300 ${activeClass}`}
                    >
                      <Monitor className={`w-5 h-5 ${isSender ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <div className="text-left leading-normal text-xs">
                        <div className="font-bold text-slate-800">{cli.label}</div>
                        <div className="font-mono text-[10px] text-slate-500">
                          {cli.ip}:{isSender ? hostPort : 49152}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Path corridor to Gateway */}
            <div className="col-span-3 h-32 relative flex items-center justify-around">
              <div className="h-[1px] border-b-2 border-dashed border-slate-300 absolute w-full left-0 top-1/2 -translate-y-1/2 z-0" />
              
              {/* Packet traveling Inside LAN (Step 1 -> 2) */}
              <AnimatePresence>
                {simStep === 1 && (
                  <motion.div
                    initial={{ x: '-150%', y: '0%', scale: 0.8 }}
                    animate={{ x: '50%', y: '0%', scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                    className="bg-indigo-600 border border-indigo-500 text-white font-mono text-[9px] font-bold px-3 py-1.5 rounded-lg shadow-md z-10 flex flex-col items-center leading-none"
                  >
                    <span>L3 Packet (LAN)</span>
                    <span className="mt-1 text-[8px] opacity-80">{hostIp}:{hostPort} ▶ Web</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Packet returning to Inside Client (Step 6) */}
              <AnimatePresence>
                {simStep === 6 && (
                  <motion.div
                    initial={{ x: '50%', y: '0%', scale: 0.8 }}
                    animate={{ x: '-150%', y: '0%', scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                    className="bg-emerald-600 border border-emerald-500 text-white font-mono text-[9px] font-bold px-3 py-1.5 rounded-lg shadow-md z-10 flex flex-col items-center leading-none"
                  >
                    <span>L3 Reply (LAN)</span>
                    <span className="mt-1 text-[8px] opacity-80">Web ▶ {hostIp}:{hostPort}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* L2: NAT Central Gateway Device */}
            <div className="col-span-2 flex flex-col items-center gap-3">
              <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold border border-blue-200 text-center py-0.5 px-3 rounded-full uppercase tracking-wider font-mono">
                NAT Gateway
              </span>

              <div className={`p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center w-full duration-300 ${
                simStep === 2 || simStep === 5
                  ? 'ring-4 ring-blue-500/20 border-blue-500 bg-slate-950 shadow-lg'
                  : 'shadow-sm'
              }`}>
                <Cpu className={`w-8 h-8 mx-auto mb-1.5 ${simStep === 2 || simStep === 5 ? 'text-blue-400 animate-pulse' : 'text-slate-400'}`} />
                <span className="text-xs font-black text-white block">NAT Router</span>
                <span className="text-[9px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-705 px-1 rounded mt-1.5 block leading-relaxed py-0.5">
                  Private IP: 10.0.0.4
                </span>
                <span className="text-[9.5px] font-mono font-black text-blue-400 mt-1 block">
                  Public WAN IP:<br />138.76.29.7
                </span>
              </div>
            </div>

            {/* Path corridor to WAN Internet */}
            <div className="col-span-2 h-32 relative flex items-center justify-around">
              <div className="h-[1px] border-b-2 border-dashed border-blue-300 absolute w-full left-0 top-1/2 -translate-y-1/2 z-0" />

              {/* Packet traveling Outside WAN Outgoing (Step 3) */}
              <AnimatePresence>
                {simStep === 3 && (
                  <motion.div
                    initial={{ x: '-100%', scale: 0.8 }}
                    animate={{ x: '50%', scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2 }}
                    className="bg-blue-600 border border-blue-500 text-white font-mono text-[9px] font-bold px-3 py-1.5 rounded-lg shadow-md z-10 flex flex-col items-center leading-none"
                  >
                    <span>L3 WAN Out</span>
                    <span className="mt-1 text-[8px] opacity-80">138.76.29.7:{allocatedPort} ▶ Web</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Packet returning Outside WAN Inbound (Step 4 -> 5) */}
              <AnimatePresence>
                {simStep === 4 && (
                  <motion.div
                    initial={{ x: '100%', scale: 0.8 }}
                    animate={{ x: '-50%', scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2 }}
                    className="bg-orange-500 border border-orange-400 text-white font-mono text-[9px] font-bold px-3 py-1.5 rounded-lg shadow-md z-10 flex flex-col items-center leading-none"
                  >
                    <span>L3 WAN Reply</span>
                    <span className="mt-1 text-[8px] opacity-80">Web ▶ 138.76.29.7:{allocatedPort}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* L3: Web Server Node */}
            <div className="col-span-2 space-y-4">
              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold block text-center py-0.5 rounded-full uppercase tracking-wider font-mono">
                Public IP Core
              </span>

              <div className={`p-4 bg-white border border-slate-200 rounded-2xl text-center w-full shadow-sm duration-350 ${
                simStep === 4 ? 'ring-4 ring-emerald-300 border-emerald-500 scale-102' : ''
              }`}>
                <Server className={`w-8 h-8 mx-auto mb-1.5 ${simStep === 4 ? 'text-emerald-600 animate-bounce' : 'text-slate-600'}`} />
                <span className="text-xs font-black text-slate-800 block">Web Server</span>
                <span className="text-[9.5px] font-mono font-bold text-slate-500 block mt-1">
                  128.119.40.186
                </span>
                <span className="text-[10px] font-mono font-black text-emerald-600 mt-1 block">
                  Port: 80
                </span>
              </div>
            </div>
          </div>

          {/* Current Step Explanation Log */}
          <div className="bg-slate-900 border border-slate-950 p-4 rounded-xl text-xs font-mono text-slate-300 flex items-start gap-2.5">
            <span className="bg-blue-900 text-blue-200 rounded p-1 px-1.5 font-bold shrink-0">躍點階段 #{simStep}</span>
            <div className="leading-relaxed">
              {simStep === 0 && '設備處於待命狀態。請在上方選擇您的內網測試 Host（預設 10.0.0.1:3345）與配置發射埠號，隨後點選「發射封包」查看完整 NAT 狀態重寫流程。'}
              {simStep === 1 && `[LAN 出合] 由內部電腦 PC A (${hostIp}) 發起的封包，綁定本端隨機 Source Port: ${hostPort}，流向目的外部伺服器 (${destIp}:80)。此時封包穿梭於區域網路 (LAN) 交換走廊中，標頭為原汁原味的私有 IP 配置。`}
              {simStep === 2 && `[NAT 埠號轉譯] 封包到達 NAT Router 內網閘道。路由器查對，認領來源為私網 IP 且發往公網，故由硬體轉送引擎分配對外唯一的公網 WAN Port: ${allocatedPort}。與此同時，向「NAT 狀態重寫對照表」寫入一筆動態映射條目。`}
              {simStep === 3 && `[WAN 發送] 改頭換面的封包正式穿越 WAN Port 向 Internet 行進。此時，外部路由器查閱其標頭：Source IP 變更為公網 138.76.29.7，Source Port 改寫為分配之 ${allocatedPort}。原先的私有位址 10.0.0.1 已對外部世界完全不可見，安全匿名。`}
              {simStep === 4 && `[伺服器應對] Internet 骨幹網將封包成功送抵網頁伺服器 (${destIp}:80)。網頁伺服器處理了這個封包（例如 HTTP GET），隨即發出響應，其目的端為來源之「公網位址及分配埠：138.76.29.7:${allocatedPort}」。`}
              {simStep === 5 && `[路由器逆改寫] 外部響應包到達 NAT Router 的公用電路 (WAN)。路由器內核讀取目的地 Port: ${allocatedPort}，回查「NAT 轉譯對照表」，查核映射歸屬為內網 "${hostIp}:${hostPort}"。隨即進行反向代理重寫：將目的 IP 與目的 Port 分別逆向替換。`}
              {simStep === 6 && `[私網安全達陣] 經由路由器精細改寫完畢的封包重回區域網路。PC ${hostIp} 的 L4 監聽進程順利聽到該響應信號並接收。對於內網主機與外部伺服器而言，整個 NAT 埠改寫與多工轉換（NAPT）過程皆是完全透明、無感的。`}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: THE DETAILED FRAME HEADERS COMPARISON */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm overflow-x-auto text-xs font-mono">
        <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-500" />
          <span>四個關鍵躍點之 IP 與 Port 標頭欄位比對面板</span>
        </h4>

        <table className="w-full text-left border-collapse border rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-slate-100 border-b text-slate-650 font-bold">
              <th className="p-3">物理路徑位置</th>
              <th className="p-3">來源 IP (Src IP)</th>
              <th className="p-3">來源 Port (Src Port)</th>
              <th className="p-3">目的 IP (Dst IP)</th>
              <th className="p-3">目的 Port (Dst Port)</th>
              <th className="p-3 text-right">標頭重寫狀態</th>
            </tr>
          </thead>
          <tbody>
            {/* Step 1 LAN outgoing */}
            <tr className={`border-b ${simStep >= 1 ? 'bg-slate-50/50' : 'opacity-40'}`}>
              <td className="p-3 font-bold text-indigo-750">① LAN 外流 (Client ➔ Router)</td>
              <td className="p-3 text-slate-700">{hostIp}</td>
              <td className="p-3 text-slate-700 font-bold">{hostPort}</td>
              <td className="p-3 text-slate-700">{destIp}</td>
              <td className="p-3 text-slate-700">{destPort}</td>
              <td className="p-3 text-right text-indigo-600 font-semibold">原始私網位址</td>
            </tr>

            {/* Step 3 WAN outgoing */}
            <tr className={`border-b ${simStep >= 3 ? 'bg-blue-50/30' : 'opacity-40'}`}>
              <td className="p-3 font-bold text-blue-750">② WAN 外流 (Router ➔ Server)</td>
              <td className="p-3 text-blue-800 font-bold">138.76.29.7 (GW WAN)</td>
              <td className="p-3 text-blue-800 font-extrabold">{simStep >= 3 ? allocatedPort : '待轉換'}</td>
              <td className="p-3 text-slate-750">{destIp}</td>
              <td className="p-3 text-slate-755">{destPort}</td>
              <td className="p-3 text-right text-blue-600 font-semibold">★ IP 與 Port 已改寫</td>
            </tr>

            {/* Step 4 WAN incoming */}
            <tr className={`border-b ${simStep >= 4 ? 'bg-orange-50/20' : 'opacity-40'}`}>
              <td className="p-3 font-bold text-orange-750">③ WAN 響應 (Server ➔ Router)</td>
              <td className="p-3 text-slate-700">{destIp}</td>
              <td className="p-3 text-slate-700">{destPort}</td>
              <td className="p-3 text-orange-850 font-bold">138.76.29.7 (GW WAN)</td>
              <td className="p-3 text-orange-850 font-extrabold">{simStep >= 4 ? allocatedPort : '待分配'}</td>
              <td className="p-3 text-right text-orange-600 font-semibold">等待查找狀態表</td>
            </tr>

            {/* Step 6 LAN incoming */}
            <tr className={`${simStep >= 6 ? 'bg-emerald-50/30 font-semibold' : 'opacity-40'}`}>
              <td className="p-3 font-bold text-emerald-750">④ LAN 響應 (Router ➔ Client)</td>
              <td className="p-3 text-slate-700">{destIp}</td>
              <td className="p-3 text-slate-700">{destPort}</td>
              <td className="p-3 text-emerald-800">{hostIp}</td>
              <td className="p-3 text-emerald-850 font-bold">{hostPort}</td>
              <td className="p-3 text-right text-emerald-600 font-semibold">★ 解開狀態還原抵達</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* SECTION 3: THE LIVE NAT TRANSLATION TABLE */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-5">
        <div className="md:w-7/12 space-y-4">
          <h4 className="text-sm font-black text-slate-800 flex items-center justify-between">
            <span>NAT 對照轉換快取表 (NAT Translation Table)</span>
            <span className="text-[10px] bg-slate-100 border text-slate-500 font-mono py-1 px-2.5 rounded-lg font-bold">
              已動態登入數量：{natTable.length} 組
            </span>
          </h4>

          <div className="border rounded-xl overflow-hidden text-xs font-mono">
            <div className="grid grid-cols-12 bg-slate-150 p-2.5 font-bold text-slate-650 tracking-wider">
              <div className="col-span-1">ID</div>
              <div className="col-span-5 border-l pl-3">WAN 廣域公網 IP & Port</div>
              <div className="col-span-6 border-l pl-3">LAN 局域私網 IP & Port</div>
            </div>

            <div className="divide-y max-h-[170px] overflow-y-auto bg-slate-50/30">
              {natTable.map((row) => {
                const isCurrentActiveRow = (simStep >= 2 && simStep <= 5) && row.lanIp === hostIp && row.lanPort === hostPort;

                return (
                  <div
                    key={row.id}
                    className={`grid grid-cols-12 p-2.5 items-center ${
                      isCurrentActiveRow ? 'bg-blue-50/70 text-blue-900 border-y border-blue-200 font-bold' : 'bg-white'
                    }`}
                  >
                    <div className="col-span-1 text-slate-400">#{row.id}</div>
                    <div className="col-span-5 border-l pl-3">
                      {row.wanIp} : <span className="text-blue-600 font-extrabold">{row.wanPort}</span>
                    </div>
                    <div className="col-span-6 border-l pl-3">
                      {row.lanIp} : <span className="font-semibold text-slate-850">{row.lanPort}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            💡 <strong>動態 NAPT 協同原理：</strong> NAT 路由器利用「TCP/UDP 傳輸層之 16 位元 Port 號欄位」做多工。極限理論下，單個 WAN IP 可以藉由高達 65,536 個不同的 Port 與內網數千台主機動態複用，極大地延緩了主公網 IPv4 地址的枯竭！
          </p>
        </div>

        {/* NAT Detail indicators */}
        <div className="md:w-5/12 bg-slate-900 text-slate-350 rounded-2xl p-5 border border-slate-950 flex flex-col justify-between">
          <div>
            <span className="text-[10px] bg-indigo-900 text-indigo-300 font-black tracking-widest uppercase p-1 px-1.5 rounded block w-max font-mono mb-2">
              AUDIT LOGS
            </span>
            <h5 className="text-xs font-black text-white font-mono">轉 forwarder 電路實時映射指標</h5>
            <div className="mt-3 text-[10.5px] leading-relaxed space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-850">
              <div className="flex justify-between border-b border-slate-900 pb-1.5 font-mono">
                <span className="text-slate-500">當前 LAN 端套接字 (Socket):</span>
                <span className="text-white">{hostIp}:{hostPort}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5 font-mono">
                <span className="text-slate-500">路由分配對外 WAN 套端:</span>
                <span className="text-blue-400">138.76.29.7:{simStep >= 2 ? allocatedPort : '暫未指派'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5 font-mono">
                <span className="text-slate-500">外部目標伺服器網址:</span>
                <span className="text-white">128.119.40.186:80</span>
              </div>
              <div className="text-[10px] text-slate-505 leading-normal pt-1.5">
                NAPT 利用的 16-bit Port 號，最大值為 65535。通常路由器會保留前 1024 個著名埠口（Well-known Ports），專門指配 1024 之後的臨時埠口（Ephemerial Ports）作為對外轉換登載。
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 mt-3 text-[9.5px] text-slate-500 font-mono">
            ⚠ <strong>安全邊界特性：</strong> NAT 兼具了防火牆的安全防護，阻斷任何外部未主動發起對應表映射而單方面投遞進來的封包。這對內網有天然防禦力。
          </div>
        </div>
      </div>

      {/* SECTION 4: CONCEPT CARDS BENTO */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b pb-4 mb-4">
          <BookOpen className="w-5 h-5 text-indigo-600 animate-pulse" />
          <div>
            <h3 className="text-base font-black text-slate-800">NAT 運作學術核心觀念庫</h3>
            <span className="text-xs text-slate-400 block">RFC 1918 私網宣告、NAT 爭論點、以及 STUN/Traversal 穿透技術詳解</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Tabs Sidebar Selector */}
          <div className="col-span-1 flex flex-col gap-1 text-xs">
            {[
              { id: 'why-nat', label: '① 為什麼需要 NAT 與節約' },
              { id: 'private-ranges', label: '② RFC 1918 私網位址範疇' },
              { id: 'pro-con', label: '③ NAT 的極致優勢與學術爭議' },
              { id: 'traversal', label: '④ NAT 穿透 (STUN/TURN/PF)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveConceptTab(tab.id as any)}
                className={`p-3 text-left rounded-xl border duration-200 font-bold ${
                  activeConceptTab === tab.id
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-extrabold'
                    : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Cards Active Panel */}
          <div className="col-span-3 bg-slate-50/50 p-5 rounded-2xl border border-dashed text-xs leading-relaxed">
            {activeConceptTab === 'why-nat' && (
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span>公網 IP 的乾涸與 NAT 解套優點</span>
                </h4>
                <p className="text-slate-600">
                  早期的 IPv4 僅設計了 32 位元，合計最多 43 億個可能的主機地址。隨著網際網路爆發，公網地址於 2010 年代初完全配光。
                </p>
                <div className="bg-white p-3.5 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex gap-2">
                    <span className="text-indigo-600 font-extrabold shrink-0">■</span>
                    <span><strong>對外僅需 1 個 IP：</strong> 內網中千百台辦公設備，對外全部共享 ISP 下發的 1 個 IP 位址。</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-indigo-600 font-extrabold shrink-0">■</span>
                    <span><strong>內網地址自主規劃：</strong> 可以在局域網隨意更改或規劃主機 IP，而無須去外部 ISP 重新申請報備。</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-indigo-600 font-extrabold shrink-0">■</span>
                    <span><strong>設備變更對外無感：</strong> 內網設備物理替換、修改架構，其外部網際網路鏈路均不需要重新配置。</span>
                  </div>
                </div>
              </div>
            )}

            {activeConceptTab === 'private-ranges' && (
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>RFC 1918 私有地址專用區段</span>
                </h4>
                <p className="text-slate-600">
                  網際網路工程任務組（IETF）在 RFC 1918 中預留了專用於區域網路內部部署的三個區段。這些 IP 地址不允許在 Internet 骨幹中公佈或路由，具有本地私網唯一性，但全球重合性：
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <strong className="text-slate-800 block mb-1 text-[11px]">Class A 專用區段</strong>
                    <span className="text-blue-600 font-black text-[10.5px]">10.0.0.0 / 8</span>
                    <span className="text-[10px] text-slate-400 block mt-1">範圍: 10.0.0.0 至 10.255.255.255 (約1677萬個)</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <strong className="text-slate-800 block mb-1 text-[11px]">Class B 專用區段</strong>
                    <span className="text-blue-600 font-black text-[10.5px]">172.16.0.0 / 12</span>
                    <span className="text-[10px] text-slate-400 block mt-1">範圍: 172.16.0.0 至 172.31.255.255 (約104萬個)</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <strong className="text-slate-800 block mb-1 text-[11px]">Class C 專用區段</strong>
                    <span className="text-blue-605 font-black text-[10.5px]">192.168.0.0 / 16</span>
                    <span className="text-[10px] text-slate-400 block mt-1">範圍: 192.168.0.0 至 192.168.255.255 (約65536個)</span>
                  </div>
                </div>
              </div>
            )}

            {activeConceptTab === 'pro-con' && (
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-indigo-600" />
                  <span>NAT 的實務成效優勢與學術層級爭議</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-250">
                    <strong className="text-emerald-800 block font-black text-[11.5px] border-b border-emerald-200 pb-1 mb-1.5">✔ 實務極致優點</strong>
                    <ul className="space-y-1 text-slate-600 text-[10.5px]">
                      <li>• 急劇縮減了短缺的 IPv4 地址請求數量。</li>
                      <li>• 提供局域網路自防護盾，免予外部直接攻擊。</li>
                      <li>• 使得內部網路自主定址、高效率規劃。</li>
                    </ul>
                  </div>

                  <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-250">
                    <strong className="text-rose-800 block font-black text-[11.5px] border-b border-rose-200 pb-1 mb-1.5">✘ 結構與端對端爭論點</strong>
                    <ul className="space-y-1 text-slate-600 text-[10.5px]">
                      <li>• <strong>Layer Violations (層級越界)：</strong> 路由器理應運作在網路層 (L3)，竟去讀寫 TCP/UDP (L4) 埠口。</li>
                      <li>• <strong>破壞端對端原則：</strong> 使得外網無法直開連入內網。</li>
                      <li>• P2P 遊戲、即時 VoIP 視訊連線等技術實施障礙巨大。</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeConceptTab === 'traversal' && (
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>NAT 穿透技術：STUN / TURN / Port Forwarding</span>
                </h4>
                <p className="text-slate-600">
                  由於 NAT 阻絕了非主動映射的外部入流 TCP 線路，這對 P2P 連接、語音串流或內網建站形成了挑戰。業界為此推出了多種解決方案：
                </p>
                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <strong className="text-slate-800">1. Port Forwarding (埠口轉發 / 靜態虛擬主機)</strong>
                    <p className="text-[10px] text-slate-500">在路由器中靜態預置映射表格。凡訪問 <code>Router_Public_IP:8080</code>，即靜態指派轉送給 <code>10.0.0.1:80</code>。簡單但也喪失了動態性。</p>
                  </div>
                  <div>
                    <strong className="text-indigo-600">2. STUN 穿透工具 (Session Traversal Utilities for NAT)</strong>
                    <p className="text-[10px] text-slate-500">內網主機主動接洽外部 STUN 伺服器，探查其所在的公網 IP 及動態分配埠號，將此公報知外網 P2P 端，進而「打洞」打通直接連通路徑，對寬型 NAT 有效。</p>
                  </div>
                  <div>
                    <strong className="text-indigo-650">3. TURN 中繼中轉伺服器 (Traversal Using Relays around NAT)</strong>
                    <p className="text-[10px] text-slate-500">當對稱型安全 NAT 導致打洞失敗時，被迫租用一台中介的 TURN 伺服器，兩台內網主機皆主動向其傾吐，由其進行高頻寬中繼轉發。代價為伺服器費率消耗極大。</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 5: NAT TRANSLATION EVALUATION QUIZ */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="border-b pb-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800">隨堂演練三：NAT 重寫與狀態轉譯核心測試</h4>
              <span className="text-[10px] text-slate-400 font-bold block">利用 4 道學術典型精選與計算選擇題，驗證您對私有網絡及 Port 轉換的通盤認知：</span>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {quizQuestions.map((q, idx) => {
            const chosenIdx = selectedAnswers[q.id];

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
                    if (isChosen && !quizSubmitted) {
                      btnClass = 'border-indigo-500 bg-indigo-50/80 text-indigo-800 font-bold';
                    } else if (quizSubmitted) {
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
                        disabled={quizSubmitted}
                        onClick={() => handleAnswerSelect(q.id, oIdx)}
                        className={`p-3 text-left rounded-xl border duration-150 flex items-center justify-between ${btnClass}`}
                      >
                        <span>{opt}</span>
                        {quizSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 ml-1" />}
                        {quizSubmitted && isChosen && !isCorrect && <XCircle className="w-4 h-4 text-red-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>

                {quizSubmitted && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-white border border-slate-100 rounded-xl text-[11px] text-slate-500 leading-relaxed font-sans first-letter:font-bold"
                  >
                    💡 <strong className="text-slate-700">精析解讀：</strong> {q.explanation}
                  </motion.p>
                )}
              </div>
            );
          })}

          <div className="flex gap-2 justify-end pt-2">
            {quizSubmitted && (
              <button
                onClick={handleResetQuiz}
                className="text-xs font-bold text-slate-707 bg-slate-100 border px-4 py-2 rounded-xl hover:bg-slate-200"
              >
                重校測驗
              </button>
            )}
            <button
              disabled={quizSubmitted || Object.keys(selectedAnswers).length < quizQuestions.length}
              onClick={handleCheckQuiz}
              className="text-xs font-black bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl disabled:opacity-50 transition"
            >
              核對 NAT 測驗結果
            </button>
          </div>

          {quizScore !== null && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="p-4 bg-slate-900 text-white font-mono text-xs rounded-xl flex items-center justify-between"
            >
              <div>
                <span className="text-blue-400 block font-bold text-[10px] tracking-wider uppercase">NAT CONCEPT EVALUATION</span>
                <strong className="text-sm">NAT 隨堂綜合測驗得分：<span className="text-emerald-400 font-extrabold">{quizScore} / 100</span></strong>
              </div>
              <span className="text-2xl">
                {quizScore === 100 ? '🎉 100% 完美的學術掌握！' : '✍ 閱讀下方資訊卡可以獲得正確提示歐！'}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
