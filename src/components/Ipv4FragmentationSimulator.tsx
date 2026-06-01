/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  Sliders,
  Play,
  HelpCircle,
  FileText,
  Boxes,
  HelpCircle as CheckIcon,
  AlertCircle,
  Info,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award
} from 'lucide-react';

interface FragmentResult {
  num: number;
  totalLength: number;
  dataSize: number;
  offset: number;
  mf: number;
  ident: number;
}

// Random Challenge pool for Practice Mode
interface Challenge {
  id: number;
  datagramSize: number;
  mtu: number;
  headerSize: number;
  questionText: string;
  questionType: 'num_fragments' | 'f2_offset' | 'last_length';
  correctAnswer: number;
  explanation: string;
}

const PRACTICE_CHALLENGES: Challenge[] = [
  {
    id: 1,
    datagramSize: 3000,
    mtu: 1000,
    headerSize: 20,
    questionText: '當原數據報長度為 3000 位元組、MTU 為 1000 位元組（標頭 20 位元組）時，求分割成碎片的總數量是多少？',
    questionType: 'num_fragments',
    correctAnswer: 4,
    explanation: 'MTU 為 1000，扣除 20 標頭，最大資料為 980。但必須是 8 的倍數，所以每個非最後一片碎片的最大資料為 976 位元組 (976 = 122 * 8)。總資料負載為 3000 - 20 = 2980。2980 = 976 (片1) + 976 (片2) + 976 (片3) + 52 (片4)。所以共分割成 4 片碎片。'
  },
  {
    id: 2,
    datagramSize: 2000,
    mtu: 1200,
    headerSize: 20,
    questionText: '當原數據報長度為 2000 位元組、MTU 為 1200 位元組（標頭 20 位元組）時，請計算第 2 片碎片 (Fragment 2) 的「分段偏移量 (Offset)」是多少？',
    questionType: 'f2_offset',
    correctAnswer: 147,
    explanation: '最大資料量 = 1200 - 20 = 1180。向下調整至 8 的整數位數 = 1176 位元組。第一片承載 1176 位元組資料，因此第二片資料的位元組開始位置為 1176。偏移量 (Offset) = 1176 / 8 = 147。'
  },
  {
    id: 3,
    datagramSize: 4000,
    mtu: 1500,
    headerSize: 20,
    questionText: '在預設情境下：原數據報大小 4000 且 MTU 為 1500 時，最後一片碎片 (Fragment 3) 的「總長度 (Total Length，含標頭)」應該是多少位元組？',
    questionType: 'last_length',
    correctAnswer: 1040,
    explanation: '總負載為 3980。非最後碎片最大資料 payload = 1480 (1480 / 8 = 185)。第一、二片各載 1480 的 payload，其餘留下：3980 - (1480 * 2) = 1020 位元組資料。因此最後一片總長度為：1020 (實質負載) + 20 (標頭) = 1040 位元組。'
  },
  {
    id: 4,
    datagramSize: 3200,
    mtu: 800,
    headerSize: 20,
    questionText: '當原數據報長度為 3200 位元組、MTU 為 800 位元組時，求分割成碎片的總數量是多少？',
    questionType: 'num_fragments',
    correctAnswer: 5,
    explanation: '最大資料 = 800 - 20 = 780。調整到 8 的倍數為 776 位元組。總資料為 3180 位元組。3180 / 776 = 4.09，所以共需要 5 片碎片 (776 * 4 + 76 = 3180)。'
  }
];

