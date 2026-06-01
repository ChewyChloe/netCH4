/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Cpu, ArrowRightLeft, ArrowRight, ArrowDown } from 'lucide-react';

interface RouterComponentInfo {
  id: string;
  name: string;
  englishName: string;
  timeframe: string;
  plane: 'data' | 'control';
  desc: string;
}

export function InteractiveDiagram() {
  const [hoveredComponent, setHoveredComponent] = useState<RouterComponentInfo | null>(null);

  const routerComponents: RouterComponentInfo[] = [
    {
      id: 'processor',
      name: '路由處理器',
      englishName: 'Routing Processor',
      timeframe: '毫秒（Millisecond）時間刻度',
      plane: 'control',
      desc: '執行路由協定（例如 OSPF、BGP），維護傳統路由狀態表，計算本地轉送表，並進行網路管理功能。這是路由器的核心控制大腦，屬於「控制平面（Control Plane）」的一部分，主要以軟體形式運作於處理器晶片中。',
    },
    {
      id: 'fabric',
      name: '高頻交換結構',
      englishName: 'Switching Fabric',
      timeframe: '奈秒（Nanosecond）時間刻度',
      plane: 'data',
      desc: '將路由器的輸入埠連接至合適的輸出埠。它是路由器最關鍵的物理通道骨幹，主要以積體電路硬體形式高速串聯。有三大實現類型：記憶體（Memory）交換、共享匯流排（Bus）交換、與縱橫網格（Crossbar）互連網路交換。',
    },
    {
      id: 'input',
      name: '路由器輸入埠',
      englishName: 'Router Input Ports',
      timeframe: '奈秒（Nanosecond）時間刻度',
      plane: 'data',
      desc: '包含實體線路端接及連結層協定接收（例如 Ethernet）。最核心功能是執行「去中心化交換與匹配（Decentralized Switching & Lookup）」，根據標頭字首查詢轉送表，直接決定輸出埠。若抵達速度過快則會被迫進入輸入佇列。',
    },
    {
      id: 'output',
      name: '路由器輸出埠',
      englishName: 'Router Output Ports',
      timeframe: '奈秒（Nanosecond）時間刻度',
      plane: 'data',
      desc: '暫存來自交換結構的 IP 封包，並執行連結層及實體層協定將其傳送至下一個節點。包含了關鍵的「佇列緩衝區管理（Queue Buffer Management）」與「排程政策（Scheduling Policies，如 FCFS、Priority 或加權公平排程 WFQ）」。',
    },
  ];

  return (
    <div id="interactive-diagram" className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm">
      <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
        <span>互動組件：通用路由器架構（Generic Router Architecture）</span>
        <span className="text-[10px] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-indigo-700 font-bold uppercase">
          資料平面與控制平面物理對接
        </span>
      </h4>
      <p className="text-xs text-slate-500 mb-5 leading-normal">
        下圖為路由器的物理硬體拓樸。請將滑鼠移到或點擊各個元件，一睹其執行工作、處理平面與時間刻度細節差距。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SVG Drawing of the Router Architecture */}
        <div className="md:col-span-8 flex flex-col items-center bg-slate-50 border border-slate-100 rounded-xl p-6 relative">
          
          {/* CONTROL PLANE BOX LIMIT */}
          <div className="w-full border border-dashed border-red-300 rounded-lg p-3 bg-red-50/5 mb-4 relative">
            <span className="absolute -top-2.5 left-4 px-1.5 bg-slate-50 text-[10px] font-bold text-red-500 uppercase tracking-widest font-mono">
              控制平面 (Control Plane) —— 軟體 (Software)
            </span>
            <div className="flex justify-center">
              <motion.div
                id="diag-processor"
                onMouseEnter={() => setHoveredComponent(routerComponents[0])}
                onMouseLeave={() => setHoveredComponent(null)}
                whileHover={{ scale: 1.02 }}
                className={`px-6 py-3 rounded-lg border flex items-center gap-2 cursor-pointer duration-200 shadow-sm ${
                  hoveredComponent?.id === 'processor'
                    ? 'border-red-500 bg-red-100/60 text-red-800 font-bold'
                    : 'border-slate-350 bg-white text-slate-700'
                }`}
              >
                <Cpu className="w-4 h-4 text-red-500" />
                <div className="text-left font-semibold">
                  <div className="text-xs">路由處理器 (Routing Processor)</div>
                  <div className="text-[9px] font-mono opacity-80">毫秒 (millisecond) 控制</div>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="w-full flex justify-center py-1">
            <ArrowDown className="w-4 h-4 text-slate-400" />
          </div>

          {/* DATA PLANE BOX LIMIT */}
          <div className="w-full border border-dashed border-blue-300 rounded-lg p-3 bg-blue-50/5 relative">
            <span className="absolute -top-2.5 left-4 px-1.5 bg-slate-50 text-[10px] font-bold text-blue-500 uppercase tracking-widest font-mono">
              資料平面 (Data Plane) —— 硬體 (Hardware)
            </span>

            <div className="grid grid-cols-3 items-center gap-4 py-3">
              {/* INPUT PORTS STACK */}
              <div className="flex flex-col gap-2">
                {[1, 2].map((x) => (
                  <motion.div
                    key={x}
                    id={`diag-input-${x}`}
                    onMouseEnter={() => setHoveredComponent(routerComponents[2])}
                    onMouseLeave={() => setHoveredComponent(null)}
                    whileHover={{ scale: 1.02 }}
                    className={`p-2.5 rounded-lg border text-center cursor-pointer duration-200 shadow-sm ${
                      hoveredComponent?.id === 'input'
                        ? 'border-blue-500 bg-blue-100/60 text-blue-800'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-bold">輸入埠 (Input Port)</div>
                    <div className="text-[8px] font-mono text-slate-400 mt-0.5">查表與轉送</div>
                  </motion.div>
                ))}
              </div>

              {/* CENTRAL SWITCHING FABRIC */}
              <motion.div
                id="diag-fabric"
                onMouseEnter={() => setHoveredComponent(routerComponents[1])}
                onMouseLeave={() => setHoveredComponent(null)}
                whileHover={{ scale: 1.02 }}
                className={`py-6 px-3 border-2 rounded-xl text-center cursor-pointer duration-200 flex flex-col items-center justify-center shadow-md ${
                  hoveredComponent?.id === 'fabric'
                    ? 'border-indigo-500 bg-indigo-100 text-indigo-900 font-bold'
                    : 'border-slate-300 bg-white text-slate-700'
                }`}
              >
                <ArrowRightLeft className="w-6 h-6 text-indigo-500 mb-1.5" />
                <div className="text-[10px] font-bold leading-tight">高連通交換結構</div>
                <div className="text-[8px] font-mono text-slate-400 mt-1">Switching Fabric</div>
              </motion.div>

              {/* OUTPUT PORTS STACK */}
              <div className="flex flex-col gap-2">
                {[1, 2].map((x) => (
                  <motion.div
                    key={x}
                    id={`diag-output-${x}`}
                    onMouseEnter={() => setHoveredComponent(routerComponents[3])}
                    onMouseLeave={() => setHoveredComponent(null)}
                    whileHover={{ scale: 1.02 }}
                    className={`p-2.5 rounded-lg border text-center cursor-pointer duration-200 shadow-sm ${
                      hoveredComponent?.id === 'output'
                        ? 'border-blue-500 bg-blue-100/60 text-blue-800'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-bold">輸出埠 (Output Port)</div>
                    <div className="text-[8px] font-mono text-slate-400 mt-0.5">佇列與排程</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Explanation Side cards */}
        <div className="md:col-span-4 min-h-[220px] flex flex-col justify-center">
          {hoveredComponent ? (
            <motion.div
              key={hoveredComponent.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900 border border-slate-950 rounded-xl p-5 text-white"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    hoveredComponent.plane === 'control'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {hoveredComponent.plane === 'control' ? '控制平面 (Control)' : '資料平面 (Data)'}
                </span>
                <span className="text-[9px] font-mono text-slate-400">{hoveredComponent.timeframe}</span>
              </div>
              <h5 className="text-sm font-extrabold flex items-center gap-1">
                <span>{hoveredComponent.name}</span>
                <span className="text-[10px] font-normal text-slate-400">({hoveredComponent.englishName})</span>
              </h5>
              <p className="mt-2.5 text-xs text-slate-300 leading-relaxed font-normal">
                {hoveredComponent.desc}
              </p>
            </motion.div>
          ) : (
            <div className="border border-dashed border-slate-300 rounded-xl p-5 text-center text-slate-400 italic text-xs leading-relaxed max-w-sm mx-auto flex flex-col items-center justify-center gap-2 h-full py-12">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-1">
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
              <span>請將游標移至左側路由器硬體結構區塊上，觀看每個單元的功能分解與時間刻度。</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
