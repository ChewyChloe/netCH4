/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface TimelineStep {
  stepNumber: string;
  title: string;
  englishTitle: string;
  desc: string;
  sender: string;
  receiver: string;
  badgeText?: string;
}

interface StepTimelineProps {
  steps: TimelineStep[];
}

export function StepTimeline({ steps }: StepTimelineProps) {
  return (
    <div id="step-timeline" className="relative pl-6 border-l-2 border-slate-200 space-y-8 my-6">
      {steps.map((x, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.1, duration: 0.3 }}
          className="relative text-left"
        >
          {/* Timeline Node dot */}
          <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-mono text-xs font-bold shadow-md shadow-blue-100">
            {x.stepNumber}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                <span>{x.title}</span>
                <span className="text-xs font-medium text-slate-400 font-mono">
                  （{x.englishTitle}）
                </span>
              </h4>
              {x.badgeText && (
                <span className="text-[9px] bg-slate-100 border border-slate-200 px-1 py-0.5 rounded text-slate-600 font-bold font-mono uppercase">
                  {x.badgeText}
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] text-slate-400 font-bold font-mono">
              <span>發送：{x.sender}</span>
              <span className="text-slate-300">➔</span>
              <span>接收：{x.receiver}</span>
            </div>

            <p className="mt-2 text-xs text-slate-600 leading-relaxed max-w-2xl font-normal">
              {x.desc}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