export function Ipv4FragmentationSimulator() {
  // Simulator inputs
  const [datagramSize, setDatagramSize] = useState<number>(4000);
  const [mtu, setMtu] = useState<number>(1500);
  const [headerSize, setHeaderSize] = useState<number>(20);
  const [ident] = useState<number>(18452); // Constant Ident for trace simulation

  const [fragments, setFragments] = useState<FragmentResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Practice states
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);
  const [challengeIdx, setChallengeIdx] = useState<number>(0);
  const [userGuess, setUserGuess] = useState<string>('');
  const [guessChecked, setGuessChecked] = useState<boolean>(false);
  const [isCurrentChallengeCorrect, setIsCurrentChallengeCorrect] = useState<boolean | null>(null);

  // Calculate Fragmentation on inputs modification
  useEffect(() => {
    calculateFragmentation();
  }, [datagramSize, mtu, headerSize]);

  const calculateFragmentation = () => {
    // Basic validation
    if (isNaN(datagramSize) || isNaN(mtu) || isNaN(headerSize)) {
      setErrorMsg('請輸入有效的數值參數。');
      setFragments([]);
      return;
    }

    if (headerSize < 20 || headerSize > 60) {
      setErrorMsg('IP 標頭長度最低為 20 位元組，最高為 60 位元組。');
      setFragments([]);
      return;
    }

    if (mtu <= headerSize) {
      setErrorMsg(`MTU 必須大於 IP 標頭長度 (${headerSize} 位元組)。`);
      setFragments([]);
      return;
    }

    if (datagramSize <= headerSize) {
      setErrorMsg(`數據報尺寸必須大於 IP 標頭長度 (${headerSize} 位元組)。`);
      setFragments([]);
      return;
    }

    setErrorMsg(null);

    const maxData = mtu - headerSize;
    if (maxData < 8) {
      setErrorMsg('MTU 剩餘承載 Payload 長度不足 (必須大於等於 8 位元組)，無法對齊 8 位元組碎片偏移量。');
      setFragments([]);
      return;
    }

    // Ensure fragment data payload except the last are multiples of 8 bytes
    const fragmentPayLoadMax = Math.floor(maxData / 8) * 8;
    const totalDataToTransmit = datagramSize - headerSize;

    let remainingData = totalDataToTransmit;
    let currentOffset = 0;
    const results: FragmentResult[] = [];
    let fragCount = 1;

    while (remainingData > 0) {
      if (remainingData > fragmentPayLoadMax) {
        results.push({
          num: fragCount,
          totalLength: fragmentPayLoadMax + headerSize,
          dataSize: fragmentPayLoadMax,
          offset: currentOffset,
          mf: 1,
          ident: ident
        });
        remainingData -= fragmentPayLoadMax;
        currentOffset += (fragmentPayLoadMax / 8);
      } else {
        results.push({
          num: fragCount,
          totalLength: remainingData + headerSize,
          dataSize: remainingData,
          offset: currentOffset,
          mf: 0,
          ident: ident
        });
        remainingData = 0;
      }
      fragCount++;
    }

    setFragments(results);
  };

  const handleApplyDefault = () => {
    setDatagramSize(4000);
    setMtu(1500);
    setHeaderSize(20);
    setErrorMsg(null);
  };

  const handleCheckGuess = () => {
    if (userGuess === '') return;
    const ans = Number(userGuess);
    const challenge = PRACTICE_CHALLENGES[challengeIdx];
    const isCorrect = ans === challenge.correctAnswer;
    setIsCurrentChallengeCorrect(isCorrect);
    setGuessChecked(true);
  };

  const handleNextChallenge = () => {
    setUserGuess('');
    setGuessChecked(false);
    setIsCurrentChallengeCorrect(null);
    setChallengeIdx((prev) => (prev + 1) % PRACTICE_CHALLENGES.length);
  };

  // Start Quick Challenge Practice
  const handleLaunchPractice = () => {
    setIsPracticeMode(true);
    setChallengeIdx(0);
    setUserGuess('');
    setGuessChecked(false);
  };

  return (
    <div className="space-y-8 select-none">
      {/* SECTION 1: SIMULATOR CONTROL & INPUTS */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Boxes className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
                MTU LIMIT SEGMENTATION
              </span>
              <h3 className="text-xl font-black text-slate-800">IPv4 資料報碎裂 (Fragmentation) 實境模擬</h3>
            </div>
          </div>
          
          <button
            id="btn-apply-default"
            onClick={handleApplyDefault}
            className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border duration-200"
          >
            套用標準預設 (4000B / 1500B)
          </button>
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div className="p-4 bg-slate-50 border rounded-xl space-y-1">
            <label className="block text-xs font-bold text-slate-500">
              ① 原始 IP 數據報大小 (Datagram Size - Bytes)
            </label>
            <input
              type="number"
              id="input-datagram-size"
              value={datagramSize}
              onChange={(e) => setDatagramSize(Number(e.target.value))}
              className="w-full text-base font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
            />
            <span className="text-[10px] text-slate-400 block">含 IP 標頭的總位元組大小</span>
          </div>

          <div className="p-4 bg-slate-50 border rounded-xl space-y-1">
            <label className="block text-xs font-bold text-slate-500">
              ② 最大傳輸單元 (MTU - Bytes)
            </label>
            <input
              type="number"
              id="input-mtu"
              value={mtu}
              onChange={(e) => setMtu(Number(e.target.value))}
              className="w-full text-base font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
            />
            <span className="text-[10px] text-slate-400 block">乙太網物理連結限制，常規為 1500</span>
          </div>

          <div className="p-4 bg-slate-50 border rounded-xl space-y-1">
            <label className="block text-xs font-bold text-slate-500">
              ③ IP 標頭大小 (IP Header Size - Bytes)
            </label>
            <input
              type="number"
              id="input-header-size"
              value={headerSize}
              onChange={(e) => setHeaderSize(Number(e.target.value))}
              className="w-full text-base font-mono font-bold px-2.5 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
            />
            <span className="text-[10px] text-slate-400 block">預設 20 Bytes 固定開銷，可包含 Options</span>
          </div>
        </div>

        {/* Display Error if exists */}
        {errorMsg ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Visual Bar Diagrams */}
            <div className="p-5 border border-dashed rounded-2xl bg-slate-50/50 space-y-6">
              <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                資料流切剖視訊 (Visual Fragmentation Stack)
              </h4>

              {/* 1. Original Datagram Bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-slate-850" />
                    原始大數據報 (Original IP Datagram, {datagramSize} Bytes)
                  </span>
                  <span className="font-mono text-slate-400">OFFSET = 0 (不可發送，因超出了 MTU 限)</span>
                </div>
                <div className="h-8 rounded-lg overflow-hidden flex font-mono text-[10px] text-white font-bold text-center shadow select-none">
                  <div
                    style={{ width: `${(headerSize / datagramSize) * 100}%` }}
                    className="bg-red-500 h-full flex items-center justify-center font-bold tracking-wide min-w-[40px]"
                  >
                    Header ({headerSize}B)
                  </div>
                  <div className="bg-indigo-600 h-full flex-1 flex items-center justify-center font-bold">
                    Payload Data ({datagramSize - headerSize} Bytes)
                  </div>
                </div>
              </div>

              {/* 2. Divider indicating MTU Restriction */}
              <div className="flex items-center justify-center my-2 select-none">
                <div className="h-[1px] bg-slate-200 flex-1" />
                <span className="mx-3 text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-50 border border-red-100 rounded-full px-2.5 py-0.5">
                  ✂️ 當前鏈路 MTU 限制：{mtu} Bytes / 非最後碎片 Payload (8位元對齊) ≒ {Math.floor((mtu - headerSize) / 8) * 8} Bytes
                </span>
                <div className="h-[1px] bg-slate-200 flex-1" />
              </div>

              {/* 3. Output Fragments Bars */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-400 block">切割完成的碎片群 (Resulting Fragments):</span>
                
                <div className="space-y-3">
                  {fragments.map((frag, idx) => (
                    <motion.div
                      key={frag.num}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="space-y-1"
                    >
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                        <span className="font-bold flex items-center gap-1 text-slate-700">
                          <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                          碎片 <strong>#{frag.num}</strong>: 總長度 = {frag.totalLength} Bytes (資料淨載 = {frag.dataSize}B)
                        </span>
                        <span className="font-mono text-blue-600">
                          MF = {frag.mf} (是否有後續：{frag.mf === 1 ? '是' : '最後一片'}) | <strong className="bg-blue-10/70 py-0.5 px-1 rounded border border-blue-101">OFFSET = {frag.offset}</strong>
                        </span>
                      </div>
                      <div className="h-7 w-full bg-slate-100 rounded-lg overflow-hidden flex font-mono text-[9px] text-white font-bold select-none text-center shadow-sm">
                        <div
                          style={{ width: `${(headerSize / frag.totalLength) * 100}%` }}
                          className="bg-red-500 h-full flex items-center justify-center tracking-wider min-w-[30px]"
                        >
                          H
                        </div>
                        <div
                          style={{ width: `${(frag.dataSize / frag.totalLength) * 100}%` }}
                          className="bg-emerald-500 h-full flex-1 flex items-center justify-center"
                        >
                          Data ({frag.dataSize}B)
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Fragmentation Table Outputs */}
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-12 bg-slate-100 p-2 text-xs font-bold text-slate-600 rounded-t-xl font-mono">
                <div className="col-span-2">碎片編號</div>
                <div className="col-span-2">標頭 ID (Ident)</div>
                <div className="col-span-2 text-center">總長度 (Length)</div>
                <div className="col-span-2 text-center">實質負載 (Payload)</div>
                <div className="col-span-2 text-center">偏移量 (Offset)</div>
                <div className="col-span-2 text-right">續存旗標 (MF)</div>
              </div>

              <div className="divide-y divide-slate-100 font-mono text-xs">
                {fragments.map((frag) => (
                  <div key={frag.num} className="grid grid-cols-12 p-2.5 items-center hover:bg-slate-50 duration-150">
                    <div className="col-span-2 font-black text-slate-700">Fragment {frag.num}</div>
                    <div className="col-span-2 text-slate-500 font-mono">{frag.ident}</div>
                    <div className="col-span-2 text-center font-bold text-slate-600">{frag.totalLength} B</div>
                    <div className="col-span-2 text-center font-semibold text-slate-500">{frag.dataSize} B</div>
                    <div className="col-span-2 text-center">
                      <span className="bg-blue-50 border border-blue-200 text-blue-700 font-bold px-2 py-0.5 rounded text-[11px]">
                        {frag.offset}
                      </span>
                    </div>
                    <div className={`col-span-2 text-right font-black ${frag.mf ? 'text-amber-600' : 'text-slate-400'}`}>
                      MF = {frag.mf}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: EXPLANATION OF FRAGMENTATION PATH */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-2 border-b">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Info className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-black text-slate-800">碎裂與重組背後的「網格設計哲學」</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed text-xs text-slate-600">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="bg-blue-600 text-white font-mono rounded px-1.5 h-4 text-[10px] leading-4 mt-0.5">1</span>
              <div>
                <strong className="text-slate-850">路由器中途切片，目的地大一統重組 (Reassembly only at receiver)</strong>
                <p className="mt-1">
                  只要數據報超過了當前輸出鏈路的 MTU，中轉路由器別無選擇，必須立即對其進行碎片分割。然而，這些碎片<strong>在中途是絕不會被路由器提前重組的</strong>。因為重組需要耗費大量的緩衝區和計算資源，一旦中途出錯會加劇網路阻塞。因此，重組任務完全推給具備完整快取的<strong>目的地端主機</strong>，這極大地簡化了轉送層的性能要求。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="bg-blue-600 text-white font-mono rounded px-1.5 h-4 text-[10px] leading-4 mt-0.5">2</span>
              <div>
                <strong className="text-slate-850">偏移量的向下取整及「8 位元組」魔術數 (offset matching)</strong>
                <p className="mt-1">
                  IPv4 標頭的【Fragment Offset】因欄位位數有限，其值是以 <strong>8 位元組 (8-byte units)</strong> 為基本單位進行折縮。故任何非最後一片碎片的淨載荷，<strong>都必須是 8 的倍數</strong>。如 MTU = 1500 時，最大淨資料為 1480 位元組（這也是 8 的倍數：1480 ÷ 8 = 185）。假如 MTU = 1000 位元組，雖然 1000 - 20 = 980 位元組，但因其不整除 8，必須刻意降低到 <strong>976 位元組</strong> 進行傳輸（976 ÷ 8 = 122）。
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="bg-blue-600 text-white font-mono rounded px-1.5 h-4 text-[10px] leading-4 mt-0.5">3</span>
              <div>
                <strong className="text-slate-850">三大天王標頭：ID、Flags 與 Offset 攜手破案</strong>
                <p className="mt-1">
                  目的地重組程序依靠這三個關鍵元素：
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li><strong className="text-slate-700">Identifier</strong>: 知道哪些散落的碎片原本是一家子（具有相同的 ID 標識）。</li>
                    <li><strong className="text-slate-700">More Fragments (MF)</strong>: 決定是不是能收尾。若 MF ＝ 0 代表收到最後一片，可用以計算原始封包應有的總長。</li>
                    <li><strong className="text-slate-700">Offset</strong>: 按位元精確將它們拼回對應格子中。</li>
                  </ul>
                </p>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-[11px] font-mono text-indigo-700">
              <span className="font-extrabold uppercase block mb-1 tracking-wider text-slate-800">📌 IPv4 碎裂黃金計算公式：</span>
              <div>• 最大可用資料空間 = Math.floor((MTU - HeaderSize) / 8) * 8</div>
              <div>• 碎片數量 K = Math.ceil( 總負載量 / 最大可用資料空間 )</div>
              <div>• 第 N 片碎片的 Offset = (N - 1) * (最大可用資料空間 / 8)</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: PRACTICE MODE */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b pb-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800">碎片計算與偏移預測「實戰練習場」</h4>
              <span className="text-[10px] text-slate-400 font-bold block">利用動態計算鍛鍊軟硬體試題中的常見 fragmentation 考點</span>
            </div>
          </div>

          {!isPracticeMode && (
            <button
              id="btn-start-practice"
              onClick={handleLaunchPractice}
              className="text-xs font-black bg-emerald-650 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl transition duration-200 shadow-sm"
            >
              開啟挑戰模式
            </button>
          )}
        </div>

        {isPracticeMode && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 font-mono">
              <span>情境實戰：挑戰題 #{challengeIdx + 1}</span>
              <span>挑戰池累計 4 題</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-blue-600 block uppercase font-mono">
                已知參數：
                Original Size = {PRACTICE_CHALLENGES[challengeIdx].datagramSize}B | 
                MTU = {PRACTICE_CHALLENGES[challengeIdx].mtu}B | 
                Header = {PRACTICE_CHALLENGES[challengeIdx].headerSize}B
              </span>
              <p className="text-xs font-black text-slate-705 leading-relaxed font-mono">
                {PRACTICE_CHALLENGES[challengeIdx].questionText}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="number"
                  id="practice-input"
                  placeholder="請輸入你所計算出的整數答案..."
                  value={userGuess}
                  disabled={guessChecked}
                  onChange={(e) => setUserGuess(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50"
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckGuess()}
                />
              </div>

              <div className="flex gap-2">
                <button
                  id="btn-check-guess"
                  disabled={guessChecked || userGuess === ''}
                  onClick={handleCheckGuess}
                  className="text-xs font-black bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl disabled:opacity-50"
                >
                  比對驗證
                </button>
                {guessChecked && (
                  <button
                    id="btn-next-challenge"
                    onClick={handleNextChallenge}
                    className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl shadow-sm"
                  >
                    切換下一題
                  </button>
                )}
              </div>
            </div>

            {guessChecked && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border font-mono text-xs leading-relaxed space-y-2 ${
                  isCurrentChallengeCorrect
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center gap-2 font-black">
                  {isCurrentChallengeCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 font-black text-green-600 shrink-0" />
                      <span>解答正確！大獲全勝 🌟</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 font-black text-red-600 shrink-0" />
                      <span>好可惜，答案不對！建議細看底下的運作推導。</span>
                    </>
                  )}
                </div>
                
                <p className="font-semibold mt-1">
                  <strong>正確解答：</strong> {PRACTICE_CHALLENGES[challengeIdx].correctAnswer}
                </p>
                <p className="text-[11px] text-slate-550 leading-relaxed bg-white/60 p-2.5 rounded-lg border">
                  <strong>詳細推演細節：</strong> {PRACTICE_CHALLENGES[challengeIdx].explanation}
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
