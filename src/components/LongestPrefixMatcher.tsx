/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Hash,
  Play,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Sparkles,
  Layers,
  Cpu,
} from 'lucide-react';

interface PrefixRule {
  id: number;
  name: string;
  cidr: string;
  prefixBinary: string; // The bits that must match
  prefixLength: number;
  interfaceId: number;
  description: string;
}

const FORWARDING_TABLE: PrefixRule[] = [
  {
    id: 0,
    name: '路由子網 A',
    cidr: '200.23.16.0/20',
    prefixBinary: '11001000000101110001', // 20 bits
    prefixLength: 20,
    interfaceId: 0,
    description: '涵蓋 200.23.16.0 至 200.23.31.255 的子網段',
  },
  {
    id: 1,
    name: '路由子網 B',
    cidr: '200.23.18.0/23',
    prefixBinary: '11001000000101110001001', // 23 bits
    prefixLength: 23,
    interfaceId: 1,
    description: '涵蓋 200.23.18.0 至 200.23.19.255 的更特定子網段',
  },
  {
    id: 2,
    name: '路由子網 C',
    cidr: '200.23.20.0/23',
    prefixBinary: '11001000000101110001010', // 23 bits
    prefixLength: 23,
    interfaceId: 2,
    description: '涵蓋 200.23.20.0 至 200.23.21.255 的更特定子網段',
  },
  {
    id: 3,
    name: '預設路徑 (Default Route)',
    cidr: 'otherwise',
    prefixBinary: '',
    prefixLength: 0,
    interfaceId: 3,
    description: '萬用不匹配時的預設路由（對應 Interface 3）',
  },
];

const PRESETS = [
  { ip: '200.23.18.5', label: '200.23.18.5 (雙匹配 /20, /23 A)' },
  { ip: '200.23.20.8', label: '200.23.20.8 (雙匹配 /20, /23 B)' },
  { ip: '200.23.31.1', label: '200.23.31.1 (單一匹配 /20 版)' },
  { ip: '8.8.8.8', label: '8.8.8.8 (無匹敵 預設外部路由)' },
];

const RANDOM_QUESTION_POOL = [
  { ip: '200.23.18.15', correctInterface: 1, explanation: '200.23.18.15 轉為二進位前 23 位元與 200.23.18.0/23 完全吻合，同時也與 200.23.16.0/20 吻合。依「最長字首匹配」原則，/23 比 /20 更加具體特定，因此選擇 Interface 1。' },
  { ip: '200.23.21.99', correctInterface: 2, explanation: '200.23.21.99 的第三個八位元是 21 (00010101)。其前 23 位元符合 200.23.20.0/23 的字首（11001000.00010111.0001010*），同時也符合 /20（長度 20）。因 /23 位元長度較大，選擇更特定的 Interface 2。' },
  { ip: '200.23.30.254', correctInterface: 0, explanation: '200.23.30.254 的第一個與第二個八位元為 200.23，第三個八位元為 30 (00011110)。比對前 20 位（11001000.00010111.0001****）符合 200.23.16.0/20。不符合 /23 的兩個網段，因此選擇唯一的匹配 Interface 0。' },
  { ip: '140.112.5.5', correctInterface: 3, explanation: '140.112.5.5 的首碼非 200.23 開頭，路由表內與 A、B、C 規則皆不相符。故直接套入「預設路由 (otherwise)」，導向 Interface 3。' },
  { ip: '200.23.24.12', correctInterface: 0, explanation: '200.23.24.12 的第三個八位元為 24 (00011000)。前 20 位元與 200.23.16.0/20（字首 11001000.00010111.0001）相符。不符合另外兩個 /23 首碼，故轉送至 Interface 0。' },
  { ip: '192.168.1.1', correctInterface: 3, explanation: '192.168.1.1 開頭完全對不上有罩子網，歸入 Default otherwise，轉送至 Interface 3。' }
];

