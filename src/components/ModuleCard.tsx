/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface ModuleCardProps {
  id: string;
  title: string;
  englishTitle: string;
  description: string;
  index: number;
  icon: LucideIcon;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}

export function ModuleCard({
  title,
  englishTitle,
  description,
  index,
  icon: Icon,
  isActive,
  isCompleted,
  onClick,
}: ModuleCardProps) {
  return (
    <motion.button
      id={`module-card-${index}`}
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`relative w-full text-left p-5 rounded-xl border transition-all duration-300 ${
        isActive
          ? 'bg-blue-50/70 border-blue-500 shadow-md shadow-blue-100/40'
          : 'bg-white border-zinc-100 shadow-sm hover:shadow-md hover:border-blue-200'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-lg transition-colors duration-300 ${
            isActive
              ? 'bg-blue-500 text-white'
              : 'bg-zinc-50 text-zinc-500 group-hover:bg-blue-50 group-hover:text-blue-500'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-mono text-xs font-semibold tracking-wider text-blue-500 uppercase">
              單元 {index + 1}
            </span>
            {isCompleted ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                已讀完
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-50 text-zinc-500 border border-zinc-100">
                未完成
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-zinc-800 flex items-center gap-1.5 flex-wrap">
            <span>{title}</span>
            <span className="text-xs font-normal text-zinc-400 font-mono">
              （{englishTitle}）
            </span>
          </h3>
          <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
