/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Search,
  Globe,
  Settings,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Network,
  Calculator,
  Compass,
  ArrowRight,
  Database,
  RotateCcw,
  Award
} from 'lucide-react';

// IP address conversion utilities with unsigned right shift to handle 32-bit JS overflow correctly
function ipToInt(ipStr: string): number {
  const parts = ipStr.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return 0;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function intToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255
  ].join('.');
}

function getOctetsBinary(ipStr: string): string[] {
  const parts = ipStr.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return ['00000000', '00000000', '00000000', '00000000'];
  return parts.map(p => {
    let s = p.toString(2);
    while (s.length < 8) s = '0' + s;
    return s;
  });
}

function makeMask(prefixLen: number): number {
  if (prefixLen === 0) return 0;
  return (~0 << (32 - prefixLen)) >>> 0;
}

interface SubnetHighlightDetail {
  id: string;
  name: string;
  subnetStr: string;
  interfaces: { name: string; ip: string; dev: string }[];
}

const SUBNETS_CONFIG: SubnetHighlightDetail[] = [
  {
    id: 'subnet-1',
    name: '子網路 1 (LAN 1)',
    subnetStr: '223.1.1.0/24',
    interfaces: [
      { name: 'PC A', ip: '223.1.1.1', dev: 'Host A' },
      { name: 'PC B', ip: '223.1.1.2', dev: 'Host B' },
      { name: 'Router Intf 1', ip: '223.1.1.110', dev: 'Router' }
    ]
  },
  {
    id: 'subnet-2',
    name: '子網路 2 (LAN 2)',
    subnetStr: '223.1.2.0/24',
    interfaces: [
      { name: 'PC C', ip: '223.1.2.1', dev: 'Host C' },
      { name: 'Router Intf 2', ip: '223.1.2.110', dev: 'Router' }
    ]
  },
  {
    id: 'subnet-3',
    name: '子網路 3 (LAN 3)',
    subnetStr: '223.1.3.0/24',
    interfaces: [
      { name: 'PC D', ip: '223.1.3.1', dev: 'Host D' },
      { name: 'PC E', ip: '223.1.3.2', dev: 'Host E' },
      { name: 'Router Intf 3', ip: '223.1.3.110', dev: 'Router' }
    ]
  }
];

// CIDR practice mode challenge database
interface CidrChallenge {
  id: number;
  ip: string;
  prefix: number;
  questionText: string;
  questionType: 'network_addr' | 'host_count' | 'broadcast_addr';
  correctAnswer: string; // We can check string matches
  options: string[];
  explanation: string;
}

const CIDR_CHALLENGES: CidrChallenge[] = [
  {
    id: 1,
    ip: '192.168.1.130',
    prefix: 26,
    questionText: '已知 IP 為 192.168.1.130，CIDR 記法為 /26，求該子網路的「網路位址 (Network Address)」是多少？',
    questionType: 'network_addr',
    correctAnswer: '192.168.1.128',
    options: ['192.168.1.0', '192.168.1.128', '192.168.1.64', '192.168.1.192'],
    explanation: '遮罩 /26 的二進位前段為 11000000 (即 192)。IP 的第四個 Octet 130 的二進位是 10000010。將其與 11000000 做 AND 運算，得到第四個 Octet 網路位為 10000000 = 128。因此網路位址為 192.168.1.128。'
  },
  {
    id: 2,
    ip: '200.23.16.0',
    prefix: 23,
    questionText: '對於 CIDR 地址規劃 200.23.16.0/23，該子網內「可分配給設備的最大可用主機數 (Usable Hosts)」是多少？',
    questionType: 'host_count',
    correctAnswer: '510',
    options: ['254', '512', '510', '1022'],
    explanation: '可用主機數公式為 2^(32 - prefix) - 2。此處 prefix 為 23，故主機部分位數占 32 - 23 = 9 bits。Usable Hosts = 2^9 - 2 = 512 - 2 = 510 個（扣除網路位址與廣播位址）。'
  },
  {
    id: 3,
    ip: '10.0.4.77',
    prefix: 22,
    questionText: '對於 IP 位址 10.0.4.77 /22，求其所屬子網路的「廣播位址 (Broadcast Address)」是什麼？',
    questionType: 'broadcast_addr',
    correctAnswer: '10.0.7.255',
    options: ['10.0.4.255', '10.0.7.255', '10.0.15.255', '10.0.3.255'],
    explanation: '/22 代表網路位占高 22 位，所以第三個 Octet 占高 6 位。4 的二進位是 00000100。將剩下 10 bits 全部填 1 即為廣播位址，第三個 Octet 的低 2 位填 1 變 00000111 = 7，第四個 Octet 填滿 1 即 255。故廣播地址為 10.0.7.255。'
  }
];

