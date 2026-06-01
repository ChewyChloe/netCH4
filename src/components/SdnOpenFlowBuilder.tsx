/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Terminal,
  Play,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Plus,
  Trash2,
  ListFilter,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  Cpu,
  Layers,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';

interface MatchFields {
  ingressPort?: string;
  srcMac?: string;
  dstMac?: string;
  ethType?: string;
  vlanId?: string;
  ipSrc?: string;
  ipDst?: string;
  ipProto?: string;
  ipToS?: string;
  tcpSrcPort?: string;
  tcpDstPort?: string;
}

interface FlowEntry {
  id: string;
  priority: number;
  match: MatchFields;
  action: {
    type: 'forward' | 'drop' | 'modify' | 'controller';
    param?: string; // e.g. Port number, rewrite address
  };
  desc: string;
  isPreloaded?: boolean;
}

const PRELOADED_RULES: FlowEntry[] = [
  {
    id: 'rule-1',
    priority: 100,
    match: {
      ipDst: '51.6.0.8',
    },
    action: {
      type: 'forward',
      param: '6',
    },
    desc: '「常規 IP 轉送」：若 IPv4 目的地為 51.6.0.8，則從 6 號埠口轉送出去。',
    isPreloaded: true
  },
  {
    id: 'rule-2',
    priority: 250,
    match: {
      ipProto: '6', // TCP
      tcpDstPort: '22',
    },
    action: {
      type: 'drop',
    },
    desc: '「安全防火牆」：主動阻斷所有 SSH (TCP Port 22) 連線請求，直接丟棄（Drop）。',
    isPreloaded: true
  },
  {
    id: 'rule-3',
    priority: 200,
    match: {
      ipSrc: '128.119.1.1',
    },
    action: {
      type: 'drop',
    },
    desc: '「來源黑名單」：對抗惡意流量，凡是來源 IP 為 128.119.1.1 之封包一概丟棄（Drop）。',
    isPreloaded: true
  }
];

