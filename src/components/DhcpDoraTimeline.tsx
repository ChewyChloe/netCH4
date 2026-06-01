/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  ArrowLeft,
  Tv,
  Server,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  ChevronRight,
  RotateCcw,
  Sliders,
  MoveUp,
  MoveDown,
  ListOrdered
} from 'lucide-react';

interface DhcpStep {
  name: string;
  type: 'Discover' | 'Offer' | 'Request' | 'ACK';
  direction: 'client-to-server' | 'server-to-client';
  srcIp: string;
  dstIp: string;
  srcPort: number;
  dstPort: number;
  yiaddr: string;
  xid: string; // Hex representation
  leaseTime?: number;
  router?: string;
  dns?: string;
  mask?: string;
  summary: string;
  details: string[];
}

const DHCP_STEPS: DhcpStep[] = [
  {
    name: 'DHCP Discover (探尋)',
    type: 'Discover',
    direction: 'client-to-server',
    srcIp: '0.0.0.0',
    dstIp: '255.255.255.255',
    srcPort: 68,
    dstPort: 67,
    yiaddr: '0.0.0.0',
    xid: '0x3F1A9E48',
    summary: 'DHCP 客戶端在廣播域中發送廣播以尋找可用的 DHCP 伺服器。',
    details: [
      'OP = 1 (Boot Request / 請求)',
      'Hops = 0',
      'Transaction ID = 0x3F1A9E48 (用以識別整個 DORA 會話契合性)',
      'Client IP (ciaddr) = 0.0.0.0 (此時尚未擁有對應 IP)',
      'Your IP (yiaddr) = 0.0.0.0',
      'Next Server IP (siaddr) = 0.0.0.0',
      'Option 53 = DHCP Discover (探尋代碼 1)',
      '此時目的 MAC 為 FF:FF:FF:FF:FF:FF (廣播風暴，任何網卡皆在 L2 接收此封包)'
    ]
  },
  {
    name: 'DHCP Offer (提供)',
    type: 'Offer',
    direction: 'server-to-client',
    srcIp: '223.1.2.5',
    dstIp: '255.255.255.255', // Or unicast in some config, default DORA focuses broadcast
    srcPort: 67,
    dstPort: 68,
    yiaddr: '223.1.2.4',
    xid: '0x3F1A9E48',
    leaseTime: 3600,
    router: '223.1.2.5',
    dns: '8.8.8.8',
    mask: '255.255.255.0',
    summary: 'DHCP 伺服器向客戶端返回一個可用的 IP 以及其他組態配置參數。',
    details: [
      'OP = 2 (Boot Reply / 回應)',
      'Transaction ID = 0x3F1A9E48 (必須與 Discover 的 ID 完全相同，否則客戶端不接收)',
      'Your IP (yiaddr) = 223.1.2.4 (伺服器分配給客戶端之擬用 IP)',
      'Option 53 = DHCP Offer (提供代碼 2)',
      'Option 1 (Subnet Mask) = 255.255.255.0',
      'Option 3 (Default Router / Gateway) = 223.1.2.5',
      'Option 6 (DNS Server) = 8.8.8.8',
      'Option 51 (IP Address Lease Time) = 3600s (代表 IP 可使用時間為 1 小時)'
    ]
  },
  {
    name: 'DHCP Request (請求)',
    type: 'Request',
    direction: 'client-to-server',
    srcIp: '0.0.0.0',
    dstIp: '255.255.255.255',
    srcPort: 68,
    dstPort: 67,
    yiaddr: '223.1.2.4',
    xid: '0x3F1A9E48',
    summary: '客戶端宣告自己「接受」該 IP。該封包仍然以廣播發送以昭告網路中所有伺服器。',
    details: [
      'OP = 1 (Boot Request / 請求)',
      'Transaction ID = 0x3F1A9E48',
      'Option 53 = DHCP Request (請求狀態代碼 3)',
      'Option 50 (Requested IP Address) = 223.1.2.4 (宣告自己正式想要選用此 IP)',
      'Option 54 (Server Identifier) = 223.1.2.5 (昭告天下被選中的伺服器是 223.1.2.5)',
      '廣播用意：由於可能有複數台 DHCP 伺服器各自給予了 Offer，使用 Request 廣播可讓「落選」的伺服器知道它們可以回收原先保留的 Offer IP，極具協同禮貌。'
    ]
  },
  {
    name: 'DHCP ACK (確認應答)',
    type: 'ACK',
    direction: 'server-to-client',
    srcIp: '223.1.2.5',
    dstIp: '255.255.255.255',
    srcPort: 67,
    dstPort: 68,
    yiaddr: '223.1.2.4',
    xid: '0x3F1A9E48',
    leaseTime: 3600,
    router: '223.1.2.5',
    dns: '8.8.8.8',
    mask: '255.255.255.0',
    summary: '伺服器正式將該 IP 的使用權租給此客戶端，客戶端此時方能安全綁定此 IP。',
    details: [
      'OP = 2 (Boot Reply / 回應)',
      'Transaction ID = 0x3F1A9E48',
      'Your IP (yiaddr) = 223.1.2.4 (確認分配之 IP)',
      'Option 53 = DHCP ACK (確認代碼 5)',
      '租約建立完成！客戶端自此正式將內部網路介面位址設定為 223.1.2.4。',
      '客戶端可以開始使用該 IP 於局域網路或網際網路段中進行正常 L3 傳輸。'
    ]
  }
];

