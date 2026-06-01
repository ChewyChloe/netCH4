/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Timer,
  BookOpen,
  Trophy,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Bookmark,
  RefreshCw,
  Award,
  BookMarked,
  Layers,
  ArrowRight,
  ClipboardList,
  Flame,
  Star,
  Info
} from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data.ts';
import { QuizQuestion } from '../types.ts';

interface QuizCenterProps {
  onModuleChange?: (id: string) => void;
}

export function QuizCenter({ onModuleChange }: QuizCenterProps) {
  const [activeMode, setActiveMode] = useState<'practice' | 'exam' | 'weakness'>('practice');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Quiz Running States
  const [currentQuestions, setCurrentQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answeredMap, setAnsweredMap] = useState<Record<number, number>>({}); // qId -> selectedOptionIdx
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [scoreHistory, setScoreHistory] = useState<Record<number, boolean>>({}); // qId -> wasCorrect

  // Exam Specifics
  const [examState, setExamState] = useState<'intro' | 'running' | 'completed'>('intro');
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 mins in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Weakness List loaded from localStorage
  const [weaknesses, setWeaknesses] = useState<number[]>([]); // Array of question IDs

  // Load weaknesses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chapter4_quiz_weaknesses');
    if (saved) {
      try {
        setWeaknesses(JSON.parse(saved));
      } catch (e) {
        setWeaknesses([]);
      }
    }
  }, []);

  // Update weaknesses list
  const updateWeaknessInStorage = (questionId: number, isCorrect: boolean) => {
    let currentWeaknesses = [...weaknesses];
    if (!isCorrect) {
      if (!currentWeaknesses.includes(questionId)) {
        currentWeaknesses.push(questionId);
      }
    } else {
      currentWeaknesses = currentWeaknesses.filter(id => id !== questionId);
    }
    setWeaknesses(currentWeaknesses);
    localStorage.setItem('chapter4_quiz_weaknesses', JSON.stringify(currentWeaknesses));
  };

  // Prepare questions on category or mode switch
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    let filtered = [...QUIZ_QUESTIONS];
    
    if (activeMode === 'practice') {
      if (selectedCategory !== 'all') {
        filtered = QUIZ_QUESTIONS.filter(q => q.moduleId === selectedCategory);
      }
      setCurrentQuestions(filtered);
      setCurrentIndex(0);
      setAnsweredMap({});
      setShowExplanation(false);
    } else if (activeMode === 'exam') {
      // Shuffle exam questions (e.g. up to 8 of them for standard simulation)
      const shuffled = [...QUIZ_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 8);
      setCurrentQuestions(shuffled);
      setExamState('intro');
      setCurrentIndex(0);
      setAnsweredMap({});
      setShowExplanation(false);
    } else if (activeMode === 'weakness') {
      // Find questions based on weakness list
      const weakQs = QUIZ_QUESTIONS.filter(q => weaknesses.includes(q.id));
      setCurrentQuestions(weakQs);
      setCurrentIndex(0);
      setAnsweredMap({});
      setShowExplanation(false);
    }
  }, [activeMode, selectedCategory, weaknesses.length]);

  // Exam timer ticker
  useEffect(() => {
    if (activeMode === 'exam' && examState === 'running') {
      setTimeLeft(300); // Reset timer
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleExamSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeMode, examState]);

  // Actions
  const handleSelectAnswer = (optIdx: number) => {
    const currentQ = currentQuestions[currentIndex];
    if (!currentQ) return;

    if (activeMode === 'practice' || activeMode === 'weakness') {
      if (answeredMap[currentQ.id] !== undefined) return; // Answer locked
      const isCorrect = optIdx === currentQ.correctIndex;
      setAnsweredMap(prev => ({ ...prev, [currentQ.id]: optIdx }));
      setShowExplanation(true);
      updateWeaknessInStorage(currentQ.id, isCorrect);
    } else if (activeMode === 'exam') {
      // No instant feedback in exam, can overwrite
      setAnsweredMap(prev => ({ ...prev, [currentQ.id]: optIdx }));
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowExplanation(false);
    } else {
      if (activeMode === 'exam') {
        handleExamSubmit();
      }
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowExplanation(false);
    }
  };

  const handleExamSubmit = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setExamState('completed');
    
    // Evaluate scores for weakness and localStorage
    currentQuestions.forEach(q => {
      const chosen = answeredMap[q.id];
      const isCorrect = chosen === q.correctIndex;
      updateWeaknessInStorage(q.id, isCorrect);
    });
  };

  const handleRestartExam = () => {
    const shuffled = [...QUIZ_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 8);
    setCurrentQuestions(shuffled);
    setCurrentIndex(0);
    setAnsweredMap({});
    setShowExplanation(false);
    setExamState('running');
  };

  // Calculations
  const totalCatCount = currentQuestions.length;
  const currentQ = currentQuestions[currentIndex];
  
  // Practice Correct rate calculate
  const answeredIds = Object.keys(answeredMap).map(Number);
  const practiceCorrectCount = answeredIds.reduce((acc, qId) => {
    const q = QUIZ_QUESTIONS.find(x => x.id === qId);
    return acc + (q && answeredMap[qId] === q.correctIndex ? 1 : 0);
  }, 0);

  // Exam Score calculation
  const examScore = Math.round(
    (currentQuestions.reduce((acc, q) => {
      return acc + (answeredMap[q.id] === q.correctIndex ? 1 : 0);
    }, 0) / (currentQuestions.length || 1)) * 100
  );

  const getModuleTitleCn = (modId: string) => {
    switch (modId) {
      case 'overview': return '網路層概述';
      case 'router-arch': return '工作架構';
      case 'prefix-match': return '最長匹配';
      case 'queue-schedule': return '佇列排程';
      case 'ipv4-datagram': return 'IPv4 標頭';
      case 'ip-addressing': return 'IP 定址';
      case 'dhcp': return 'DHCP 流程';
      case 'nat': return '地址轉換';
      case 'ipv6': return 'IPv6 封裝';
      case 'sdn-openflow': return 'OpenFlow';
      case 'middleboxes': return '中介設備';
      default: return '綜合考題';
    }
  };

  const categories = [
    { id: 'all', label: '📖 全章綜合考題' },
    { id: 'overview', label: '1. 觀念概述' },
    { id: 'router-arch', label: '2. 路由器架構' },
    { id: 'prefix-match', label: '3. 最長字首匹配' },
    { id: 'queue-schedule', label: '4. 佇列與擁塞排程' },
    { id: 'ipv4-datagram', label: '5. IPv4 標頭與分片' },
    { id: 'ip-addressing', label: '6. 子網 CIDR 劃分' },
    { id: 'dhcp', label: '7. DHCP 分配流程' },
    { id: 'nat', label: '8. NAT 埠口重寫' },
    { id: 'ipv6', label: '9. IPv6 隧道過渡' },
    { id: 'sdn-openflow', label: '10. OpenFlow 轉送' },
    { id: 'middleboxes', label: '11. 中介設備與腰結構' }
  ];

  return (
    <div className="space-y-6 text-left selection-none">
      {/* HEADER CONTROLS CARD */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-805 flex items-center gap-2">
              <ClipboardList className="w-5.5 h-5.5 text-blue-600 animate-pulse" />
              第四章 網路層資料平面：研討級自我整合測驗中心
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              提供三種面向不同自檢情境的考核機制。與此同時，當前已在 local 部署了<strong>實時錯題追蹤本</strong>：
            </p>
          </div>

          <div className="bg-slate-50 border px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
            <BookMarked className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-semibold text-slate-600">
              錯題累計數： <span className="text-rose-550 font-mono font-black">{weaknesses.length}</span> 題
            </span>
          </div>
        </div>

        {/* Mode Switch Tabs Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4 text-xs font-bold font-sans">
          {[
            { id: 'practice', label: '✍ 1. 練習模式（Practice Mode）', desc: '即答即核，內建 Latex 解析與公式詳細分析' },
            { id: 'exam', label: '⏱️ 2. 模擬考模式（Exam Mode）', desc: '5分鐘定時突擊、8題隨機抽取、交卷出分' },
            { id: 'weakness', label: `🎯 3. 錯題弱點複習（Weaks Book）`, desc: '基於錯題本，自動剔除已掌握，集中火力攻克' }
          ].map(md => (
            <button
              key={md.id}
              onClick={() => {
                setActiveMode(md.id as any);
              }}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between duration-150 cursor-pointer ${
                activeMode === md.id
                  ? 'border-blue-500 bg-blue-50/50 text-blue-800 shadow-sm ring-2 ring-blue-100'
                  : 'border-slate-150 bg-white text-slate-650 hover:bg-slate-50'
              }`}
            >
              <div className="font-black text-xs">{md.label}</div>
              <span className="text-[10px] text-slate-400 font-normal mt-1 leading-snug">{md.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* RENDER FOR THE THREE MODES */}

      {/* MODE 1: PRACTICE MODE WITH CATEGORY SELECTOR */}
      {activeMode === 'practice' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Category selection sidebar */}
          <div className="lg:col-span-3 bg-white border border-slate-150 rounded-2xl p-4 shadow-sm space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              知識板塊分類
            </h4>
            <div className="space-y-1">
              {categories.map(cat => {
                const isSelected = selectedCategory === cat.id;
                // Count questions for this category
                const count = cat.id === 'all'
                  ? QUIZ_QUESTIONS.length
                  : QUIZ_QUESTIONS.filter(q => q.moduleId === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                    }}
                    className={`w-full text-left p-2 rounded-lg border text-xs flex justify-between items-center duration-150 ${
                      isSelected
                        ? 'border-slate-900 bg-slate-800 text-white font-bold'
                        : 'border-transparent text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${isSelected ? 'bg-slate-900 text-slate-300' : 'bg-slate-100'}`}>
                      {count}題
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Practice Questions Panel */}
          <div className="lg:col-span-9 bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-6">
            {totalCatCount === 0 ? (
              <div className="py-16 text-center text-slate-400 italic text-xs font-mono">
                📭 對應此板塊的題庫目前為空...
              </div>
            ) : (
              <div className="space-y-5">
                {/* Upper progress pagination */}
                <div className="flex items-center justify-between border-b pb-3 text-xs">
                  <span className="font-bold text-slate-400">
                    目前進度： <span className="font-mono text-slate-700 font-extrabold">{currentIndex + 1}</span> / {totalCatCount} 題
                  </span>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 bg-slate-100 py-0.5 px-2 rounded-full font-bold">
                      類別: {getModuleTitleCn(currentQ.moduleId)}
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="font-mono font-bold text-blue-600">
                      答對率: {practiceCorrectCount} / {answeredIds.length} ({answeredIds.length ? Math.round((practiceCorrectCount / answeredIds.length) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                {/* Progress dot dots */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {currentQuestions.map((q, idx) => {
                    const isCur = idx === currentIndex;
                    const ansIdx = answeredMap[q.id];
                    const wasCorrect = ansIdx !== undefined && ansIdx === q.correctIndex;
                    
                    let dotClass = 'bg-slate-200';
                    if (isCur) dotClass = 'ring-2 ring-blue-500 scale-110 bg-blue-500';
                    else if (ansIdx !== undefined) {
                      dotClass = wasCorrect ? 'bg-green-500' : 'bg-rose-500';
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setCurrentIndex(idx);
                          setShowExplanation(ansIdx !== undefined);
                        }}
                        className={`w-5 h-5 rounded-md text-[9px] font-mono text-white font-extrabold flex items-center justify-center cursor-pointer ${dotClass}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Question item rendering */}
                <div className="space-y-4">
                  <div className="font-bold text-slate-800 text-sm leading-relaxed text-left flex gap-2">
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded h-max shrink-0 font-mono">Q{currentIndex + 1}</span>
                    <span>{currentQ.question}</span>
                  </div>

                  {/* Options loop */}
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {currentQ.options.map((opt, oIdx) => {
                      const answeredIdx = answeredMap[currentQ.id];
                      const isChosen = answeredIdx === oIdx;
                      const isCorrect = currentQ.correctIndex === oIdx;

                      let btnClass = 'border-slate-150 bg-white text-slate-705 hover:bg-slate-50';
                      
                      if (answeredIdx !== undefined) {
                        if (isCorrect) {
                          btnClass = 'border-green-400 bg-green-50/50 text-green-901 font-bold';
                        } else if (isChosen) {
                          btnClass = 'border-red-400 bg-red-50/50 text-red-901 font-bold';
                        } else {
                          btnClass = 'border-slate-100 bg-white text-slate-400 opacity-60';
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={answeredIdx !== undefined}
                          onClick={() => handleSelectAnswer(oIdx)}
                          className={`p-3.5 text-left rounded-xl border duration-150 flex items-center justify-between cursor-pointer ${btnClass}`}
                        >
                          <span>{opt}</span>
                          {answeredIdx !== undefined && isCorrect && <CheckCircle2 className="w-4.5 h-4.5 text-green-600 shrink-0 ml-1.5" />}
                          {answeredIdx !== undefined && isChosen && !isCorrect && <XCircle className="w-4.5 h-4.5 text-red-550 shrink-0 ml-1.5" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Progressive visual explanation box */}
                  <AnimatePresence>
                    {showExplanation && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100 text-xs space-y-2 text-left"
                      >
                        <strong className="text-indigo-800 flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-indigo-600" />
                          解答與詳盡觀念剖析:
                        </strong>
                        <p className="text-slate-600 leading-relaxed font-sans">{currentQ.explanation}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Pagination control buttons */}
                  <div className="flex justify-between items-center pt-2">
                    <button
                      disabled={currentIndex === 0}
                      onClick={handlePrevQuestion}
                      className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border px-4 py-2 rounded-lg duration-150 disabled:opacity-40"
                    >
                      上一題
                    </button>

                    <button
                      disabled={currentIndex === totalCatCount - 1}
                      onClick={handleNextQuestion}
                      className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border px-4 py-2 rounded-lg duration-150 disabled:opacity-40"
                    >
                      下一題
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: EXAM COUNTDOWN SIMULATION */}
      {activeMode === 'exam' && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm min-h-[300px]">
          {examState === 'intro' && (
            <div className="text-center py-10 max-w-xl mx-auto space-y-5 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-slate-900 text-yellow-405 flex items-center justify-center">
                <Timer className="w-7 h-7" />
              </div>
              
              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-805">第四章自我定時限時突擊考核</h4>
                <p className="text-xs text-slate-500 leading-normal">
                  系統將隨機為您調度 <strong>8 題全章節綜合考題</strong>，並設定了 <strong>5 分鐘 (300 秒)</strong> 緊湊高壓測試。在提交紙卷前，你無法即時看到任何對錯提示，挑戰全局把控力！
                </p>
              </div>

              <div className="p-3 bg-red-50 text-[10.5px] text-red-800 rounded-xl leading-normal border w-full max-w-sm">
                ⚠️ <strong>注意：</strong> 開始考卷後時鐘將自動倒計時，若時間耗盡將自動強制交卷。
              </div>

              <button
                onClick={() => setExamState('running')}
                className="bg-slate-900 border border-slate-950 text-white font-extrabold px-6 py-3 rounded-xl shadow-lg hover:bg-slate-800 transition duration-150 cursor-pointer text-xs"
              >
                我知道了，現在配發考卷！
              </button>
            </div>
          )}

          {examState === 'running' && currentQ && (
            <div className="space-y-6">
              {/* Ticker Timer Header */}
              <div className="flex items-center justify-between bg-slate-900 text-white p-3 rounded-xl font-mono text-xs">
                <div className="flex items-center gap-1.5 text-yellow-405 font-bold">
                  <Timer className="w-4 h-4 animate-spin-slow shrink-0" />
                  <span>剩餘時間: {Math.floor(timeLeft / 60)} 分 {timeLeft % 60} 秒</span>
                </div>
                <div className="text-slate-400">
                  答題紙：{currentIndex + 1} / {currentQuestions.length} 題
                </div>
                <div>
                  <button
                    onClick={handleExamSubmit}
                    className="bg-yellow-500 hover:bg-yellow-405 text-slate-950 font-black px-3 py-1 rounded-lg text-[10px] duration-150 scale-95"
                  >
                    主動提交考卷
                  </button>
                </div>
              </div>

              {/* Progress bar line */}
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-full transition-all duration-1000" style={{ width: `${(timeLeft / 300) * 100}%` }} />
              </div>

              {/* Question list buttons */}
              <div className="flex flex-wrap items-center gap-1">
                {currentQuestions.map((q, idx) => {
                  const isCur = idx === currentIndex;
                  const isAns = answeredMap[q.id] !== undefined;

                  let bClass = 'bg-slate-100 border text-slate-600';
                  if (isCur) bClass = 'ring-2 ring-yellow-405 bg-slate-900 text-yellow-405 font-bold';
                  else if (isAns) bClass = 'bg-yellow-55 bg-opacity-30 border-yellow-200 text-amber-800';

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono duration-150 cursor-pointer ${bClass}`}
                    >
                      Q{idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Question Content */}
              <div className="p-5 border border-slate-150 rounded-2xl space-y-4">
                <div className="font-extrabold text-slate-800 text-sm leading-relaxed text-left flex gap-2">
                  <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded font-mono h-max shrink-0">Q{currentIndex + 1}</span>
                  <span>{currentQ.question}</span>
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs">
                  {currentQ.options.map((opt, oIdx) => {
                    const activeAnswer = answeredMap[currentQ.id];
                    const isChosen = activeAnswer === oIdx;

                    let btnClass = 'border-slate-150 bg-white text-slate-705 hover:bg-slate-50';
                    if (isChosen) {
                      btnClass = 'border-yellow-500 bg-yellow-50/50 text-amber-901 font-black';
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectAnswer(oIdx)}
                        className={`p-3.5 text-left rounded-xl border duration-150 flex items-center justify-between cursor-pointer ${btnClass}`}
                      >
                        <span>{opt}</span>
                        {isChosen && <CheckCircle2 className="w-4.5 h-4.5 text-yellow-500 shrink-0 ml-1.5" />}
                      </button>
                    );
                  })}
                </div>

                {/* Next details pagination */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    disabled={currentIndex === 0}
                    onClick={handlePrevQuestion}
                    className="text-xs font-bold text-slate-700 bg-slate-105 px-4 py-2 rounded-lg duration-150 border disabled:opacity-40"
                  >
                    上一步
                  </button>

                  {currentIndex === currentQuestions.length - 1 ? (
                    <button
                      onClick={handleExamSubmit}
                      className="text-xs font-black bg-yellow-500 hover:bg-yellow-405 text-slate-950 px-5 py-2.5 rounded-xl shadow-md duration-150 cursor-pointer"
                    >
                      確認答卷完畢 ➔ 送交評分
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="text-xs font-bold text-slate-700 bg-slate-105 px-4 py-2 rounded-lg duration-150 border"
                    >
                      跳往下一個
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {examState === 'completed' && (
            <div className="space-y-6">
              <div className="p-6 md:p-8 rounded-2xl bg-slate-900 border text-center text-white max-w-xl mx-auto space-y-4 py-10 relative">
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:1.2rem_1.2rem] opacity-25" />
                
                <div className="w-14 h-14 rounded-full bg-yellow-405 text-slate-950 flex items-center justify-center mx-auto mb-2 relative z-10 scale-103 animate-bounce">
                  <Award className="w-7 h-7" />
                </div>
                
                <div className="space-y-1 relative z-10 text-center">
                  <h4 className="text-lg font-black text-white">大功告成！模擬突擊考卷已交卷評估</h4>
                  <p className="text-[11px] text-slate-400">
                    系統安全機制已完成分析。這份突擊考核包含了全章多維度隨機知識，以下為最終診斷所得：
                  </p>
                </div>

                {/* Score display block */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-805 grid grid-cols-2 divide-x divide-slate-805 max-w-sm mx-auto relative z-10 text-center font-mono">
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-sans">模擬考總分</span>
                    <strong className="text-3xl font-black text-yellow-405">{examScore}%</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-sans">答對數值</span>
                    <strong className="text-3xl font-black text-white">
                      {currentQuestions.reduce((acc, q) => acc + (answeredMap[q.id] === q.correctIndex ? 1 : 0), 0)} / {currentQuestions.length}
                    </strong>
                  </div>
                </div>

                <div className="flex gap-2 justify-center pt-2 relative z-10">
                  <button
                    onClick={handleRestartExam}
                    className="text-xs font-bold text-slate-300 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl hover:bg-slate-750 duration-150 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    重新分配新考題
                  </button>
                  <button
                    onClick={() => setActiveMode('practice')}
                    className="text-xs font-black text-slate-950 bg-yellow-500 px-4 py-2 rounded-xl hover:bg-yellow-450 duration-150"
                  >
                    回到練習模式重查
                  </button>
                </div>
              </div>

              {/* Review exam mistakes on current page */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase">
                  <ClipboardList className="w-4 h-4 text-slate-500" />
                  本次考卷逐題精析鑑定（Answers & Explanations）
                </h4>

                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {currentQuestions.map((q, idx) => {
                    const chosenIdx = answeredMap[q.id];
                    const isCorrect = chosenIdx === q.correctIndex;

                    return (
                      <div key={q.id} className="p-4 border rounded-xl space-y-2 text-xs bg-slate-50/50">
                        <div className="font-extrabold flex items-center justify-between">
                          <span className="text-slate-800">Q{idx + 1}. {q.question}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-101 text-red-700'
                          }`}>
                            {isCorrect ? '答對 (+12.5分)' : '答錯 (0分/已記錄入錯題)'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 font-sans">
                          • 客戶選擇：<span className="font-semibold">{chosenIdx !== undefined ? q.options[chosenIdx] : '未作答 (Skip)'}</span><br />
                          • 正確回答：<span className="font-mono text-green-700 font-bold">{q.options[q.correctIndex]}</span>
                        </div>

                        <p className="p-2.5 bg-white border border-slate-100 rounded-lg text-[10px] text-slate-500 font-sans leading-relaxed">
                          💡 <strong>解析：</strong> {q.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: WEAKNESS STUDY REVIEW BOOK */}
      {activeMode === 'weakness' && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm min-h-[300px]">
          {currentQuestions.length === 0 ? (
            <div className="text-center py-12 max-w-md mx-auto space-y-4 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              
              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-805">您當前沒有任何錯題記錄！</h4>
                <p className="text-xs text-slate-500 leading-normal">
                  太厲害了！每一次練習的錯誤都會被系統動態沉澱在這裡。目前您的錯題簿為空（0 錯題），這代表您對考點的把控極高！
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveMode('practice');
                  setSelectedCategory('all');
                }}
                className="text-xs font-black bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl duration-150 cursor-pointer shadow-sm"
              >
                前往課堂練習模式累積實力 ➔
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="bg-slate-50 border p-4 rounded-xl text-xs space-y-1 text-slate-600 leading-relaxed border-dashed">
                <strong>💡 錯題本（Weakness Book）使用說明：</strong>
                <p>
                  當您在此模式下重新作答並<strong>回答正確（Get Correct）</strong>時，系統會自動認為您已經徹底攻克此短板，並將其<strong>從錯題簿中永久剔除（Auto Remove）</strong>，真正落實減負、效率複習！
                </p>
              </div>

              {/* Ticker tracker */}
              <div className="flex justify-between items-center bg-rose-50 text-rose-800 p-3 rounded-xl text-xs border border-rose-100 font-bold">
                <div className="flex items-center gap-1.5 font-sans">
                  <Star className="w-4 h-4 fill-current text-rose-550 shrink-0" />
                  <span>錯題剩餘量：{currentQuestions.length} 題</span>
                </div>
                <span>挑戰：Q{currentIndex + 1} / {totalCatCount} 題</span>
              </div>

              {/* Progress pagination selector */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {currentQuestions.map((q, idx) => {
                  const isCur = idx === currentIndex;
                  const ansIdx = answeredMap[q.id];
                  const wasCorrect = ansIdx !== undefined && ansIdx === q.correctIndex;
                  
                  let dotClass = 'bg-slate-100 border text-slate-600';
                  if (isCur) dotClass = 'ring-2 ring-rose-500 scale-108 bg-rose-502 text-rose-500 bg-rose-50 font-bold';
                  else if (ansIdx !== undefined) {
                    dotClass = wasCorrect ? 'bg-green-500 text-white' : 'bg-rose-500 text-white';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowExplanation(ansIdx !== undefined);
                      }}
                      className={`w-5 h-5 rounded-md text-[9px] font-mono font-extrabold flex items-center justify-center cursor-pointer ${dotClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Question Content */}
              <div className="space-y-4">
                <div className="font-bold text-slate-800 text-sm leading-relaxed text-left flex gap-2">
                  <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded font-mono h-max shrink-0">Q{currentIndex + 1}</span>
                  <span>{currentQ.question}</span>
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs">
                  {currentQ.options.map((opt, oIdx) => {
                    const answeredIdx = answeredMap[currentQ.id];
                    const isChosen = answeredIdx === oIdx;
                    const isCorrect = currentQ.correctIndex === oIdx;

                    let btnClass = 'border-slate-150 bg-white text-slate-705 hover:bg-slate-50';
                    
                    if (answeredIdx !== undefined) {
                      if (isCorrect) {
                        btnClass = 'border-green-400 bg-green-50/50 text-green-901 font-bold';
                      } else if (isChosen) {
                        btnClass = 'border-red-400 bg-red-50/50 text-red-901 font-bold';
                      } else {
                        btnClass = 'border-slate-100 bg-white text-slate-400 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={answeredIdx !== undefined}
                        onClick={() => handleSelectAnswer(oIdx)}
                        className={`p-3.5 text-left rounded-xl border duration-150 flex items-center justify-between cursor-pointer ${btnClass}`}
                      >
                        <span>{opt}</span>
                        {answeredIdx !== undefined && isCorrect && <CheckCircle2 className="w-4.5 h-4.5 text-green-600 shrink-0 ml-1.5" />}
                        {answeredIdx !== undefined && isChosen && !isCorrect && <XCircle className="w-4.5 h-4.5 text-red-550 shrink-0 ml-1.5" />}
                      </button>
                    );
                  })}
                </div>

                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-indigo-50/20 border border-indigo-101 rounded-xl text-xs space-y-1.5"
                  >
                    <strong className="text-indigo-805 block">解讀分析：</strong>
                    <p className="text-slate-550 leading-relaxed font-sans">{currentQ.explanation}</p>
                  </motion.div>
                )}

                {/* Sub control buttons */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    disabled={currentIndex === 0}
                    onClick={handlePrevQuestion}
                    className="text-xs font-bold text-slate-700 bg-slate-105 border px-4 py-2 rounded-lg duration-150 disabled:opacity-40"
                  >
                    上一步
                  </button>

                  <button
                    disabled={currentIndex === totalCatCount - 1}
                    onClick={handleNextQuestion}
                    className="text-xs font-bold text-slate-700 bg-slate-105 border px-4 py-2 rounded-lg duration-150 disabled:opacity-40"
                  >
                    下一步
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
