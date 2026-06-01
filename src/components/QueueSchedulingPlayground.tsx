/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Zap,
  Plus,
  Play,
  RotateCcw,
  Sliders,
  HelpCircle,
  Database,
  ArrowRight,
  ChevronRight,
  Lock,
  RefreshCw,
  Award,
  CheckCircle2,
  XCircle,
  Server,
  Layers,
} from 'lucide-react';

// ==================== TYPES & INTERFACES ====================
interface HOLPacket {
  id: string; // unique ID like "P-1"
  targetOutput: number; // 1, 2, or 3
  colorTheme: string; // Tailwind bg styles
  name: string; // Label like "IP-A1"
}

interface SchedulerPacket {
  id: string;
  className: 'Class 1' | 'Class 2' | 'Class 3';
  classIdx: number; // 0, 1, or 2
  arrivalTime: number; // For FCFS/FIFO
  name: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const SCHEDULING_QUIZ: QuizQuestion[] = [
  {
    id: 101,
    question: '在加權公平佇列（WFQ）調度中，若三個類別的權重分別設為 w1=3, w2=2, w3=1。在鏈路擁塞、且各佇列皆有源源不絕封包時，Class 2 的頻寬分配佔比為何？',
    options: ['16.7% (1/6)', '33.3% (2/6)', '50.0% (3/6)', '100%'],
    correctIndex: 1,
    explanation: '依加權配比公式，各類別所佔頻寬為 wi / (w1+w2+w3)。Class 2 佔比即為 2 / (3+2+1) = 2/6 ≈ 33.3%。此機制能確保低優先權流（Class 3）享有最少 1/6 頻寬，免於被大流量 Class 1 徹底餓死。'
  },
  {
    id: 102,
    question: '在輸入佇列中引發「線頭阻塞（Head-of-the-Line, HOL Blocking）」的實質原因為何？',
    options: [
      '交換結構（Switching Fabric）頻寬不足以發送任何一個封包',
      '輸出埠（Output Port）物理鏈路斷線',
      '排在佇列第一個首位的封包因為目的地輸出埠正忙而被堵住，導致其後方想前往「完全空閒輸出埠」的封包也被無辜拖累、無法前進',
      '封包在傳輸途中發生 TTL 扣減至 0'
    ],
    correctIndex: 2,
    explanation: 'HOL 阻塞是輸入埠佇列的特色瓶頸：即使交換網和目的地輸出埠完全空閒，只要你前面的人塞住，你縱使有空檔也被絆住無法動彈。'
  },
  {
    id: 103,
    question: '與「雙跨越匯流排交換（Bus）」相比，「縱橫式互連網路交換結構（Crossbar / Interconnection Network）」的核心技術優勢是什麼？',
    options: [
      '它完全不需要任何實體緩衝區',
      '它的製造成本最低、最節省硬體連線',
      '它包含垂直與水平交錯並行線路，允許多個輸入端「同時」轉送封包到「不同的」輸出端，大大提升併發吞吐量',
      '它能將 IPv4 標頭直接與 IPv6 鏈路做一對一對應'
    ],
    correctIndex: 2,
    explanation: '在 Bus 結構中，所有晶片共享一條道路，每次只能走一部封包。互連網路則像是有十字立體交會的高速公路網，只要不同目的地，大家可以同時暢行無阻。'
  },
  {
    id: 104,
    question: '在排程演算法中，如果採用「絕對優先權（Priority Scheduling）」進行排班，可能產生的最大副作用為何？',
    options: [
      '所有的封包都將面臨同樣的隨機丟棄率',
      '當高優先權佇列不停有封包進來時，中低優先權佇列將長年等不到服務，陷入俗稱的「 starvation (餓死)」現象',
      '高優先權封包在通過交換結構時會自動被壓縮標頭',
      '導致本機端最長字首匹配（LPM）功能故障'
    ],
    correctIndex: 1,
    explanation: '「絕對優先權（Priority）」是鐵面無私的。只要高優先權（Class 1）還有任意一粒封包，中低優先權（Class 2/3）都會被完全凍結。若高優先權源源不絕，低階流就徹底餓死了。'
  }
];

export function QueueSchedulingPlayground() {
  const [activeSubTab, setActiveSubTab] = useState<'fabric' | 'hol' | 'scheduling'>('fabric');

  // ==================== PART A: FABRICS ====================
  const [selectedFabric, setSelectedFabric] = useState<'memory' | 'bus' | 'interconnection'>('memory');

  // ==================== PART B: HOL BLOCKER ====================
  const [holInputQueues, setHolInputQueues] = useState<Record<number, HOLPacket[]>>({
    1: [
      { id: 'p-1', targetOutput: 1, colorTheme: 'bg-indigo-500 shadow-indigo-200 text-white border-indigo-650', name: 'P-A1' },
      { id: 'p-2', targetOutput: 2, colorTheme: 'bg-emerald-500 shadow-emerald-200 text-white border-emerald-650', name: 'P-A2' },
    ],
    2: [
      { id: 'p-3', targetOutput: 1, colorTheme: 'bg-indigo-500 shadow-indigo-200 text-white border-indigo-650', name: 'P-B1' },
      { id: 'p-4', targetOutput: 3, colorTheme: 'bg-amber-500 shadow-amber-200 text-white border-amber-650', name: 'P-B2' },
    ],
    3: [
      { id: 'p-5', targetOutput: 3, colorTheme: 'bg-amber-500 shadow-amber-200 text-white border-amber-650', name: 'P-C1' },
    ],
  });

  const [holStepLog, setHolStepLog] = useState<{
    timestep: number;
    moved: string[];
    blocked: string[];
    explanation: string;
  }>({
    timestep: 0,
    moved: [],
    blocked: [],
    explanation: '請點擊下方按鈕新增封包，或點選「步進模擬」開始觀察交換機中的衝突競爭！',
  });

  const [holPacketIdCounter, setHolPacketIdCounter] = useState<number>(6);

  const handleAddHolPacket = (inputPortNum: number, targetOutputNum: number) => {
    const idNum = holPacketIdCounter;
    setHolPacketIdCounter(idNum + 1);

    const portLetter = inputPortNum === 1 ? 'A' : inputPortNum === 2 ? 'B' : 'C';
    const colorTheme =
      targetOutputNum === 1
        ? 'bg-indigo-500 shadow-indigo-200 text-white border-indigo-650'
        : targetOutputNum === 2
        ? 'bg-emerald-500 shadow-emerald-200 text-white border-emerald-650'
        : 'bg-amber-500 shadow-amber-200 text-white border-amber-650';

    const newPacket: HOLPacket = {
      id: `p-${idNum}`,
      targetOutput: targetOutputNum,
      colorTheme,
      name: `P-${portLetter}${idNum}`,
    };

    setHolInputQueues((prev) => ({
      ...prev,
      [inputPortNum]: [...prev[inputPortNum], newPacket],
    }));
  };

  const handleResetHolSimulator = () => {
    setHolInputQueues({
      1: [
        { id: 'p-1', targetOutput: 1, colorTheme: 'bg-indigo-500 shadow-indigo-200 text-white border-indigo-650', name: 'P-A1' },
        { id: 'p-2', targetOutput: 2, colorTheme: 'bg-emerald-500 shadow-emerald-200 text-white border-emerald-650', name: 'P-A2' },
      ],
      2: [
        { id: 'p-3', targetOutput: 1, colorTheme: 'bg-indigo-500 shadow-indigo-200 text-white border-indigo-650', name: 'P-B1' },
        { id: 'p-4', targetOutput: 3, colorTheme: 'bg-amber-500 shadow-amber-200 text-white border-amber-650', name: 'P-B2' },
      ],
      3: [
        { id: 'p-5', targetOutput: 3, colorTheme: 'bg-amber-500 shadow-amber-200 text-white border-amber-650', name: 'P-C1' },
      ],
    });
    setHolStepLog({
      timestep: 0,
      moved: [],
      blocked: [],
      explanation: '模擬器已安全重設！您可以重新指派、點選封包與步進。',
    });
    setHolPacketIdCounter(6);
  };

  const handleRandomHolScenario = () => {
    const randomized: Record<number, HOLPacket[]> = { 1: [], 2: [], 3: [] };
    let idCounter = 1;

    for (let port = 1; port <= 3; port++) {
      const portLetter = port === 1 ? 'A' : port === 2 ? 'B' : 'C';
      const packetCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 packets
      for (let i = 0; i < packetCount; i++) {
        const targetOutput = Math.floor(Math.random() * 3) + 1; // output 1, 2, or 3
        const colorClass =
          targetOutput === 1
            ? 'bg-indigo-500 shadow-indigo-200 text-white border-indigo-650'
            : targetOutput === 2
            ? 'bg-emerald-500 shadow-emerald-200 text-white border-emerald-650'
            : 'bg-amber-500 shadow-amber-200 text-white border-amber-650';

        randomized[port].push({
          id: `p-${idCounter}`,
          targetOutput,
          colorTheme: colorClass,
          name: `P-${portLetter}${idCounter}`,
        });
        idCounter++;
      }
    }

    setHolInputQueues(randomized);
    setHolPacketIdCounter(idCounter);
    setHolStepLog({
      timestep: 0,
      moved: [],
      blocked: [],
      explanation: '已隨機佈署全新鏈路競爭場景！請點選「步進模擬」開始推演。',
    });
  };

  const handleStepHolSimulation = () => {
    // 1. Check head elements of queues
    const heads: { portNum: number; packet: HOLPacket }[] = [];
    for (let p = 1; p <= 3; p++) {
      const q = holInputQueues[p];
      if (q.length > 0) {
        heads.push({ portNum: p, packet: q[0] });
      }
    }

    if (heads.length === 0) {
      setHolStepLog((prev) => ({
        ...prev,
        explanation: '目前所有輸入埠口佇列均已空，沒有可以傳輸的 IP 封包！',
      }));
      return;
    }

    // 2. Determine target output distribution and contention
    // Key is target output (1, 2, or 3), value is list of competing header items
    const outputDemand: Record<number, { portNum: number; packet: HOLPacket }[]> = { 1: [], 2: [], 3: [] };
    heads.forEach((item) => {
      outputDemand[item.packet.targetOutput].push(item);
    });

    const movedIds: string[] = [];
    const movedNames: string[] = [];
    const blockedNames: string[] = [];
    let conflictText = '';

    const nextQueues = { ...holInputQueues };

    // Process output channels
    for (let out = 1; out <= 3; out++) {
      const competitors = outputDemand[out];
      if (competitors.length === 0) continue;

      if (competitors.length === 1) {
        // No contention, direct switch
        const winner = competitors[0];
        movedIds.push(winner.packet.id);
        movedNames.push(`${winner.packet.name} (Port ${winner.portNum} ➝ Output ${out})`);
        
        // Remove from its queue
        nextQueues[winner.portNum] = nextQueues[winner.portNum].slice(1);
      } else {
        // Contention! Select only ONE winner (arbitrary: first one in listing)
        const winner = competitors[0];
        movedIds.push(winner.packet.id);
        movedNames.push(`${winner.packet.name} (Port ${winner.portNum} ➝ Output ${out})`);
        
        // Remove winner from its queue
        nextQueues[winner.portNum] = nextQueues[winner.portNum].slice(1);

        // Others are blocked
        const losers = competitors.slice(1);
        losers.forEach((loser) => {
          blockedNames.push(`${loser.packet.name} (前往 Output ${out})`);
        });

        conflictText += `【輸出埠 ${out} 出現衝突】有 ${competitors.length} 個輸入頭端封包搶奪輸出 ${out} 介面。我們允許 ${winner.packet.name} 通行。`;
      }
    }

    // 3. Find if any packets behind are HOL blocked
    // For each queue that is blocked, we check if there is a second packet whose output is completely idle but can't move because first is blocked
    let holBlockedHappened = false;
    let holBlockedInfoText = '';

    for (let port = 1; port <= 3; port++) {
      const q = holInputQueues[port];
      const nextQ = nextQueues[port];
      
      // If the queue did not move (length is still same as before), its head packet was blocked!
      if (q.length > 0 && nextQ.length > 0 && q[0].id === nextQ[0].id) {
        const headPacket = q[0];
        // The second packet exists and is now stuck behind headPacket
        if (q.length > 1) {
          const secondPacket = q[1];
          const targetOfSecond = secondPacket.targetOutput;
          
          // Is targetOfSecond free? Let's check if anyone moved to targetOfSecond in this step
          // Or if targetOfSecond is unconflicted
          const isTargetOutputFreeThisStep = outputDemand[targetOfSecond].length === 0;
          if (isTargetOutputFreeThisStep) {
            holBlockedHappened = true;
            holBlockedInfoText += `【線頭阻塞 HOL 案例】Port ${port} 的第二個封包 ${secondPacket.name} 目的是 Output ${targetOfSecond}（該出口此步完全處於空閒狀態！），然而因為首位的 ${headPacket.name} 遭到阻擋，導致 ${secondPacket.name} 也被迫在後面排隊等候！`;
          }
        }
      }
    }

    setHolInputQueues(nextQueues);
    setHolStepLog((prev) => {
      const nextStep = prev.timestep + 1;
      let exp = `第 ${nextStep} 步：${movedNames.join(', ')} 成功被交換。`;
      if (blockedNames.length > 0) {
        exp += ` ${blockedNames.join(', ')} 因爭奪資源受阻。`;
      }
      if (conflictText) {
        exp += ` ` + conflictText;
      }
      if (holBlockedHappened) {
        exp += ` ` + holBlockedInfoText;
      } else if (blockedNames.length > 0) {
        exp += ` 各後排封包也因為頭端阻塞無法移向其目的地。`;
      }

      return {
        timestep: nextStep,
        moved: movedNames,
        blocked: blockedNames,
        explanation: exp,
      };
    });
  };

  // ==================== PART C: OUTPUT SERVICE SCHEDULER ====================
  const [schedulerPolicy, setSchedulerPolicy] = useState<'fifo' | 'priority' | 'rr' | 'wfq'>('wfq');
  
  // Custom Weights for WFQ
  const [wfqWeight1, setWfqWeight1] = useState<number>(3);
  const [wfqWeight2, setWfqWeight2] = useState<number>(2);
  const [wfqWeight3, setWfqWeight3] = useState<number>(1);

  // Scheduler queues corresponding to Class 1, Class 2, Class 3
  const [schedQueue1, setSchedQueue1] = useState<SchedulerPacket[]>([]);
  const [schedQueue2, setSchedQueue2] = useState<SchedulerPacket[]>([]);
  const [schedQueue3, setSchedQueue3] = useState<SchedulerPacket[]>([]);
  
  const [schedInService, setSchedInService] = useState<SchedulerPacket | null>(null);
  const [schedHistory, setSchedHistory] = useState<SchedulerPacket[]>([]);
  const [schedStepCount, setSchedStepCount] = useState<number>(0);
  const [schedLog, setSchedLog] = useState<string[]>([]);
  const [schedIdCounter, setSchedIdCounter] = useState<number>(1);

  // WFQ Work counters for current cycle
  const [wfqCycleSent1, setWfqCycleSent1] = useState<number>(0);
  const [wfqCycleSent2, setWfqCycleSent2] = useState<number>(0);
  const [wfqCycleSent3, setWfqCycleSent3] = useState<number>(0);
  const [wfqActiveTargetClass, setWfqActiveTargetClass] = useState<number>(0); // 0 = class 1, 1 = class 2, 2 = class 3

  // Simple Round Robin Turn state
  const [rrLastTurn, setRrLastTurn] = useState<number>(0); // 0 = q1, 1 = q2, 2 = q3

  // Standard Bandwidth share calculation
  const totalWeightSum = wfqWeight1 + wfqWeight2 + wfqWeight3;
  const sharePercent1 = totalWeightSum > 0 ? (wfqWeight1 / totalWeightSum) * 100 : 0;
  const sharePercent2 = totalWeightSum > 0 ? (wfqWeight2 / totalWeightSum) * 100 : 0;
  const sharePercent3 = totalWeightSum > 0 ? (wfqWeight3 / totalWeightSum) * 100 : 0;

  const handleAddSchedulerPacket = (classIdx: number) => {
    const pId = schedIdCounter;
    setSchedIdCounter(pId + 1);

    const className = classIdx === 0 ? 'Class 1' : classIdx === 1 ? 'Class 2' : 'Class 3';
    const initials = classIdx === 0 ? 'H' : classIdx === 1 ? 'M' : 'L';
    const newPacket: SchedulerPacket = {
      id: `p-sched-${pId}`,
      className,
      classIdx,
      arrivalTime: Date.now() + pId, // guarantee monotonic order
      name: `${initials}-${pId}`,
    };

    if (classIdx === 0) setSchedQueue1((prev) => [...prev, newPacket]);
    if (classIdx === 1) setSchedQueue2((prev) => [...prev, newPacket]);
    if (classIdx === 2) setSchedQueue3((prev) => [...prev, newPacket]);

    setSchedLog((prev) => [
      `[抵達] 新增封包 ${newPacket.name} 進入 ${className}.`,
      ...prev.slice(0, 8),
    ]);
  };

  const handleResetScheduler = () => {
    setSchedQueue1([]);
    setSchedQueue2([]);
    setSchedQueue3([]);
    setSchedInService(null);
    setSchedHistory([]);
    setSchedStepCount(0);
    setSchedLog(['[重設] 排程器佇列、傳輸主機、統計紀錄皆已清空！']);
    setSchedIdCounter(1);
    setWfqCycleSent1(0);
    setWfqCycleSent2(0);
    setWfqCycleSent3(0);
    setWfqActiveTargetClass(0);
    setRrLastTurn(0);
  };

  const handleStepSchedulerSimulation = () => {
    // If packet currently in service, push to history first
    if (schedInService) {
      setSchedHistory((prev) => [schedInService, ...prev].slice(0, 10));
      setSchedInService(null);
    }

    const hasQ1 = schedQueue1.length > 0;
    const hasQ2 = schedQueue2.length > 0;
    const hasQ3 = schedQueue3.length > 0;

    if (!hasQ1 && !hasQ2 && !hasQ3) {
      setSchedLog((prev) => ['[提示] 所有佇列緩衝區當前均為空，請點選「新增封包」按鈕！', ...prev]);
      return;
    }

    let selectedPacket: SchedulerPacket | null = null;
    let logMsg = '';

    // ================== POLICY: FIFO ==================
    if (schedulerPolicy === 'fifo') {
      const candidates: { packet: SchedulerPacket; qNum: number }[] = [];
      if (hasQ1) candidates.push({ packet: schedQueue1[0], qNum: 1 });
      if (hasQ2) candidates.push({ packet: schedQueue2[0], qNum: 2 });
      if (hasQ3) candidates.push({ packet: schedQueue3[0], qNum: 3 });

      // Sort by arrival time
      candidates.sort((a, b) => a.packet.arrivalTime - b.packet.arrivalTime);
      const winner = candidates[0];
      selectedPacket = winner.packet;

      if (winner.qNum === 1) setSchedQueue1((prev) => prev.slice(1));
      if (winner.qNum === 2) setSchedQueue2((prev) => prev.slice(1));
      if (winner.qNum === 3) setSchedQueue3((prev) => prev.slice(1));

      logMsg = `[FIFO 傳輸] 按抵達時序選擇了 ${selectedPacket.name} (Class ${selectedPacket.classIdx + 1})`;
    }

    // ================== POLICY: PRIORITY ==================
    else if (schedulerPolicy === 'priority') {
      if (hasQ1) {
        selectedPacket = schedQueue1[0];
        setSchedQueue1((prev) => prev.slice(1));
        logMsg = `[PRIORITY 傳輸] 偵測到 Class 1 佇列有封包，直接提取最高優先階級：${selectedPacket.name}`;
      } else if (hasQ2) {
        selectedPacket = schedQueue2[0];
        setSchedQueue2((prev) => prev.slice(1));
        logMsg = `[PRIORITY 傳輸] Class 1 佇列為空，提取中優先權 Class 2：${selectedPacket.name}`;
      } else {
        selectedPacket = schedQueue3[0];
        setSchedQueue3((prev) => prev.slice(1));
        logMsg = `[PRIORITY 傳輸] Class 1/2 阻隔均為空，提取低優先權 Class 3：${selectedPacket.name}`;
      }
    }

    // ================== POLICY: ROUND ROBIN ==================
    else if (schedulerPolicy === 'rr') {
      // Round Robin: search starting from next queue in rotation
      let searchTurn = rrLastTurn;
      let winnerQ = -1;

      for (let i = 0; i < 3; i++) {
        const checkQ = (searchTurn + i) % 3;
        if (checkQ === 0 && hasQ1) {
          winnerQ = 0;
          break;
        } else if (checkQ === 1 && hasQ2) {
          winnerQ = 1;
          break;
        } else if (checkQ === 2 && hasQ3) {
          winnerQ = 2;
          break;
        }
      }

      if (winnerQ === 0) {
        selectedPacket = schedQueue1[0];
        setSchedQueue1((prev) => prev.slice(1));
        setRrLastTurn(1);
        logMsg = `[ROUND ROBIN 傳輸] 輪巡指向 Class 1：發送了 ${selectedPacket.name}`;
      } else if (winnerQ === 1) {
        selectedPacket = schedQueue2[0];
        setSchedQueue2((prev) => prev.slice(1));
        setRrLastTurn(2);
        logMsg = `[ROUND ROBIN 傳輸] 輪巡指向 Class 2：發送了 ${selectedPacket.name}`;
      } else if (winnerQ === 2) {
        selectedPacket = schedQueue3[0];
        setSchedQueue3((prev) => prev.slice(1));
        setRrLastTurn(0);
        logMsg = `[ROUND ROBIN 傳輸] 輪巡指向 Class 3：發送了 ${selectedPacket.name}`;
      }
    }

    // ================== POLICY: WEIGHTED FAIR QUEUEING (WFQ) ==================
    else if (schedulerPolicy === 'wfq') {
      // Robust implementation of weighted round robin based on class weights w1, w2, w3.
      // Every cycle, a class can send up to its weight.
      // Track cycle state: wfqCycleSent1/2/3 represent packets sent so far in the current cycle.
      
      let winnerIdx = -1; // 0, 1, or 2 representing Class 1, 2, or 3
      
      // Determine what is non-empty and has remaining budget in current cycle
      const canSendClass1 = hasQ1 && wfqCycleSent1 < wfqWeight1;
      const canSendClass2 = hasQ2 && wfqCycleSent2 < wfqWeight2;
      const canSendClass3 = hasQ3 && wfqCycleSent3 < wfqWeight3;

      // If all active queues with remaining budget are exhausted or there's none, we start a new cycle!
      // A cycle reset happens when (no queue has budget left, OR queues that have budget left are completely empty)
      const needCycleReset = 
        (!canSendClass1 && !canSendClass2 && !canSendClass3) || 
        ((hasQ1 && wfqCycleSent1 >= wfqWeight1) && (hasQ2 && wfqCycleSent2 >= wfqWeight2) && (hasQ3 && wfqCycleSent3 >= wfqWeight3)) ||
        // Only one active but exhausted progress
        (hasQ1 && !hasQ2 && !hasQ3 && wfqCycleSent1 >= wfqWeight1) || 
        (hasQ2 && !hasQ1 && !hasQ3 && wfqCycleSent2 >= wfqWeight2) || 
        (hasQ3 && !hasQ1 && !hasQ2 && wfqCycleSent3 >= wfqWeight3) ||
        (hasQ1 && hasQ2 && !hasQ3 && wfqCycleSent1 >= wfqWeight1 && wfqCycleSent2 >= wfqWeight2);

      let cycleResetExecuted = false;
      let effectiveSent1 = wfqCycleSent1;
      let effectiveSent2 = wfqCycleSent2;
      let effectiveSent3 = wfqCycleSent3;

      if (needCycleReset) {
        effectiveSent1 = 0;
        effectiveSent2 = 0;
        effectiveSent3 = 0;
        cycleResetExecuted = true;
      }

      // Re-evaluate eligibility with effective sent counters
      const elig1 = hasQ1 && effectiveSent1 < wfqWeight1;
      const elig2 = hasQ2 && effectiveSent2 < wfqWeight2;
      const elig3 = hasQ3 && effectiveSent3 < wfqWeight3;

      // Follow priorities: send Class 1 till weight limit, then Class 2, then Class 3
      if (elig1) {
        winnerIdx = 0;
      } else if (elig2) {
        winnerIdx = 1;
      } else if (elig3) {
        winnerIdx = 2;
      } else {
        // Fallback fallback if weights or queues are messy
        if (hasQ1) winnerIdx = 0;
        else if (hasQ2) winnerIdx = 1;
        else if (hasQ3) winnerIdx = 2;
      }

      if (winnerIdx === 0 && hasQ1) {
        selectedPacket = schedQueue1[0];
        setSchedQueue1((prev) => prev.slice(1));
        const nextSent = cycleResetExecuted ? 1 : wfqCycleSent1 + 1;
        setWfqCycleSent1(nextSent);
        if (cycleResetExecuted) {
          setWfqCycleSent2(0);
          setWfqCycleSent3(0);
        }
        logMsg = `[WFQ 權重分配] Class 1 設有權重 w1=${wfqWeight1}，此週期已發送 ${nextSent}/${wfqWeight1}。發送：${selectedPacket.name}`;
      } else if (winnerIdx === 1 && hasQ2) {
        selectedPacket = schedQueue2[0];
        setSchedQueue2((prev) => prev.slice(1));
        const nextSent = cycleResetExecuted ? 1 : wfqCycleSent2 + 1;
        setWfqCycleSent2(nextSent);
        if (cycleResetExecuted) {
          setWfqCycleSent1(0);
          setWfqCycleSent3(0);
        }
        logMsg = `[WFQ 權重分配] Class 2 設有權重 w2=${wfqWeight2}，此週期已發送 ${nextSent}/${wfqWeight2}。發送：${selectedPacket.name}`;
      } else if (winnerIdx === 2 && hasQ3) {
        selectedPacket = schedQueue3[0];
        setSchedQueue3((prev) => prev.slice(1));
        const nextSent = cycleResetExecuted ? 1 : wfqCycleSent3 + 1;
        setWfqCycleSent3(nextSent);
        if (cycleResetExecuted) {
          setWfqCycleSent1(0);
          setWfqCycleSent2(0);
        }
        logMsg = `[WFQ 權重分配] Class 3 設有權重 w3=${wfqWeight3}，此週期已發送 ${nextSent}/${wfqWeight3}。發送：${selectedPacket.name}`;
      }
    }

    if (selectedPacket) {
      setSchedInService(selectedPacket);
      setSchedStepCount((prev) => prev + 1);
      setSchedLog((prev) => [logMsg, ...prev.slice(0, 8)]);
    }
  };

  // Preview / Determine which packet will be picked NEXT
  const getNextSelectedPreviewText = (): string => {
    const hasQ1 = schedQueue1.length > 0;
    const hasQ2 = schedQueue2.length > 0;
    const hasQ3 = schedQueue3.length > 0;

    if (!hasQ1 && !hasQ2 && !hasQ3) return '暫無封包';

    if (schedulerPolicy === 'fifo') {
      const candidates: { name: string; time: number }[] = [];
      if (hasQ1) candidates.push({ name: schedQueue1[0].name, time: schedQueue1[0].arrivalTime });
      if (hasQ2) candidates.push({ name: schedQueue2[0].name, time: schedQueue2[0].arrivalTime });
      if (hasQ3) candidates.push({ name: schedQueue3[0].name, time: schedQueue3[0].arrivalTime });
      candidates.sort((a, b) => a.time - b.time);
      return candidates[0].name;
    }

    if (schedulerPolicy === 'priority') {
      if (hasQ1) return schedQueue1[0].name;
      if (hasQ2) return schedQueue2[0].name;
      return schedQueue3[0].name;
    }

    if (schedulerPolicy === 'rr') {
      for (let i = 0; i < 3; i++) {
        const checkQ = (rrLastTurn + i) % 3;
        if (checkQ === 0 && hasQ1) return schedQueue1[0].name;
        if (checkQ === 1 && hasQ2) return schedQueue2[0].name;
        if (checkQ === 2 && hasQ3) return schedQueue3[0].name;
      }
    }

    if (schedulerPolicy === 'wfq') {
      const can1 = hasQ1 && wfqCycleSent1 < wfqWeight1;
      const can2 = hasQ2 && wfqCycleSent2 < wfqWeight2;
      const can3 = hasQ3 && wfqCycleSent3 < wfqWeight3;

      const needReset = (!can1 && !can2 && !can3) || 
        ((hasQ1 && wfqCycleSent1 >= wfqWeight1) && (hasQ2 && wfqCycleSent2 >= wfqWeight2) && (hasQ3 && wfqCycleSent3 >= wfqWeight3)) ||
        (hasQ1 && !hasQ2 && !hasQ3 && wfqCycleSent1 >= wfqWeight1) ||
        (hasQ2 && !hasQ1 && !hasQ3 && wfqCycleSent2 >= wfqWeight2) ||
        (hasQ3 && !hasQ1 && !hasQ2 && wfqCycleSent3 >= wfqWeight3);

      const sSent1 = needReset ? 0 : wfqCycleSent1;
      const sSent2 = needReset ? 0 : wfqCycleSent2;
      const sSent3 = needReset ? 0 : wfqCycleSent3;

      if (hasQ1 && sSent1 < wfqWeight1) return schedQueue1[0].name;
      if (hasQ2 && sSent2 < wfqWeight2) return schedQueue2[0].name;
      if (hasQ3 && sSent3 < wfqWeight3) return schedQueue3[0].name;

      if (hasQ1) return schedQueue1[0].name;
      if (hasQ2) return schedQueue2[0].name;
      if (hasQ3) return schedQueue3[0].name;
    }

    return '未匹配';
  };

  const nextSelectedName = getNextSelectedPreviewText();

  // ==================== PART D: CONCEPTUAL QUIZ ====================
  const [selectedQuizIdx, setSelectedQuizIdx] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<{ answered: number; correct: number }>({ answered: 0, correct: 0 });
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [answeredHistory, setAnsweredHistory] = useState<Record<number, number>>({});

  const handleSelectQuizOption = (optionIdx: number) => {
    if (selectedQuizIdx !== null) return; // already selected
    setSelectedQuizIdx(optionIdx);

    const question = SCHEDULING_QUIZ[quizIndex];
    const isCorrect = optionIdx === question.correctIndex;

    setAnsweredHistory((prev) => ({ ...prev, [question.id]: optionIdx }));
    setQuizScore((prev) => ({
      answered: prev.answered + 1,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
    }));
  };

  const handleNextQuizQuestion = () => {
    if (quizIndex < SCHEDULING_QUIZ.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setSelectedQuizIdx(null);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestartQuiz = () => {
    setQuizIndex(0);
    setSelectedQuizIdx(null);
    setQuizScore({ answered: 0, correct: 0 });
    setQuizCompleted(false);
    setAnsweredHistory({});
  };

  return (
    <div id="queue-schedule-playground-suite" className="space-y-10">
      
      {/* Tab select Header */}
      <div className="flex bg-slate-100 p-1 rounded-2xl max-w-2xl mx-auto border border-slate-200">
        <button
          onClick={() => setActiveSubTab('fabric')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 ${
            activeSubTab === 'fabric' ? 'bg-white text-indigo-755 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>A. 交換結構分析</span>
        </button>
        <button
          onClick={() => setActiveSubTab('hol')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 ${
            activeSubTab === 'hol' ? 'bg-white text-indigo-755 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span className="relative">
            B. HOL 阻塞模擬
            <span className="absolute -top-1.5 -right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('scheduling')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 ${
            activeSubTab === 'scheduling' ? 'bg-white text-indigo-755 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>C. 輸出排程實驗</span>
        </button>
      </div>

      {/* ========================================================== */}
      {/* ==================== PART A: FABRICS ==================== */}
      {/* ========================================================== */}
      {activeSubTab === 'fabric' && (
        <div className="space-y-8 animate-fade-in text-left">
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-xs space-y-4">
            <div className="space-y-1">
              <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-705 font-bold font-mono text-[10px] rounded tracking-wider uppercase">
                資料平面微核心 (Switching Fabrics)
              </span>
              <h3 className="text-xl font-black text-slate-800">
                路由器核心：三大主流「交換結構」對抗論 (Anatomy of Switching Fabric Designs)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                交換結構（Switching Fabric）是真正運送封包的晶片大動脈。以下提供三種由簡入繁的實體硬體設計，請點選切換以查閱其技術瓶頸：
              </p>
            </div>

            {/* Quick selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
              {[
                { id: 'memory', name: '經由記憶體交換 (Memory)', sub: '傳統初階軟體式' },
                { id: 'bus', name: '經由匯流排交換 (Bus)', sub: '經典單通道共享' },
                { id: 'interconnection', name: '互連網路/縱橫式 (Network)', sub: '現代多軌高速並行' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFabric(f.id as any)}
                  className={`p-4 border text-left rounded-2xl transition-all cursor-pointer ${
                    selectedFabric === f.id
                      ? 'border-indigo-600 bg-indigo-50/10 shadow-sm shadow-indigo-100 ring-2 ring-indigo-600/10'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-black text-slate-800 block">{f.name}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{f.sub}</span>
                </button>
              ))}
            </div>

            {/* Selected Info display in a nice polished Card layout */}
            <div className="border border-slate-200 rounded-2xl p-5 md:p-6 bg-gradient-to-tr from-slate-50/30 to-white grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              <div className="md:col-span-7 space-y-4">
                {selectedFabric === 'memory' && (
                  <>
                    <h4 className="text-sm font-black text-indigo-755 inline-flex bg-indigo-50 border border-indigo-150 rounded px-2.5 py-1">
                      1. 經由記憶體交換 (Switching via Memory)
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <b>運作機理：</b>封包抵達輸入埠後，透過中斷（Interrupt）向中央處理器（CPU）示警。CPU 將封包拷貝入主系統記憶體，解析標頭 LPM 之後，重新經由匯流排複製搬移至指定輸出埠。
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-red-50/50 border border-red-150 p-2.5 rounded-xl">
                        <span className="text-[10px] font-black text-red-700 block uppercase">致命瓶頸</span>
                        <span className="text-[11px] text-slate-650 font-normal mt-0.5 block leading-normal">
                          其吞吐量受限於系統記憶體頻寬。每個封包必須<b>跨越匯流排兩次</b>（一次寫入、一次讀取），最高速亦無法超過系統總記憶體寫讀速度之一半。
                        </span>
                      </div>
                      <div className="bg-emerald-50/50 border border-emerald-150 p-2.5 rounded-xl">
                        <span className="text-[10px] font-black text-emerald-700 block uppercase">優缺點對照</span>
                        <span className="text-[11px] text-slate-650 font-normal mt-0.5 block leading-normal">
                          🟢 <b>優點：</b>架構極度簡單，僅透過軟體程式控制，成本最低廉。<br/>
                          🔴 <b>缺點：</b>速度極慢、極易產生硬體中斷塞車，不適用於現代高速骨幹。
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {selectedFabric === 'bus' && (
                  <>
                    <h4 className="text-sm font-black text-indigo-755 inline-flex bg-indigo-50 border border-indigo-150 rounded px-2.5 py-1">
                      2. 經由匯流排交換 (Switching via Bus)
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <b>運作機理：</b>輸入埠透過一條公用<b>高速內部匯流排 (Shared Bus)</b>與所有的輸出埠直接連通。當封包匹配完成，直接在匯流排打上輸出埠專屬 Token 頭，各輸出埠在 Bus 上監聽並抓取。不需要系統 CPU 拷貝過渡。
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-red-50/50 border border-red-150 p-2.5 rounded-xl">
                        <span className="text-[10px] font-black text-red-700 block uppercase">致命瓶頸</span>
                        <span className="text-[11px] text-slate-650 font-normal mt-0.5 block leading-normal">
                          <b>匯流排衝突 (Bus Contention)</b>。因為媒介共享，一次只准「一個」封包跨越匯流排。有多個封包同時想走，其餘的人必須退避排隊，總傳播速率天花板受限於一根 Bus 的物理最高頻寬。
                        </span>
                      </div>
                      <div className="bg-emerald-50/50 border border-emerald-150 p-2.5 rounded-xl">
                        <span className="text-[10px] font-black text-emerald-700 block uppercase">優缺點對照</span>
                        <span className="text-[11px] text-slate-650 font-normal mt-0.5 block leading-normal">
                          🟢 <b>優點：</b>無須中央 CPU 干預，效能比記憶體拷貝高出一個數量級（適用於中階企業路由器）。<br/>
                          🔴 <b>缺點：</b>無法跨界超大頻寬（例如一萬個萬兆口需求）。
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {selectedFabric === 'interconnection' && (
                  <>
                    <h4 className="text-sm font-black text-indigo-755 inline-flex bg-indigo-50 border border-indigo-150 rounded px-2.5 py-1">
                      3. 互連網路 / 縱橫交換晶片 (Switching via Interconnection Network)
                    </h4>
                    <p className="text-xs text-slate-605 leading-relaxed">
                      <b>運作機理：</b>這是一種 2D 或 3D 棋盤格子型的 <b>縱橫交換器 (Crossbar Switch)</b>。由 N 條水平線與 N 條垂直線在交點安置高靈敏微電子開關。多條通道完全並行導通，當 Input 1 走 A 線去 Output 2 時，Input 2 仍可走 B 線去 Output 3！
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-red-50/50 border border-red-150 p-2.5 rounded-xl">
                        <span className="text-[10px] font-black text-red-700 block uppercase">致命瓶頸</span>
                        <span className="text-[11px] text-slate-650 font-normal mt-0.5 block leading-normal">
                          雖然內部網路是非阻塞（Non-blocking）的，但如果複數個輸入埠的頭端封包<b>目的地正是「同一個」輸出埠</b>，在出入口仍有聚集衝突，引發 HOL 阻塞。
                        </span>
                      </div>
                      <div className="bg-emerald-50/50 border border-emerald-150 p-2.5 rounded-xl">
                        <span className="text-[10px] font-black text-emerald-700 block uppercase">優缺點對照</span>
                        <span className="text-[11px] text-slate-650 font-normal mt-0.5 block leading-normal">
                          🟢 <b>優點：</b>多通道無阻極限發送，頻寬直指數十 Tbps，是核心骨幹骨灰級之選。<br/>
                          🔴 <b>缺點：</b>交換矩陣研發製造昂貴，控制邏輯與排程器硬體設計極繁。
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Graphical Visual Diagram Panel */}
              <div className="md:col-span-5 border border-slate-200 rounded-2xl bg-slate-900 p-5 h-[230px] flex flex-col justify-between text-white relative overflow-hidden font-mono">
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl" />
                <span className="text-[9px] uppercase font-bold text-slate-400">實體硬體拓撲示意</span>
                
                {selectedFabric === 'memory' && (
                  <div className="flex flex-col items-center justify-center gap-2 flex-grow">
                    <div className="flex items-center gap-5 text-xs">
                      <div className="px-2 py-1 bg-blue-650 opacity-90 rounded border text-[9px]">輸入埠</div>
                      <ArrowRight className="w-3.5 h-3.5 text-red-400 rotate-90 animate-bounce" />
                      <div className="px-2.5 py-1.5 bg-slate-800 border-2 border-red-500 text-center rounded flex flex-col items-center">
                        <span className="text-[8px] opacity-70">CPU/MEM</span>
                        <span className="text-[9px] font-bold">LPM 計算 (慢)</span>
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-450 italic max-w-[150px] text-center mt-2">
                       拷貝1 ➝ 計算 ➝ 拷貝2 (嚴重牽制總線)
                    </div>
                  </div>
                )}

                {selectedFabric === 'bus' && (
                  <div className="flex flex-col justify-center gap-3 flex-grow p-2">
                    <div className="grid grid-cols-3 gap-2 text-[9px] text-center">
                      <div className="p-1 bg-indigo-900 border rounded">輸入 A</div>
                      <div className="p-1 bg-indigo-900 border rounded">輸入 B</div>
                      <div className="p-1 bg-indigo-900 border rounded">輸入 C</div>
                    </div>
                    {/* Common Bus Line */}
                    <div className="h-2 bg-gradient-to-r from-red-500 to-indigo-500 rounded relative">
                      <div className="w-1.5 h-1.5 bg-white rounded-full absolute left-1/3 animate-ping" />
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[7px] text-slate-300">共享單軌 BUS</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[9px] text-center">
                      <div className="p-1 bg-slate-800 border rounded">輸出 1</div>
                      <div className="p-1 bg-slate-800 border rounded">輸出 2</div>
                      <div className="p-1 bg-slate-800 border rounded">輸出 3</div>
                    </div>
                  </div>
                )}

                {selectedFabric === 'interconnection' && (
                  <div className="flex flex-col items-center justify-center gap-2 flex-grow scale-95">
                    {/* Crossbar Switch 3x3 Grid */}
                    <div className="grid grid-cols-3 gap-y-3 gap-x-6 relative">
                      <div className="absolute inset-0 border-t-2 border-b-2 border-slate-700/60 flex flex-col justify-between" />
                      
                      {[1, 2, 3].map((r) =>
                        [1, 2, 3].map((c) => {
                          const isActiveIntersection = (r === 1 && c === 2) || (r === 2 && c === 3);
                          return (
                            <div
                              key={`${r}-${c}`}
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[7px] font-bold ${
                                isActiveIntersection
                                  ? 'bg-amber-500 border-amber-400 text-slate-900 shadow-sm animate-pulse'
                                  : 'bg-slate-800 border-slate-700 text-slate-500'
                              }`}
                            >
                              +
                            </div>
                          );
                        })
                      )}
                    </div>
                    <span className="text-[8px] text-slate-400 text-center mt-2 italic">
                      多交叉節點同時連通：獨立軌道不干涉
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[8px] text-slate-500">
                  <span>MODEL_FABRIC_TOP v4</span>
                  <span>INTERACTIVE COMPONENT</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* ========== PART B: HOL BLOCKING & INPUT QUEUEING ========== */}
      {/* ========================================================== */}
      {activeSubTab === 'hol' && (
        <div className="space-y-8 animate-fade-in text-left">
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
            <div className="space-y-1">
              <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-705 font-bold font-mono text-[10px] rounded tracking-wider uppercase">
                線頭阻塞模擬器 (HOL Simulation Core)
              </span>
              <h3 className="text-xl font-black text-slate-800">
                輸入佇列衝突與 HOL 阻塞實體推演面板 (Input Queueing & HOL Blocking Tracer)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                <b>什麼是 HOL (Head-of-the-Line) 阻塞？</b> 
                當兩個排在第一名的封包要去「同一個偏好出口」（輸出埠），由於交換網路衝突，只有一個能走，另一個被迫塞在原地。
                此時排在被堵塞封包後面、<b>原本要去完全空閒出口的那些無辜封包</b>也因此完全無法前進！
              </p>
            </div>

            {/* Simulated Live Grid Board */}
            <div className="border border-slate-250 rounded-3xl p-6 md:p-8 bg-slate-50 relative space-y-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/5 to-transparent pointer-events-none" />

              {/* State bar */}
              <div className="flex justify-between items-center text-xs font-mono font-bold bg-white px-4 py-2 bg-white/70 border border-slate-150 rounded-xl">
                <span className="text-slate-550">當前模擬時脈 (Sim Timestep): <span className="text-blue-600">Step {holStepLog.timestep}</span></span>
                <span className="text-[10px] text-slate-400 uppercase">Input-Port Queueing / Crossbar Logic</span>
              </div>

              {/* Core 3x3 Simulation Track Layout */}
              <div className="grid grid-cols-12 gap-y-6 gap-x-4 items-stretch relative">
                
                {/* 1. Left hand side: INPUT PORTS + QUEUES */}
                <div className="col-span-12 md:col-span-5 flex flex-col gap-6 justify-between">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                      📥 輸入埠口佇列 (Input Ports - Queued Bitstreams)
                    </span>
                    <p className="text-[9px] text-slate-400 mb-4 italic">點選 + 按鈕可新增 IP 封包並指派其偏好去向</p>
                  </div>

                  {[1, 2, 3].map((portNum) => {
                    const queue = holInputQueues[portNum] || [];
                    const portLetter = portNum === 1 ? 'A' : portNum === 2 ? 'B' : 'C';

                    return (
                      <div key={portNum} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 relative">
                        {/* Port title and add control */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            輸入埠 {portNum} (Input 0{portNum})
                          </span>
                          
                          {/* Speed button selectors to append packets */}
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] text-slate-400 font-bold uppercase mr-1">ADD TARGET STAG:</span>
                            {[1, 2, 3].map((dest) => (
                              <button
                                key={dest}
                                onClick={() => handleAddHolPacket(portNum, dest)}
                                className={`w-5 h-5 rounded text-[9px] hover:scale-102 flex items-center justify-center font-black cursor-pointer shadow-xs border ${
                                  dest === 1
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                                    : dest === 2
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                    : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                }`}
                                title={`新增一往 輸出 ${dest} 封包`}
                              >
                                {dest}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Queued Packet Cards */}
                        <div className="min-h-[50px] border border-dashed border-slate-150 rounded-xl flex items-center gap-2 px-3 bg-slate-50/50 relative overflow-x-auto">
                          <AnimatePresence>
                            {queue.length === 0 ? (
                              <span className="text-[10px] text-slate-400/80 italic py-3 mx-auto">佇列目前為空</span>
                            ) : (
                              queue.map((p, idx) => {
                                const isHOL = idx === 0;
                                // Is this second packet HOL blocked?
                                // Let's check: if we have more than 1 packet, second wants dest, and dest matches a free output not claimed by headers.
                                // We can show a visual red exclamation if HOL conditions match.
                                const isHOLBlockedPreview = !isHOL && isWinnerOfDestBlocked(p, queue[0], holInputQueues);

                                return (
                                  <motion.div
                                    key={p.id}
                                    initial={{ scale: 0.8, opacity: 0, x: -10 }}
                                    animate={{ scale: 1, opacity: 1, x: 0 }}
                                    exit={{ scale: 0.8, opacity: 0, x: 10 }}
                                    className={`w-14 h-9 border rounded-lg flex flex-col justify-center items-center shrink-0 relative ${p.colorTheme} text-center select-none`}
                                  >
                                    <span className="text-[9px] font-black">{p.name}</span>
                                    <span className="text-[7px] scale-90 font-mono opacity-80">
                                      {isHOL ? '首端 (HOL)' : `往 Out ${p.targetOutput}`}
                                    </span>

                                    {/* HOL Warning Badge representation */}
                                    {isHOLBlockedPreview && (
                                      <span className="absolute -top-1.5 -right-1 flex h-3.5 w-3.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600 text-[8px] font-black text-white items-center justify-center shadow-xs" title="HOL 受累塞車！後續目的地完全空檔卻無法前進！">
                                          !
                                        </span>
                                      </span>
                                    )}
                                  </motion.div>
                                );
                              })
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Middle Column: SWITCHING FABRIC PATH LINES */}
                <div className="col-span-12 md:col-span-3 flex flex-col items-center justify-center bg-slate-900 rounded-3xl p-4 text-white relative min-h-[220px] shadow-md border border-slate-850 font-mono text-center">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider mb-2">縱橫切換晶片 (Fabric)</span>
                  
                  {/* Miniature Crossbar display dots */}
                  <div className="grid grid-cols-3 gap-x-4 gap-y-4 my-2 relative">
                    {[1, 2, 3].map((r) =>
                      [1, 2, 3].map((c) => {
                        // Is this dynamic path highlighted?
                        // Let's check heads output preference.
                        const activePath = 
                          (r === 1 && holInputQueues[1]?.[0]?.targetOutput === c) ||
                          (r === 2 && holInputQueues[2]?.[0]?.targetOutput === c) ||
                          (r === 3 && holInputQueues[3]?.[0]?.targetOutput === c);

                        return (
                          <div
                            key={`${r}-${c}`}
                            className={`w-2 h-2 rounded-full border transition-all duration-300 ${
                              activePath
                                ? 'bg-amber-500 border-amber-400 ring-2 ring-amber-500/40 scale-110'
                                : 'bg-slate-800 border-slate-700'
                            }`}
                            title={`交接軌 Input ${r} - Output ${c}`}
                          />
                        );
                      })
                    )}
                  </div>

                  <span className="text-[8px] text-zinc-500 max-w-[120px] block mt-1">
                    橘色晶點：首端封包請求建立的內部導通線路
                  </span>
                </div>

                {/* 3. Right hand side: OUTPUT PORTS */}
                <div className="col-span-12 md:col-span-4 flex flex-col gap-6 justify-between">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                      📤 目的輸出埠口 (Output Ports - Receivers)
                    </span>
                    <p className="text-[9px] text-slate-400 mb-4 italic">每個物理時脈，一個輸出通道僅能拉取導通單一封包</p>
                  </div>

                  {[1, 2, 3].map((outNum) => {
                    // Check if multiple inputs are targeting this outNum
                    const competitors = Object.keys(holInputQueues).filter(
                      (port) => holInputQueues[Number(port)]?.[0]?.targetOutput === outNum
                    );
                    const conflict = competitors.length > 1;

                    return (
                      <div
                        key={outNum}
                        className={`p-3 border-2 rounded-2xl flex flex-col justify-center min-h-[90px] text-left transition-all duration-300 ${
                          conflict
                            ? 'border-red-500 bg-red-50/20'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${outNum === 1 ? 'bg-indigo-500' : outNum === 2 ? 'bg-emerald-500' : 'bg-amber-550'}`} />
                            輸出 0{outNum} (Output 0{outNum})
                          </span>
                          {conflict && (
                            <span className="px-1.5 py-0.5 bg-red-500 text-white font-black text-[8px] uppercase rounded animate-pulse">
                              資源競爭 (Contention!)
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-500 font-normal leading-relaxed mb-2">
                          {outNum === 1 && '對接光纖主鏈路 1 (w=3)'}
                          {outNum === 2 && '對接乙太分鏈路 2 (w=2)'}
                          {outNum === 3 && '對接預設通網 3 (w=1)'}
                        </p>
                        
                        {/* Summary of what inputs are competing */}
                        {competitors.length > 0 ? (
                          <div className="text-[9px] font-mono text-slate-650 flex flex-wrap items-center gap-1">
                            <span>排隊端需求：</span>
                            {competitors.map((c) => {
                              const pName = holInputQueues[Number(c)]?.[0]?.name;
                              return (
                                <span key={c} className="bg-slate-100 border text-slate-700 px-1 rounded">
                                  Port {c} ({pName})
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400 italic">此埠目前無任何通道請求建立</span>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Explanations Console */}
              <div className="border border-slate-200 bg-white rounded-2xl p-5 hover:border-slate-300 transition-all font-sans text-xs">
                <div className="flex items-center gap-2 mb-2 font-black text-slate-800">
                  <Server className="w-4 h-4 text-blue-600" />
                  <span>當前衝突排解與 HOL 診斷結果控制書面：</span>
                </div>
                <p className="text-slate-600 leading-relaxed font-normal">
                  {holStepLog.explanation}
                </p>
              </div>

              {/* Control panels */}
              <div className="flex flex-wrap items-center gap-3 justify-center">
                <button
                  id="btn-hol-step"
                  onClick={handleStepHolSimulation}
                  className="px-5 py-3 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-black text-xs shadow-xs hover:scale-101 duration-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>推進一格時脈 (Step Sim)</span>
                </button>

                <button
                  id="btn-hol-random"
                  onClick={handleRandomHolScenario}
                  className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-850 text-white font-bold text-xs border border-slate-600 shadow-xs cursor-pointer"
                >
                  <span>隨機配置情境</span>
                </button>

                <button
                  id="btn-hol-reset"
                  onClick={handleResetHolSimulator}
                  className="p-3 bg-white border border-slate-200 text-slate-500 hover:text-slate-850 rounded-xl hover:border-slate-350 shadow-xs cursor-pointer"
                  title="重置模擬"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* ==================== PART C: SCHEDULING ================== */}
      {/* ========================================================== */}
      {activeSubTab === 'scheduling' && (
        <div className="space-y-8 animate-fade-in text-left">
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
            <div className="space-y-1">
              <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-705 font-bold font-mono text-[10px] rounded tracking-wider uppercase">
                排程演算控制台 (Scheduling policies suite)
              </span>
              <h3 className="text-xl font-black text-slate-800">
                輸出佇列調度與服務品質 (Output Queue Scheduling & QoS Playground)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                在輸出緩衝區溢滿擁塞時，<b>排程器 (Packet Scheduler)</b> 將決定誰獲得下一個被送上傳輸介面的特權。
                底下支持四種經典排程策略。您可以手動調配 WFQ 權重分配比並實況推算頻寬分攤：
              </p>
            </div>

            {/* Policy pickers */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {[
                { id: 'wfq', name: '加權公平佇列 (WFQ)', desc: '按自訂權重比例輪流，不會令底端流挨死。' },
                { id: 'priority', name: '絕對優先權 (Priority)', desc: '先掏空 Class 1，次掏 Class 2，後 Class 3。' },
                { id: 'rr', name: '公平輪詢 (Round Robin)', desc: '不計權重，在 1、2、3 佇列之間平均巡檢發送。' },
                { id: 'fifo', name: '先進先出 (FCFS/FIFO)', desc: '不計優先級，純粹按封包歷史抵達先後順序。' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSchedulerPolicy(p.id as any);
                    // Reset work stats on shuffle
                    setWfqCycleSent1(0);
                    setWfqCycleSent2(0);
                    setWfqCycleSent3(0);
                  }}
                  className={`p-3.5 border text-left rounded-2xl transition-all cursor-pointer ${
                    schedulerPolicy === p.id
                      ? 'border-indigo-600 bg-indigo-50/10 shadow-sm ring-2 ring-indigo-600/10'
                      : 'border-slate-180 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-black text-slate-800 block">{p.name}</span>
                  <span className="text-[10px] text-slate-500 leading-normal block mt-1">{p.desc}</span>
                </button>
              ))}
            </div>

            {/* WFQ weight adjustment sliders (only shown if policy === 'wfq') */}
            <AnimatePresence>
              {schedulerPolicy === 'wfq' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-5 border border-amber-200 bg-amber-50/30 rounded-2xl overflow-hidden text-xs my-1 text-left space-y-4"
                >
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <Sliders className="w-4 h-4 shrink-0" />
                    <span>加權公平佇列 (WFQ) 權重調配 (Weighted Allocation Sliders)</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Class 1 Weight slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-slate-700 font-semibold">
                        <span>Class 1 佇列權重 (w1)：</span>
                        <span className="font-mono font-bold text-red-650">{wfqWeight1}</span>
                      </div>
                      <input
                        type="range"
                        id="weight-class-1"
                        min="1"
                        max="5"
                        value={wfqWeight1}
                        onChange={(e) => {
                          setWfqWeight1(Number(e.target.value));
                          setWfqCycleSent1(0);
                        }}
                        className="w-full accent-red-500"
                      />
                      <span className="text-[9px] text-slate-400 block font-bold leading-normal">
                        預期獨佔頻寬：{sharePercent1.toFixed(1)}% ({wfqWeight1}/{totalWeightSum})
                      </span>
                    </div>

                    {/* Class 2 Weight slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-slate-700 font-semibold">
                        <span>Class 2 佇列權重 (w2)：</span>
                        <span className="font-mono font-bold text-emerald-650">{wfqWeight2}</span>
                      </div>
                      <input
                        type="range"
                        id="weight-class-2"
                        min="1"
                        max="5"
                        value={wfqWeight2}
                        onChange={(e) => {
                          setWfqWeight2(Number(e.target.value));
                          setWfqCycleSent2(0);
                        }}
                        className="w-full accent-emerald-500"
                      />
                      <span className="text-[9px] text-slate-400 block font-bold leading-normal">
                        預期獨佔頻寬：{sharePercent2.toFixed(1)}% ({wfqWeight2}/{totalWeightSum})
                      </span>
                    </div>

                    {/* Class 3 Weight slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-slate-700 font-semibold">
                        <span>Class 3 佇列權重 (w3)：</span>
                        <span className="font-mono font-bold text-blue-650">{wfqWeight3}</span>
                      </div>
                      <input
                        type="range"
                        id="weight-class-3"
                        min="1"
                        max="5"
                        value={wfqWeight3}
                        onChange={(e) => {
                          setWfqWeight3(Number(e.target.value));
                          setWfqCycleSent3(0);
                        }}
                        className="w-full accent-blue-500"
                      />
                      <span className="text-[9px] text-slate-400 block font-bold leading-normal">
                        預期獨佔頻寬：{sharePercent3.toFixed(1)}% ({wfqWeight3}/{totalWeightSum})
                      </span>
                    </div>
                  </div>

                  {/* Visual formula preview bar */}
                  <div className="pt-2 border-t border-amber-100 flex items-center gap-3">
                    <span className="text-[10px] text-amber-800 font-black tracking-wider uppercase">
                      動態頻寬分攤條 (Bandwidth Share Bar)：
                    </span>
                    <div className="flex-grow h-4 bg-slate-200 rounded-full overflow-hidden flex font-mono text-[9px] text-white font-bold select-none text-center">
                      <div className="bg-red-500 h-full flex items-center justify-center transition-all duration-300" style={{ width: `${sharePercent1}%` }}>
                        {sharePercent1 > 10 && `C1: ${sharePercent1.toFixed(0)}%`}
                      </div>
                      <div className="bg-emerald-555 h-full flex items-center justify-center transition-all duration-300" style={{ width: `${sharePercent2}%` }}>
                        {sharePercent2 > 10 && `C2: ${sharePercent2.toFixed(0)}%`}
                      </div>
                      <div className="bg-blue-500 h-full flex items-center justify-center transition-all duration-300" style={{ width: `${sharePercent3}%` }}>
                        {sharePercent3 > 10 && `C3: ${sharePercent3.toFixed(0)}%`}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Interactive Scheduler Core Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Queues container */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                
                {/* 1. Queue 1 */}
                <div className="border border-dashed border-red-200 rounded-2xl p-4 bg-red-50/5 relative text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-red-650 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Class 1 (高優先權 {schedulerPolicy === 'wfq' && ` / WFQ 權重: ${wfqWeight1}`})
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">目前封包數：{schedQueue1.length}</span>
                  </div>

                  <div className="h-14 flex items-center gap-2 bg-slate-50 border border-slate-150 rounded-xl px-3 overflow-x-auto relative shadow-inner">
                    <AnimatePresence>
                      {schedQueue1.length === 0 ? (
                        <span className="text-[10px] text-slate-400/80 italic my-3 mx-auto">無待送封包</span>
                      ) : (
                        schedQueue1.map((p, idx) => {
                          const isNext = nextSelectedName === p.name;
                          return (
                            <motion.div
                              key={p.id}
                              initial={{ scale: 0.6, opacity: 0, x: -10 }}
                              animate={{ scale: 1, opacity: 1, x: 0 }}
                              exit={{ scale: 0.6, opacity: 0, x: 10 }}
                              className={`w-12 h-9 rounded-lg bg-red-500 text-white flex flex-col items-center justify-center font-mono text-xs font-bold shadow-md shadow-red-100 shrink-0 relative border ${
                                isNext ? 'ring-4 ring-orange-400 border-white scale-102 font-black' : 'border-red-600'
                              }`}
                            >
                              <span>{p.name}</span>
                              {isNext && <span className="absolute -top-1.5 -right-1 bg-amber-500 text-[6px] shrink-0 text-white px-0.5 rounded uppercase leading-none font-bold">NEXT</span>}
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* 2. Queue 2 */}
                <div className="border border-dashed border-emerald-200 rounded-2xl p-4 bg-emerald-50/5 relative text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-emerald-650 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Class 2 (中優先權 {schedulerPolicy === 'wfq' && ` / WFQ 權重: ${wfqWeight2}`})
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">目前封包數：{schedQueue2.length}</span>
                  </div>

                  <div className="h-14 flex items-center gap-2 bg-slate-50 border border-slate-150 rounded-xl px-3 overflow-x-auto relative shadow-inner">
                    <AnimatePresence>
                      {schedQueue2.length === 0 ? (
                        <span className="text-[10px] text-slate-400/80 italic my-3 mx-auto">無待送封包</span>
                      ) : (
                        schedQueue2.map((p, idx) => {
                          const isNext = nextSelectedName === p.name;
                          return (
                            <motion.div
                              key={p.id}
                              initial={{ scale: 0.6, opacity: 0, x: -10 }}
                              animate={{ scale: 1, opacity: 1, x: 0 }}
                              exit={{ scale: 0.6, opacity: 0, x: 10 }}
                              className={`w-12 h-9 rounded-lg bg-emerald-500 text-white flex flex-col items-center justify-center font-mono text-xs font-bold shadow-md shadow-emerald-100 shrink-0 relative border ${
                                isNext ? 'ring-4 ring-orange-400 border-white scale-102 font-black' : 'border-emerald-600'
                              }`}
                            >
                              <span>{p.name}</span>
                              {isNext && <span className="absolute -top-1.5 -right-1 bg-amber-500 text-[6px] shrink-0 text-white px-0.5 rounded leading-none font-bold uppercase">NEXT</span>}
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* 3. Queue 3 */}
                <div className="border border-dashed border-blue-200 rounded-2xl p-4 bg-blue-50/5 relative text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-blue-600 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Class 3 (低優先權 {schedulerPolicy === 'wfq' && ` / WFQ 權重: ${wfqWeight3}`})
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">目前封包數：{schedQueue3.length}</span>
                  </div>

                  <div className="h-14 flex items-center gap-2 bg-slate-50 border border-slate-150 rounded-xl px-3 overflow-x-auto relative shadow-inner">
                    <AnimatePresence>
                      {schedQueue3.length === 0 ? (
                        <span className="text-[10px] text-slate-400/80 italic my-3 mx-auto">無待送封包</span>
                      ) : (
                        schedQueue3.map((p, idx) => {
                          const isNext = nextSelectedName === p.name;
                          return (
                            <motion.div
                              key={p.id}
                              initial={{ scale: 0.6, opacity: 0, x: -10 }}
                              animate={{ scale: 1, opacity: 1, x: 0 }}
                              exit={{ scale: 0.6, opacity: 0, x: 10 }}
                              className={`w-12 h-9 rounded-lg bg-blue-500 text-white flex flex-col items-center justify-center font-mono text-xs font-bold shadow-md shadow-blue-100 shrink-0 relative border ${
                                isNext ? 'ring-4 ring-orange-400 border-white scale-102 font-black' : 'border-blue-600'
                              }`}
                            >
                              <span>{p.name}</span>
                              {isNext && <span className="absolute -top-1.5 -right-1 bg-amber-500 text-[6px] shrink-0 text-white px-0.5 rounded leading-none font-bold uppercase font-sans">NEXT</span>}
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Insertion triggers buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    id="btn-add-class-1"
                    onClick={() => handleAddSchedulerPacket(0)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-red-700 bg-red-105 hover:bg-red-200 border border-red-200 rounded-xl cursor-pointer shadow-xs duration-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>加塞 Class 1</span>
                  </button>
                  <button
                    id="btn-add-class-2"
                    onClick={() => handleAddSchedulerPacket(1)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 border border-emerald-200 rounded-xl cursor-pointer shadow-xs duration-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>加塞 Class 2</span>
                  </button>
                  <button
                    id="btn-add-class-3"
                    onClick={() => handleAddSchedulerPacket(2)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-200 rounded-xl cursor-pointer shadow-xs duration-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>加塞 Class 3</span>
                  </button>
                </div>

              </div>

              {/* Server lane in Service view */}
              <div className="lg:col-span-4 border border-slate-200 rounded-2xl p-5 bg-slate-50 flex flex-col justify-between text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent pointer-events-none" />
                
                <div className="space-y-4 flex-grow flex flex-col">
                  <div>
                    <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">
                      傳輸通道實時服務端 (Server Line Status)
                    </span>
                    <h5 className="text-[11px] font-bold text-slate-700 mt-1">目前正在發送封包 (In Service)</h5>
                  </div>

                  <div className="border border-dashed border-slate-300 rounded-2xl bg-white p-4 flex items-center justify-center min-h-[70px] shadow-inner my-auto">
                    {schedInService ? (
                      <motion.div
                        key={schedInService.id}
                        layoutId="service-sched-p"
                        className={`px-4 py-2.5 rounded-xl text-white font-mono text-sm font-black shadow-md flex items-center gap-1.5 ${
                          schedInService.classIdx === 0
                            ? 'bg-red-500 shadow-red-200'
                            : schedInService.classIdx === 1
                            ? 'bg-emerald-500 shadow-emerald-200'
                            : 'bg-blue-500 shadow-blue-200'
                        }`}
                      >
                        <span>{schedInService.name}</span>
                        <span className="text-[9px] px-1 bg-black/20 rounded font-normal font-sans">發送中</span>
                      </motion.div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">傳輸線閒置中，等待下一班 IP</span>
                    )}
                  </div>

                  {/* Details statistics */}
                  <div className="border border-slate-200 bg-white rounded-xl p-3 space-y-1.5 text-[10px] font-semibold text-slate-600 font-mono">
                    <div className="flex justify-between">
                      <span>已成功發送 (Total Dispatched):</span>
                      <span className="text-blue-600 font-black">{schedStepCount} 粒</span>
                    </div>
                    {schedulerPolicy === 'wfq' && (
                      <div className="space-y-1 pt-1.5 border-t border-slate-100">
                        <span className="text-[8px] text-slate-400 block uppercase font-bold tracking-wider">
                          WFQ 此周期計數 (Cycle Budget Used):
                        </span>
                        <div className="flex justify-between text-slate-500">
                          <span>Class 1: {wfqCycleSent1} / {wfqWeight1}</span>
                          <span>Class 2: {wfqCycleSent2} / {wfqWeight2}</span>
                          <span>Class 3: {wfqCycleSent3} / {wfqWeight3}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Control step bar footer */}
                <div className="flex items-center gap-2 pt-4 border-t border-slate-200 mt-4">
                  <button
                    id="btn-sched-step"
                    onClick={handleStepSchedulerSimulation}
                    className="flex-grow py-3 px-4 bg-indigo-650 hover:bg-indigo-600 text-white font-black text-xs rounded-xl shadow-xs hover:scale-101 active:scale-98 cursor-pointer duration-205 flex items-center justify-center gap-1.5"
                  >
                    <span>發送一步 (Dispatch STEP)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    id="btn-sched-reset"
                    onClick={handleResetScheduler}
                    className="p-3 bg-white border border-slate-205 text-slate-500 hover:text-slate-800 rounded-xl hover:border-slate-350 cursor-pointer shadow-xs"
                    title="重新開始"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>

            {/* Output Logs console list */}
            <div className="border border-slate-200 bg-slate-90 rounded-2xl p-5 hover:border-slate-300 transition-all text-left">
              <span className="text-[10px] uppercase font-black text-slate-400 block tracking-widest mb-2.5">
                排程發送日誌 (Dispatcher Engine Live Logs)
              </span>
              <div id="scheduler-logs-list" className="bg-slate-900 border border-slate-950 text-green-400 p-4 rounded-xl font-mono text-[11px] leading-relaxed space-y-1.5 max-h-[140px] overflow-y-auto">
                {schedLog.length === 0 ? (
                  <span className="text-slate-500 italic block">期待加塞封包並執行步進發送，事件將在此記錄。</span>
                ) : (
                  schedLog.map((log, i) => <div key={i}>{log}</div>)
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* ==================== PART D: CONCEPT QUIZ ================= */}
      {/* ========================================================== */}
      <div className="bg-slate-905 text-white bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xs text-left relative overflow-hidden" id="diagnose-quiz-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6 flex-wrap gap-4">
          <div className="space-y-1">
            <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold font-mono text-[10px] rounded tracking-wider uppercase flex items-center gap-1 w-max">
              <Award className="w-3.5 h-3.5" />
              <span>自我技術檢測 (Diagnostics)</span>
            </span>
            <h3 className="text-lg font-black text-white">
              第二單元：隊列調度與 HOL 阻塞隨堂挑戰 (Quiz Diagnostics)
            </h3>
          </div>
          <div className="px-3 py-1 bg-slate-800 border border-slate-705 rounded-xl text-xs font-mono font-bold text-slate-400">
            答題統計：{quizScore.correct} / {quizScore.answered} 題
          </div>
        </div>

        {/* Quiz game block */}
        <AnimatePresence mode="wait">
          {!quizCompleted ? (
            <motion.div
              key={quizIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 font-mono block">
                  QUESTION {quizIndex + 1} OF {SCHEDULING_QUIZ.length}
                </span>
                <p className="text-sm md:text-base font-black text-white leading-normal">
                  {SCHEDULING_QUIZ[quizIndex].question}
                </p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2.5">
                {SCHEDULING_QUIZ[quizIndex].options.map((opt, oIdx) => {
                  const qId = SCHEDULING_QUIZ[quizIndex].id;
                  const answeredOption = answeredHistory[qId];
                  const hasAnswered = answeredOption !== undefined;
                  const isUserSelection = answeredOption === oIdx;
                  const isCorrectOption = oIdx === SCHEDULING_QUIZ[quizIndex].correctIndex;

                  let borderClass = 'border-slate-800 hover:bg-slate-800 text-slate-350 bg-slate-850/50';
                  
                  if (hasAnswered) {
                    if (isCorrectOption) {
                      borderClass = 'border-emerald-700 bg-emerald-950/30 text-emerald-250 font-black';
                    } else if (isUserSelection) {
                      borderClass = 'border-rose-700 bg-rose-950/30 text-rose-250';
                    } else {
                      borderClass = 'border-slate-900 bg-slate-900/40 text-slate-500 opacity-60';
                    }
                  } else if (selectedQuizIdx === oIdx) {
                    borderClass = 'border-indigo-650 bg-indigo-950/50 text-indigo-200';
                  }

                  return (
                    <button
                      key={oIdx}
                      id={`quiz-option-${qId}-${oIdx}`}
                      disabled={hasAnswered}
                      onClick={() => handleSelectQuizOption(oIdx)}
                      className={`w-full p-3.5 border rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer gap-2 duration-200 ${borderClass}`}
                    >
                      <span>{opt}</span>
                      {hasAnswered && isCorrectOption && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                      {hasAnswered && isUserSelection && !isCorrectOption && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation section if answered */}
              {selectedQuizIdx !== null && (
                <div className="p-4 border border-indigo-950/50 bg-indigo-950/30 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-indigo-300">
                    💡 答題深度解碼 (Answer Explanation)：
                  </div>
                  <p className="leading-relaxed font-normal text-slate-350">
                    {SCHEDULING_QUIZ[quizIndex].explanation}
                  </p>
                </div>
              )}

              {/* Footer controls */}
              <div className="pt-2">
                {selectedQuizIdx !== null && (
                  <button
                    id="btn-quiz-next"
                    onClick={handleNextQuizQuestion}
                    className="px-5 py-2.5 font-bold text-xs bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>推進至下一題 (Next Question)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-5"
            >
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full w-max mx-auto text-indigo-400">
                <Award className="w-12 h-12" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-white">恭喜完成第二單元調度診斷隨堂檢驗！</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  您成功答對了 {quizScore.correct} / {SCHEDULING_QUIZ.length} 題。對 HOL 阻塞與佇列排程（Priority, WFQ）等網路核心原理有深入底蘊的實體硬體理解。
                </p>
              </div>

              <div className="flex gap-4 items-center justify-center pt-2">
                <button
                  id="btn-quiz-restart"
                  onClick={handleRestartQuiz}
                  className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-all cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>再度挑戰一次</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ==================== HELPER ALGORITHM FOR HOL blocking PREVIEW ====================
function isWinnerOfDestBlocked(packet: HOLPacket, headPacket: HOLPacket, queues: Record<number, HOLPacket[]>): boolean {
  // If the packet is not head structure, it is physically behind headPacket in this queue.
  // Will its output target be completely free of other queue's head target demands?
  // Let's analyze: what outputs are head packets calling for?
  const headDemands = new Set<number>();
  for (let port = 1; port <= 3; port++) {
    const q = queues[port];
    if (q.length > 0) {
      headDemands.add(q[0].targetOutput);
    }
  }

  // The destination of this secondary packet
  const target = packet.targetOutput;

  // Is target NOT being requested by any of the currently active head of queues?
  // If it is NOT requested, this output port is completely idle and free!
  // But because this packet is behind headPacket in its queue, it can't move.
  // This is a classic textbook example of Head-of-the-Line (HOL) blocking!
  const targetOutputIsFullyFree = !headDemands.has(target);
  
  return targetOutputIsFullyFree;
}