export function SdnOpenFlowBuilder() {
  const [flowTable, setFlowTable] = useState<FlowEntry[]>(PRELOADED_RULES);
  const [selectedAction, setSelectedAction] = useState<FlowEntry['action']['type']>('forward');
  const [actionParam, setActionParam] = useState<string>('3');
  const [priority, setPriority] = useState<number>(150);
  const [ruleDesc, setRuleDesc] = useState<string>('');

  // Fields toggled for new rule
  const [enabledMatches, setEnabledMatches] = useState<Record<keyof MatchFields, boolean>>({
    ingressPort: false,
    srcMac: false,
    dstMac: false,
    ethType: false,
    vlanId: false,
    ipSrc: false,
    ipDst: false,
    ipProto: false,
    ipToS: false,
    tcpSrcPort: false,
    tcpDstPort: false
  });

  // Target match field values
  const [matchValues, setMatchValues] = useState<MatchFields>({
    ingressPort: '1',
    srcMac: 'AA:BB:CC:11:22:33',
    dstMac: 'DD:EE:FF:44:55:66',
    ethType: '0x0800',
    vlanId: '10',
    ipSrc: '128.119.1.1',
    ipDst: '51.6.0.8',
    ipProto: '6',
    ipToS: '0',
    tcpSrcPort: '1024',
    tcpDstPort: '22'
  });

  // Packet under test
  const [testPacket, setTestPacket] = useState<Required<MatchFields>>({
    ingressPort: '1',
    srcMac: 'AA:BB:CC:11:22:33',
    dstMac: 'DD:EE:FF:44:55:66',
    ethType: '0x0800',
    vlanId: '10',
    ipSrc: '128.119.1.1',
    ipDst: '51.6.0.8',
    ipProto: '6',
    ipToS: '0',
    tcpSrcPort: '1024',
    tcpDstPort: '22'
  });

  const [testResult, setTestResult] = useState<{
    matchedRule: FlowEntry | null;
    checkedRules: Array<{ ruleId: string; matched: boolean; priority: number }>;
    animatedIndex: number;
    isRunningSimulation: boolean;
  } | null>(null);

  // Quiz States
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizChecked, setQuizChecked] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const sdnQuizQuestions = [
    {
      id: 1,
      question: '若要設定 OpenFlow 作為一個純粹的「第三層路由器」（L3 Router），流表的 Match 與 Action 應採取何種配置？',
      options: [
        '比對來源 MAC 地址 ➔ 執行點對點封包 Modify',
        '比對目的 IP 首碼 (LPM) ➔ 執行轉送 (Forward) 至指定出口 Port',
        '比對 TCP 埠號 ➔ 封裝 (Encapsulate) 上傳給 Controller',
        '比對 VLAN ID ➔ 丟棄 (Drop)'
      ],
      correctIndex: 1,
      explanation: 'OpenFlow 的通用匹配能力極強。如果要模擬傳統 L3 路由器，我們只需要「比對 IP 目的地（對應最長字首）」，並將動作設定為「轉送至對應輸出埠（Forward to Port）」即可。'
    },
    {
      id: 2,
      question: '如果流表（Flow Table）中有多個條目同時能成功比對行進中的同一個封包，OpenFlow 規定應如何挑選執行的 Rule？',
      options: [
        '挑選優先權 (Priority) 數值最高的那一個規則 entry 執行',
        '依照隨機運算機率隨機挑選一個執行',
        '同時執行所有能匹配的規則，分流發送',
        '挑選匹配條件最少的那一個 entry 優先執行'
      ],
      correctIndex: 0,
      explanation: 'OpenFlow 流表中可能有多個規則重疊 (Overlap) 命中同一個封包。此時，具備最高「Priority (優先權)」數值的規則將具有絕對決定權，其餘低優先權規則會被直接忽略。'
    },
    {
      id: 3,
      question: 'OpenFlow 引入了「轉送給控制器 (Send to Controller)」特殊 Action，其在 SDN 宏觀架構中的實戰作用為何？',
      options: [
        '用於把壞掉的數據報拿去回收重算',
        '充當本機備份，當交換機斷電時可以復原',
        '將無法處理的新未知流報文封裝上傳（Packet-In），由集中式 Controller 運算後回傳下發（Packet-Out）新安裝規則',
        '利用控制器當做中繼代理，躲避防火牆追蹤'
      ],
      correctIndex: 2,
      explanation: '當 OpenFlow 遇到查無常規流表匹配的「全新未知流封包」時，常設規則會將其送交 Controller。控制器擁有全局拓撲視野，經過計算决策後，會動態向硬體交換機下發新流表規則，實現軟體定義網路的極智控制。'
    }
  ];

  const handleAddRule = () => {
    // Collect selected matching fields
    const newMatch: MatchFields = {};
    let hasMatch = false;
    (Object.keys(enabledMatches) as Array<keyof MatchFields>).forEach(key => {
      if (enabledMatches[key]) {
        newMatch[key] = matchValues[key];
        hasMatch = true;
      }
    });

    // We can allow blank match if they want to match "*" (Any), so that is fine!
    const ruleId = `rule-${Date.now()}`;
    const defaultDesc = `使用者自訂規則（優先權 ${priority}，動作：${getFriendlyActionLabel(selectedAction, actionParam)}）`;
    
    const newEntry: FlowEntry = {
      id: ruleId,
      priority,
      match: newMatch,
      action: {
        type: selectedAction,
        param: selectedAction === 'forward' || selectedAction === 'modify' ? actionParam : undefined
      },
      desc: ruleDesc.trim() || defaultDesc
    };

    setFlowTable(prev => [...prev, newEntry].sort((a, b) => b.priority - a.priority));
    
    // Reset temporary custom fields
    setRuleDesc('');
  };

  const handleDeleteRule = (id: string) => {
    setFlowTable(prev => prev.filter(r => r.id !== id));
    if (testResult) setTestResult(null);
  };

  const handleResetTable = () => {
    setFlowTable(PRELOADED_RULES);
    setTestResult(null);
  };

  const getFriendlyActionLabel = (type: FlowEntry['action']['type'], param?: string) => {
    switch (type) {
      case 'forward':
        return `轉送至 Port ${param || '6'}`;
      case 'drop':
        return '直接丟棄 (Drop)';
      case 'modify':
        return `改寫欄位值 ➔ ${param || 'Rewrite'}`;
      case 'controller':
        return '封裝送交控制器 (Send to Controller)';
      default:
        return 'Forward';
    }
  };

  // Run matching simulation
  const handleRunSimulation = () => {
    if (flowTable.length === 0) {
      alert('請先在流表（Flow Table）中加入或預載規則！');
      return;
    }

    setTestResult({
      matchedRule: null,
      checkedRules: [],
      animatedIndex: 0,
      isRunningSimulation: true
    });

    const sortedRules = [...flowTable].sort((a, b) => b.priority - a.priority);
    const checks: typeof testResult.checkedRules = [];
    let matchedRule: FlowEntry | null = null;

    for (const rule of sortedRules) {
      let isMatch = true;
      const matchCriteria = Object.keys(rule.match) as Array<keyof MatchFields>;
      
      // If no criteria specified, it acts as standard matches everything (Wildcard '*')
      if (matchCriteria.length === 0) {
        isMatch = true;
      } else {
        for (const criterion of matchCriteria) {
          const ruleVal = rule.match[criterion];
          const pktVal = testPacket[criterion];
          if (ruleVal !== pktVal) {
            isMatch = false;
            break;
          }
        }
      }

      checks.push({ ruleId: rule.id, matched: isMatch, priority: rule.priority });
      
      if (isMatch && !matchedRule) {
        matchedRule = rule;
      }
    }

    // Dynamic timeout matching animation steps
    let idx = 0;
    const interval = setInterval(() => {
      setTestResult(prev => {
        if (!prev) return null;
        const reachedEnd = idx >= sortedRules.length;
        if (reachedEnd || (idx > 0 && prev.checkedRules[idx - 1]?.matched)) {
          clearInterval(interval);
          return {
            ...prev,
            matchedRule,
            isRunningSimulation: false
          };
        }
        
        const nextChecks = [...prev.checkedRules, checks[idx]];
        idx++;
        return {
          ...prev,
          checkedRules: nextChecks,
          animatedIndex: idx
        };
      });
    }, 600);
  };

  const handleSelectPreloadedPacket = (type: 'ssh' | 'normal' | 'blocked') => {
    if (testResult) setTestResult(null);
    if (type === 'ssh') {
      setTestPacket({
        ingressPort: '1',
        srcMac: 'AA:BB:CC:11:22:33',
        dstMac: '00:11:22:33:44:55',
        ethType: '0x0800',
        vlanId: '10',
        ipSrc: '192.168.1.100',
        ipDst: '51.6.0.8',
        ipProto: '6',
        ipToS: '0',
        tcpSrcPort: '59205',
        tcpDstPort: '22' // Target SSH Drop
      });
    } else if (type === 'normal') {
      setTestPacket({
        ingressPort: '2',
        srcMac: '11:22:33:44:55:66',
        dstMac: 'DD:EE:FF:44:55:66',
        ethType: '0x0800',
        vlanId: '20',
        ipSrc: '223.1.2.4',
        ipDst: '51.6.0.8', // Will hit Rule 1 Forward 6
        ipProto: '6',
        ipToS: '0',
        tcpSrcPort: '8080',
        tcpDstPort: '80'
      });
    } else if (type === 'blocked') {
      setTestPacket({
        ingressPort: '1',
        srcMac: 'AA:BB:CC:11:22:33',
        dstMac: 'DD:EE:FF:44:55:66',
        ethType: '0x0800',
        vlanId: '10',
        ipSrc: '128.119.1.1', // Will hit blacklisted source
        ipDst: '8.8.8.8',
        ipProto: '17',
        ipToS: '1',
        tcpSrcPort: '5353',
        tcpDstPort: '53'
      });
    }
  };

  // Load a full Device Template to illustrate abstractions
  const handleLoadDeviceAbstraction = (device: 'router' | 'switch' | 'firewall' | 'nat') => {
    setTestResult(null);
    let rules: FlowEntry[] = [];
    if (device === 'router') {
      rules = [
        {
          id: 'dev-r-1',
          priority: 100,
          match: { ipDst: '128.119.0.0/16' },
          action: { type: 'forward', param: '1' },
          desc: '【路由器功能】匹配最長目的 IP 前置 prefix /16 ➔ 轉送 1 號埠。'
        },
        {
          id: 'dev-r-2',
          priority: 90,
          match: { ipDst: '0.0.0.0/0' },
          action: { type: 'forward', param: '2' },
          desc: '【路由器功能】默認匹配條目(Otherwise) ➔ 轉送 2 號出口閘道。'
        }
      ];
    } else if (device === 'switch') {
      rules = [
        {
          id: 'dev-sw-1',
          priority: 200,
          match: { dstMac: '00:11:22:33:44:55' },
          action: { type: 'forward', param: '3' },
          desc: '【交換機功能】匹配目的地二層 MAC 地址 ➔ 橋接收集轉送至端點 3'
        },
        {
          id: 'dev-sw-2',
          priority: 100,
          match: { dstMac: 'FF:FF:FF:FF:FF:FF' },
          action: { type: 'forward', param: 'ALL' },
          desc: '【交換機功能】廣播泛洪(Flood) ➔ 發送到除了入埠口之外的所有埠'
        }
      ];
    } else if (device === 'firewall') {
      rules = [
        {
          id: 'dev-fw-1',
          priority: 500,
          match: { tcpDstPort: '23', ipProto: '6' },
          action: { type: 'drop' },
          desc: '【防火牆功能】禁止明文 Telnet (TCP Port 23) 入侵封鎖 ➔ Drop 丟棄'
        },
        {
          id: 'dev-fw-2',
          priority: 100,
          match: {}, // Match Everything
          action: { type: 'forward', param: 'NORMAL' },
          desc: '【防火牆功能】其餘常規流量全數放行轉送 (Default Permit)'
        }
      ];
    } else if (device === 'nat') {
      rules = [
        {
          id: 'dev-nat-1',
          priority: 400,
          match: { ipSrc: '10.0.0.1', tcpSrcPort: '12345' },
          action: { type: 'modify', param: 'Rewrite IP to 138.76.29.7, TCP Port to 5001' },
          desc: '【NAT 功能】內部私網 IP:Port 重寫改寫 ➔ 變更為公網 IP 與對應埠。'
        }
      ];
    }
    setFlowTable(rules);
  };

  const handleValidateQuiz = () => {
    let score = 0;
    sdnQuizQuestions.forEach(q => {
      if (quizAnswers[q.id] === q.correctIndex) {
        score += 33;
      }
    });
    if (score === 99) score = 100;
    setQuizScore(score);
    setQuizChecked(true);
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
    setQuizChecked(false);
    setQuizScore(null);
  };

  return (
    <div className="space-y-8 select-none text-left">
      {/* CONCEPT CARDS INTRO */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="border-b pb-4 mb-5">
          <span className="text-[10px] bg-blue-105 text-blue-700 font-extrabold font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            GENERALIZED FORWARDING (SDN DATA PLANE)
          </span>
          <h3 className="text-xl font-black text-slate-800 mt-1">
            軟體定義網路與 OpenFlow 通用「匹配＋動作」法則
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            在傳統網路中，轉送決策依賴目的地 IP 地址。而 SDN 使網路編程化：通用的交換硬體僅透過一個統一的<strong>「流表（Flow Table）」</strong>來控制封包的生死與流向。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border rounded-xl space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-mono text-[10px]">1</span>
              傳統目的地轉送
            </h4>
            <p className="text-slate-505 leading-relaxed font-sans">
              每個路由器內部自行運算路由協定，僅僅能依據封包標頭的<strong>目的 IP 地址前置 (Destination IP)</strong> 來比對轉送表，功能僵硬，無法進行複雜的多維度策略調度。
            </p>
          </div>
          <div className="p-4 bg-slate-50 border rounded-xl space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-mono text-[10px]">2</span>
              通用轉送 Match + Action
            </h4>
            <p className="text-slate-505 leading-relaxed font-sans">
              OpenFlow 打破界限，支援同時比對 MAC 地址、VLAN 標記、IP 地址、協定、TCP/UDP 埠號等 <strong>12 個不同協議層的欄位</strong>。匹配成功後即可執行 Forward, Drop, Modify 等豐富 Action。
            </p>
          </div>
          <div className="p-4 bg-slate-50 border rounded-xl space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-mono text-[10px]">3</span>
              中央集中化控制器
            </h4>
            <p className="text-slate-505 leading-relaxed font-sans">
              由運行在雲端或實體的主機 <strong>SDN Centralized Controller</strong> 掌管大局，以南向 API（如 OpenFlow 協定）下發並將規則熱安裝（Install）到網格硬體中，實現極致擴展性。
            </p>
          </div>
        </div>
      </div>

      {/* FLOW ENTRY BUILDER SECTION */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="border-b pb-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-800">流表條目編輯器 (Flow Table Rule Builder)</h3>
            <span className="text-[10.5px] text-zinc-400 block font-medium">配置 Match 比對規則，指派 Action 並將其植入下方流表硬碟中：</span>
          </div>
          <button
            onClick={handleResetTable}
            className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border flex items-center gap-1 duration-150"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置並載入預設流表
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Rule Creator Form */}
          <div className="lg:col-span-5 p-5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-4">
            <div className="border-b pb-2 mb-2">
              <strong className="text-xs text-slate-800 block">步驟一：勾選並填寫匹配條件 (Match Matching Criteria)</strong>
              <span className="text-[9px] text-slate-400">只有勾選啓用的欄位，才會加入該 Flow Entry 規則的比對機制中（未勾選代表 * 萬用）</span>
            </div>

            {/* Ingress port and MAC rows */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {/* IngressPort */}
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  id="chk-ingress"
                  checked={enabledMatches.ingressPort}
                  onChange={(e) => setEnabledMatches(prev => ({ ...prev, ingressPort: e.target.checked }))}
                  className="rounded text-blue-600"
                />
                <label htmlFor="chk-ingress" className="font-bold text-slate-700 w-32 shrink-0">流進埠口 (Ingress Port)</label>
                <input
                  type="text"
                  disabled={!enabledMatches.ingressPort}
                  value={matchValues.ingressPort || ''}
                  onChange={(e) => setMatchValues(prev => ({ ...prev, ingressPort: e.target.value }))}
                  className="flex-1 px-2 py-1 border rounded disabled:bg-slate-200 font-mono text-[11px]"
                />
              </div>

              {/* Source MAC */}
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  id="chk-srcmac"
                  checked={enabledMatches.srcMac}
                  onChange={(e) => setEnabledMatches(prev => ({ ...prev, srcMac: e.target.checked }))}
                  className="rounded text-blue-600"
                />
                <label htmlFor="chk-srcmac" className="font-bold text-slate-700 w-32 shrink-0">來源 MAC</label>
                <input
                  type="text"
                  disabled={!enabledMatches.srcMac}
                  value={matchValues.srcMac || ''}
                  onChange={(e) => setMatchValues(prev => ({ ...prev, srcMac: e.target.value }))}
                  className="flex-1 px-2 py-1 border rounded disabled:bg-slate-200 font-mono text-[11px]"
                />
              </div>

              {/* Destination MAC */}
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  id="chk-dstmac"
                  checked={enabledMatches.dstMac}
                  onChange={(e) => setEnabledMatches(prev => ({ ...prev, dstMac: e.target.checked }))}
                  className="rounded text-blue-600"
                />
                <label htmlFor="chk-dstmac" className="font-bold text-slate-700 w-32 shrink-0">目的地 MAC</label>
                <input
                  type="text"
                  disabled={!enabledMatches.dstMac}
                  value={matchValues.dstMac || ''}
                  onChange={(e) => setMatchValues(prev => ({ ...prev, dstMac: e.target.value }))}
                  className="flex-1 px-2 py-1 border rounded disabled:bg-slate-200 font-mono text-[11px]"
                />
              </div>

              {/* IP Source */}
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  id="chk-ipsrc"
                  checked={enabledMatches.ipSrc}
                  onChange={(e) => setEnabledMatches(prev => ({ ...prev, ipSrc: e.target.checked }))}
                  className="rounded text-blue-600"
                />
                <label htmlFor="chk-ipsrc" className="font-bold text-slate-700 w-32 shrink-0">來源 IP</label>
                <input
                  type="text"
                  disabled={!enabledMatches.ipSrc}
                  value={matchValues.ipSrc || ''}
                  onChange={(e) => setMatchValues(prev => ({ ...prev, ipSrc: e.target.value }))}
                  className="flex-1 px-2 py-1 border rounded disabled:bg-slate-200 font-mono text-[11px]"
                />
              </div>

              {/* IP Destination */}
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  id="chk-ipdst"
                  checked={enabledMatches.ipDst}
                  onChange={(e) => setEnabledMatches(prev => ({ ...prev, ipDst: e.target.checked }))}
                  className="rounded text-blue-600"
                />
                <label htmlFor="chk-ipdst" className="font-bold text-slate-700 w-32 shrink-0">目的地 IP</label>
                <input
                  type="text"
                  disabled={!enabledMatches.ipDst}
                  value={matchValues.ipDst || ''}
                  onChange={(e) => setMatchValues(prev => ({ ...prev, ipDst: e.target.value }))}
                  className="flex-1 px-2 py-1 border rounded disabled:bg-slate-200 font-mono text-[11px]"
                />
              </div>

              {/* IP Protocol */}
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  id="chk-ipproto"
                  checked={enabledMatches.ipProto}
                  onChange={(e) => setEnabledMatches(prev => ({ ...prev, ipProto: e.target.checked }))}
                  className="rounded text-blue-600"
                />
                <label htmlFor="chk-ipproto" className="font-bold text-slate-700 w-32 shrink-0">IP 協定類型</label>
                <select
                  disabled={!enabledMatches.ipProto}
                  value={matchValues.ipProto || ''}
                  onChange={(e) => setMatchValues(prev => ({ ...prev, ipProto: e.target.value }))}
                  className="flex-1 px-2 py-1 border rounded disabled:bg-slate-200 font-mono text-[11px] bg-white h-8"
                >
                  <option value="6">6 (TCP)</option>
                  <option value="17">17 (UDP)</option>
                  <option value="1">1 (ICMP)</option>
                </select>
              </div>

              {/* TCP/UDP Destination Port */}
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  id="chk-tcpdst"
                  checked={enabledMatches.tcpDstPort}
                  onChange={(e) => setEnabledMatches(prev => ({ ...prev, tcpDstPort: e.target.checked }))}
                  className="rounded text-blue-600"
                />
                <label htmlFor="chk-tcpdst" className="font-bold text-slate-700 w-32 shrink-0">TCP/UDP 目地埠</label>
                <input
                  type="text"
                  disabled={!enabledMatches.tcpDstPort}
                  value={matchValues.tcpDstPort || ''}
                  onChange={(e) => setMatchValues(prev => ({ ...prev, tcpDstPort: e.target.value }))}
                  className="flex-1 px-2 py-1 border rounded disabled:bg-slate-200 font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Step 2: Action details */}
            <div className="border-t pt-3 space-y-2.5 text-xs">
              <strong className="text-xs text-slate-800 block">步驟二：選擇命中動作 (Choose Instruction Action)</strong>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'forward', label: '轉送至埠口' },
                  { id: 'drop', label: '丟棄 (Drop)' },
                  { id: 'modify', label: '改寫標頭' },
                  { id: 'controller', label: '發給控制器' }
                ].map(act => (
                  <button
                    key={act.id}
                    onClick={() => setSelectedAction(act.id as any)}
                    className={`p-2 rounded-lg border font-bold text-center duration-150 ${
                      selectedAction === act.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>

              {(selectedAction === 'forward' || selectedAction === 'modify') && (
                <div className="bg-white p-2 border rounded-lg flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">設定參數 :</span>
                  <input
                    type="text"
                    value={actionParam}
                    onChange={(e) => setActionParam(e.target.value)}
                    placeholder={selectedAction === 'forward' ? '填寫輸出埠，如：6' : '重寫格式，如：IP=10.0.0.1'}
                    className="flex-1 px-2 py-1 text-xs border rounded font-mono"
                  />
                </div>
              )}
            </div>

            {/* Priority & Description */}
            <div className="space-y-2.5 border-t pt-3 text-xs">
              <div className="flex items-center justify-between gap-4">
                <label className="font-bold text-slate-700">優先權 (Priority):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="999"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value))}
                    className="w-24 focus:outline-none"
                  />
                  <span className="font-mono bg-slate-200 py-0.5 px-2 rounded font-black text-slate-800">{priority}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">條目描述或備註 (Optional Description):</label>
                <input
                  type="text"
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  placeholder="例：阻斷此入侵主機的網路通訊..."
                  className="w-full px-2 py-1.5 border rounded"
                />
              </div>

              <button
                onClick={handleAddRule}
                className="w-full bg-blue-600 hover:bg-blue-750 text-white font-black py-2.5 rounded-xl shadow-md cursor-pointer duration-150 flex items-center justify-center gap-1 text-xs"
              >
                <Plus className="w-4 h-4" />
                將此規則植入流表 (Add Flow Entry)
              </button>
            </div>
          </div>

          {/* Current Flow Table View */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 border border-slate-950 rounded-2xl p-4 text-white relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="text-[10px] bg-indigo-900 text-indigo-300 font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  ACTIVE FLOW TABLE
                </span>
                <span className="text-xs font-bold text-slate-400">
                  共計 <span className="text-yellow-400 font-mono font-black">{flowTable.length}</span> 條流規則在線
                </span>
              </div>

              {flowTable.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-mono text-xs">
                  📭 當前流表為空，請在左側配置或按右上角按鈕「載入預設流表」！
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[10.5px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-1.5 px-2 w-16">優先權</th>
                        <th className="py-1.5 px-2">匹配特徵 (Matches)</th>
                        <th className="py-1.5 px-2">處理動作 (Actions)</th>
                        <th className="py-1.5 px-2 w-10 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {flowTable.map((rule) => {
                        const isMatchedInTest = testResult?.checkedRules.find(
                          cr => cr.ruleId === rule.id && cr.matched
                        );
                        const isMainMatched = testResult?.matchedRule?.id === rule.id;

                        let trClass = 'hover:bg-slate-850/40 transition duration-150';
                        if (isMainMatched) {
                          trClass = 'bg-green-950 border-l-4 border-l-green-400 font-bold';
                        } else if (isMatchedInTest) {
                          trClass = 'bg-amber-950 bg-opacity-30 border-l-4 border-l-amber-500';
                        }

                        return (
                          <tr key={rule.id} className={trClass}>
                            <td className="py-3.5 px-2 font-black text-rose-300">{rule.priority}</td>
                            <td className="py-2 px-2 max-w-xs break-all">
                              {Object.keys(rule.match).length === 0 ? (
                                <span className="text-slate-500">* (Match Any 萬用)</span>
                              ) : (
                                <div className="space-y-0.5">
                                  {Object.entries(rule.match).map(([k, v]) => (
                                    <span key={k} className="inline-block bg-slate-800 text-blue-300 rounded px-1 text-[9.5px] mr-1 mb-0.5">
                                      {k}: {v}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <span className="text-[9px] text-slate-400 block mt-1 font-sans">{rule.desc}</span>
                            </td>
                            <td className="py-2 px-2">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                rule.action.type === 'drop'
                                  ? 'bg-rose-900 text-rose-200'
                                  : rule.action.type === 'forward'
                                  ? 'bg-emerald-900 text-emerald-200'
                                  : rule.action.type === 'modify'
                                  ? 'bg-orange-900 text-orange-200'
                                  : 'bg-indigo-900 text-indigo-200'
                              }`}>
                                {getFriendlyActionLabel(rule.action.type, rule.action.param)}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                onClick={() => handleDeleteRule(rule.id)}
                                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 duration-150"
                                title="刪除本條規則"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* PRESET LOADERS CARD */}
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-xs space-y-3">
              <span className="text-[9px] bg-slate-250 text-slate-600 font-extrabold font-mono px-2 py-0.5 rounded uppercase block w-max">
                DEVICE ABSTRACT PRESET TEMPLATES
              </span>
              <p className="text-slate-500 leading-normal">
                流表大一統！點擊下方預載按鈕，可將通用流表一秒變幻為特定的專用網路硬體，感受其大一統設計美學：
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { device: 'router', label: '🌐 L3 路由器' },
                  { device: 'switch', label: '🔌 L2 交換機' },
                  { device: 'firewall', label: '🔥 網絡防火牆' },
                  { device: 'nat', label: '🔁 NAT 轉換器' }
                ].map(item => (
                  <button
                    key={item.device}
                    onClick={() => handleLoadDeviceAbstraction(item.device as any)}
                    className="p-2 py-2.5 rounded-lg border bg-white hover:bg-slate-100 font-black text-center text-slate-700 hover:scale-101 duration-150 cursor-pointer shadow-sm text-[11px]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PACKET TESTER MODULE */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="border-b pb-4 mb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-800">流表封包校驗及優先權模擬器 (Packet Tester & Priority Matcher)</h3>
            <span className="text-xs text-slate-400 block mt-0.5">
              手動配置欲過境的封包標頭資訊，執行模擬。系統將嚴格<strong>按 Priority 從高到低</strong>，檢查哪一條匹配規則被率先命中！
            </span>
          </div>
          <button
            onClick={handleRunSimulation}
            disabled={testResult?.isRunningSimulation}
            className="text-xs font-black bg-indigo-650 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md duration-150 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            啟動流表匹配檢驗
          </button>
        </div>

        {/* Premade scenarios quick options */}
        <div className="flex gap-2 mb-4 items-center flex-wrap">
          <span className="text-xs text-slate-400 font-bold font-mono">載入特定測試數據報：</span>
          {[
            { id: 'ssh', label: '🔐 SSH 二十二埠(Drop) 封包' },
            { id: 'normal', label: '📬 目的地 51.6.0.8 常規封包' },
            { id: 'blocked', label: '⚠️ 來源 128.119.1.1 惡意封包' }
          ].map(scn => (
            <button
              key={scn.id}
              onClick={() => handleSelectPreloadedPacket(scn.id as any)}
              className="text-xs py-1 px-3 border rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 duration-150 font-medium"
            >
              {scn.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Packet Header Input Columns */}
          <div className="md:col-span-4 p-5 bg-indigo-50/20 border border-indigo-100 rounded-2xl space-y-3">
            <span className="text-[10px] text-indigo-500 font-extrabold block border-b pb-1">PACKET HEADERS (封包多層標頭值)</span>
            
            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block">1. 接入 Ingress Port 的實體入口:</label>
                <input
                  type="text"
                  value={testPacket.ingressPort}
                  onChange={(e) => setTestPacket(prev => ({ ...prev, ingressPort: e.target.value }))}
                  className="w-full px-2 py-1 border rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block">2. 來源 MAC 地址 (Source MAC):</label>
                <input
                  type="text"
                  value={testPacket.srcMac}
                  onChange={(e) => setTestPacket(prev => ({ ...prev, srcMac: e.target.value }))}
                  className="w-full px-2 py-1 border rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block">3. 目的地 MAC 地址 (Destination MAC):</label>
                <input
                  type="text"
                  value={testPacket.dstMac}
                  onChange={(e) => setTestPacket(prev => ({ ...prev, dstMac: e.target.value }))}
                  className="w-full px-2 py-1 border rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block">4. 來源 IP (Source IPV4 Address):</label>
                <input
                  type="text"
                  value={testPacket.ipSrc}
                  onChange={(e) => setTestPacket(prev => ({ ...prev, ipSrc: e.target.value }))}
                  className="w-full px-2 py-1 border rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block">5. 目的地 IP (Destination IPV4 Address):</label>
                <input
                  type="text"
                  value={testPacket.ipDst}
                  onChange={(e) => setTestPacket(prev => ({ ...prev, ipDst: e.target.value }))}
                  className="w-full px-2 py-1 border rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block">6. TCP/UDP 目的埠號 (Destination L4 Port):</label>
                <input
                  type="text"
                  value={testPacket.tcpDstPort}
                  onChange={(e) => setTestPacket(prev => ({ ...prev, tcpDstPort: e.target.value }))}
                  className="w-full px-2 py-1 border rounded bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Simulation Output Card Panel */}
          <div className="md:col-span-8 flex flex-col justify-between">
            <div className="bg-slate-950 text-emerald-400 p-5 rounded-2xl border border-slate-900 font-mono text-[11px] h-full flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2 mb-3 text-xs justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>SIMULATOR STATUS LOGS: </span>
                  </div>
                  {testResult?.isRunningSimulation && <span className="text-[10px] text-yellow-405 italic">正在由高至低核對優先權中...</span>}
                </div>

                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {!testResult && (
                    <div className="text-slate-500 italic">
                      [等待指令] 點擊上方「啟動流表匹配檢驗」模擬 OpenFlow 硬體管道運行過程...
                    </div>
                  )}

                  {testResult?.checkedRules.map((cr, idx) => {
                    const rule = flowTable.find(r => r.id === cr.ruleId);
                    if (!rule) return null;
                    return (
                      <div
                        key={rule.id}
                        className={`p-1.5 rounded text-left ${
                          cr.matched
                            ? 'bg-green-950 text-green-300 border border-green-900 font-bold'
                            : 'text-slate-500 line-through'
                        }`}
                      >
                        {idx + 1}. 核對優先權 {rule.priority} 規則 ID ({rule.id.substring(0, 10)})：
                        {cr.matched ? '【命中 Match!】' : '【未匹配 Miss!】'}
                      </div>
                    );
                  })}
                </div>
              </div>

              {testResult && !testResult.isRunningSimulation && (
                <div className="border-t border-slate-900 pt-3 mt-3">
                  {testResult.matchedRule ? (
                    <div className="space-y-2">
                      <div className="text-white text-xs font-black flex items-center gap-1 bg-green-900/40 p-2.5 rounded-xl border border-green-800">
                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                        <div>
                          <span>匹配命中成功！最終匹配規則最高優先權為： {testResult.matchedRule.priority}</span>
                          <span className="block text-[10px] font-normal text-slate-350">{testResult.matchedRule.desc}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-900 rounded-xl space-y-1 text-slate-300">
                        <span className="block text-[10px] text-slate-500 uppercase">執行處置動作 (Action Exchanged):</span>
                        <div className="flex items-center gap-2">
                          <strong className="text-emerald-300 text-sm">
                            {getFriendlyActionLabel(testResult.matchedRule.action.type, testResult.matchedRule.action.param)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-400 font-black p-3 bg-red-950/20 border border-red-950 rounded-xl flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <div>
                        流表比對失敗 (Table Miss) ! 封包未匹配任何條目。
                        <span className="block text-[9.5px] text-slate-500 font-normal mt-0.5 font-sans leading-relaxed">
                          （通常在傳統 OpenFlow 中，若發生 Table Miss，封包會觸發默認行為：直接丟棄，或是包裝為 Packet-In 上傳交給 SDN Central Controller 作動態路徑決策。）
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DEVICE ABSTRACTION CARDS */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="border-b pb-4 mb-5">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
            <Layers className="w-5 h-5 text-blue-600" />
            四、通用轉送對「多維度專用網格設備」的完美抽象
          </h3>
          <span className="text-xs text-slate-400 block mt-0.5">
            下圖演示一個 OpenFlow 開配流表，如何依據不同的欄位遮罩，輕鬆自如地扮演多個傳統網格中獨立、昂貴之實體設備的功能：
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-slate-200/60 p-4 rounded-xl flex flex-col justify-between space-y-3 bg-slate-50/20 h-full hover:border-slate-300">
            <div className="space-y-1 text-left">
              <span className="p-1 px-1.5 text-[9px] bg-blue-50 text-blue-800 rounded font-bold font-mono">1. IP 路由器 (L3 Router)</span>
              <h4 className="text-xs font-bold text-slate-800 pt-1">最長前綴 Forwarding</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                比對「IP 目的地首碼 (Destination IP prefix)」，動作指配為「轉送到特定端口埠」。完美的 L3 IP 路由實體。
              </p>
            </div>
            <div className="bg-slate-100 p-2 rounded text-[10px] font-mono leading-relaxed text-slate-600 border border-slate-200">
              ⚡ <strong>Matches:</strong> Dst IP prefix<br />
              ⚙️ <strong>Action:</strong> Forward to Port
            </div>
          </div>

          <div className="border border-slate-200/60 p-4 rounded-xl flex flex-col justify-between space-y-3 bg-slate-50/20 h-full hover:border-slate-300">
            <div className="space-y-1 text-left">
              <span className="p-1 px-1.5 text-[9px] bg-emerald-50 text-emerald-800 rounded font-bold font-mono">2. L2 乙太網路交換機</span>
              <h4 className="text-xs font-bold text-slate-800 pt-1">MAC 特徵匹配與泛洪</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                比對「目的地 MAC 地址 (Destination MAC)」，進行轉送、廣播或泛洪、靜態拋棄，完美降維扮演二層通訊。
              </p>
            </div>
            <div className="bg-slate-100 p-2 rounded text-[10px] font-mono leading-relaxed text-slate-600 border border-slate-200">
              ⚡ <strong>Matches:</strong> Dst MAC addr<br />
              ⚙️ <strong>Action:</strong> Forward / Flood
            </div>
          </div>

          <div className="border border-slate-200/60 p-4 rounded-xl flex flex-col justify-between space-y-3 bg-slate-50/20 h-full hover:border-slate-300">
            <div className="space-y-1 text-left">
              <span className="p-1 px-1.5 text-[9px] bg-rose-50 text-rose-800 rounded font-bold font-mono">3. 防火牆 (Firewall)</span>
              <h4 className="text-xs font-bold text-slate-800 pt-1">IP 埠口與協定阻斷</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                比對「來源/目的 IP」以及「TCP/UDP 埠號」，如遇到黑名單來源或 Telnet/SSH 通信，強制動作設定為 Drop。
              </p>
            </div>
            <div className="bg-slate-100 p-2 rounded text-[10px] font-mono leading-relaxed text-slate-600 border border-slate-200">
              ⚡ <strong>Matches:</strong> IP + Port + Proto<br />
              ⚙️ <strong>Action:</strong> Drop (丟棄)
            </div>
          </div>

          <div className="border border-slate-200/60 p-4 rounded-xl flex flex-col justify-between space-y-3 bg-slate-50/20 h-full hover:border-slate-300">
            <div className="space-y-1 text-left">
              <span className="p-1 px-1.5 text-[9px] bg-purple-50 text-purple-800 rounded font-bold font-mono">4. 地址轉換 (NAT)</span>
              <h4 className="text-xs font-bold text-slate-800 pt-1">動態重寫與改寫欄位</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                匹配内部 IP + Port，執行動作直接修改（Modify）標頭數據，将其翻新改寫為公網 IP 與對應外埠。
              </p>
            </div>
            <div className="bg-slate-100 p-2 rounded text-[10px] font-mono leading-relaxed text-slate-600 border border-slate-200">
              ⚡ <strong>Matches:</strong> Private IP + Port<br />
              ⚙️ <strong>Action:</strong> Change IP & Port
            </div>
          </div>
        </div>
      </div>

      {/* QUIZ SUB-SECTION */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="border-b pb-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-50 text-yellow-700 rounded-xl">
              <HelpCircle className="w-5 h-5 text-yellow-600 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800">隨堂演練：OpenFlow 規則與 SDN 資料面評測</h4>
              <span className="text-[10px] text-slate-400 font-bold block">利用 3 道精選理解選擇題，檢核您對軟體定義網路通用轉送機制的掌握度：</span>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {sdnQuizQuestions.map((q, idx) => {
            const chosenIdx = quizAnswers[q.id];

            return (
              <div key={q.id} className="p-4 bg-slate-50/50 border rounded-2xl space-y-3 text-xs">
                <div className="font-bold text-slate-800 leading-relaxed">
                  <span className="bg-blue-105 text-blue-700 font-extrabold px-1.5 py-0.5 rounded mr-1.5 font-mono">Q{idx + 1}</span>
                  {q.question}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  {q.options.map((opt, oIdx) => {
                    const isChosen = chosenIdx === oIdx;
                    const isCorrect = q.correctIndex === oIdx;

                    let btnClass = 'border-slate-201 bg-white text-slate-700 hover:bg-slate-50';
                    if (isChosen && !quizChecked) {
                      btnClass = 'border-blue-500 bg-blue-50 text-blue-808 font-bold';
                    } else if (quizChecked) {
                      if (isCorrect) {
                        btnClass = 'border-green-400 bg-green-50 text-green-800 font-bold ring-2 ring-green-150';
                      } else if (isChosen) {
                        btnClass = 'border-red-400 bg-red-50 text-red-808 font-bold';
                      } else {
                        btnClass = 'border-slate-100 bg-white text-slate-400 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={quizChecked}
                        onClick={() => {
                          if (quizChecked) return;
                          setQuizAnswers(prev => ({ ...prev, [q.id]: oIdx }));
                        }}
                        className={`p-3 text-left rounded-xl border duration-150 flex items-center justify-between ${btnClass}`}
                      >
                        <span>{opt}</span>
                        {quizChecked && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 ml-1" />}
                        {quizChecked && isChosen && !isCorrect && <XCircle className="w-4 h-4 text-red-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>

                {quizChecked && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-white border border-slate-100 rounded-xl text-[10.5px] text-slate-500 leading-relaxed font-sans"
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
                onClick={handleResetQuiz}
                className="text-xs font-bold text-slate-700 bg-slate-100 border px-4 py-2 rounded-xl hover:bg-slate-200"
              >
                重做本節題目
              </button>
            )}
            <button
              disabled={quizChecked || Object.keys(quizAnswers).length < sdnQuizQuestions.length}
              onClick={handleValidateQuiz}
              className="text-xs font-black bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl disabled:opacity-50 transition cursor-pointer shadow-sm"
            >
              提交 OpenFlow 答題結果
            </button>
          </div>

          {quizScore !== null && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="p-4 bg-slate-900 text-white font-mono text-xs rounded-xl flex items-center justify-between"
            >
              <div>
                <span className="text-blue-400 block font-bold text-[10px] tracking-wider uppercase">FLOW TABLE MATCH VERIFICATION</span>
                <strong className="text-sm">本節實測得分：<span className="text-yellow-405 font-extrabold">{quizScore} / 100</span></strong>
              </div>
              <span className="text-yellow-405 font-bold">
                {quizScore === 100 ? '🎉 匹配分析十分精確！恭喜滿分通關！' : '✍ 部分觀念可以重查對比，加油！'}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
