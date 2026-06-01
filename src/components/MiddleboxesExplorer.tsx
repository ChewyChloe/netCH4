/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Server,
  ShieldAlert,
  Sliders,
  Send,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Cpu,
  Monitor,
  Video,
  FileCode,
  Globe,
  Shuffle,
  Info
} from 'lucide-react';

interface MiddleboxDetail {
  id: string;
  name: string;
  englishName: string;
  icon: any;
  purpose: string;
  usagePlace: string;
  benefit: string;
  downside: string;
  packetBehavior: string;
}

const GALLERY_MIDDLEBOXES: MiddleboxDetail[] = [
  {
    id: 'nat',
    name: '網路位址轉換器',
    englishName: 'Network Address Translation (NAT)',
    icon: Shuffle,
    purpose: '重寫 IP 數據報中的來源/目的地 IP 地址與傳輸層埠口 (Port Number)，使局域網私用地址共享一個外部公共 IP 發送。',
    usagePlace: '家庭、企業網路出口路由器 (SOHO Gateways / Enterprise Edges)',
    benefit: '極大化延緩了 IPv4 地址枯竭危機，並增強內部主機隱私，不對外端直接暴露。',
    downside: '嚴重違反網路層級化設計，強行修改 L4 Port；阻礙 P2P 應用直連，被迫依賴 STUN/TURN 穿透伺服器。',
    packetBehavior: 'IP Packet from 10.0.0.1:2345 rewritten to 138.76.29.7:5001'
  },
  {
    id: 'firewall',
    name: '網絡防火牆',
    englishName: 'Packet-filtering Firewall',
    icon: ShieldAlert,
    purpose: '核查過境封包的標頭欄位（例如 IP, TCP Flag, Port），根據安全政策丟棄（Drop）非授權的惡意報文。',
    usagePlace: '企業邊際交換、雲端基礎設施閘口',
    benefit: '安全屏障！能防止惡意連接、DDoS、非授權特權接口訪問。',
    downside: '中途核查可能降低傳輸速率；對於採用加密 (HTTPS/TLS) 的流量難以直接探視 L4+ 特徵，不得不深度解析、維護複雜。',
    packetBehavior: 'If packet matches dst port = 23 (Telnet) ➔ Action: DROP'
  },
  {
    id: 'ids',
    name: '入侵檢測系統',
    englishName: 'Intrusion Detection System (IDS)',
    icon: Cpu,
    purpose: '對過境的所有封包進行「深度封包解析 (Deep Packet Inspection / DPI)」，比對是否含有惡意特徵（Signature）或非正常行為模式。',
    usagePlace: '重要伺服器防線前、數據中心骨幹交換節點',
    benefit: '相較於防火牆只看標頭，IDS 可以深度窺探封包 Payload 負載，識別應用層病毒、特徵漏洞與木馬通訊。',
    downside: '大數據負荷下解析頻寬壓力極度龐大，需要專用的高耗能硬件加速板卡；容易引發大量誤報 (False Positives)。',
    packetBehavior: 'Scan payload strings matching database signature of Log4j exploit ➔ Raise Alert'
  },
  {
    id: 'load-balancer',
    name: '負載平衡器',
    englishName: 'Load Balancer',
    icon: Server,
    purpose: '接收一個外部全局虛擬 IP 地址，將其湧入的並發流量，智能分配（輪詢、最少連接、雜湊）到後方的伺服器叢集（Server Farms）中。',
    usagePlace: '高流量網站雲端入口、反向代理前端',
    benefit: '完美實現大並發雲端擴展、彈性增加服務容器、抗爆增流量，並提供故障節點的高可用轉義。',
    downside: '成爲整套系統單一故障點 (SPOF)；流狀態管理（Session Sticky）同步機制複雜，需要高頻健康探查。',
    packetBehavior: 'Client maps Virtual IP ➔ Router converts destination to real node IP 10.23.0.4'
  },
  {
    id: 'cache',
    name: '網絡快取伺服器 / CDN',
    englishName: 'Web Cache / Content Delivery Network (CDN)',
    icon: Globe,
    purpose: '儲存熱點 HTTP/Media 靜態資源。當遇到相同的下載請求時，直接就近攔截並交付，無需往返源頭 Web 伺服器。',
    usagePlace: 'ISP 邊際機房、電信業者核心、近端代理 Proxy',
    benefit: '極速降低端對端響應延遲、釋放主幹網骨幹頻寬、為源網站伺服器分擔 90% 以上的大頻寬巨幅負荷。',
    downside: '可能發生過時快取 (Cache Invalidation Delay)，導致使用者端在資源更新初期看到古老舊版本內容。',
    packetBehavior: 'Intercept GET page ➔ If locally stored ➔ 200 OK with cache data without forwarding request'
  },
  {
    id: 'video-optimizer',
    name: '影音適配網關',
    englishName: 'Video Optimizer / Compactor',
    icon: Video,
    purpose: '檢測使用者端當下的實體無線鏈路品質、自適應降低影音在第四層上傳送的解析度或封裝碼率 (Transcoding)。',
    usagePlace: '移動通訊 (LTE / 5G) 電信商無線接入網路 (RAN) 核心',
    benefit: '保護移動基站通信頻寬，避免因為大量 4K 串流打爆局端天線；主機觀看獲得平滑、不卡頓的流動體驗。',
    downside: '干預了原始的多媒體負載格式，直接破壞了應用層與發送端原裝的媒體信號純淨度（與端對端原則相違）。',
    packetBehavior: 'Down-sample 1080p MP4 packet segment to 480p under low bandwidth radio channel'
  }
];