export function DhcpDoraTimeline() {
  // Step visualization states
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedInspectStep, setSelectedInspectStep] = useState<number>(0);

  // Sorting quiz states
  const [scrambledSteps, setScrambledSteps] = useState<DhcpStep[]>([
    DHCP_STEPS[2],
    DHCP_STEPS[0],
    DHCP_STEPS[3],
    DHCP_STEPS[1]
  ]);
  const [quizVerified, setQuizVerified] = useState<boolean>(false);
  const [quizSuccess, setQuizSuccess] = useState<boolean | null>(null);

  // Fill in blanks states
  const [fibSrcIp, setFibSrcIp] = useState<string>('');
  const [fibDstIp, setFibDstIp] = useState<string>('');
  const [fibServerPort, setFibServerPort] = useState<string>('');
  const [fibClientPort, setFibClientPort] = useState<string>('');
  const [fibExtraChecked, setFibExtraChecked] = useState<{
    gateway: boolean;
    dns: boolean;
    mask: boolean;
    mac: boolean; // WRONG (DHCP does not assign client hardware MAC address, client registers MAC instead)
    cpu: boolean; // WRONG
  }>({
    gateway: false,
    dns: false,
    mask: false,
    mac: false,
    cpu: false
  });
  const [fibChecked, setFibChecked] = useState<boolean>(false);
  const [fibScore, setFibScore] = useState<number | null>(null);

  // Sorting helpers
  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (quizVerified) return;
    const newItems = [...scrambledSteps];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newItems.length) return;

    // Swap
    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;
    setScrambledSteps(newItems);
  };

  const handleVerifySort = () => {
    const isCorrect = scrambledSteps.every((step, idx) => step.type === DHCP_STEPS[idx].type);
    setQuizSuccess(isCorrect);
    setQuizVerified(true);
  };

  const handleResetSort = () => {
    setScrambledSteps([
      { ...DHCP_STEPS[2] },
      { ...DHCP_STEPS[0] },
      { ...DHCP_STEPS[3] },
      { ...DHCP_STEPS[1] }
    ]);
    setQuizVerified(false);
    setQuizSuccess(null);
  };

  // Fill in the blank validation helper
  const handleVerifyFib = () => {
    let score = 0;
    if (fibSrcIp.trim() === '0.0.0.0') score += 20;
    if (fibDstIp.trim() === '255.255.255.255') score += 20;
    if (Number(fibServerPort) === 67) score += 20;
    if (Number(fibClientPort) === 68) score += 20;

    // Extra returned values are gateway, dns, and mask
    if (fibExtraChecked.gateway && fibExtraChecked.dns && fibExtraChecked.mask && !fibExtraChecked.mac && !fibExtraChecked.cpu) {
      score += 20;
    }

    setFibScore(score);
    setFibChecked(true);
  };

  const handleResetFib = () => {
    setFibSrcIp('');
    setFibDstIp('');
    setFibServerPort('');
    setFibClientPort('');
    setFibExtraChecked({ gateway: false, dns: false, mask: false, mac: false, cpu: false });
    setFibChecked(false);
    setFibScore(null);
  };

  return (
    <div className="space-y-8 select-none">
      {/* SECTION 1: DHCP MESSAGE TIMELINE / SEQUENCE DIAGRAM */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
                MESSAGE FLOW CHRONOLOGY
              </span>
              <h3 className="text-xl font-black text-slate-800">DHCP 四步訊號 DORA 封包序列圖</h3>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              id="btn-dhcp-prev"
              disabled={activeStep === 0}
              onClick={() => {
                const prev = activeStep - 1;
                setActiveStep(prev);
                setSelectedInspectStep(prev);
              }}
              className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border disabled:opacity-50"
            >
              ◀ 上一步
            </button>
            <button
              id="btn-dhcp-next"
              disabled={activeStep === 4}
              onClick={() => {
                if (activeStep < 4) {
                  const next = activeStep + 1;
                  setActiveStep(next);
                  if (next < 4) {
                    setSelectedInspectStep(next);
                  }
                }
              }}
              className="text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition"
            >
              {activeStep === 4 ? '模擬結束 (已獲得 IP!)' : `下一步 (DORA ${activeStep + 1}/4) ▶`}
            </button>
            <button
              id="btn-dhcp-reset"
              onClick={() => {
                setActiveStep(0);
                setSelectedInspectStep(0);
              }}
              className="p-1.5 rounded-lg border text-slate-400 hover:text-slate-600"
              title="重置模擬"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Sequence Diagram Grid */}
        <div className="grid grid-cols-12 gap-4 items-stretch relative bg-slate-50/50 p-6 rounded-2xl border border-dashed border-slate-200/80 mb-6">
          
          {/* Column 1: Client device Card */}
          <div className="col-span-3 flex flex-col items-center">
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center w-full shadow-sm text-center duration-300 ${
              activeStep === 4
                ? 'bg-emerald-50 border-emerald-500 scale-102 ring-4 ring-emerald-100'
                : 'bg-white border-slate-200'
            }`}>
              <Tv className={`w-8 h-8 mb-2 ${activeStep === 4 ? 'text-emerald-600' : 'text-slate-600'}`} />
              <span className="text-xs font-black text-slate-800">DHCP Client (新主機)</span>
              <span className="text-[10px] font-mono font-bold bg-slate-100 border text-slate-500 px-1.5 py-0.5 rounded-md mt-1.5 leading-none py-1 block">
                MAC: 00:0C:29:1A:3B:5C
              </span>
              <span className="text-[10px] font-mono font-black text-blue-600 mt-1 block">
                IP: {activeStep === 4 ? '223.1.2.4 (ACK 已認同)' : '0.0.0.0 (未取得配置)'}
              </span>
            </div>
            
            {/* Timeline dotted line down */}
            <div className="w-[1px] bg-dashed border-l border-slate-300 flex-1 my-2"></div>
          </div>

          {/* Column 2: Sequence Lines Center Intercept */}
          <div className="col-span-6 flex flex-col justify-around py-4 relative">
            {DHCP_STEPS.map((step, idx) => {
              const isActive = activeStep > idx;
              const isPending = activeStep === idx;
              const isSelected = selectedInspectStep === idx;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (activeStep > idx) {
                      setSelectedInspectStep(idx);
                    }
                  }}
                  className={`relative flex flex-col items-center justify-center py-5 transition duration-300 cursor-pointer ${
                    isActive ? 'opacity-100' : isPending ? 'opacity-80' : 'opacity-25'
                  }`}
                >
                  {/* Step details header tooltip */}
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-2 ${
                    isPending ? 'bg-amber-100 text-amber-800 animate-pulse' : isActive ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {idx + 1}. {step.name}
                  </div>

                  {/* Packet arrow path line */}
                  <div className="w-full relative px-6">
                    {step.direction === 'client-to-server' ? (
                      <div className="w-full flex items-center justify-start relative h-3">
                        <div className={`h-0.5 w-full absolute top-1/2 left-0 -translate-y-1/2 ${
                          isActive ? 'bg-indigo-600' : 'bg-slate-350'
                        }`} />
                        {isActive && (
                          <motion.div
                            initial={{ left: '0%' }}
                            animate={{ left: '100%' }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                            className="w-2.5 h-2.5 bg-indigo-600 rounded-full absolute -translate-y-1/2 top-1/2 shadow"
                          />
                        )}
                        <ArrowRight className={`w-4 h-4 absolute right-4 -translate-y-1/2 top-1/2 ${
                          isActive ? 'text-indigo-600' : 'text-slate-400'
                        }`} />
                      </div>
                    ) : (
                      <div className="w-full flex items-center justify-end relative h-3">
                        <div className={`h-0.5 w-full absolute top-1/2 left-0 -translate-y-1/2 ${
                          isActive ? 'bg-emerald-600' : 'bg-slate-350'
                        }`} />
                        {isActive && (
                          <motion.div
                            initial={{ right: '0%' }}
                            animate={{ right: '100%' }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                            className="w-2.5 h-2.5 bg-emerald-600 rounded-full absolute -translate-y-1/2 top-1/2 shadow"
                          />
                        )}
                        <ArrowLeft className={`w-4 h-4 absolute left-4 -translate-y-1/2 top-1/2 ${
                          isActive ? 'text-emerald-600' : 'text-slate-400'
                        }`} />
                      </div>
                    )}
                  </div>

                  {/* High level info flags */}
                  <div className="flex gap-2 text-[9px] font-mono mt-1 px-4 justify-between w-full font-bold">
                    <span className="text-slate-400">SRC: {step.srcIp}:{step.srcPort}</span>
                    <span className="text-blue-600">Yiaddr: {step.yiaddr}</span>
                    <span className="text-slate-400">DST: {step.dstIp}:{step.dstPort}</span>
                  </div>

                  {isSelected && (
                    <span className="absolute -bottom-1 w-2 h-2 bg-indigo-600 rounded-full animate-ping" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Column 3: Server device Card */}
          <div className="col-span-3 flex flex-col items-center">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center w-full shadow-sm text-center">
              <Server className="w-8 h-8 text-indigo-400 mb-2" />
              <span className="text-xs font-black text-white">DHCP Server</span>
              <span className="text-[10px] font-mono font-bold bg-slate-800 border border-slate-705 text-slate-300 px-1.5 py-0.5 rounded-md mt-1.5 leading-none py-1 block">
                IP: 223.1.2.5
              </span>
              <span className="text-[9px] font-mono font-bold text-slate-500 mt-1 block">
                Local Router IP Same
              </span>
            </div>

            {/* Timeline dotted line down */}
            <div className="w-[1px] bg-dashed border-l border-slate-300 flex-1 my-2"></div>
          </div>
        </div>

        {/* Message INSPECTOR / Packet Header Detail view */}
        <div className="bg-slate-900 text-slate-300 rounded-2xl border border-slate-950 p-5 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2 text-[10px] font-black bg-blue-900 text-blue-300 rounded uppercase font-mono">
                MSG INSPECTOR
              </span>
              <h4 className="text-sm font-black text-white">
                DORA 欄位解剖分析 ➔{' '}
                <span className="text-blue-400">{DHCP_STEPS[selectedInspectStep].name}</span>
              </h4>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              選中第 {selectedInspectStep + 1}/4 步報文
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch text-xs leading-relaxed">
            {/* Left summary bullet */}
            <div className="md:col-span-5 space-y-3 flex flex-col justify-between">
              <div>
                <p className="text-slate-355 text-xs font-medium leading-relaxed bg-slate-950/60 border border-slate-850 p-3 rounded-xl mb-4">
                  {DHCP_STEPS[selectedInspectStep].summary}
                </p>

                {/* Packet Frame Structure visual stack */}
                <div className="space-y-1 font-mono text-[9px] font-bold text-center">
                  <span className="text-[10px] font-bold text-slate-500 block text-left mb-1">封包封裝堆疊架構：</span>
                  <div className="bg-slate-800 text-slate-300 p-1.5 border border-slate-700/80 rounded leading-none">
                    Ethernet II Header (Broadcast MAC FF-FF-FF-FF-FF-FF)
                  </div>
                  <div className="bg-slate-700 text-white p-1.5 border border-slate-600 rounded leading-none">
                    IPv4 Packet: SRC={DHCP_STEPS[selectedInspectStep].srcIp} DST={DHCP_STEPS[selectedInspectStep].dstIp} (Protocol 17)
                  </div>
                  <div className="bg-indigo-900 text-indigo-200 p-1.5 border border-indigo-850 rounded leading-none">
                    UDP Datagram: SRC Port={DHCP_STEPS[selectedInspectStep].srcPort} DST Port={DHCP_STEPS[selectedInspectStep].dstPort}
                  </div>
                  <div className="bg-emerald-950 text-emerald-300 p-2.5 border border-emerald-900 rounded select-text text-left text-[9.5px]">
                    <strong>DHCP Payload 欄位：</strong>
                    <div className="mt-1 flex justify-between"><span>XID: </span><span>{DHCP_STEPS[selectedInspectStep].xid}</span></div>
                    <div className="flex justify-between"><span>Yiaddr: </span><span>{DHCP_STEPS[selectedInspectStep].yiaddr}</span></div>
                  </div>
                </div>
              </div>

              {/* Lease properties banner if Offer or ACK */}
              {DHCP_STEPS[selectedInspectStep].leaseTime && (
                <div className="p-3 bg-indigo-950/50 border border-indigo-900 rounded-xl text-[10px] text-indigo-300 mt-2">
                  <div className="font-extrabold text-indigo-200 block uppercase mb-1">🎉 租約協議承諾事項 (Lifetime Package)：</div>
                  <div>- Lease Time (IP 生效期限)：{DHCP_STEPS[selectedInspectStep].leaseTime} 秒 (1小時)</div>
                  <div>- Subnet Mask (子網遮罩)：{DHCP_STEPS[selectedInspectStep].mask}</div>
                  <div>- Router Endpoint (預設閘道)：{DHCP_STEPS[selectedInspectStep].router}</div>
                  <div>- DNS Lookup Server (域名解析器)：{DHCP_STEPS[selectedInspectStep].dns}</div>
                </div>
              )}
            </div>

            {/* Right: Detailed Fields list */}
            <div className="md:col-span-7 bg-slate-950 rounded-xl p-4 border border-slate-800/60 font-mono text-[11px] h-full flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-500 block uppercase border-b border-slate-900 pb-1.5 mb-1.5">
                  DHCP 應用層報文解析日誌（DHCP Options Trace）
                </span>
                {DHCP_STEPS[selectedInspectStep].details.map((detail, idx) => (
                  <div key={idx} className="flex gap-2 items-start text-emerald-400">
                    <span className="text-slate-655 font-bold shrink-0">✔</span>
                    <span className="leading-relaxed">{detail}</span>
                  </div>
                ))}
              </div>

              <div className="text-[9.5px] border-t border-slate-900 pt-3 mt-3 text-slate-500 leading-normal">
                💡 <strong className="text-slate-400">學術核心思考點：</strong> 為什麼要利用固定 <strong>UDP Port 67 (Server) </strong> 與 <strong>68 (Client)</strong>？因為此時客戶端不具備合法 IP，通訊協議完全依賴資料連結層的實體廣播。固定埠號能避免協定多載解包的錯位，提供硬體硬接聽最直接的隨插即用支援。
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: INTERACTIVE DRAG-AND-DROP ORDERING QUIZ */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="border-b pb-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800">隨堂演練一：DORA 四向握手「順序重建排表」</h4>
              <span className="text-[10px] text-slate-400 font-bold block">點按欄中的上下按鈕 (Move Up / Down)，將 DHCP 報文流向按合理的先後時間軸進行重組排序：</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-w-2xl mx-auto">
          {scrambledSteps.map((step, idx) => {
            return (
              <motion.div
                key={step.type}
                layout
                className={`p-3 border rounded-xl flex items-center justify-between font-mono text-xs shadow-sm bg-white hover:border-slate-350 transition-all ${
                  quizVerified
                    ? step.type === DHCP_STEPS[idx].type
                      ? 'border-green-300 bg-green-50/50'
                      : 'border-red-300 bg-red-50/50'
                    : 'border-slate-205'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-[11px]">
                    #{idx + 1}
                  </span>
                  <div>
                    <strong className="text-slate-700 font-black">{step.name}</strong>
                    <p className="text-[10px] text-slate-400 mt-0.5">{step.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={idx === 0 || quizVerified}
                    onClick={() => moveItem(idx, 'up')}
                    className="p-1 px-2 border rounded-md hover:bg-slate-50 text-slate-650 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="向上移"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === scrambledSteps.length - 1 || quizVerified}
                    onClick={() => moveItem(idx, 'down')}
                    className="p-1 px-2 border rounded-md hover:bg-slate-50 text-slate-650 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="向下移"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}

          <div className="flex gap-2 justify-end pt-3">
            {quizVerified && (
              <button
                onClick={handleResetSort}
                className="text-xs font-bold text-slate-707 bg-slate-100 border px-4 py-2 rounded-xl hover:bg-slate-200"
              >
                重置挑戰
              </button>
            )}
            <button
              disabled={quizVerified}
              onClick={handleVerifySort}
              className="text-xs font-black bg-emerald-650 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl disabled:opacity-50"
            >
              提交核對序列
            </button>
          </div>

          {quizVerified && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-xl border font-mono text-xs mt-4 ${
                quizSuccess
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2 font-black mb-1">
                {quizSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <span>恭喜您！四向 DORA 交換順序完全重組正確。</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <span>順序不正確！標準順序為 D ➔ O ➔ R ➔ A：</span>
                  </>
                )}
              </div>
              <p className="leading-relaxed text-[11px] text-slate-500 bg-white/60 p-3 rounded-lg border mt-2">
                <strong>DHCP 演算法金律 (DORA Rule)：</strong><br />
                - ① <strong>Discover</strong> (探尋): 客戶端拋網廣播呼喊是否有 DHCP Server。<br />
                - ② <strong>Offer</strong> (提供): 各伺服器回應提出可配發的 IP 單。<br />
                - ③ <strong>Request</strong> (請求): 客戶端向網絡宣告選用拿到了哪一個 Offer。<br />
                - ④ <strong>ACK</strong> (確認): 該伺服器拍板鎖定，派發成功！
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* SECTION 3: FILL IN THE BLANK CONCEPT FIELD CHALLENGES */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="border-b pb-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800">隨堂演練二：DHCP 核心欄位與協定參數考核</h4>
              <span className="text-[10px] text-slate-400 font-bold block">請在空格內輸入精確的十進位或點分十進位，並自選認證 DHCP 正確回傳的核心附加屬性：</span>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Q1 */}
            <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
              <label className="block text-[11px] font-bold text-slate-550">
                1. 尚未取得 IP 前，DHCP 客戶端發送 Discover 的「初始來源 IP 位址」？
              </label>
              <input
                type="text"
                placeholder="例如 0.0.0.0"
                value={fibSrcIp}
                disabled={fibChecked}
                onChange={e => setFibSrcIp(e.target.value)}
                className="w-full font-mono text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
              />
              {fibChecked && (
                <span className={`text-[10px] font-bold block ${fibSrcIp.trim() === '0.0.0.0' ? 'text-green-600' : 'text-red-600'}`}>
                  {fibSrcIp.trim() === '0.0.0.0' ? '✓ 正確解答 0.0.0.0' : '✗ 答錯了！正確應為 0.0.0.0'}
                </span>
              )}
            </div>

            {/* Q2 */}
            <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
              <label className="block text-[11px] font-bold text-slate-550">
                2. 為了確保網段內所有的伺服器都能收到探尋，其「廣播目的 IP 位址」？
              </label>
              <input
                type="text"
                placeholder="例如 255.255.255.255"
                value={fibDstIp}
                disabled={fibChecked}
                onChange={e => setFibDstIp(e.target.value)}
                className="w-full font-mono text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
              />
              {fibChecked && (
                <span className={`text-[10px] font-bold block ${fibDstIp.trim() === '255.255.255.255' ? 'text-green-600' : 'text-red-600'}`}>
                  {fibDstIp.trim() === '255.255.255.255' ? '✓ 正確解答 255.255.255.255' : '✗ 答錯了！正確應為 255.255.255.255'}
                </span>
              )}
            </div>

            {/* Q3 */}
            <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
              <label className="block text-[11px] font-bold text-slate-550">
                3. DHCP 伺服器端 (Server) 所接聽的 UDP 埠號 (Port) 號碼是多少？
              </label>
              <input
                type="number"
                placeholder="例如 67"
                value={fibServerPort}
                disabled={fibChecked}
                onChange={e => setFibServerPort(e.target.value)}
                className="w-full font-mono text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
              />
              {fibChecked && (
                <span className={`text-[10px] font-bold block ${Number(fibServerPort) === 67 ? 'text-green-600' : 'text-red-600'}`}>
                  {Number(fibServerPort) === 67 ? '✓ 正確解答 67' : '✗ 答錯了！伺服器接聽 UDP 埠為 67'}
                </span>
              )}
            </div>

            {/* Q4 */}
            <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
              <label className="block text-[11px] font-bold text-slate-550">
                4. DHCP 客戶端 (Client) 所接聽並用以回應廣播的 UDP 埠號是多少？
              </label>
              <input
                type="number"
                placeholder="例如 68"
                value={fibClientPort}
                disabled={fibChecked}
                onChange={e => setFibClientPort(e.target.value)}
                className="w-full font-mono text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
              />
              {fibChecked && (
                <span className={`text-[10px] font-bold block ${Number(fibClientPort) === 68 ? 'text-green-600' : 'text-red-600'}`}>
                  {Number(fibClientPort) === 68 ? '✓ 正確解答 68' : '✗ 答錯了！客戶端對應埠為 68'}
                </span>
              )}
            </div>
          </div>

          {/* Selection section Q5 */}
          <div className="p-4 bg-slate-50 border rounded-xl space-y-2 text-xs font-sans">
            <label className="block text-[11px] font-mono font-bold text-slate-550">
              5. 除了最基本的主機 IP 位址外，以下哪些核心網路參數是 DHCP 可以自動配置並回傳給用戶端的？（可多選）
            </label>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-1 font-mono">
              {[
                { key: 'gateway', label: '預設第一跳閘道器 (Gateway) IP' },
                { key: 'dns', label: '網域伺服器 (DNS Server) IP' },
                { key: 'mask', label: '子網路遮罩 (Subnet Mask)' },
                { key: 'mac', label: '用戶端硬體網卡實體 MAC' },
                { key: 'cpu', label: '用戶主機 CPU 超頻配置頻率' }
              ].map((arg) => (
                <button
                  key={arg.key}
                  disabled={fibChecked}
                  onClick={() => setFibExtraChecked(prev => ({
                    ...prev,
                    [arg.key]: !prev[arg.key as keyof typeof fibExtraChecked]
                  }))}
                  className={`p-2 border rounded-lg text-[10px] font-bold text-left duration-150 leading-tight ${
                    fibExtraChecked[arg.key as keyof typeof fibExtraChecked]
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="block mb-1">{fibExtraChecked[arg.key as keyof typeof fibExtraChecked] ? '☑' : '☐'}</span>
                  <span>{arg.label}</span>
                </button>
              ))}
            </div>

            {fibChecked && (
              <div className="pt-1.5 font-mono text-[10px] font-bold block text-slate-500">
                {fibExtraChecked.gateway && fibExtraChecked.dns && fibExtraChecked.mask && !fibExtraChecked.mac && !fibExtraChecked.cpu ? (
                  <span className="text-green-600">✓ 選取正確！DHCP 回傳包含閘道器、DNS 地址及子網路遮罩。MAC 地址是實體固化於設備網卡中、用來向 DHCP 表明身份，絕非由 DHCP 分配；CPU 排程更非網路層協定職司範疇。</span>
                ) : (
                  <span className="text-red-600">✗ 選取有些錯漏。正確可由 DHCP 附加回傳的重磅元素為：閘道器 (Gateway)、DNS 地址、子網路遮罩。</span>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            {fibChecked && (
              <button
                onClick={handleResetFib}
                className="text-xs font-bold text-slate-707 bg-slate-100 border px-4 py-2 rounded-xl hover:bg-slate-200"
              >
                重做本練習
              </button>
            )}
            <button
              disabled={fibChecked}
              onClick={handleVerifyFib}
              className="text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl disabled:opacity-50"
            >
              提交驗證回填
            </button>
          </div>

          {fibScore !== null && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="p-4 bg-slate-900 border border-slate-950 text-white font-mono text-xs rounded-xl flex items-center justify-between"
            >
              <div>
                <span className="text-indigo-400 block font-bold text-[10px] uppercase">DORA CONCEPT ASSESSMENT</span>
                <strong className="text-sm">DHCP 參數考核綜合評分：<span className="text-emerald-400 font-extrabold">{fibScore} / 100</span></strong>
              </div>
              <span className="text-2xl">
                {fibScore === 100 ? '🎉 100分滿分通關！' : '✍ 還有進步空間，加油！'}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