export function LongestPrefixMatcher() {
  const [ipAddress, setIpAddress] = useState<string>('200.23.18.5');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Practice State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedPracticeAnswer, setSelectedPracticeAnswer] = useState<number | null>(null);
  const [practiceChecked, setPracticeChecked] = useState<boolean>(false);
  const [practiceScore, setPracticeScore] = useState({ correct: 0, total: 0 });

  // Parsing & matching helper
  const parseIpToBinaryString = (ip: string): string => {
    const parts = ip.split('.').map(p => parseInt(p, 10));
    return parts
      .map(part => {
        let bin = part.toString(2);
        while (bin.length < 8) bin = '0' + bin;
        return bin;
      })
      .join('');
  };

  const validateIp = (ip: string): boolean => {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every(part => {
      const num = Number(part);
      return !isNaN(num) && num >= 0 && num <= 255 && part.trim() !== '';
    });
  };

  const currentBinary = validateIp(ipAddress) ? parseIpToBinaryString(ipAddress) : '';

  // Calculate matching details for each forwarding rule
  const getRuleMatchDetails = (rule: PrefixRule, targetBin: string) => {
    if (!targetBin || rule.prefixLength === 0) {
      return { matches: rule.prefixLength === 0, matchCount: 0, misMatchPos: -1 };
    }

    let matchCount = 0;
    let misMatchPos = -1;

    for (let i = 0; i < rule.prefixLength; i++) {
      if (targetBin[i] === rule.prefixBinary[i]) {
        matchCount++;
      } else {
        misMatchPos = i;
        break;
      }
    }

    const matches = matchCount === rule.prefixLength;
    return { matches, matchCount, misMatchPos };
  };

  // Find the winner
  let winningRuleId = 3; // default router is otherwise (id 3 / index 3)
  let maxMatchedLength = -1;

  if (validateIp(ipAddress)) {
    const binary = parseIpToBinaryString(ipAddress);
    FORWARDING_TABLE.forEach(rule => {
      if (rule.prefixLength > 0) {
        const details = getRuleMatchDetails(rule, binary);
        if (details.matches && rule.prefixLength > maxMatchedLength) {
          maxMatchedLength = rule.prefixLength;
          winningRuleId = rule.id;
        }
      }
    });
  }

  const handleIpChange = (val: string) => {
    setIpAddress(val);
    if (!validateIp(val)) {
      setErrorMsg('請輸入合法的 IPv4 地址格式（如 200.23.18.5）');
    } else {
      setErrorMsg(null);
    }
  };

  const handlePracticeAnswer = (option: number) => {
    if (practiceChecked) return;
    setSelectedPracticeAnswer(option);
  };

  const handlePracticeSubmit = () => {
    if (selectedPracticeAnswer === null || practiceChecked) return;
    setPracticeChecked(true);
    const isCorrect = selectedPracticeAnswer === RANDOM_QUESTION_POOL[currentQuestionIdx].correctInterface;
    setPracticeScore(prev => ({
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      total: prev.total + 1,
    }));
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIdx((prev) => (prev + 1) % RANDOM_QUESTION_POOL.length);
    setSelectedPracticeAnswer(null);
    setPracticeChecked(false);
  };

  const handleRestartPractice = () => {
    setCurrentQuestionIdx(0);
    setSelectedPracticeAnswer(null);
    setPracticeChecked(false);
    setPracticeScore({ correct: 0, total: 0 });
  };

  // Format Helper for binary blocks visualization
  const renderBinaryBlocks = (rule: PrefixRule, targetBin: string) => {
    if (!targetBin) return null;

    // We render 32 bits as styled blocks
    const blocks: any[] = [];
    const details = getRuleMatchDetails(rule, targetBin);

    for (let i = 0; i < 32; i++) {
      let colorClass = 'bg-slate-100 text-slate-500 border-slate-200'; // Default gray
      let label = 'H'; // Host bit by default

      if (rule.prefixLength > 0) {
        if (i < rule.prefixLength) {
          // It's a prefix bit
          label = 'P';
          if (details.matches) {
            colorClass = 'bg-emerald-500 text-white border-emerald-600 font-bold'; // Matched prefix bits in green
          } else {
            // Unmatched rule
            if (i <= (details.misMatchPos >= 0 ? details.misMatchPos : 0)) {
              // Up to mismatch position, it matched, but if total rule didn't match, we color prefix bits as gray
              colorClass = 'bg-slate-400 text-white border-slate-500';
            } else {
              colorClass = 'bg-slate-300 text-slate-600 border-slate-400'; // Mismatched prefix bits in gray
            }
          }
        } else {
          // Host bits
          label = 'H';
          // Highlight host bits in blue if the prefix is fully matched
          if (details.matches) {
            colorClass = 'bg-blue-500 text-white border-blue-600 font-semibold';
          } else {
            colorClass = 'bg-slate-100 text-slate-400 border-slate-200';
          }
        }
      } else {
        // otherwise default rule: all 32 bits are host-like or unmatched prefix-like
        if (winningRuleId === 3) {
          colorClass = 'bg-blue-500 text-white border-blue-600 font-semibold';
        } else {
          colorClass = 'bg-slate-100 text-slate-400 border-slate-200';
        }
      }

      // Draw dot separator between octets
      blocks.push(
        <div key={i} className="flex items-center gap-0.5">
          <span
            className={`w-5 h-7 md:w-6 md:h-8 border text-center flex items-center justify-center text-[10px] font-mono rounded shadow-xs transition-colors duration-300 ${colorClass}`}
            title={`Bit ${i}: ${targetBin[i]} (${label === 'P' ? '字首位元' : '主機位元'})`}
          >
            {targetBin[i]}
          </span>
          {(i === 7 || i === 15 || i === 23) && (
            <span className="text-slate-400 font-black text-xs px-0.5 select-none">•</span>
          )}
        </div>
      );
    }

    return <div className="flex flex-wrap gap-0.5 md:gap-1 items-center">{blocks}</div>;
  };

  const getMatchedBitsTextForExplanation = (ip: string, rule: PrefixRule) => {
    if (!validateIp(ip) || rule.prefixLength === 0) return '';
    const bin = parseIpToBinaryString(ip);
    const rule_bin = rule.prefixBinary;
    let matching_string = '';
    for (let i = 0; i < rule.prefixLength; i++) {
      if (bin[i] === rule_bin[i]) {
        matching_string += bin[i];
      } else {
        break;
      }
    }
    return matching_string;
  };

  return (
    <div className="space-y-10" id="longest-prefix-matcher-playground">
      {/* 1. CONCEPT EXPLANATION */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-xs text-left space-y-6">
        <div className="space-y-1">
          <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-705 font-bold font-mono text-[10px] rounded tracking-wider uppercase">
            核心概念詳解 (LPM Architecture)
          </span>
          <h3 className="text-xl font-black text-slate-800">
            最長字首匹配演算法 (Longest Prefix Matching, LPM)
          </h3>
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            當一個 IP 封包抵達路由器，路由器必須在一瞬間決定該將它從哪個實體介面發送。這正是 LPM 精妙硬體匹配機制的舞台：
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-blue-100 text-blue-700 font-bold shrink-0"><Layers className="w-4 h-4" /></span>
              <h4 className="text-xs font-black text-slate-800">1. 最長首碼優先</h4>
            </div>
            <p className="text-[11px] text-slate-650 font-normal leading-relaxed">
              如果轉送表中有複數條規則（如 <code className="bg-slate-100 px-1 rounded">/20</code> 與 <code className="bg-slate-100 px-1 rounded">/23</code>）皆符合目的地 IP 開頭，則<b>字首遮罩最長（Prefix Length 較大）</b>、即最具體而特定的那條路由勝出。
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-orange-100 text-orange-700 font-bold shrink-0"><Cpu className="w-4 h-4" /></span>
              <h4 className="text-xs font-black text-slate-800">2. 快速硬體輔助 (TCAM)</h4>
            </div>
            <p className="text-[11px] text-slate-650 font-normal leading-relaxed">
              在現代超高吞吐量骨幹核心中，路由器使用<b>三態內容可定址記憶體 (TCAM)</b>。這種類型記憶體能在一個時脈週期內一網打盡所有項目，實現並行匹配，瞬間完成。
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-100 text-amber-700 font-bold shrink-0"><BookOpen className="w-4 h-4" /></span>
              <h4 className="text-xs font-black text-slate-800">3. 預設路由備案</h4>
            </div>
            <p className="text-[11px] text-slate-650 font-normal leading-relaxed">
              當 IP 位址與路由表中所有子網字首完全不符合，將 fallback 引用唯一的<b>預設路由 (Default Route / otherwise)</b>。通常對接通往 Internet 頂層網閘的 Interface 3 出口。
            </p>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE SIMULATOR */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-xs text-left space-y-6">
        <div>
          <h3 className="text-lg font-black text-slate-800">
            比對匹配與字首轉譯實驗室 (Live Matching & Binary Visualizer)
          </h3>
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            在下方輸入任意目的地 IPv4，或點選高頻經典測試 Preset，親眼觀察 32 位元大小中 IP 前置遮罩的比對：
          </p>
        </div>

        {/* Input box & Presets */}
        <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-8 space-y-1 bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
              <label htmlFor="destination-ip-field" className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                請輸入目的地 IPv4 地址 (Destination IP Address)
              </label>
              <input
                id="destination-ip-field"
                type="text"
                value={ipAddress}
                onChange={(e) => handleIpChange(e.target.value)}
                placeholder="例如: 200.23.18.5"
                className="w-full font-mono text-base font-black text-slate-800 focus:outline-none placeholder-slate-300"
              />
            </div>
            <div className="md:col-span-4">
              <button
                id="btn-clear-ip"
                onClick={() => handleIpChange('200.23.18.5')}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-3 bg-white border border-slate-200 hover:border-slate-350 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重置原設定值</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-bold flex items-center gap-1.5 leading-normal">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">
              點擊快速套用經典測試案例 (Presets)：
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  id={`preset-${idx}`}
                  onClick={() => handleIpChange(p.ip)}
                  className={`px-3 py-1.5 border hover:border-slate-350 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    ipAddress === p.ip
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Binary representation & Winner declaration */}
        {validateIp(ipAddress) && (
          <div className="p-5 border border-indigo-200 bg-indigo-50/40 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-755 border border-indigo-250 text-[9px] font-bold font-mono rounded tracking-wider uppercase">
                輸入位址轉譯
              </span>
              <div className="font-mono text-sm md:text-base font-black text-slate-800 flex flex-wrap items-center gap-2">
                <span>{ipAddress}</span>
                <span className="text-slate-400 font-normal text-xs">=</span>
                <span className="text-indigo-600 tracking-wider">
                  {currentBinary.substring(0, 8)}.{currentBinary.substring(8, 16)}.{currentBinary.substring(16, 24)}.{currentBinary.substring(24)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-normal">
                💡 輸入之 32 位元二進位（Binary）字串被對照用作以下 Prefix 逐一比對。
              </p>
            </div>

            <div className="p-3.5 bg-white border border-indigo-150 rounded-xl shadow-xs self-stretch md:self-auto flex flex-col justify-center items-center md:items-end text-center md:text-right">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                這場對決決策勝出 (Decision Winner)
              </span>
              <span className="text-xl font-black text-emerald-600 block mt-1">
                介面 Interface {winningRuleId}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                {winningRuleId === 3
                  ? '落入萬用 Default 路由，介面 3 送出'
                  : `遮罩優勢長度：/${FORWARDING_TABLE[winningRuleId].prefixLength} bits`}
              </span>
            </div>
          </div>
        )}

        {/* 3. FORWARDING TABLE AND VISUALIZATION */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              路由器轉送表比對演算 (Forwarding Table Binary Compare Grid)
            </span>
            <div className="flex gap-4 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 綠: 首匹配
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> 灰: Mismatch
              </span>
              <span className="flex items-center gap-1 text-blue-600">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> 藍: Host位元
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {FORWARDING_TABLE.map((rule, idx) => {
              const isWinner = winningRuleId === rule.id;
              let matchDetails = validateIp(ipAddress)
                ? getRuleMatchDetails(rule, currentBinary)
                : { matches: false, matchCount: 0, misMatchPos: -1 };

              return (
                <div
                  key={rule.id}
                  id={`matcher-rule-${rule.id}`}
                  className={`border rounded-2xl p-4 md:p-5 transition-all duration-305 text-left relative overflow-hidden flex flex-col gap-3 ${
                    isWinner
                      ? 'border-emerald-500 bg-emerald-50/10 shadow-sm shadow-emerald-50/30'
                      : 'border-slate-150 bg-white'
                  }`}
                >
                  {isWinner && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-bl">
                      獲選最長匹配 (LPM WINNER)
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isWinner ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        <span className="text-xs font-bold text-slate-800">{rule.name}</span>
                        <span className="font-mono text-xs font-black bg-slate-100 px-1.5 py-0.5 rounded text-amber-800">
                          {rule.cidr}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal leading-relaxed">
                        {rule.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-center md:text-right">
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">轉送介面</span>
                        <span className={`font-mono text-xs font-black px-2 py-0.5 rounded ${
                          isWinner ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          Interface {rule.interfaceId}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Prefix 長度</span>
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {rule.prefixLength > 0 ? `${rule.prefixLength} bits` : '0位 (otherwise)'}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">是否匹配</span>
                        <span className={`text-[10px] font-bold px-1.5 rounded ${
                          rule.prefixLength === 0
                            ? (winningRuleId === 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')
                            : matchDetails.matches
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-50 text-red-500'
                        }`}>
                          {rule.prefixLength === 0
                            ? (winningRuleId === 3 ? '是 (不匹配 fallback)' : '否 (因有其他吻合)')
                            : matchDetails.matches
                            ? '完全吻合'
                            : '字首不符'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 32 Bits Visualization bar */}
                  {validateIp(ipAddress) && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 text-[9px] text-slate-400 font-bold">
                        <span>32 位元逐一比對視覺：</span>
                        {rule.prefixLength > 0 && (
                          <span className="font-mono text-slate-500">
                            路由首碼 bits = {rule.prefixBinary}... (比對結果: {matchDetails.matches ? '全部吻合' : `在前 ${matchDetails.misMatchPos} 位吻合，第 ${matchDetails.misMatchPos + 1} 位不符`})
                          </span>
                        )}
                      </div>

                      {renderBinaryBlocks(rule, currentBinary)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. PRACTICE MODE */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xs text-left space-y-6 relative overflow-hidden" id="lpm-practice-portal">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-indigo-300 font-mono text-xs font-bold">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>STUDENT DRILL PORTAL</span>
          </div>
          <h3 className="text-lg font-black text-white">
            最長首匹配實戰挑戰 (Practice Mode: LPM Game Engine)
          </h3>
          <p className="text-xs text-slate-400 leading-normal font-normal">
            我們將隨機為您出題，請依據上方的轉送表規格，診斷該目的地 IP 最終會經由哪一個 Interface 轉送？
          </p>
        </div>

        {/* Game Box */}
        <div className="p-5 border border-slate-800 bg-slate-850 rounded-2xl space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">
                當前目的地 IP 地址
              </span>
              <div className="text-xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-indigo-300">
                {RANDOM_QUESTION_POOL[currentQuestionIdx].ip}
              </div>
            </div>

            <div className="px-3 py-1 bg-slate-800 rounded-lg text-xs font-semibold text-slate-300 border border-slate-700">
              得分：{practiceScore.correct} / {practiceScore.total} 題 ({practiceScore.total === 0 ? 0 : Math.round((practiceScore.correct / practiceScore.total) * 100)}%)
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">
              請選擇其匹配分發介面：
            </span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map(id => {
                const isSelected = selectedPracticeAnswer === id;
                const correctId = RANDOM_QUESTION_POOL[currentQuestionIdx].correctInterface;
                let btnStyle = 'border-slate-700 hover:bg-slate-800 text-slate-300 bg-transparent';

                if (isSelected) {
                  btnStyle = 'border-indigo-500 bg-indigo-950 text-indigo-200 ring-2 ring-indigo-500/50';
                }
                if (practiceChecked) {
                  if (id === correctId) {
                    btnStyle = 'border-emerald-600 bg-emerald-950 text-emerald-200 font-black ring-2 ring-emerald-500';
                  } else if (isSelected && id !== correctId) {
                    btnStyle = 'border-rose-600 bg-rose-950 text-rose-200 ring-2 ring-rose-500';
                  } else {
                    btnStyle = 'border-slate-800 bg-slate-900/50 opacity-40 text-slate-400';
                  }
                }

                return (
                  <button
                    key={id}
                    id={`btn-practice-option-${id}`}
                    onClick={() => handlePracticeAnswer(id)}
                    disabled={practiceChecked}
                    className={`p-3 border rounded-xl text-center font-bold text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer duration-200 ${btnStyle}`}
                  >
                    <span className="text-[10px] font-mono text-slate-400 block font-normal">介面</span>
                    <span className="text-sm font-black">Interface {id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation console */}
          <AnimatePresence mode="wait">
            {practiceChecked && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 border rounded-xl text-xs space-y-1.5 ${
                  selectedPracticeAnswer === RANDOM_QUESTION_POOL[currentQuestionIdx].correctInterface
                    ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300'
                    : 'border-rose-800 bg-rose-950/40 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {selectedPracticeAnswer === RANDOM_QUESTION_POOL[currentQuestionIdx].correctInterface ? (
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 答對了！您分析得非常精準。</span>
                  ) : (
                    <span className="flex items-center gap-1"><XCircle className="w-4 h-4 text-rose-400" /> 解答錯誤，再接再厲！</span>
                  )}
                </div>
                <p className="leading-relaxed font-normal text-slate-350">
                  {RANDOM_QUESTION_POOL[currentQuestionIdx].explanation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stepper controls */}
          <div className="flex items-center gap-3 pt-2">
            {!practiceChecked ? (
              <button
                id="btn-practice-submit"
                onClick={handlePracticeSubmit}
                disabled={selectedPracticeAnswer === null}
                className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  selectedPracticeAnswer === null
                    ? 'bg-slate-800 border border-slate-705 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-650 hover:bg-indigo-600 text-white shadow-xs'
                }`}
              >
                提供答案並送出 (Submit)
              </button>
            ) : (
              <button
                id="btn-practice-next"
                onClick={handleNextQuestion}
                className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <span>解下一題挑戰碼</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              id="btn-practice-restart"
              onClick={handleRestartPractice}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white hover:underline ml-auto font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>歸零重算</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