export function MiddleboxesExplorer() {
  const [selectedBoxId, setSelectedBoxId] = useState<string>('nat');
  const [reflectionStance, setReflectionStance] = useState<'helpful' | 'harmful' | 'both' | ''>('');
  const [reflectionText, setReflectionText] = useState<string>('');
  const [reflectionSubmitted, setReflectionSubmitted] = useState<boolean>(false);

  // Middleboxes Path Toggles
  const [enabledBoxes, setEnabledBoxes] = useState<Record<string, boolean>>({
    nat: true,
    firewall: true,
    loadBalancer: true
  });

  const activeBox = GALLERY_MIDDLEBOXES.find(b => b.id === selectedBoxId) || GALLERY_MIDDLEBOXES[0];

  const handleToggleBox = (id: string) => {
    setEnabledBoxes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReflectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionStance || !reflectionText.trim()) return;
    setReflectionSubmitted(true);
  };

  return (
    <div className="space-y-8 select-none text-left font-sans">
      {/* EXPLANATORY HERO SECTION */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="border-b pb-4 mb-5">
          <span className="text-[10px] bg-green-150 text-green-800 font-extrabold font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            BEYOND STANDARD ROUTING
          </span>
          <h3 className="text-xl font-black text-slate-800 mt-1">
            中介設備、網際架構與端對端原則 (Middleboxes & Internet Arch)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            什麼是中介設備？根據 RFC 3234 定義，中介設備是<strong>處在源端與目的地主機之間、除了執行標準 IP 路由器轉送（IP Routing Forwarding）以外</strong>的任何具備修改、劫持、加載或限制流量數據報行為的網路功能實體（如 NAT、防火牆、負載平衡器等）。
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl text-xs space-y-1.5 leading-relaxed">
          <strong>🤔 為什麼它破壞了傳統架構美德？</strong>
          <p className="text-slate-505">
            早期的網際網路設計哲學信奉<strong>「端對端原則 (End-to-End Argument)」</strong>：網格核心（Network Core）應該儘可能保持簡單、愚蠢與中立，只管傳遞封包；所有的智能（例如安全校驗、加密、影片緩衝、擁塞重傳）都應完全放置在<strong>網路邊緣的端點宿主主機（Edge Hosts）</strong>應用層上。
          </p>
          <p className="text-slate-505">
            然而在現實商業世界中，中介設備（Middleboxes）無處不在。它們雖然大幅增強了安全性、管理性與通透性能，但也使得網路核心變得無比精細、厚重且不易維護，也增加了新型網絡協定（例如 HTTP/3 QUIC 遭遇防火牆封鎖）普及的屏障。
          </p>
        </div>
      </div>

      {/* GALLERY SELECT SECTION */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="border-b pb-3 mb-5">
          <h3 className="text-base font-black text-slate-800">
            一、中介設備互動博覽館 (Interactive Middlebox Gallery)
          </h3>
          <span className="text-xs text-slate-400 block mt-0.5">點擊下方卡片深入瞭解在通往 Internet Data Path 的旅程中，不同中介魔術盒如何玩轉您的封包：</span>
        </div>

        {/* Gallery Selection Grids */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {GALLERY_MIDDLEBOXES.map((box) => {
            const isSelected = box.id === selectedBoxId;
            const Icon = box.icon;

            return (
              <button
                key={box.id}
                onClick={() => setSelectedBoxId(box.id)}
                className={`p-3 rounded-xl border text-center flex flex-col items-center justify-between gap-2 duration-150 ${
                  isSelected
                    ? 'border-green-500 bg-green-50/50 text-green-700 shadow-sm ring-2 ring-green-100 scale-102'
                    : 'border-slate-150 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-green-500 text-white' : 'bg-slate-100'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-center font-black text-[11px] font-sans">
                  {box.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Inspector Panel detail of selected box */}
        <div className="bg-slate-900 border border-slate-950 text-white p-5 rounded-2xl space-y-4 font-mono text-xs">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <span className="p-1 px-1.5 text-[9px] bg-green-900 text-green-200 rounded font-bold">
              SPECIFICATION INSPECTOR
            </span>
            <h4 className="text-sm font-black text-green-400">
              {activeBox.name} <span className="text-[10px] text-slate-405 font-normal font-sans">({activeBox.englishName})</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-8 space-y-3 leading-relaxed">
              <div>
                <strong className="text-slate-400 text-[10px] uppercase font-sans">⚙️ 工作職責與基本流程:</strong>
                <p className="text-slate-205 leading-relaxed font-sans">{activeBox.purpose}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <strong className="text-slate-400 text-[10px] uppercase font-sans">🌟 核心優勢 (Benefit):</strong>
                  <p className="text-emerald-300 font-sans text-[11px]">{activeBox.benefit}</p>
                </div>
                <div>
                  <strong className="text-slate-400 text-[10px] uppercase font-sans">⚠️ 主要爭議或反作用 (Downside):</strong>
                  <p className="text-rose-300 font-sans text-[11px]">{activeBox.downside}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 space-y-3">
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                <strong className="text-[10px] text-slate-500 block font-sans">📦 常見部署位置 (Deployment Place)</strong>
                <span className="text-slate-300 font-sans mt-0.5 block">{activeBox.usagePlace}</span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                <strong className="text-[10px] text-yellow-405 block">⚡ 過境封包實務異動特徵 (Packet Behavior)</strong>
                <span className="text-yellow-405 mt-1 block h-9 font-mono overflow-y-auto leading-normal">{activeBox.packetBehavior}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC PATHWAY VISUALIZER */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="border-b pb-4 mb-5">
          <h3 className="text-base font-black text-slate-800">
            二、數據路徑端對端中介模擬器 (Network Path Middlebox Visualizer)
          </h3>
          <span className="text-xs text-slate-400 block mt-0.5">
            控制數據流沿途所經過的「NAT」、「防火牆」與「負載平衡器」的開關狀態，查看封包在傳送時標頭與行爲的精細實時演變：
          </span>
        </div>

        {/* Pathway settings controller row */}
        <div className="flex gap-4 items-center bg-slate-50 border p-4 rounded-xl mb-6 flex-wrap text-xs justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-slate-500">開關中介節點：</span>
            
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enabledBoxes.nat}
                onChange={() => handleToggleBox('nat')}
                className="rounded text-green-600 focus:ring-green-400 w-4 h-4"
              />
              <span className="font-semibold text-slate-700">1. 出口 NAT</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enabledBoxes.firewall}
                onChange={() => handleToggleBox('firewall')}
                className="rounded text-green-600 focus:ring-green-400 w-4 h-4"
              />
              <span className="font-semibold text-slate-700">2. 入口防火牆</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enabledBoxes.loadBalancer}
                onChange={() => handleToggleBox('loadBalancer')}
                className="rounded text-green-600 focus:ring-green-400 w-4 h-4"
              />
              <span className="font-semibold text-slate-700">3. 負載流量平衡</span>
            </label>
          </div>

          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded text-[11px] text-indigo-700">
            💡 數據報目前正從 <strong>Client 內部局域主機</strong> 發送到目的地 <strong>Web 雲端集群</strong>
          </div>
        </div>

        {/* Node visual map chain */}
        <div className="p-5 bg-slate-50 border border-dashed rounded-2xl space-y-6 relative overflow-hidden">
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 z-10 relative">
            
            {/* Host Node */}
            <div className="bg-white border-2 border-slate-200 p-3 rounded-xl shadow-sm text-center w-36 shrink-0 select-none">
              <Monitor className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <strong className="text-[10.5px] block text-slate-800">局網 PC Client</strong>
              <span className="text-[9px] font-mono text-slate-400">Src IP: 192.168.1.102</span>
              <span className="text-[9px] font-mono text-slate-400 block">Src Port: 49200</span>
            </div>

            {/* Jump 1 Arrow */}
            <div className="h-6 lg:h-[2px] w-[2px] lg:w-10 bg-slate-300 relative" />

            {/* NAT Node */}
            <div className={`p-3 rounded-xl shadow-sm text-center w-40 shrink-0 border duration-200 ${
              enabledBoxes.nat
                ? 'bg-emerald-50 border-emerald-300 text-slate-800'
                : 'bg-white border-slate-100 text-slate-400 opacity-60'
            }`}>
              <div className="font-mono text-[9px] tracking-wider text-slate-400 font-extrabold uppercase mb-1">NODE 01: NAT</div>
              <strong className="text-[10px] block font-bold">局域出口 NAT 節點</strong>
              {enabledBoxes.nat ? (
                <div className="mt-1 space-y-0.5 text-[8.5px] font-mono text-emerald-700 font-semibold leading-normal">
                  <span className="bg-emerald-100 rounded px-1">【重寫 IP 地址及埠號】</span>
                  <span className="block text-slate-500">改爲 138.76.29.7:5001</span>
                </div>
              ) : (
                <span className="text-[9px] text-slate-400 block mt-1 italic">（已被繞過/關閉）</span>
              )}
            </div>

            {/* Jump 2 Arrow */}
            <div className="h-6 lg:h-[2px] w-[2px] lg:w-10 bg-slate-300" />

            {/* Firewall Node */}
            <div className={`p-3 rounded-xl shadow-sm text-center w-40 shrink-0 border duration-200 ${
              enabledBoxes.firewall
                ? 'bg-rose-50 border-rose-200 text-slate-800'
                : 'bg-white border-slate-100 text-slate-400 opacity-60'
            }`}>
              <div className="font-mono text-[9px] tracking-wider text-slate-400 font-extrabold uppercase mb-1">NODE 02: FIREWALL</div>
              <strong className="text-[10px] block font-bold">雲端安全防火牆</strong>
              {enabledBoxes.firewall ? (
                <div className="mt-1 space-y-0.5 text-[8.5px] font-mono text-rose-700 font-semibold leading-normal">
                  <span className="bg-rose-100 rounded px-1">【過境標頭深度安全核查】</span>
                  <span className="block text-slate-500">放行 Dst Port = 8000</span>
                </div>
              ) : (
                <span className="text-[9px] text-slate-400 block mt-1 italic">（放行所有未經過濾包）</span>
              )}
            </div>

            {/* Jump 3 Arrow */}
            <div className="h-6 lg:h-[2px] w-[2px] lg:w-10 bg-slate-300" />

            {/* Load Balancer */}
            <div className={`p-3 rounded-xl shadow-sm text-center w-40 shrink-0 border duration-200 ${
              enabledBoxes.loadBalancer
                ? 'bg-indigo-50 border-indigo-200 text-slate-800'
                : 'bg-white border-slate-100 text-slate-400 opacity-60'
            }`}>
              <div className="font-mono text-[9px] tracking-wider text-slate-400 font-extrabold uppercase mb-1">NODE 03: LB</div>
              <strong className="text-[10px] block font-bold">伺服器負載分流器</strong>
              {enabledBoxes.loadBalancer ? (
                <div className="mt-1 space-y-0.5 text-[8.5px] font-mono text-indigo-700 font-semibold leading-normal">
                  <span className="bg-indigo-100 rounded px-1">【指派目標服務主機】</span>
                  <span className="block text-slate-500">分流至實體 Node 03</span>
                </div>
              ) : (
                <span className="text-[9px] text-slate-400 block mt-1 italic">（無分配，直連主節點）</span>
              )}
            </div>

            {/* Jump 4 Arrow */}
            <div className="h-6 lg:h-[2px] w-[2px] lg:w-10 bg-slate-300" />

            {/* Server Cluster */}
            <div className="bg-white border-2 border-slate-200 p-3 rounded-xl shadow-sm text-center w-36 shrink-0 select-none">
              <Server className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <strong className="text-[10.5px] block text-slate-800">Server Nodes</strong>
              <span className="text-[8.5px] font-mono text-slate-400 block">
                {enabledBoxes.loadBalancer ? '🎯 Node_03: 10.23.1.5' : '🎯 Node_Main: 10.23.1.1'}
              </span>
            </div>
          </div>

          {/* Current Packet Information Banner */}
          <div className="p-4 bg-slate-900 text-white rounded-xl font-mono text-[11px] leading-relaxed relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">當前過境封包最終特徵 (OUTBOUND PACKET SPECIFICATE):</span>
              <div className="flex gap-2 items-center flex-wrap">
                <span><strong>Source IP:</strong> <span className="text-yellow-405">{enabledBoxes.nat ? '138.76.29.7' : '192.168.1.102'}</span></span>
                <span className="text-slate-700">|</span>
                <span><strong>Source Port:</strong> <span className="text-yellow-405">{enabledBoxes.nat ? '5001' : '49200'}</span></span>
                <span className="text-slate-700">|</span>
                <span><strong>Destination IP:</strong> <span className="text-yellow-405">{enabledBoxes.loadBalancer ? '10.23.1.5' : '10.23.1.1'}</span></span>
              </div>
            </div>

            <div className="bg-slate-950 p-2 border border-slate-800 rounded font-sans text-slate-300 text-[10.5px] flex-1 sm:max-w-xs leading-normal">
              🛡️ <strong>物理安全行為：</strong><br />
              <p className="mt-1 text-slate-400">
                {enabledBoxes.firewall
                  ? '封包已成功通過入侵過濾。防火牆未丟棄此報文，保障通暢抵達雲機！'
                  : '未經過滤器核查。如果封包內含有惡意特徵（DDoS），後方 Web 主機可能會遭受嚴重網絡打擊。'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* IP HOURGLASS SECTION */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="border-b pb-4 mb-6">
          <h3 className="text-base font-black text-slate-850">三、網際網路之哲學信仰：IP 沙漏細腰 (The IP Hourglass)</h3>
          <span className="text-xs text-slate-400 block mt-0.5">為什麼全球有數百萬種軟硬體協定，卻能在 Internet 融洽對接？來感受 IP 的「沙漏形」最美架構特徵：</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Symmetrical CSS visual Hourglass */}
          <div className="md:col-span-5 bg-slate-950 border border-slate-900 rounded-2xl p-6 text-white text-center font-mono relative py-10">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-20" />
            
            {/* Top Hourglass - Application Layer */}
            <div className="space-y-1 block relative z-10">
              <span className="text-[9px] text-slate-500 font-bold block mb-1">TOP - 應用層繁花繁盛</span>
              <div className="flex justify-center gap-1.5 flex-wrap">
                {['HTTP', 'SMTP', 'DASH', 'SSH', 'DNS', 'QUIC', 'MQTT'].map(app => (
                  <span key={app} className="bg-blue-900/40 text-blue-300 text-[9px] px-1.5 py-0.5 rounded font-black border border-blue-900">
                    {app}
                  </span>
                ))}
              </div>
            </div>

            {/* Connecting lines */}
            <div className="my-5 h-[2px] bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

            {/* Middle Waist - NARROW IP */}
            <div className="py-2 inline-block relative z-10">
              <div className="bg-amber-500 text-black font-sans font-black text-xs px-5 py-2.5 rounded-full shadow-lg shadow-amber-500/10 ring-4 ring-amber-550 border border-amber-400 relative">
                👑 IP (Internet Protocol)
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-black" />
                </span>
              </div>
              <span className="text-[9px] text-amber-500 block uppercase font-bold mt-2 tracking-widest">
                “Thin Waist - 極簡窄細腰”
              </span>
            </div>

            {/* Connecting lines */}
            <div className="my-5 h-[2px] bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

            {/* Bottom Hourglass - Link & Physical Layer */}
            <div className="space-y-1 block relative z-10">
              <span className="text-[9px] text-slate-500 font-bold block mb-1">BOTTOM - 豐富多樣物理介質</span>
              <div className="flex justify-center gap-1.5 flex-wrap">
                {['Ethernet', '802.11 WiFi', '5G NR', 'Bluetooth', 'PPP', 'Radio', 'Fiber'].map(lnk => (
                  <span key={lnk} className="bg-slate-800 text-slate-350 text-[9px] px-1.5 py-0.5 rounded border border-slate-700">
                    {lnk}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Symmetrical Explanatory Text */}
          <div className="md:col-span-7 space-y-4">
            <h4 className="text-sm font-bold text-slate-800">為什麼要設計成「沙漏形（Hourglass）」？</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Internet 架構不要求上層應用去適應底層物理媒介，也不要求下層物理媒介去知曉上層應用內容。其唯一的接口、共通的窄腰就是——<strong>IP (網際網路協定)</strong>。
            </p>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              所有的應用、不論是直播串流還是郵件，在發射時都必須拆散為 IP 數據報並加上 IP 標頭；所有的物理網卡物理信道，不論是海底光纖還是 5G 電磁波，都必須能搬運 IP 封包。<strong>這種「一個窄腰，兩頭無限發散」的極致折衝，是整個 Internet 得以無限包容、相容全球的基石。</strong>
            </p>
            <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-xl text-[11px] text-amber-800/95 leading-relaxed font-sans">
              ⚠️ <strong>中介設備的侵蝕憂患：</strong><br />
              <p className="mt-1 text-slate-600">
                如果我們濫用 Middleboxes（例如在網路內部到處設立深度解析 Web 的 Content Caches 與 Video Optimizers），這等同於在「大沙漏細腰」上疊加了沉重厚實的中介石塊，促使網路核心日趨僵化。本來只需傳輸 IP bits 的中介硬體若開始「深度探視」應用，使得未來欲推廣新型協定（如 HTTP/3）時會被錯誤直接丟棄。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* END-TO-END VS NETWORK SMART CARD */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="border-b pb-4 mb-5">
          <h3 className="text-base font-black text-slate-850">四、學術思想核心：端對端原則 (End-to-End Argument)</h3>
          <span className="text-xs text-slate-400 block mt-0.5">對比「智能在邊緣」與「智能在網路中間」兩大哲學陣營的角逐：</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-sans">
          <div className="border border-blue-100 bg-blue-50/10 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-blue-700">陣營一：邊緣智能端對端原則 (E2E Argument)</h4>
              <span className="p-0.5 px-1.5 text-[9px] bg-blue-500 text-white rounded font-bold">傳統正統學派</span>
            </div>
            <p className="text-slate-601 leading-relaxed text-[11.5px]">
              此信條宣稱：<strong>「某些網絡傳輸功能，有且僅能在兩端的端點（Endpoints）上方，結合最高應用層（Application）的知識，方可被正確且完全地實現。」</strong>
            </p>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              例如：在網絡中間節點提供 Checksum 校正可能重傳。但這仍然「無法免除」發送端與接收端「端對端做文件校驗」的職責（因中間硬體磁碟或緩衝區也可能損壞）。既然端對端「必須」要做這份校驗，在網路核心中間反復重複做便是一種低效的冗餘。保持网芯愚蠢，網絡方能極致快速運行。
            </p>
          </div>

          <div className="border border-green-150 bg-green-50/10 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-green-700">陣營二：核心中介代理智能 (Middlebox Smart Core)</h4>
              <span className="p-0.5 px-1.5 text-[9px] bg-green-600 text-white rounded font-bold">當代商業實踐</span>
            </div>
            <p className="text-slate-601 leading-relaxed text-[11.5px]">
              此陣營宣稱：<strong>「在中間通路節點注入智能加值，可以極大地增進傳輸性能、節省頻寬，並在端主機無感知的情況下捍衛安全。」</strong>
            </p>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              例如：NAT 防護了幾十億級別的 IPv4 端機安全；CDN（快取伺服器）在本地直接返回網頁，降低骨幹 90% 延時。一味追求聖潔、純潔的 E2E 原則將失去當下絕大多數的性能高速快感。商業現實和工程實用性促使了 Middlebox 當下大獲全勝。
            </p>
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE STANCE REFLECTION TASK */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="border-b pb-3 mb-5">
          <h3 className="text-base font-black text-slate-805">五、學術反思與思考擂台：中介設備是天使還是惡魔？</h3>
          <span className="text-xs text-slate-400 block mt-0.5">「中介設備（Middleboxes）的存在，對於網路生態是利大於弊（Helpful），還是弊大於利（Harmful），或是皆而有之的雙刃劍（Both）？」</span>
        </div>

        {!reflectionSubmitted ? (
          <form onSubmit={handleReflectionSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-605 font-mono">請選擇您的學術立場 Stance:</span>
              <div className="flex gap-2">
                {[
                  { id: 'helpful', label: '😇 有利（Helpful）- 大幅提速與保障安全' },
                  { id: 'harmful', label: '👿 有害（Harmful）- 違背 E2E、硬體僵化' },
                  { id: 'both', label: '⚖️ 皆有（Both）- 學術反對，商業剛需的矛盾體' }
                ].map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setReflectionStance(b.id as any)}
                    className={`text-xs py-1.5 px-3 rounded-lg border font-bold duration-150 ${
                      reflectionStance === b.id
                        ? 'border-green-500 bg-green-105 text-green-800'
                        : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label htmlFor="txt-reflection" className="block text-slate-500 font-bold">請寫下一段 50-150 字的短文闡述您的個人思考（Short Academic Response）：</label>
              <textarea
                id="txt-reflection"
                rows={4}
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="在此寫下您的深入見解..."
                className="w-full border rounded-xl p-3 focus:ring-green-400"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!reflectionStance || !reflectionText.trim()}
                className="text-xs font-black bg-green-600 hover:bg-green-705 text-white px-5 py-2.5 rounded-xl disabled:opacity-50 transition cursor-pointer shadow-sm flex items-center gap-1"
              >
                <Send className="w-4 h-4" />
                送交學術思考報告
              </button>
            </div>
          </form>
        ) : (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-5"
          >
            <div className="p-4 bg-slate-900 text-white rounded-xl font-mono text-xs text-left border">
              <span className="text-[9px] text-green-400 block font-bold uppercase tracking-wider">SUBMITTED STUDY REPORT</span>
              <strong className="text-sm">學術思維診斷：【{reflectionStance === 'helpful' ? '有利學派' : reflectionStance === 'harmful' ? '危害思潮' : '雙向中庸學閥'}】</strong>
              
              <div className="mt-2.5 p-3 bg-slate-950 rounded border border-slate-805 leading-relaxed font-sans text-slate-300">
                “{reflectionText}”
              </div>

              <div className="mt-4 flex items-center gap-2 text-green-400 font-sans text-[11px] font-bold">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                報告提交成功！您的思考非常具有深度，這份反思報告已安全加載並存入本地數據棧。
              </div>
            </div>

            {/* Simulated peers reflections feedbacks to encourage the students */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800">🗣️ 看看其他學霸們對此議題的解嘲與駁斥 (Simulated Peer Reflections):</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] leading-relaxed font-sans text-slate-600">
                <div className="p-3 bg-blue-50/20 border border-blue-105 rounded-xl space-y-1">
                  <strong>🎓 台大資工系學長:</strong>
                  <p className="text-slate-505">
                    「Middleboxes 是工程妥協的極致。如果沒有 NAT，IPv4 位址在上個世紀早已徹底熔斷死鎖，我們根本活不到 IPv6 真正普及的一天。所以比起教條般的純真，能動、可用、高效率才是第一原則！」
                  </p>
                </div>
                <div className="p-3 bg-rose-50/20 border border-rose-105 rounded-xl space-y-1">
                  <strong>🎓 麻省理工學院 (MIT) 訪問學者:</strong>
                  <p className="text-slate-505">
                    「Middleboxes 的泛濫，其代價是毀滅性的。當下所有的防火牆把未知、非 HTTP 標頭的 L4+ 流量乾脆地 Drop，這實質上阻斷了全球科學界對於新型非 TCP/UDP 傳輸協定的研發探索。這種扼殺創新，就是沉重網芯的邪惡罪狀。」
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
