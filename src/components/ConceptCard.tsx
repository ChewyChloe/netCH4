/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { BookOpen, Check } from 'lucide-react';

interface ConceptCardProps {
  key?: any;
  title: string;
  englishTitle: string;
  description: string;
  details: string[];
  latexFormula?: string;
}

export function ConceptCard({
  title,
  englishTitle,
  description,
  details,
  latexFormula,
}: ConceptCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-zinc-100 shadow-sm p-6 relative overflow-hidden group hover:border-blue-100 transition-colors duration-300"
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 rounded-l-xl" />
      <div className="flex items-start gap-3.5">
        <div className="mt-1 bg-blue-50 text-blue-600 p-2 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
          <BookOpen className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-bold text-zinc-800 flex items-center gap-1.5 flex-wrap">
            <span>{title}</span>
            <span className="text-sm font-medium text-zinc-400 font-mono">
              （{englishTitle}）
            </span>
          </h4>
          <p className="mt-2 text-sm text-zinc-600 leading-relaxed font-normal">
            {description}
          </p>

          {latexFormula && (
            <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-mono text-sm text-blue-600 overflow-x-auto">
              <span className="font-semibold text-center select-all px-2">
                {latexFormula}
              </span>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {details.map((detail, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-zinc-600">
                <div className="mt-1 bg-green-50 text-green-600 p-0.5 rounded-full flex-shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <p className="text-xs leading-relaxed font-normal">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