export function IpAddressingSubnets() {
  // IP Explainer states
  const [explainerIp, setExplainerIp] = useState<string>('223.1.1.1');
  const [binaryOctets, setBinaryOctets] = useState<string[]>(['11011111', '00000001', '00000001', '00000001']);

  // Update binary array when inputs change
  useEffect(() => {
    setBinaryOctets(getOctetsBinary(explainerIp));
  }, [explainerIp]);

  // Subnet visualizer interactive highlights
  const [selectedSubnetId, setSelectedSubnetId] = useState<string>('subnet-1');

  // CIDR Calculator states
  const [cidrIp, setCidrIp] = useState<string>('192.168.1.100');
  const [cidrPrefix, setCidrPrefix] = useState<number>(24);
  const [calcResults, setCalcResults] = useState<{
    subnetMask: string;
    networkAddress: string;
    broadcastAddress: string;
    firstUsable: string;
    lastUsable: string;
    usableCount: number;
    maskBinary: string;
    netBinary: string;
  } | null>(null);

  // Same Subnet Checker States
  const [ipA, setIpA] = useState<string>('192.168.1.45');
  const [ipB, setIpB] = useState<string>('192.168.1.80');
  const [checkerPrefix, setCheckerPrefix] = useState<number>(24);
  const [isSameSubnet, setIsSameSubnet] = useState<boolean | null>(null);

  // Practice States
  const [practiceActive, setPracticeActive] = useState<boolean>(false);
  const [pChallengeIdx, setPChallengeIdx] = useState<number>(0);
  const [pSelectedOpt, setPSelectedOpt] = useState<number | null>(null);
  const [pChecked, setPChecked] = useState<boolean>(false);
  const [pScore, setPScore] = useState<number>(0);

  // Trigger CIDR Calculations on inputs load
  useEffect(() => {
    runCidrCalculation();
  }, [cidrIp, cidrPrefix]);

  // Trigger Same Subnet Checker
  useEffect(() => {
    runSameSubnetCheck();
  }, [ipA, ipB, checkerPrefix]);

  const runCidrCalculation = () => {
    const parts = cidrIp.split('.').map(Number);
    if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
      setCalcResults(null);
      return;
    }
    if (cidrPrefix < 0 || cidrPrefix > 32) {
      setCalcResults(null);
      return;
    }

    const ipVal = ipToInt(cidrIp);
    const maskVal = makeMask(cidrPrefix);
    const netVal = (ipVal & maskVal) >>> 0;
    const bcastVal = (netVal | ~maskVal) >>> 0;

    let usableCount = 0;
    let firstUsable = 'N/A';
    let lastUsable = 'N/A';

    if (cidrPrefix <= 30) {
      usableCount = Math.pow(2, 32 - cidrPrefix) - 2;
      firstUsable = intToIp((netVal + 1) >>> 0);
      lastUsable = intToIp((bcastVal - 1) >>> 0);
    } else if (cidrPrefix === 31) {
      usableCount = 2;
      firstUsable = intToIp(netVal);
      lastUsable = intToIp(bcastVal);
    } else {
      usableCount = 1;
      firstUsable = intToIp(netVal);
      lastUsable = intToIp(netVal);
    }

    // Binary format
    const formatIntToBin = (val: number) => {
      const s = (val >>> 0).toString(2).padStart(32, '0');
      return s.match(/.{1,8}/g)?.join(' ') || '';
    };

    setCalcResults({
      subnetMask: intToIp(maskVal),
      networkAddress: intToIp(netVal),
      broadcastAddress: intToIp(bcastVal),
      firstUsable,
      lastUsable,
      usableCount,
      maskBinary: formatIntToBin(maskVal),
      netBinary: formatIntToBin(netVal)
    });
  };

  const runSameSubnetCheck = () => {
    const partsA = ipA.split('.').map(Number);
    const partsB = ipB.split('.').map(Number);
    if (partsA.length !== 4 || partsA.some(isNaN) || partsB.length !== 4 || partsB.some(isNaN)) {
      setIsSameSubnet(null);
      return;
    }

    const valA = ipToInt(ipA);
    const valB = ipToInt(ipB);
    const mask = makeMask(checkerPrefix);

    const match = (valA & mask) === (valB & mask);
    setIsSameSubnet(match);
  };

  const handleCidrPracticeAnswer = (optIdx: number) => {
    if (pChecked) return;
    setPSelectedOpt(optIdx);
    setPChecked(true);

    const challenge = CIDR_CHALLENGES[pChallengeIdx];
    const optionSelected = challenge.options[optIdx];
    if (optionSelected === challenge.correctAnswer) {
      setPScore(prev => prev + 1);
    }
  };

  const handleNextCidrChallenge = () => {
    setPSelectedOpt(null);
    setPChecked(false);
    if (pChallengeIdx < CIDR_CHALLENGES.length - 1) {
      setPChallengeIdx(prev => prev + 1);
    } else {
      setPChallengeIdx(0); // Loop back or complete
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* SECTION 1: IP DECIMAL TO BINARY CONVERTER */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] bg-blue-100 text-blue-805 font-extrabold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
              IP REPRESENTATION EXPLORER
            </span>
            <h3 className="text-lg font-black text-slate-850 mt-0.5">IP 位址結構與二進位轉換原理</h3>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          一個 IPv4 位址本質上是由 <strong>32 個位元 (32 bits)</strong> 組成的無正負號整數。為了便於人類閱讀，採用十進位標點格式。請在下方輸入任意 IP 位址，即時分析各 Octet 位元組的二進位形式：
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-4 bg-slate-50 border rounded-xl p-4 space-y-2">
            <label className="block text-xs font-bold text-slate-500">
              請輸入 IPv4 位址：
            </label>
            <input
              type="text"
              id="explainer-ip-input"
              value={explainerIp}
              onChange={(e) => setExplainerIp(e.target.value)}
              className="w-full text-base font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-400 block font-mono">預設為本節開頭範例：223.1.1.1</span>
          </div>

          <div className="md:col-span-8 bg-white border rounded-xl p-4 shadow-sm grid grid-cols-4 gap-2 text-center font-mono select-none">
            {binaryOctets.map((bin, idx) => {
              const decimalValue = explainerIp.split('.')[idx] || '0';
              return (
                <div key={idx} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold block">OCTET #{idx + 1}</span>
                  <span className="text-lg font-black text-blue-600 block">{decimalValue}</span>
                  <span className="text-[10px] font-bold text-slate-600 block bg-white px-1.5 py-0.5 rounded border border-blue-50 shadow-sm leading-none py-1">
                    {bin}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 2: INTERFACE & SUBNET DIAGRAM VISUALIZATION */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 mb-5 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
                SUBNET ISLAND ARCHITECTURE
              </span>
              <h3 className="text-lg font-black text-slate-800 mt-0.5">IP 介面與「子網路孤島」實景特徵</h3>
            </div>
          </div>

          <div className="flex bg-slate-200/50 p-1 rounded-xl">
            {SUBNETS_CONFIG.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubnetId(sub.id)}
                className={`text-[11px] font-black px-3.5 py-1.5 rounded-lg transition duration-200 ${
                  selectedSubnetId === sub.id
                    ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100'
                    : 'text-slate-650 hover:text-slate-800'
                }`}
              >
                {sub.subnetStr}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* LAN graphical structure highlights based on selection */}
          <div className="lg:col-span-8 bg-slate-50 border rounded-2xl p-6 relative overflow-hidden min-h-[220px] flex flex-col justify-between">
            <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">
              網路拓樸示意圖 (三個 LAN 藉由一台中央路由器互連)
            </h4>

            {/* Static layout representing 3 subnets and 1 router */}
            <div className="grid grid-cols-3 gap-4 items-center justify-center py-4 relative">
              {/* LAN 1 island block */}
              <div
                onClick={() => setSelectedSubnetId('subnet-1')}
                className={`p-3.5 rounded-2xl border-2 transition duration-300 text-center cursor-pointer ${
                  selectedSubnetId === 'subnet-1'
                    ? 'bg-blue-50 border-blue-500 scale-102 ring-4 ring-blue-100'
                    : 'bg-white border-slate-200 hover:border-slate-350'
                }`}
              >
                <div className="font-extrabold text-[11px] text-blue-600">Subnet 1 (LAN 1)</div>
                <div className="font-mono text-[10px] font-bold text-slate-400 mt-0.5">223.1.1.0/24</div>
                <div className="flex gap-2 justify-center mt-2.5">
                  <div className="bg-slate-100 p-1 rounded text-[9px] font-mono leading-none font-bold shadow-sm">
                    PC A: .1
                  </div>
                  <div className="bg-slate-100 p-1 rounded text-[9px] font-mono leading-none font-bold shadow-sm">
                    PC B: .2
                  </div>
                </div>
              </div>

              {/* Central Router */}
              <div className="flex flex-col items-center justify-center p-3 bg-slate-850 text-white rounded-xl border border-slate-705 relative max-w-[120px] mx-auto z-10">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full block animate-ping absolute -top-1 -right-1" />
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full block absolute -top-1 -right-1" />
                <span className="text-[10px] font-extrabold">Router</span>
                <span className="text-[8px] font-mono text-slate-400 mt-1">3 Interfaces:</span>
                <span className="text-[7.5px] font-mono text-blue-400 leading-tight">1.1.110 | 1.2.110 | 1.3.110</span>
              </div>

              {/* LAN 3 island block */}
              <div
                onClick={() => setSelectedSubnetId('subnet-3')}
                className={`p-3.5 rounded-2xl border-2 transition duration-300 text-center cursor-pointer ${
                  selectedSubnetId === 'subnet-3'
                    ? 'bg-indigo-50 border-indigo-500 scale-102 ring-4 ring-indigo-100'
                    : 'bg-white border-slate-200 hover:border-slate-350'
                }`}
              >
                <div className="font-extrabold text-[11px] text-indigo-600">Subnet 3 (LAN 3)</div>
                <div className="font-mono text-[10px] font-bold text-slate-400 mt-0.5">223.1.3.0/24</div>
                <div className="flex gap-2 justify-center mt-2.5">
                  <div className="bg-slate-100 p-1 rounded text-[9px] font-mono leading-none font-bold shadow-sm">
                    PC D: .1
                  </div>
                  <div className="bg-slate-100 p-1 rounded text-[9px] font-mono leading-none font-bold shadow-sm">
                    PC E: .2
                  </div>
                </div>
              </div>

              {/* Central bottom LAN 2 island link */}
              <div className="col-span-3 flex justify-center mt-4">
                <div
                  onClick={() => setSelectedSubnetId('subnet-2')}
                  className={`p-3.5 rounded-2xl border-2 transition duration-300 text-center cursor-pointer max-w-[200px] w-full ${
                    selectedSubnetId === 'subnet-2'
                      ? 'bg-emerald-50 border-emerald-550 scale-102 ring-4 ring-emerald-100'
                      : 'bg-white border-slate-200 hover:border-slate-350'
                  }`}
                >
                  <div className="font-extrabold text-[11px] text-emerald-600">Subnet 2 (LAN 2)</div>
                  <div className="font-mono text-[10px] font-bold text-slate-400 mt-0.5">223.1.2.0/24</div>
                  <div className="bg-slate-100 p-1.5 rounded text-[9px] font-mono leading-none font-bold shadow-sm mt-2 max-w-[100px] mx-auto">
                    PC C: .1
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] bg-slate-900 text-slate-300 rounded-xl p-3 font-mono leading-relaxed mt-2">
              👉 <strong className="text-white">網路介面概念 (Interfaces)：</strong> IP 位址不是指配給單個「主機裝置」，而是指配給每個固有的 <strong>實體網卡介面 (Interface)</strong>。一個主機若有兩張網卡（如乙太網及Wi-Fi）則有兩個 IP；而中間轉送的路由器，通常連接多個網段，因此擁有數個不同的介面和 IP。
            </div>
          </div>

          {/* Connected interfaces lists inside selected subnet */}
          <div className="lg:col-span-4 bg-white border rounded-2xl p-5 space-y-4 shadow-sm h-full flex flex-col justify-between">
            <div>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded-md font-mono">
                {SUBNETS_CONFIG.find(c => c.id === selectedSubnetId)?.subnetStr}
              </span>
              <h4 className="text-sm font-black text-slate-800 mt-2.5 mb-1">
                所屬子網路內介面列表：
              </h4>
              <p className="text-[11px] text-slate-500 mb-3.5 leading-relaxed">
                以下設備介面在主幹線上屬於同一個「子網路孤島」，彼此可在不經過中繼路由器下，直接透過 L2 交換技術進行暢通直連通訊：
              </p>

              <div className="space-y-2">
                {SUBNETS_CONFIG.find(c => c.id === selectedSubnetId)?.interfaces.map((intf, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-slate-700">{intf.name}</span>
                    <span className="text-blue-600 font-bold">{intf.ip}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed font-semibold">
              ⚠️ 如果 PC A 想要傳送封包給不同網段的 PC C，封包必須先依靠 MAC 層發送到其對應子網段內的 Default Gateway（即路由器介面 223.1.1.110），再由其轉發。
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: CIDR CALCULATOR */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Calculator className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <span className="text-[10px] bg-emerald-100 text-emerald-805 font-extrabold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
              REAL-TIME CIDR SUBNET MATCH
            </span>
            <h3 className="text-lg font-black text-slate-805 mt-0.5">以特定首碼長度精準試算 CIDR 遮罩</h3>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          現代網際網路擺脫了 A/B/C 類別定址的教條，採用無類別網域間路由 (CIDR)。請在此输入主機 IP 與預置位首碼長度 (0..32 bits)，獲得精準無誤的子網路規劃數據：
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Controls */}
          <div className="lg:col-span-4 bg-slate-50 border rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                目標主機 IP：
              </label>
              <input
                type="text"
                id="cidr-ip-input"
                value={cidrIp}
                onChange={(e) => setCidrIp(e.target.value)}
                className="w-full text-sm font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-550"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-500">
                  首碼長度 (Prefix Length):
                </label>
                <span className="text-xs font-black font-mono text-emerald-600">/{cidrPrefix} bits</span>
              </div>
              <input
                type="range"
                id="cidr-prefix-range"
                min="0"
                max="32"
                value={cidrPrefix}
                onChange={(e) => setCidrPrefix(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
          </div>

          {/* Results Block */}
          <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            {calcResults ? (
              <div className="space-y-4 select-none">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 block tracking-wider uppercase">子網路遮罩 (Mask)</span>
                    <span className="text-xs font-mono font-black text-slate-700">{calcResults.subnetMask}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 block tracking-wider uppercase">網路位址 (Network IP)</span>
                    <span className="text-xs font-mono font-black text-blue-600">{calcResults.networkAddress}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded-xl col-span-2 md:col-span-1">
                    <span className="text-[9px] font-bold text-slate-400 block tracking-wider uppercase">廣播位址 (Broadcast IP)</span>
                    <span className="text-xs font-mono font-black text-red-500">{calcResults.broadcastAddress}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 border border-indigo-150 bg-indigo-50/20 rounded-xl">
                    <span className="text-[9px] font-bold text-indigo-500 block uppercase">可用主機範圍 (Usable Range)</span>
                    <span className="text-[11px] font-mono font-black text-indigo-700 block mt-0.5">
                      {calcResults.firstUsable} ➔ {calcResults.lastUsable}
                    </span>
                  </div>

                  <div className="p-3 border border-emerald-150 bg-emerald-50/20 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-emerald-500 block uppercase">可用主機總量 (Usable count)</span>
                      <span className="text-base font-mono font-black text-emerald-700">
                        {calcResults.usableCount.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono font-semibold">2^(32-/{cidrPrefix}) - 2</span>
                  </div>
                </div>

                {/* Binary trace in CIDR */}
                <div className="border-t pt-3 space-y-2">
                  <div className="font-mono text-[10px] space-y-1 bg-slate-900 text-slate-400 p-3 rounded-lg overflow-x-auto leading-relaxed">
                    <div className="flex justify-between border-b border-slate-800 pb-1 text-slate-300">
                      <span>網路及主機位元分解 (Binary Representation)</span>
                      <span className="text-emerald-400">/{cidrPrefix} 劃分</span>
                    </div>
                    <div className="pt-1.5">
                      <span className="text-slate-500 inline-block w-20">IP Address:</span>
                      <span className="text-white font-bold">
                        {getOctetsBinary(cidrIp).join(' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 inline-block w-20">Subnet Mask:</span>
                      <span className="text-slate-300 font-bold">{calcResults.maskBinary}</span>
                    </div>
                    <div className="text-emerald-400">
                      <span className="text-slate-500 inline-block w-20">Network ID:</span>
                      <strong>{calcResults.netBinary}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-red-500 font-mono font-semibold">
                ⚠️ 輸入的 IP 地址格式錯誤，請確保為 4 個十進位（0 ~ 255）點分位格式。
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: SAME SUBNET CHECKER */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5 border-b pb-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800">「同屬一子網絡」雙 IP 比對校驗</h4>
            <span className="text-[10px] text-slate-400 font-bold block">校對兩台端點在指定的遮罩下是否可以直接傳遞 L2 封包</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Inputs */}
          <div className="lg:col-span-4 bg-slate-50 border rounded-2xl p-5 space-y-4 text-xs">
            <div className="space-y-1">
              <label className="block font-bold text-slate-550">端點主機 A IP 地址：</label>
              <input
                type="text"
                id="checker-ip-a"
                value={ipA}
                onChange={e => setIpA(e.target.value)}
                className="w-full font-mono text-xs font-bold px-3 py-2 bg-white border rounded-lg focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-550">端點主機 B IP 地址：</label>
              <input
                type="text"
                id="checker-ip-b"
                value={ipB}
                onChange={e => setIpB(e.target.value)}
                className="w-full font-mono text-xs font-bold px-3 py-2 bg-white border rounded-lg focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold text-slate-550">
                <span>比對遮罩 (Prefix):</span>
                <span className="text-indigo-600 font-mono">/{checkerPrefix} bits</span>
              </div>
              <input
                type="range"
                id="checker-prefix-range"
                min="1"
                max="32"
                value={checkerPrefix}
                onChange={e => setCheckerPrefix(Number(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded accent-indigo-600"
              />
            </div>
          </div>

          {/* Verdict and Octet Bit Match */}
          <div className="lg:col-span-8 bg-white border rounded-2xl p-5 shadow-sm space-y-4">
            {isSameSubnet !== null ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                  isSameSubnet 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {isSameSubnet ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                      <div>
                        <strong className="text-xs block">比對宣告：處於同一個子網路（Same Subnet）!</strong>
                        <p className="text-[11px] mt-0.5 opacity-90 leading-tight">PC A 與 PC B 開頭的前 {checkerPrefix} 位完全一致。它們能直接透過區域交換機通訊，不需要中介路由器。</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-600 shrink-0" />
                      <div>
                        <strong className="text-xs block">比對宣告：非同屬一子網站（Different Subnet）!</strong>
                        <p className="text-[11px] mt-0.5 opacity-90 leading-tight">由于前 {checkerPrefix} 位部分不一致，它們無法進行 L2 直連。PC A 必須將封包交給 Gateway 進行三層路由轉送。</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="font-mono text-[10px] bg-slate-900 text-slate-400 p-3 rounded-lg space-y-1 leading-relaxed">
                  <div className="text-slate-350 border-b border-slate-800 pb-1 font-bold">第三層二進位 IP 遮罩序列對照：</div>
                  <div>
                    <span className="text-slate-500 inline-block w-12">IP A:</span>
                    <span className="text-white">{getOctetsBinary(ipA).join(' ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 inline-block w-12">IP B:</span>
                    <span className="text-white">{getOctetsBinary(ipB).join(' ')}</span>
                  </div>
                  <div className="text-indigo-400">
                    <span className="text-slate-500 inline-block w-12">Mask:</span>
                    <span>{intToIp(makeMask(checkerPrefix))}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 italic font-semibold">
                請輸入正確格式的雙主機範例 IP 以展開檢視
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 5: CIDR PRACTICE CHALLENGE */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b pb-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800">隨堂子網遮罩 CIDR 位元預測擂台</h4>
              <span className="text-[10px] text-slate-400 font-bold block">利用動態挑戰鑑定您的網路劃分功底</span>
            </div>
          </div>

          {!practiceActive && (
            <button
              onClick={() => {
                setPracticeActive(true);
                setPChallengeIdx(0);
                setPChecked(false);
                setPSelectedOpt(null);
                setPScore(0);
              }}
              className="text-xs font-black bg-emerald-650 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-center duration-200"
            >
              挑戰 CIDR 實戰
            </button>
          )}
        </div>

        {practiceActive && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 font-mono">
              <span>CIDR 口試檢定 ➔ 挑戰 #{pChallengeIdx + 1}</span>
              <span>目前得分：{pScore} / {CIDR_CHALLENGES.length}</span>
            </div>

            <div className="p-4 bg-slate-50 border rounded-xl space-y-1">
              <span className="text-[9px] bg-blue-100 text-blue-700 py-0.5 px-1.5 rounded uppercase font-bold font-mono">
                練習對象：{CIDR_CHALLENGES[pChallengeIdx].ip} /{CIDR_CHALLENGES[pChallengeIdx].prefix}
              </span>
              <p className="text-xs font-black text-slate-705 leading-relaxed font-mono">
                {CIDR_CHALLENGES[pChallengeIdx].questionText}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CIDR_CHALLENGES[pChallengeIdx].options.map((opt, idx) => {
                const isSelected = pSelectedOpt === idx;
                const isCorrectVal = opt === CIDR_CHALLENGES[pChallengeIdx].correctAnswer;
                let btnClass = 'border-slate-205 bg-white hover:bg-slate-50';

                if (pChecked) {
                  if (isCorrectVal) {
                    btnClass = 'border-green-450 bg-green-50 text-green-800';
                  } else if (isSelected) {
                    btnClass = 'border-red-450 bg-red-50 text-red-800';
                  } else {
                    btnClass = 'border-slate-100 bg-slate-50/50 text-slate-400 cursor-not-allowed';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={pChecked}
                    onClick={() => handleCidrPracticeAnswer(idx)}
                    className={`p-3 text-left border rounded-xl text-xs font-mono font-bold leading-relaxed transition-all duration-200 ${btnClass}`}
                  >
                    <span>{String.fromCharCode(65 + idx)}) </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {pChecked && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl font-mono text-xs leading-relaxed space-y-2 bg-blue-50/50 border border-blue-150 text-blue-800"
              >
                <div className="font-extrabold flex items-center gap-2">
                  <span>答案解密：</span>
                  <span className="bg-white border rounded px-1.5 text-blue-700 text-[11px]">
                    {CIDR_CHALLENGES[pChallengeIdx].correctAnswer}
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-650 bg-white/60 p-2.5 rounded-lg border leading-relaxed">
                  <strong>深度解析：</strong> {CIDR_CHALLENGES[pChallengeIdx].explanation}
                </p>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleNextCidrChallenge}
                    className="flex items-center gap-1 text-[11px] font-black bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl"
                  >
                    <span>{pChallengeIdx === CIDR_CHALLENGES.length - 1 ? '重新輪替練習' : '本題完畢，下一題 ➔'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
