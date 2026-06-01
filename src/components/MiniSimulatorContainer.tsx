/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  RotateCcw,
  Plus,
  ArrowRight,
  Database,
  Cpu,
  Monitor,
  Server,
  Zap,
} from 'lucide-react';

interface Packet {
  id: number;
  type: 'class1' | 'class2' | 'class3'; // Class 1 (Red, weight 3), Class 2 (Green, w 2), Class 3 (Blue, w 1)
  name: string;
  arrivalTime: number;
}

export function MiniSimulatorContainer() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'lpm' | 'nat'>('schedule');

  // --- 1. QUEUEING & SCHEDULING STATE ---
  const [packetsQueue1, setPacketsQueue1] = useState<Packet[]>([]); // Class 1
  const [packetsQueue2, setPacketsQueue2] = useState<Packet[]>([]); // Class 2
  const [packetsQueue3, setPacketsQueue3] = useState<Packet[]>([]); // Class 3

  const [policy, setPolicy] = useState<'fifo' | 'priority' | 'wfq'>('wfq');
  const [inService, setInService] = useState<Packet | null>(null);
  const [dispatched, setDispatched] = useState<Packet[]>([]);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [wfqLastType, setWfqLastType] = useState<number>(0); // Tracks step in rotation
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
  const packetIdCounter = useRef(1);

  // --- 2. LPM STATE ---
  const [lpmIp, setLpmIp] = useState<string>('11001000 00010111 00011000 10101010');
  const [lpmStep, setLpmStep] = useState<number>(-1);
  const [lpmLog, setLpmLog] = useState<string[]>([]);
  const [lpmMatchedIdx, setLpmMatchedIdx] = useState<number | null>(null);

  // LPM Preset Datagram Address Options
  const lpmPresets = [
    {
      ip: '11001000 00010111 00010110 10100001',
      desc: '測試地址 A（第三段為 00010110）',
    },
    {
      ip: '11001000 00010111 00011000 10101010',
      desc: '測試地址 B（第三段為 00011000，兩特徵匹配）',
    },
    {
      ip: '11001000 00010111 00011001 10101010',
      desc: '測試地址 C（第三段為 00011001）',
    },
    {
      ip: '11001000 00010111 00100000 10101010',
      desc: '測試地址 D（未匹配前置字，走 otherwise）',
    },
  ];

  const lpmTable = [
    {
      range: '11001000 00010111 00010*** **********',
      interface: '0',
      prefix: '110010000001011100010',
      length: 21,
    },
    {
      range: '11001000 00010111 00011000 **********',
      interface: '1',
      prefix: '110010000001011100011000',
      length: 24,
    },
    {
      range: '11001000 00010111 00011*** **********',
      interface: '2',
      prefix: '110010000001011100011',
      length: 21,
    },
    {
      range: '其餘 IP 地址範圍（otherwise）',
      interface: '3',
      prefix: '',
      length: 0,
    },
  ];

  // --- 3. NAT STATE ---
  const [natStep, setNatStep] = useState<number>(0);
  const [natActiveClient, setNatActiveClient] = useState<'A' | 'B'>('A');
  const [natTableRows, setNatTableRows] = useState<
    { wanIp: string; wanPort: number; lanIp: string; lanPort: number }[]
  >([
    { wanIp: '138.76.29.7', wanPort: 5001, lanIp: '10.0.0.1', lanPort: 3345 },
  ]);

  // Handle Autoplay for scheduler
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoPlay) {
      timer = setInterval(() => {
        handleScheduleStep();
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isAutoPlay, packetsQueue1, packetsQueue2, packetsQueue3, policy]);

  // --- Scheduler Helper Functions ---
  const addPacket = (type: 'class1' | 'class2' | 'class3') => {
    const id = packetIdCounter.current++;
    const name = `P_${type === 'class1' ? 'R' : type === 'class2' ? 'G' : 'B'}${id}`;
    const newP: Packet = { id, type, name, arrivalTime: Date.now() };

    if (type === 'class1') setPacketsQueue1((prev) => [...prev, newP]);
    if (type === 'class2') setPacketsQueue2((prev) => [...prev, newP]);
    if (type === 'class3') setPacketsQueue3((prev) => [...prev, newP]);

    setSimulationLog((prev) => [
      `[抵達] ${type === 'class1' ? 'Class 1 (紅色)' : type === 'class2' ? 'Class 2 (綠色)' : 'Class 3 (藍色)'} 封包 ${name} 已加入佇列！`,
      ...prev.slice(0, 15),
    ]);
  };

  const handleScheduleReset = () => {
    setPacketsQueue1([]);
    setPacketsQueue2([]);
    setPacketsQueue3([]);
    setInService(null);
    setDispatched([]);
    setIsAutoPlay(false);
    setWfqLastType(0);
    setSimulationLog(['[重置] 模擬佇列與統計數據已清空。']);
    packetIdCounter.current = 1;
  };

  const handleScheduleStep = () => {
    // If active in service, dispatch it to history
    if (inService) {
      setDispatched((prev) => [inService, ...prev].slice(0, 10));
      setInService(null);
    }

    const hasQ1 = packetsQueue1.length > 0;
    const hasQ2 = packetsQueue2.length > 0;
    const hasQ3 = packetsQueue3.length > 0;

    if (!hasQ1 && !hasQ2 && !hasQ3) {
      setIsAutoPlay(false);
      return;
    }

    let targetPacket: Packet | null = null;

    if (policy === 'fifo') {
      // Find oldest arrived packet across all 3 queues
      const candidates: { packet: Packet; queueNum: number }[] = [];
      if (hasQ1) candidates.push({ packet: packetsQueue1[0], queueNum: 1 });
      if (hasQ2) candidates.push({ packet: packetsQueue2[0], queueNum: 2 });
      if (hasQ3) candidates.push({ packet: packetsQueue3[0], queueNum: 3 });

      candidates.sort((a, b) => a.packet.arrivalTime - b.packet.arrivalTime);
      const chosen = candidates[0];
      targetPacket = chosen.packet;

      if (chosen.queueNum === 1) setPacketsQueue1((prev) => prev.slice(1));
      if (chosen.queueNum === 2) setPacketsQueue2((prev) => prev.slice(1));
      if (chosen.queueNum === 3) setPacketsQueue3((prev) => prev.slice(1));

      setSimulationLog((prev) => [
        `[傳輸] FCFS 依抵達先後順序，發送了 ${targetPacket?.name}。`,
        ...prev.slice(0, 15),
      ]);
    } else if (policy === 'priority') {
      // Priority: Class 1 > Class 2 > Class 3
      if (hasQ1) {
        targetPacket = packetsQueue1[0];
        setPacketsQueue1((prev) => prev.slice(1));
        setSimulationLog((prev) => [
          `[優先傳輸] 發送了最高優先權 Class 1 佇列的封包：${targetPacket?.name}。`,
          ...prev.slice(0, 15),
        ]);
      } else if (hasQ2) {
        targetPacket = packetsQueue2[0];
        setPacketsQueue2((prev) => prev.slice(1));
        setSimulationLog((prev) => [
          `[優先傳輸] Class 1 佇列為空，發送中優先權 Class 2 封包：${targetPacket?.name}。`,
          ...prev.slice(0, 15),
        ]);
      } else if (hasQ3) {
        targetPacket = packetsQueue3[0];
        setPacketsQueue3((prev) => prev.slice(1));
        setSimulationLog((prev) => [
          `[優先傳輸] Class 1 與 2 皆為空，發送低優先權 Class 3 封包：${targetPacket?.name}。`,
          ...prev.slice(0, 15),
        ]);
      }
    } else if (policy === 'wfq') {
      // Weighted Fair Queueing: weights is Class 1=3, Class 2=2, Class 3=1
      // Simple round robin with counter steps.
      // Rotation steps logic: 3 of Class 1 -> 2 of Class 2 -> 1 of Class 3
      let selectedQ = 0;

      // Select next queue based on last selected type and queues being non-empty
      // wfqLastType state will range 0..5 (0,1,2 for Class 1, 3,4 for Class 2, 5 for Class 3)
      let found = false;
      let checkedCount = 0;
      let currentCheckIdx = wfqLastType;

      while (!found && checkedCount < 6) {
        if (currentCheckIdx < 3 && hasQ1) {
          selectedQ = 1;
          setWfqLastType((currentCheckIdx + 1) % 6);
          found = true;
        } else if (currentCheckIdx >= 3 && currentCheckIdx < 5 && hasQ2) {
          selectedQ = 2;
          setWfqLastType((currentCheckIdx + 1) % 6);
          found = true;
        } else if (currentCheckIdx === 5 && hasQ3) {
          selectedQ = 3;
          setWfqLastType((currentCheckIdx + 1) % 6);
          found = true;
        } else {
          currentCheckIdx = (currentCheckIdx + 1) % 6;
          checkedCount++;
        }
      }

      // Fallback in case rotation indexing was circular but we have some non-empty queue
      if (!found) {
        if (hasQ1) selectedQ = 1;
        else if (hasQ2) selectedQ = 2;
        else if (hasQ3) selectedQ = 3;
      }

      if (selectedQ === 1 && hasQ1) {
        targetPacket = packetsQueue1[0];
        setPacketsQueue1((prev) => prev.slice(1));
        setSimulationLog((prev) => [
          `[WFQ 加權傳輸] 拉取權重 w=3 的 Class 1 封包：${targetPacket?.name}`,
          ...prev.slice(0, 15),
        ]);
      } else if (selectedQ === 2 && hasQ2) {
        targetPacket = packetsQueue2[0];
        setPacketsQueue2((prev) => prev.slice(1));
        setSimulationLog((prev) => [
          `[WFQ 加權傳輸] 拉取權重 w=2 的 Class 2 封包：${targetPacket?.name}`,
          ...prev.slice(0, 15),
        ]);
      } else if (selectedQ === 3 && hasQ3) {
        targetPacket = packetsQueue3[0];
        setPacketsQueue3((prev) => prev.slice(1));
        setSimulationLog((prev) => [
          `[WFQ 加權傳輸] 拉取權重 w=1 的 Class 3 封包：${targetPacket?.name}`,
          ...prev.slice(0, 15),
        ]);
      }
    }

    if (targetPacket) {
      setInService(targetPacket);
    }
  };

  // --- LPM Helper Functions ---
  const handleLpmStep = () => {
    const rawIpNoSpace = lpmIp.replace(/\s/g, '');
    if (lpmStep === -1) {
      setLpmStep(0);
      setLpmLog([`[開始查詢] 欲轉送 IP：${lpmIp}，啟動最長字首匹配演算法。`]);
      setLpmMatchedIdx(null);
      return;
    }

    const currentIdx = lpmStep;
    if (currentIdx < 3) {
      const row = lpmTable[currentIdx];
      // Compare prefix bits
      const targetPrefixBits = rawIpNoSpace.substring(0, row.length);
      const isMatch = targetPrefixBits === row.prefix;

      setLpmLog((prev) => [
        `[比對第 ${currentIdx + 1} 欄] 檢查規則 ${row.interface}（/${row.length}）：` +
          `前置字 ${row.prefix} ${isMatch ? '【 符合（Match!）】' : '【 不符合（Mismatch）】'}`,
        ...prev,
      ]);

      setLpmStep((prev) => prev + 1);
    } else if (currentIdx === 3) {
      // Evaluate LPM Results to find the longest matched index
      // Evaluate actual LPM match math
      // preset 0: raw bits first 21 matches Row 0. Length 21. No match on row 1, 2. Final index = interface 0
      // preset 1: raw bits matches Row 0 (matches 21), matches Row 1 (matches 24), matches Row 2 (matches 21). Largest is Row 1 (24). Output = Interface 1
      // preset 2: matches Row 2 (21). Row 1 (mismatch: index 24 is 1 but Row 1 prefix ends with 0). Final index = interface 2
      // preset 3: None matches -> Otherwise interface 3.

      let bestIdx = 3; // defaults to otherwise
      if (rawIpNoSpace.startsWith('110010000001011100010')) {
        bestIdx = 0; // range 0
      }
      if (rawIpNoSpace.startsWith('110010000001011100011')) {
        bestIdx = 2; // range 2 (21 bits)
        if (rawIpNoSpace.startsWith('110010000001011100011000')) {
          bestIdx = 1; // range 1 (24 bits - LONGEST!)
        }
      }

      setLpmMatchedIdx(bestIdx);
      const chosenRow = lpmTable[bestIdx];
      setLpmLog((prev) => [
        `[最終裁決] 比對完成！最長匹配項為：規則 ${bestIdx === 3 ? 'otherwise' : bestIdx}，封包將移往【 介面 ${chosenRow.interface} 】發送。`,
        ...prev,
      ]);
      setLpmStep(4);
    } else {
      // Reset
      setLpmStep(-1);
      setLpmMatchedIdx(null);
      setLpmLog([]);
    }
  };

  const handleLpmReset = () => {
    setLpmStep(-1);
    setLpmMatchedIdx(null);
    setLpmLog([]);
  };

  // --- NAT Helper Functions ---
  const handleNatStep = () => {
    if (natStep === 6) {
      setNatStep(0);
      return;
    }
    const nextStep = natStep + 1;
    setNatStep(nextStep);

    // Dynamic generation of NAT translation logs
    if (nextStep === 2) {
      // Checks table insertion
      const existing = natTableRows.find(
        (r) => r.lanIp === `10.0.0.${natActiveClient === 'A' ? 1 : 2}`
      );
      if (!existing) {
        setNatTableRows((prev) => [
          ...prev,
          {
            wanIp: '138.76.29.7',
            wanPort: 5000 + prev.length + 1,
            lanIp: `10.0.0.${natActiveClient === 'A' ? 1 : 2}`,
            lanPort: 3345,
          },
        ]);
      }
    }
  };

  const getNatCurrentPort = () => {
    const row = natTableRows.find(
      (r) => r.lanIp === `10.0.0.${natActiveClient === 'A' ? 1 : 2}`
    );
    return row ? row.wanPort : 5001;
  };

  return (
    <div id="mini-simulator-container" className="bg-slate-50 border border-slate-100 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-200/60 pb-4 mb-6 gap-4">
        <div>
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
            微型互動實驗室 (Mini Interactive Labs)
          </span>
          <h3 className="text-xl font-bold text-slate-850 mt-1 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
            網路層資料平面即時動態模擬
          </h3>
        </div>
        <div className="flex bg-slate-200/70 p-1 rounded-xl w-full md:w-auto">
          <button
            id="tab-schedule"
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 md:flex-none text-xs font-semibold px-4 py-2 rounded-lg transition-colors duration-200 ${
              activeTab === 'schedule'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            佇列與排程
          </button>
          <button
            id="tab-lpm"
            onClick={() => setActiveTab('lpm')}
            className={`flex-1 md:flex-none text-xs font-semibold px-4 py-2 rounded-lg transition-colors duration-200 ${
              activeTab === 'lpm'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            最長字首匹配 (LPM)
          </button>
          <button
            id="tab-nat"
            onClick={() => setActiveTab('nat')}
            className={`flex-1 md:flex-none text-xs font-semibold px-4 py-2 rounded-lg transition-colors duration-200 ${
              activeTab === 'nat'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            NAT 重寫轉換
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: SCHEDULE & QUEUEING ==================== */}
      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* Simulation Canvas */}
            <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center justify-between">
                <span>視覺佇列緩衝區 (Visual Port Queue Buffer)</span>
                <span className="font-mono text-xs text-blue-500 uppercase tracking-wide">
                  模式：{policy === 'fifo' ? '先進先出 (FCFS)' : policy === 'priority' ? '絕對優先權' : '加權公平輪詢 (WFQ)'}
                </span>
              </h4>

              <div className="space-y-4">
                {/* Track 1 */}
                <div className="relative border border-dashed border-red-200 rounded-xl p-3 bg-red-50/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 block animate-pulse" />
                      Class 1 佇列 (高優先權 / WFQ加權=3)
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      數量：{packetsQueue1.length}
                    </span>
                  </div>
                  <div className="h-14 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 overflow-x-auto relative">
                    <AnimatePresence>
                      {packetsQueue1.length === 0 ? (
                        <span className="text-xs text-slate-400/80 italic">佇列為空</span>
                      ) : (
                        packetsQueue1.map((p, idx) => (
                          <motion.div
                            key={p.id}
                            initial={{ scale: 0.6, opacity: 0, x: -20 }}
                            animate={{ scale: 1, opacity: 1, x: 0 }}
                            exit={{ scale: 0.6, opacity: 0, x: 20 }}
                            className="w-12 h-9 rounded-lg bg-red-500 text-white flex items-center justify-center font-mono text-xs font-bold shadow-md shadow-red-200 flex-shrink-0 cursor-not-allowed"
                          >
                            {p.name}
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Track 2 */}
                <div className="relative border border-dashed border-green-200 rounded-xl p-3 bg-green-50/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-green-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 block animate-pulse" />
                      Class 2 佇列 (中優先權 / WFQ加權=2)
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      數量：{packetsQueue2.length}
                    </span>
                  </div>
                  <div className="h-14 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 overflow-x-auto relative">
                    <AnimatePresence>
                      {packetsQueue2.length === 0 ? (
                        <span className="text-xs text-slate-400/80 italic">佇列為空</span>
                      ) : (
                        packetsQueue2.map((p, idx) => (
                          <motion.div
                            key={p.id}
                            initial={{ scale: 0.6, opacity: 0, x: -20 }}
                            animate={{ scale: 1, opacity: 1, x: 0 }}
                            exit={{ scale: 0.6, opacity: 0, x: 20 }}
                            className="w-12 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-mono text-xs font-bold shadow-md shadow-emerald-200 flex-shrink-0"
                          >
                            {p.name}
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Track 3 */}
                <div className="relative border border-dashed border-blue-200 rounded-xl p-3 bg-blue-50/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 block animate-pulse" />
                      Class 3 佇列 (低優先權 / WFQ加權=1)
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      數量：{packetsQueue3.length}
                    </span>
                  </div>
                  <div className="h-14 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 overflow-x-auto relative">
                    <AnimatePresence>
                      {packetsQueue3.length === 0 ? (
                        <span className="text-xs text-slate-400/80 italic">佇列為空</span>
                      ) : (
                        packetsQueue3.map((p, idx) => (
                          <motion.div
                            key={p.id}
                            initial={{ scale: 0.6, opacity: 0, x: -20 }}
                            animate={{ scale: 1, opacity: 1, x: 0 }}
                            exit={{ scale: 0.6, opacity: 0, x: 20 }}
                            className="w-12 h-9 rounded-lg bg-blue-500 text-white flex items-center justify-center font-mono text-xs font-bold shadow-md shadow-blue-200 flex-shrink-0"
                          >
                            {p.name}
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Server Lane / Outflow */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col md:flex-row items-center gap-6 justify-between bg-slate-50 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-600">交換接收埠 (Link Server)</h5>
                    <p className="text-[10px] text-slate-400">傳輸中的活動 IP 封包</p>
                  </div>
                </div>

                <div className="flex-1 flex justify-center py-2 px-6 border border-dashed border-slate-200 rounded-xl bg-white max-w-xs min-h-[50px] items-center">
                  {inService ? (
                    <motion.div
                      layoutId="service-packet"
                      className={`px-4 py-2 rounded-lg text-white font-mono text-sm font-bold shadow-md flex items-center gap-2 ${
                        inService.type === 'class1'
                          ? 'bg-red-500 shadow-red-200'
                          : inService.type === 'class2'
                          ? 'bg-emerald-500 shadow-emerald-200'
                          : 'bg-blue-500 shadow-blue-200'
                      }`}
                    >
                      <span>{inService.name}</span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-black/20">傳輸中</span>
                    </motion.div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">無封包發射中</span>
                  )}
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                    發送通道容量 (Line Speed)
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-600">1.0 Gbps (1000msec)</span>
                </div>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="add-class1"
                onClick={() => addPacket('class1')}
                className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 duration-200 px-3.5 py-2.5 rounded-lg border border-red-200 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                新增 Class 1 (加權=3)
              </button>
              <button
                id="add-class2"
                onClick={() => addPacket('class2')}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 duration-200 px-3.5 py-2.5 rounded-lg border border-emerald-200 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                新增 Class 2 (加權=2)
              </button>
              <button
                id="add-class3"
                onClick={() => addPacket('class3')}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 duration-200 px-3.5 py-2.5 rounded-lg border border-blue-200 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                新增 Class 3 (加權=1)
              </button>
              <div className="h-5 w-[1px] bg-slate-200 mx-2" />
              <button
                id="btn-step"
                onClick={handleScheduleStep}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 duration-200 px-4 py-2.5 rounded-lg shadow-sm"
              >
                發送一步 (STEP)
              </button>
              <button
                id="btn-auto"
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm ${
                  isAutoPlay
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-800 text-white'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                {isAutoPlay ? '暫停播放' : '自動撥放'}
              </button>
              <button
                id="btn-reset"
                onClick={handleScheduleReset}
                className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300 duration-200 shadow-sm"
                title="重置"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sidebar configs */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-3">排程演算法切換 (Scheduling Policies)</h4>
              <div className="space-y-2">
                {[
                  {
                    id: 'wfq',
                    name: '加權公平佇列 (Weighted Fair Queueing, WFQ)',
                    desc: '依權重比例拉取，Class 1:2:3 分配頻寬比為 3:2:1。不會造成低階流枯竭。',
                  },
                  {
                    id: 'priority',
                    name: '絕對優先權排程 (Priority)',
                    desc: '最高優先級 (Class 1) 享有絕對最高存取權。當 1 不為空時完全不拉取 2 與 3。',
                  },
                  {
                    id: 'fifo',
                    name: '先進先出 (FCFS / FIFO)',
                    desc: '不看封包類別優先，純粹按照封包抵達緩衝區佇列的時間順序。',
                  },
                ].map((x) => (
                  <label
                    key={x.id}
                    className={`flex flex-col p-3 rounded-lg border cursor-pointer select-none transition-all duration-200 ${
                      policy === x.id
                        ? 'bg-blue-50/70 border-blue-400'
                        : 'bg-slate-50 border-slate-100 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="radio"
                        id={`policy-${x.id}`}
                        name="policy"
                        checked={policy === x.id}
                        onChange={() => setPolicy(x.id as any)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-700">{x.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 leading-normal pl-5">{x.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Simulated Live Packet Logs */}
            <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm flex-1 flex flex-col min-h-[170px]">
              <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">排程歷史日誌 (Link Dispatch Logs)</h4>
              <div id="schedule-logs" className="flex-1 bg-slate-50 border border-slate-150 rounded-lg p-3 font-mono text-[10px] text-slate-600 space-y-1.5 overflow-y-auto max-h-[180px]">
                {simulationLog.length === 0 ? (
                  <span className="text-slate-400 italic">暫無事件記錄，請按上方按鈕新增封包</span>
                ) : (
                  simulationLog.map((log, i) => <div key={i}>{log}</div>)
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: LONGEST PREFIX MATCHING ==================== */}
      {activeTab === 'lpm' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center justify-between">
                <span>網際網路目的 IP 字首比對面板</span>
                <span className="font-mono text-xs text-blue-500">
                  LPM 位元位長比：長度越大、優先度越高
                </span>
              </h4>

              {/* IP Input controls */}
              <div className="mb-5 bg-slate-50 border border-slate-100 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      目的地 IP 地址 (32-bit Binary string with spaces for octets)
                    </label>
                    <input
                      type="text"
                      id="lpm-ip-input"
                      value={lpmIp}
                      onChange={(e) => setLpmIp(e.target.value)}
                      className="w-full font-mono text-sm font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      id="btn-lpm-step"
                      onClick={handleLpmStep}
                      className="flex-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 duration-200 py-2.5 rounded-lg shadow-sm"
                    >
                      {lpmStep === -1 ? '啟動比對' : lpmStep === 4 ? '重新開始' : '推進比對步驟'}
                    </button>
                    <button
                      id="btn-lpm-reset"
                      onClick={handleLpmReset}
                      className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>

                {/* Preset Options picker */}
                <div className="mt-3 pt-3 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                    點選快速測試範例（LPM 核心案例）：
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {lpmPresets.map((opt, i) => (
                      <button
                        key={i}
                        id={`lpm-preset-${i}`}
                        onClick={() => {
                          setLpmIp(opt.ip);
                          handleLpmReset();
                        }}
                        className="text-[10px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-blue-50 hover:border-blue-300 duration-200 font-medium text-slate-700"
                      >
                        {opt.desc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* LPM TRACING TABLE */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 bg-slate-100 p-2 text-xs font-bold text-slate-600 rounded-lg mb-1 font-mono">
                  <div className="col-span-2">規則與介面</div>
                  <div className="col-span-7">目的地 IP 首碼限制範圍 (Destination address prefix)</div>
                  <div className="col-span-3 text-right">比對與長度</div>
                </div>

                {lpmTable.map((row, idx) => {
                  const isCurrentRow = lpmStep === idx;
                  const isMatchedRow = lpmMatchedIdx === idx;

                  return (
                    <div
                      key={idx}
                      id={`lpm-row-${idx}`}
                      className={`grid grid-cols-12 p-3 text-xs border rounded-lg duration-200 items-center font-mono ${
                        isMatchedRow
                          ? 'border-green-500 bg-green-50/70 shadow-sm shadow-green-100'
                          : isCurrentRow
                          ? 'border-blue-400 bg-blue-50/70'
                          : 'border-slate-100 bg-white'
                      }`}
                    >
                      <div className="col-span-2 font-bold text-slate-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 block" />
                        介面 {row.interface}
                      </div>
                      <div className="col-span-7 text-[11px] font-semibold text-slate-700">
                        {row.range}
                      </div>
                      <div className="col-span-3 text-right flex items-center justify-end gap-2">
                        {row.length > 0 ? (
                          <span className="bg-slate-100 border text-[10px] px-1.5 py-0.5 rounded text-slate-500 font-medium">
                            長位：{row.length} bits
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-[10px] border border-amber-200 px-1.5 py-0.5 rounded text-amber-600 font-medium">
                            預設條
                          </span>
                        )}
                        {isMatchedRow && (
                          <span className="bg-green-500 text-white font-bold text-[9px] px-1.5 rounded uppercase">
                            選中 (LPM)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm flex-1 flex flex-col">
              <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">比對實況演算 (Trace Step Logs)</h4>
              <div id="lpm-logs" className="flex-1 bg-slate-900 text-green-400 border border-slate-950 rounded-xl p-4 font-mono text-[11px] leading-relaxed space-y-2 overflow-y-auto max-h-[300px]">
                {lpmLog.length === 0 ? (
                  <div className="text-slate-500 italic">請按下方預設案例或調整 IP 後，點選「啟動比對」親自追蹤匹配流程。</div>
                ) : (
                  lpmLog.map((log, i) => <div key={i}>{log}</div>)
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: NAT ADDRESS REWRITE ==================== */}
      {activeTab === 'nat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center justify-between">
                <span>NAT 路由器 IP/Port 位址重寫與轉換機制</span>
                <span className="bg-amber-100 border border-amber-200 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  對外共享單一 IP：138.76.29.7
                </span>
              </h4>

              {/* Graphical Network Path Map */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 min-h-[170px] flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between">
                  {/* LOCAL HOSTS */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">私有局域網 (LAN)</span>

                    {/* PC A Device box */}
                    <div
                      onClick={() => {
                        setNatActiveClient('A');
                        setNatStep(0);
                      }}
                      className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-all duration-200 duration-200 ${
                        natActiveClient === 'A'
                          ? 'border-blue-500 bg-blue-50/50 scale-102 font-bold shadow-sm shadow-blue-100'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <Monitor className="w-4 h-4 text-slate-600" />
                      <div className="text-left leading-normal">
                        <div className="text-[10px] text-slate-800">PC A</div>
                        <div className="text-[9px] font-mono text-slate-400">10.0.0.1:3345</div>
                      </div>
                    </div>

                    {/* PC B Device box */}
                    <div
                      onClick={() => {
                        setNatActiveClient('B');
                        setNatStep(0);
                      }}
                      className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-all duration-200 duration-200 ${
                        natActiveClient === 'B'
                          ? 'border-blue-500 bg-blue-50/50 scale-102 font-bold shadow-sm shadow-blue-100'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <Monitor className="w-4 h-4 text-slate-600" />
                      <div className="text-left leading-normal">
                        <div className="text-[10px] text-slate-800">PC B</div>
                        <div className="text-[9px] font-mono text-slate-400">10.0.0.2:3345</div>
                      </div>
                    </div>
                  </div>

                  {/* TRANSIT LAN-WAN packet visualizer block */}
                  <div className="flex-1 flex flex-col items-center justify-center px-4">
                    <div className="w-full flex items-center justify-between relative px-2">
                      <div className="w-full h-1 bg-slate-200 absolute top-1/2 left-0 -translate-y-1/2 rounded" />

                      {/* Moving packet block inside LAN and WAN */}
                      {natStep > 0 && natStep <= 3 && (
                        <motion.div
                          animate={{
                            x: natStep === 1 ? '5%' : natStep === 2 ? '50%' : '210%',
                          }}
                          className="z-10 bg-indigo-600 text-white font-mono text-[9px] font-bold px-2 py-1 rounded shadow-md flex flex-col items-center leading-normal"
                        >
                          <span>REQ</span>
                          <span className="scale-90 font-mono opacity-80">
                            {natStep === 1
                              ? `10.0.0.${natActiveClient === 'A' ? 1 : 2} -> Web`
                              : `138.76.29.7:${getNatCurrentPort()} -> Web`}
                          </span>
                        </motion.div>
                      )}

                      {/* Moving REYPLY Packet back */}
                      {natStep >= 4 && natStep <= 6 && (
                        <motion.div
                          animate={{
                            x: natStep === 4 ? '210%' : natStep === 5 ? '50%' : '5%',
                          }}
                          className="z-10 bg-orange-500 text-white font-mono text-[9px] font-bold px-2 py-1 rounded shadow-md flex flex-col items-center leading-normal"
                        >
                          <span>RESP</span>
                          <span className="scale-90 font-mono opacity-80">
                            {natStep === 4
                              ? `Web -> 138.76.29.7:${getNatCurrentPort()}`
                              : `Web -> 10.0.0.${natActiveClient === 'A' ? 1 : 2}`}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* NAT CENTRAL ROUTER DEVICE */}
                  <div className="flex flex-col items-center p-3 bg-slate-800 text-white border border-slate-700 rounded-xl relative">
                    <Cpu className="w-6 h-6 text-blue-400 mb-1" />
                    <span className="text-[10px] font-bold text-center block">NAT 轉送路由器</span>
                    <span className="text-[8px] font-mono text-slate-400 mt-1 block">
                      Local: 10.0.0.4
                    </span>
                    <span className="text-[8px] font-mono text-blue-400 font-bold block">
                      WAN: 138.76.29.7
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center px-4" />

                  {/* REMOTE HOST */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col items-center">
                    <Server className="w-5 h-5 text-slate-700 mb-1" />
                    <span className="text-[10px] font-bold block text-slate-800">外部伺服器 (Web)</span>
                    <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                      128.119.40.186:80
                    </span>
                  </div>
                </div>

                {/* Step indicators */}
                <div className="mt-4 pt-3 border-t border-slate-205 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    目前步驟階段： {natStep === 0 && '等待客戶端發起傳輸...'}
                    {natStep === 1 && `[LAN走廊] PC ${natActiveClient} 向伺服器發送 IP 請求包。`}
                    {natStep === 2 && `[NAT映射] 路由器重寫標頭中的 Port，登載儲存於對照表中。`}
                    {natStep === 3 && `[WAN傳送] 改頭換面的封包抵達 Web 伺服器目的地。`}
                    {natStep === 4 && `[回應返程] 伺服器回包，目的 IP 指向路由器 WAN 位址。`}
                    {natStep === 5 && `[對手映射] 路由器回查，再次重寫更正回內網目標 IP。`}
                    {natStep === 6 && `[抵達極終] 封包已安全返達原傳送機 PC ${natActiveClient}！`}
                  </span>
                  <button
                    id="btn-nat-step"
                    onClick={handleNatStep}
                    className="flex items-center gap-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shrink-0 duration-200 select-none shadow-sm"
                  >
                    <span>{natStep === 0 ? '發射 packet' : natStep === 6 ? '重新開始' : '前進一步'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* NAT LIVE MAPPING TABLE */}
            <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm flex flex-col h-full">
              <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">
                NAT 映射轉換與對照表實況 (NAT Table)
              </h4>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex-1 flex flex-col">
                <div className="grid grid-cols-2 text-[9px] font-bold text-slate-500 border-b border-slate-200 pb-1.5 mb-2 font-mono uppercase">
                  <div>公網介面對外對應 (WAN Side)</div>
                  <div>內網目的地對應 (LAN Side)</div>
                </div>

                <div className="space-y-1.5 flex-1 font-mono text-[10px]">
                  {natTableRows.map((row, idx) => (
                    <div
                      key={idx}
                      id={`nat-row-${idx}`}
                      className="grid grid-cols-2 py-1.5 px-2 bg-white rounded border border-slate-150 text-slate-700 font-semibold"
                    >
                      <div className="text-blue-600">
                        {row.wanIp}:{row.wanPort}
                      </div>
                      <div className="text-slate-600">
                        {row.lanIp}:{row.lanPort}
                      </div>
                    </div>
                  ))}
                  {natTableRows.length === 0 && (
                    <span className="text-xs text-slate-400 italic block mt-4">轉換表尚空</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
