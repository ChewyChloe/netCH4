/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, ArrowRight, BookOpen } from 'lucide-react';

interface QuizCardProps {
  key?: any;
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  selectedOptionIndex: number | undefined;
  onSelectOption: (index: number) => void;
  onNext?: () => void;
  isLast: boolean;
}

export function QuizCard({
  id,
  question,
  options,
  correctIndex,
  explanation,
  selectedOptionIndex,
  onSelectOption,
  onNext,
  isLast,
}: QuizCardProps) {
  const isAnswered = selectedOptionIndex !== undefined;

  return (
    <div id={`quiz-card-${id}`} className="bg-white border border-slate-200/60 rounded-xl p-5 md:p-6 shadow-sm relative overflow-hidden text-left">
      <div className="absolute top-0 left-0 w-1 bg-blue-500 h-full" />
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-blue-500 uppercase tracking-wider font-mono">
          提問問題 #{id}
        </span>
        {isAnswered && (
          <span
            className={`text-xs font-bold border px-2.5 py-0.5 rounded-full ${
              selectedOptionIndex === correctIndex
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {selectedOptionIndex === correctIndex ? '解答正確！' : '解法錯誤！'}
          </span>
        )}
      </div>

      <h4 className="text-sm md:text-base font-bold text-slate-800 leading-relaxed mb-4">
        {question}
      </h4>

      {/* Choice Buttons */}
      <div className="space-y-2.5">
        {options.map((opt, idx) => {
          const isSelected = selectedOptionIndex === idx;
          const isCorrect = idx === correctIndex;

          let btnClass = 'border-slate-200 bg-white hover:bg-slate-50/50 text-slate-700';
          if (isAnswered) {
            if (isCorrect) {
              btnClass = 'border-green-500 bg-green-50 text-green-900 font-semibold';
            } else if (isSelected) {
              btnClass = 'border-red-400 bg-red-50 text-red-900';
            } else {
              btnClass = 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed';
            }
          } else if (isSelected) {
            btnClass = 'border-blue-500 bg-blue-50 text-blue-900 font-semibold';
          }

          return (
            <button
              id={`quiz-opt-${id}-${idx}`}
              key={idx}
              disabled={isAnswered}
              onClick={() => onSelectOption(idx)}
              className={`w-full text-left p-4 rounded-xl border text-xs leading-normal transition-all duration-200 flex items-start gap-3 select-none ${btnClass}`}
            >
              <div className="mt-0.5 flex-shrink-0">
                <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center font-mono text-[10px] font-bold">
                  {String.fromCharCode(65 + idx)}
                </span>
              </div>
              <span className="flex-1 font-medium">{opt}</span>
              {isAnswered && isCorrect && (
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              )}
              {isAnswered && isSelected && !isCorrect && (
                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Detailed Explanation */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-5 pt-4 border-t border-slate-100"
          >
            <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-10/40 flex items-start gap-3">
              <div className="p-2 bg-blue-500 text-white rounded-lg flex-shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div>
                <h5 className="text-[11px] font-bold text-blue-800 uppercase tracking-widest leading-none mb-1">
                  詳細分析觀念（Explanation）
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {explanation}
                </p>
              </div>
            </div>

            {onNext && (
              <div className="mt-4 flex justify-end">
                <button
                  id={`quiz-next-${id}`}
                  onClick={onNext}
                  className="flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 duration-200 px-4 py-2 rounded-lg shadow-sm"
                >
                  <span>{isLast ? '完成測驗' : '下一題'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
