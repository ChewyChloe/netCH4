/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InteractiveModule, QuizQuestion } from './types.ts';

export const CHAPTER_MODULES: InteractiveModule[] = [
  {
    id: 'overview',
    title: '網路層概述',
    englishTitle: 'Network Layer Overview',
    description: '深入探討資料平面行為、控制平面原則以及網際網路最核心的服務模型設計。',
    concepts: [
      {
        title: '雙主幹功能：轉送與路由',
        englishTitle: 'Two Key Network-Layer Functions: Forwarding and Routing',
        description: '網路層之核心任務在於將傳輸層段（Segment）從傳送端主機移動至接收端主機。這包含兩項關鍵功能的協同運作：',
        details: [
          '轉送（Forwarding）：係指單一路由器內部的本地功能。當封包抵達路由器的輸入埠連結時，路由器需決定將其移動至哪一個適當的輸出埠連結。轉送可以類比為車輛通過單一交流道（Interchange）的過程。',
          '路由（Routing）：係指跨越整個網路的全局邏輯行為。它決定了封包從起點（Source）到終點（Destination）所沿途採取的路徑。此路徑由路由演算法（Routing Algorithms）計算。可以類比為規劃整趟旅行從起點到終點之完整路線方案的規劃過程。'
        ]
      },
      {
        title: '資料平面與控制平面之區分',
        englishTitle: 'Data Plane and Control Plane',
        description: '在現代網路架構中，網路層被清晰拆解為執行層（資料平面）與決策層（控制平面）：',
        details: [
          '資料平面（Data Plane）：屬於本地（Per-router）的硬體層級功能。當 IP 資料報（IP Datagram）抵達輸入埠時，讀取封包標頭（Header）中的關鍵欄位值，並根據路由器內部的轉送表（Forwarding Table）直接將封包推送至輸出埠。此處通常在奈秒（Nanosecond）的時間刻度內極速完成。',
          '控制平面（Control Plane）：屬於網路範圍（Network-wide）的邏輯功能。它負責決定資料報在多台路由器之間的端對端路徑：',
          '傳統路由演算法（Traditional Routing Algorithms）：每個路由器內均實現路由演算法元件，彼此相互交換路由資訊計算轉送表，屬於分散式控制。',
          '軟體定義網路（Software-Defined Networking, SDN）：由遠端控制器（Remote Controller）集中式地計算並動態下載（Install）轉送表到每個路由器中，實現高彈性、可控性。'
        ]
      },
      {
        title: '網路服務模型',
        englishTitle: 'Network Service Model',
        description: '決定「通道（Channel）」在傳送端與接收端之間傳送資料報時的品質與保證。',
        details: [
          '最佳努力服務（Best-Effort Service）：網際網路所採用的服務模型。它「不保證」資料報是否成功送達終點、不保證抵達的順序或時間、也不保證流（Flow）中可用的頻寬。其極度簡單的機制正是網際網路得以低成本、高規模化部署的核心秘訣。',
          '相較於 ATM 架構提供的服務，如恆定端頻寬的等值位元率（Constant Bit Rate, CBR）或保證最低頻寬的可用位元率（Available Bit Rate, ABR），最佳努力服務雖沒有任何品質服務（QoS）保證，但高度具備彈性與適應能力。'
        ]
      }
    ]
  },
  {
    id: 'router-arch',
    title: '路由器架構解析',
    englishTitle: 'Router Architecture',
    description: '拆解高頻轉送硬體的核心，理解輸入埠、交換技術、輸出埠以及排程機制。',
    concepts: [
      {
        title: '組件與時序剖析',
        englishTitle: 'Router Components and Timeframe',
        description: '路由器架構可劃分為四個核心硬體與軟體組件：',
        details: [
          '路由處理器（Routing Processor）：運行軟體（即控制平面），處理 OSPF, BGP 等路徑選擇協定與維護管理、轉送表等。在毫秒（Millisecond）時間刻度內運行。',
          '高連通交換結構（High-speed Switching Fabric）：資料平面的硬體骨幹，將輸入埠與輸出埠以極高頻寬物理連接。在奈秒（Nanosecond）級別運行。',
          '輸入埠（Input Ports）：包含物理層的線路端接（Line Termination）、連結層協定接收（Link-layer Protocol Receive），以及去中心化交換與查表轉送（Decentralized Switching & Lookup）。',
          '輸出埠（Output Ports）：包含資料報暫存佇列（Queueing/Buffering）、連結層解析、線路端接發送。'
        ]
      },
      {
        title: '三大交換結構類型',
        englishTitle: 'Three Major Types of Switching Fabrics',
        description: '交換結構決定了資料報從輸入埠移動到輸出埠的速率與並行度（Concurrency）：',
        details: [
          '藉由記憶體交換（Switching via Memory）：最早期初代路由器。將封包複製到系統主要記憶體中，由 CPU 直接解碼轉送。頻寬限制在記憶體匯流排瓶頸中（資料報需通過匯流排二次）。',
          '藉由匯流排交換（Switching via Bus）：輸入埠與輸出埠之間共享一條専用匯流排。無須 CPU 干預，但會產生匯流排競爭（Bus Contention），一次僅有一個輸入埠能佔用發送封包。',
          '藉由互連網路交換（Switching via Interconnection Network）：利用多級交換機（Multistage Switches）或縱橫式網格（Crossbar）並行轉送。支援將 IP 封包切割成固定長度的細胞晶片（Cells）進行多路並行傳送，到了出口再行重組。能達到數十至數百 Tbps 的超高吞吐。'
        ]
      },
      {
        title: '佇列與擁塞：HOL 阻塞與緩衝區計算',
        englishTitle: 'HOL Blocking & Queueing Delay / Buffer Sizing',
        description: '當交換結構的速率低於所有輸入埠輸入速率的總和，或輸出連結速率低於來自交換結構的傳送速率時，佇列即會發生：',
        details: [
          '輸入埠佇列與線頭阻塞（Head-of-the-Line, HOL Blocking）：在輸入佇列最前方等待的封包因為輸出埠正忙，導致原本可以轉送至其他可用輸出埠的後續封包亦一併被卡住無法前進。',
          '輸出埠佇列：當資料報從交換結構抵達出口速率大於輸出連結容量時必會排隊，可能引發緩衝區溢位導致封包遺失。',
          '緩衝區大小分配公式：傳統 RFC 3439 經驗法則認為平均緩衝大小應等於典型往返時間（RTT）乘以連結容量 C：\\( B = RTT \\times C \\)。當存在 N 個獨立 TCP 流時，新研究指出可用較小緩衝區：\\( B = \\frac{RTT \\times C}{\\sqrt{N}} \\)。過大的緩衝區會增加封包延遲，產生嚴重的緩衝區膨脹（Bufferbloat）。'
        ],
        latexFormula: 'B = \\frac{RTT \\times C}{\\sqrt{N}}'
      },
      {
        title: '緩衝區管理與丟棄原則',
        englishTitle: 'Buffer Management: Drop Policies',
        description: '當佇列緩衝區額滿時，路由器應如何取捨並宣告擁塞。',
        details: [
          '尾部丟棄（Tail Drop）：當緩衝區滿了，直接丟棄後續抵達的封包。',
          '主動丟棄極限值（Active Drop/Priority Drop）：依據優先等級或分類優先丟棄低順位封包。',
          '擁塞標記（Congestion Marking）：透過在封包標頭設置 ECN（Explicit Congestion Notification）位元或隨機早期檢測（Random Early Detection, RED）機制，在擁塞初期通知傳送端降速，避免大量嚴重丟包。'
        ]
      },
      {
        title: '套件排程政策',
        englishTitle: 'Packet Scheduling Policies',
        description: '決定哪一個佇列中等待的封包應該下一個被送上連結：',
        details: [
          '先進先出排程（First-Come-First-Served, FCFS / FIFO）：按照抵達的順序無差別發送。',
          '優先權排程（Priority Scheduling）：先發送高層優先佇列之封包，僅當高階佇列皆空時始發送低層。',
          '輪詢排程（Round Robin, RR）：循環掃描所有分類佇列，一輪在每個非空佇列中各挑選一個封包發送。',
          '加權公平佇列（Weighted Fair Queueing, WFQ）：輪詢的通式與升級版。賦予每個佇列 class \\( i \\) 獨特的權重比 \\( w_i \\)，每次循環保證該類流能分配到固定比例的服務：\\( \\text{頻寬比例} = \\frac{w_i}{\\sum_j w_j} \\)，提供強健的最低頻寬保障機制。'
        ],
        latexFormula: '\\text{Service Rate Share} = \\frac{w_i}{\\sum_{j} w_j}'
      },
      {
        title: '網路中立性',
        englishTitle: 'Sidebar: Network Neutrality',
        description: '技術手段（排程、緩衝）延伸至社會、經濟與法律價值的核心探討：',
        details: [
          '技術本質：排程演算法與緩衝分配決定了 ISP 如何共享資產。這衍生出不同應用服務之間是否應該被「差別待遇」的論辯。',
          '2015 美國 FCC 防護開放網際網路三大原則：',
          '1. 不阻擋（No Blocking）：不得合法封鎖任何無害的網頁內容、應用服務、協議。',
          '2. 不限速（No Throttling）：不得故意降低、削弱特定網路流量，維持中立通暢。',
          '3. 無付費優先級（No Paid Prioritization）：不允許網路平台以金錢換取更寬裕、更快速的「專線優先通道」排程保證。'
        ]
      }
    ]
  },
  {
    id: 'prefix-match',
    title: '最長字首匹配',
    englishTitle: 'Longest Prefix Matching',
    description: '深入了解路由器轉送表底層如何搜尋 IP 地址以進行極速、精確的匹配。',
    concepts: [
      {
        title: '最長字首匹配原則',
        englishTitle: 'Longest Prefix Matching Principal',
        description: '在傳統的目的地型轉送（Destination-based forwarding）中，路由器維護一個轉送表，對應「目的地 IP 地址範圍」與「輸出連結介面」。當封包抵達時：',
        details: [
          '路由器尋找能與該目的地地址匹配成功之「最長」的二進位字首範圍（Longest Address Prefix）為準。',
          '透過此法，可以進行精準、有效率的路徑聚合與分配。若兩個區段重疊，最長的匹配字首必然贏得該封包的轉送權。',
          '非指定對應路徑之地址，通常回歸至轉送表末端的備用選項「otherwise」或預設入口（Default Route），關聯至介面 3 或系統預設閘道。'
        ]
      },
      {
        title: 'TCAM 記憶體硬體加速',
        englishTitle: 'Ternary Content Addressable Memory (TCAM)',
        description: '如何使最長字首匹配在每秒數億個封包的傳輸速率下維持無阻？這是藉由特殊的硬體架構：',
        details: [
          '內容可定址記憶體（Content Addressable Memory, CAM）：與一般依靠「記憶體地址」找「內容」不同，CAM 是給定「搜尋內容」，記憶體可在一個時脈週期內，並行比較所有項目並直接輸出位置。',
          '三態 CAM（Ternary CAM, TCAM）：多增加了一個狀態「Dont-Care（模糊對應位元 `*`）」。這使其能極高速並行查驗 0, 1 以及 *（萬用字元），完美實現 IP 遮罩的最長字首匹配。',
          '一級 Cisco 旗艦級骨幹路由器中，TCAM 能夠在單一硬體時脈週期內秒級查詢超過 100 萬個路由條目，極其強悍。'
        ]
      }
    ]
  },
  {
    id: 'queue-schedule',
    title: '佇列排程模擬器',
    englishTitle: 'Queueing and Scheduling Simulator',
    description: '使用互動控制介面，直接目擊並模擬 FCFS、Priority 與 Weighted Fair Queueing 的即時運作。',
    concepts: [
      {
        title: '排程政策與線頭阻塞直觀體驗',
        englishTitle: 'Visualizing Scheduling Policies and HOL Blocking',
        description: '排程決定了當多個不同優先級或權重的封包同時排隊時，鏈路通訊資源由誰獨佔。本模組配搭了視覺化模擬器，讓您操作並親身體驗以下排程策略：',
        details: [
          '先進先出（FIFO / FCFS）：所有封包不管類別或擁塞，只要抵達早，就先享有發送專權。',
          '優先權（Priority）：高優先級封包絕對霸佔處理前端；只有當高優先級佇列歸零，低優先級封包才有跨出出口的一刻。這也可能造成低優先級流的「飢餓（Starvation）」。',
          '加權公平佇列（WFQ）：高親和度的比例保障。當設定權重 (High=3, Low=1) 時，在兩條佇列均有封包時，系統會以 3:1 的比例交替拉取各線封包，避免飢餓並展現高層流之保證。'
        ]
      }
    ]
  },
  {
    id: 'ipv4-datagram',
    title: 'IPv4 數據報格式與實務',
    englishTitle: 'IPv4 Datagram Header and Fragmentation',
    description: '透視 IPv4 標頭的欄位意義，並推演 IP 分割與重組在 MTU 限制下的 LaTeX 計算。',
    concepts: [
      {
        title: 'IPv4 標頭欄位拆解',
        englishTitle: 'IPv4 Header Fields Layout',
        description: '一個標準 IPv4 標頭包含至少 20 bytes 的固定開銷：',
        details: [
          '版本（Version / 4 bits）：指定為 `4`（IPv4）。',
          '標頭長度（Header Length / 4 bits）：指定標頭的 32 bits 字組長度，通常為 5（即 20 bytes）。',
          '服務類型（Type of Service, TOS / 8 bits）：前 6 bits 為區別服務（Diffserv），後 2 bits 用於顯式擁塞通知（ECN）。',
          '長度（Length / 16 bits）：整個 IP 資料報（標頭加負載）的總長度。最大限制為 65,535 bytes，但通常會受到連結層 MTU 限制限制在 1500 bytes 內。',
          '生存時間（Time To Live, TTL / 8 bits）：防止封包無限循環。每次經過一台路由器，該數值減 1。歸零時直接丟棄封包並回傳 ICMP 錯誤。',
          '上層協定（Upper Layer / 8 bits）：標示承載的傳輸層協定（如 TCP 為 6, UDP 為 17）。',
          '首部總和檢查碼（Header Checksum / 16 bits）：保護 IP 標頭的校驗位，中途每台路由器因 TTL 改變均須重新計算。'
        ]
      },
      {
        title: 'IP 分割與重組計算',
        englishTitle: 'IP Fragmentation and Reassembly',
        description: '當巨型 IP 資料報面臨物理連結之最大傳輸單元（Maximum Transmission Unit, MTU）限制時，必須在網格中進行分割（Fragmentation）：',
        details: [
          '切割（Fragmentation）：大型 IP 資料報將被拆解為數個小資料報，並攜帶特別的標頭。唯有抵達終端主機（Destination）時，才會進行大一統重組（Reassembly）。',
          '相關標頭三劍客位元：',
          '1. 16位元識別碼（16-bit Identifier）：同一原裝封包的所有碎片，均具備完全相同的識別碼。',
          '2. 碎裂旗標（Flags）：由 3 bits 組成。第二個 bit 代表 DF（Don\'t Fragment），若不能切又超限則拋 ICMP。第三個 bit 代表 MF（More Fragments），除最後一片外均設為 1。',
          '3. 偏移欄位（Fragment Offset / 13 bits）：這表明此片碎片在原整 IP 資料報中的起點位置。以 「8 位元組（8-byte blocks）」為單位進行量化。',
          '偏移計算公式：假設 MTU 為 1500 bytes（含包含 20 頁標頭，故淨資料負載上限為 1480 bytes）。一個 4000 bytes 的大資料報（含 20 bytes 標頭，總負載 3980 bytes）會被切割成：',
          '第一片：長度 = 1500, Ident = x, MF = 1, Offset = 0 \\( \\frac{0}{8} \\)',
          '第二片：長度 = 1500, Ident = x, MF = 1, Offset = 185 \\( \\frac{1480}{8} \\)',
          '第三片：長度 = 1040, Ident = x, MF = 0, Offset = 370 \\( \\frac{2960}{8} \\)，公式為 \\( \\text{Offset}_k = \\frac{k \\times 1480}{8} \\)。'
        ],
        latexFormula: '\\text{Offset}_k = \\frac{k \\times \\text{Payload Size}}{8}'
      }
    ]
  },
  {
    id: 'ip-addressing',
    title: 'IP 定址、CIDR 與子網路劃分',
    englishTitle: 'IP Addressing, CIDR and Subnets',
    description: '理解 32 位元 IP 地址的階層、遮罩運算，與階層式路由（CIDR）及路由聚合技術。',
    concepts: [
      {
        title: 'IP 地址結構與遮罩',
        englishTitle: 'IP Address Structure and Subnet Mask',
        description: '一個 32 位元的 IP 地址本質上由兩個階層結構組成：',
        details: [
          '子網路部分（Subnet Part）：高位元位。同屬一個子網路之內的所有設備，其高位元必完全相同。可用子網路遮罩（Subnet Mask）表示。',
          '主機部分（Host Part）：剩餘之低位元位。用於唯一區分同一子網下的各個獨立實體設備。',
          '子網路「孤島」定義：將每台主機或路由器的介面（Interface）與其相連主線割開，所形成的孤立物理連接範疇即為一「子網路（Subnet）」。處於同一個子網路內的介面，在不經過任何中繼路由器（Intervening Router）的情況下即可藉由第二層技術（交換機或 Base Station）直連通訊。'
        ]
      },
      {
        title: '無類別網域間路由 CIDR',
        englishTitle: 'Classless Interdomain Routing (CIDR)',
        description: '擺脫了早期 Class A, B, C 的死板設計。現代網際網路採用無類別網域間路由（CIDR）：',
        details: [
          '地址表示法：\\( a.b.c.d/x \\)，其中 \\( x \\) 代表子網路部分之長度（Bit 數目）。',
          '例如在 \\( 200.23.16.0/23 \\) 目標下，高 23 bits 代表子網路。',
          '二進位表示：`11001000 00010111 00010000 00000000`。透過遮罩匹配與計算，極大地精簡並靈活規劃了有限的 IP 空間。'
        ],
        latexFormula: 'a.b.c.d/x'
      },
      {
        title: '階層式路由與路由聚合',
        englishTitle: 'Hierarchical Addressing and Route Aggregation',
        description: '在大規模骨幹網路中，如何快速進行全球百萬條路由表搜尋？答案是依靠路由聚合（Route Aggregation）：',
        details: [
          '路由聚合：ISP 擁有一個超大地址區段，可將其橫切切割成數等分，分別下發給各個子組織。當對外界宣告（Advertise）時，骨幹交換機只需要宣佈超大聚合條目。',
          '例如：ISP A 匯總宣佈一條 `200.23.16.0/20`。當外部流入此範疇時，路由器會將所有該開頭的地址發送給 ISP A。',
          '特定長路徑優先選取（More Specific Route）：當有子主機搬遷（例如組織 1 帶著 `200.23.18.0/23` 搬遷到另一個 ISP B 下面時），ISP B 會單獨宣佈該比較「特定」且擁有更長 /23 遮罩首碼的特定路徑，依據「最長字首匹配（LPM）」原則，封包將正確流入該更特定的新家，此為 Internet 彈性擴散之磐石。'
        ]
      }
    ]
  },
  {
    id: 'dhcp',
    title: '動態主機設定協定 DHCP',
    englishTitle: 'Dynamic Host Configuration Protocol (DHCP)',
    description: '詳解主機接入網格時動態取得 IP 地址的四步驟信號交換流程。',
    concepts: [
      {
        title: 'DHCP 隨插即用四步驟交換機制',
        englishTitle: 'DHCP Client-Server Scenario (4-way Handshake)',
        description: 'DHCP（常常被稱為「即插即用協定」）旨在提供臨時或長效的 IP、閘道器、DNS 地址自動派發。當客戶端加入網路時，會經歷以下四個 UDP 廣播階段：',
        details: [
          '1. 探尋階段（DHCP Discover）：客戶端利用廣播包（廣播目的 `255.255.255.255`，來源 `0.0.0.0`，埠號由 68 送往 67），呼喊此子網管內是否有 DHCP 控制器伺服器存在。',
          '2. 提供階段（DHCP Offer）：DHCP 伺服器回傳一廣播包給客戶端（目的地址 `255.255.255.255`，yiaddr 欄位填入擬發放之臨時 IP，以及可用租約時限 lifetime）。',
          '3. 請求階段（DHCP Request）：主機接收一或多個 Offer，選定最可信的一個 IP，並再次拋廣播（目的 `255.255.255.255`，來源仍為 `0.0.0.0`，在報文中清晰點名「OK，我想採用此伺服器下發的此指定 IP」）。廣播的作用是為了同時禮貌拒絕其他提供 Offer 的伺服器。',
          '4. 確認與應答階段（DHCP ACK）：被選中的伺服器聽聞後，回傳最終封包確認（DHCP ACK），客戶端自此正式宣告擁有此 IP，可開始快意遨遊網路。'
        ]
      },
      {
        title: '多維回傳參數與實務',
        englishTitle: 'More than IP address: Gateway, DNS and Mask',
        description: 'DHCP 控制器發送的事物，遠比純數字 IP 要豐富：',
        details: [
          '預設第一跳路由器地址（Address of First-Hop Router）：即預設閘道器（Default Gateway）的 IP 地址，引導封包逃出本地子網。',
          '網域伺服器名稱與 IP（Name and IP address of DNS Server）：使主機得以進行域名解析（Domain Resolution）。',
          '子網路遮罩（Subnet Mask）：清晰區分自此子網的主機部分與網絡部分。',
          '封裝細節：DHCP 為應用層協定（Application Layer Service），其報文先被套入 UDP 包頭，再套入 IP 資料包，最後綁入 Ethernet Frame（廣播 MAC 地址為 `FF:FF:FF:FF:FF:FF`）進行鏈路廣播。'
        ]
      }
    ]
  },
  {
    id: 'nat',
    title: '網路地址轉換 NAT',
    englishTitle: 'Network Address Translation (NAT)',
    description: '深入分析私有 IP 位址、NAT 對照表（NAT Table），以及其引發的端對端原則學術論爭。',
    concepts: [
      {
        title: 'NAT 運作原理與對照表實務',
        englishTitle: 'NAT Mechanism & NAT Translation Table',
        description: '因應 IPv4 地址資源短缺，NAT 技術應運而生。它使得一整個局域網格（Private Local Network）內的所有設備，能夠「對外共享唯一的一個」公網 IP（Public IPv4 Address）。',
        details: [
          '私有地址版塊：RFC 1918 預留了專用地址私有區段，公網不允許直接路由：`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`。',
          '轉換運作模式：當私有區主機發起外流 IP 封包時，NAT 路由器會主動進行下述代換：',
          '1. 修改標頭：將來源 IP（如 `10.0.0.1`）改為路由器對外唯一的公網 IP（如 `138.76.29.7`），並給定新配置的對外唯一埠號（Source Port Number，如 `5001`）。',
          '2. 寫入轉換表（NAT Translation Table）：將私有局域 IP:Port 與對外公網 IP:Port 組成成對關係，登錄於快取映射表中。',
          '3. 逆向迴轉：當外部網站回包給 `138.76.29.7:5001` 時，NAT 路由器回查轉換表，發現其映射為 `10.0.0.1:3345`，再次重寫目的標頭，安全、透明地轉送給內部主機。'
        ]
      },
      {
        title: '理論爭端、穿透與局限',
        englishTitle: 'Theoretical Controversy and NAT Traversal',
        description: '雖然 NAT 技術在全球廣泛採用，但它在網路系統結構學術界卻遭受極多爭議：',
        details: [
          '破壞層級設計：路由器本應只運作在第三層（網路層），但 NAT 竟然去查閱並修改第四層（傳輸層）的 Port 號，這嚴重跨越了層級邊界（Layer Violations）。',
          '破壞端對端原則（End-to-End Argument）：端對端原則宣稱，中間節點不應知曉或修改特定應用特徵，智能必在邊緣。而 NAT 的存在使得外部主機無法直接向居於 NAT 後方的內部設備隨意開闢通訊（這引發了 P2P、視訊連線等技術實施的巨大障礙）。',
          'NAT 穿透突破點（NAT Traversal）：對於居於 NAT 阻擋後方的伺服器，通常需要依賴「埠號轉送（Port Forwarding）」或中置伺服器技術（如 STUN / TURN）方可打通連接。'
        ]
      }
    ]
  },
  {
    id: 'ipv6',
    title: '下一代協定 IPv6',
    englishTitle: 'The New Generation Internet Protocol: IPv6',
    description: '解密 128 位元定址、定長 40 位元組快速標頭，以及過渡階段的隧道傳輸技術（Tunneling）。',
    concepts: [
      {
        title: 'IPv6 興起動機與全新標頭設計',
        englishTitle: 'IPv6 Motivation & Header Format Changes',
        description: '核心動力在於 IPv4 32位元地址（40億個）基本分配罄盡（西元2011年 ICANN 派發了最後一批 IPv4 區段）。',
        details: [
          '巨大定址高度：IPv6 採用高達 128 位元的地址（高達約 \\( 3.4 \\times 10^{38} \\) 個地址，幾乎使地球上每一顆沙子都能配備專用公網位元）。',
          '極速定長 40 位元組標頭（40-byte Fixed Length Header）：移除了大部分不穩定、任意長度之欄位，使路由器能於硬體電路中直接、無損、極速地解析定位，減少路由器的運算負載。',
          '與 IPv4 相比之三大本質遺留與精簡：',
          '1. 無檢查碼（No Checksum）：因為第二層（連結層）與第四層（傳輸層）皆具備高度校驗能力，移除之能省下中途修改 TTL 後不斷重新計算的 CPU 重擔。',
          '2. 無本地分割功能（No Router-side Fragmentation）：如果資料報大於 MTU，路由器直接丟棄並打 ICMP 警示，逼使客戶端在發射時即採用 Path MTU 探查決定好適當尺寸，避免中間傳輸的消耗。',
          '3. 無選項欄位（No Options）：改以擴展標頭（Extension Headers）及指標鍊形式外掛。'
        ],
        latexFormula: 'A_{\\text{size}} = 2^{128}'
      },
      {
        title: '歷史過渡方案：隧道與封裝技術',
        englishTitle: 'Transition via Tunneling & Encapsulation',
        description: '如何使世界無缝在 mixed 混合 IPv4 與 IPv6 路由時代完成切換？「旗艦降臨日（Flag Days，即全球切斷停機同步升級）」是不可能發生的：',
        details: [
          '隧道技術（Tunneling / Envelope Packet）：當 IPv6 資料報面臨中途尚未升級的 IPv4 孤島路由器群時，路由器 A（支援雙協議雙棧）會將整個 IPv6 封包包裝（Encapsulates）進一個普通 IPv4 資料報的「Payload 負載」內。',
          '中途走廊：當 IPv4 路由島嶼運送該包裹時，它們只將它看作一般的普通的 IPv4 payload 傳輸。',
          '抵達出口：當離開 IPv4 領土抵達第一個雙棧路由器 B 時，將外層的 IPv4 標頭剥離（De-capsulate），重新吐出原汁原味的乾淨 IPv6 封包，以此達成無阻礙、不中斷的全球過渡。'
        ]
      }
    ]
  },
  {
    id: 'sdn-openflow',
    title: '軟體定義網路與 OpenFlow 實務',
    englishTitle: 'Generalized Forwarding, SDN and OpenFlow',
    description: '探討通用轉送、比對與動作抽象化，以及 OpenFlow 串接控制器與硬體流表的範例。',
    concepts: [
      {
        title: '通用轉送與「比較+動作」抽象化',
        englishTitle: 'Generalized Forwarding and Match-plus-Action',
        description: '在現代 SDN / OpenFlow 架構下，摒棄了傳統單一局限在目的地 IP 的傻瓜式轉送。路由器化身為「通用交換機」，其封包轉送本質基於：',
        details: [
          '流表（Flow Table）：內部由一序列的流表條目（Entries）組成，取代普通轉送表。',
          '比較與動作（Match-plus-Action）：封包抵達時，不限於目的地 IP，而是匹配第一層至第四層多個欄位的組合條件，一旦命中則強制執行特定編寫的動作。',
          '核心主要組成元素：',
          '1. 比較條件組（Matches）：可比對進口（Ingress Port）、來源 MAC（Src MAC）、目的 MAC（Dst MAC）、Ethernet 類型、VLAN、來源 IP、目的 IP、協議類型（IP Proto）、TOS、來源 Port、目的 Port 等 12 個頭部欄位。',
          '2. 處理動作（Actions）：',
          '   - 轉送（Forward）：發送到特定一或多個埠口。',
          '   - 丟棄（Drop）：相當於防火牆阻擋。',
          '   - 修改（Modify Fields）：例如直接修改 IP/Port（提供 NAT 功能）。',
          '   - 封裝上傳（Encapsulate & Forward）：打包發送交給遠端中央控制器（Controller）做神經判斷。',
          '3. 計數器（Counters）：追蹤處理了多少個封包及位元組（Bytes Count），用作監控與計費。',
          '4. 優先權（Priority）：用於消除比對重疊時的歧義。'
        ]
      },
      {
        title: 'OpenFlow 流表大一統整合',
        englishTitle: 'OpenFlow Abstraction Unifies Devices',
        description: '流表的超強擴充性和匹配彈性，使其憑藉單一硬體硬體格式，完美一統、模擬傳統網格中的多款專用硬體：',
        details: [
          '1. 作為路由器（Router）：僅比對最長目的 IP 首碼（Longest Destination IP Prefix），動作用於 Forward 發送轉送。',
          '2. 作為交換機（Switch）：僅比對目的 MAC 地址（Destination MAC Address），動作用於轉送或廣播。',
          '3. 作為防火牆（Firewall）：比對來源隨便、目的 Port（例如比對目的 Port = 22 ssh 協議 ），處理動作設為 Drop，即完成防火牆設置。',
          '4. 作為地址解析轉換器（NAT）：比對 IP 與 Port，動作是 Rewrite 改寫來源/目的 IP 和 Port，即完成了 NAT 對照硬體。'
        ]
      }
    ]
  },
  {
    id: 'middleboxes',
    title: '中介設備探索',
    englishTitle: 'Middleboxes and IP Hourglass',
    description: '認識防火牆、IDS、負載平衡器，及分析在「IP 沙漏細腰」上疊加中介設備所面臨的架構考驗。',
    concepts: [
      {
        title: '中介設備定義與無處不在的景象',
        englishTitle: 'Middlebox Concept and Ubiquitous Presence',
        description: '根據 RFC 3234 的明確定義，中介設備是「在源端主機與目的地主機的資料傳輸路徑中，執行除了標準 IP 路由器以外之其他任何加值、干預、處理功能的硬體或軟體盒」。',
        details: [
          '中介設備已深入各類網路。常見例子包含：',
          '1. 防火牆與侵入檢測系統（Firewalls & Intrusion Detection Systems, IDS）：深度比對流量頭部或實體內容（Deep Packet Inspection），主動拋棄惡意流量並封鎖非法訪問。',
          '2. 負載平衡器（Load Balancers）：接收一個公共入口虛擬 IP 地址，將其資料流智能並發分發到後方成百上千個真實伺服器節點上，對外提供完美的雲端並行防線。',
          '3. 應用層快取快取（Application-layer Caches / CDNs）：將熱點網頁內容直接推送到離客戶端近的就地節點（如 CDN Caches），直接截擊並快速交付。',
          '4. 影片優化與解碼轉換器（Video Optimizers / Compression）：進行影像適應度壓縮轉換。'
        ]
      },
      {
        title: 'IP 沙漏瓶頸與細腰挑戰',
        englishTitle: 'The IP Hourglass Challenge',
        description: '網際網路長久以來被稱頌為「沙漏形狀架構（Hourglass Architecture）」：',
        details: [
          '薄瘦細腰（Thin Waist）：不論上層運行何種紛繁複雜的應用層協議（HTTP, SMTP, DNS, DASH）或下層提供何種媒介物理鏈路（銅纜、無線 radio, 光纖, Ethernet, WiFi），中間正中央處有且僅有唯一的共同連結協定，即 「IP（網際網路協定） 」。每一台萬物聯網設備都必須無條件支持 IP。',
          '中介設備的侵蝕挑戰：中介設備多數運營在網路內部，打破了「智能在邊緣、網芯只負責中立不加修飾轉送」的網際網路黃金信念，促使網芯變得日趨沉重與複雜。這也引發了學術界對於未来如何推廣無障礙新型協議研發之廣汎思索。'
        ]
      }
    ]
  }
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Module 1: Network Layer Overview (overview)
  {
    id: 1,
    moduleId: 'overview',
    question: '在網路層的功能中，將封包從路由器輸入端移動至合適輸出端，此「本地（Per-router）」之行為被定義為下述何者？',
    options: [
      '路由（Routing）',
      '轉送（Forwarding）',
      '擁塞控制（Congestion Control）',
      '分段重組（Fragmentation）'
    ],
    correctIndex: 1,
    explanation: '轉送（Forwarding）是指單一路由器內部的本地快速功能（移動封包從 input port 到 output port），可精確類比為通過單一交流道；而路由（Routing）是端到端全局路徑的路網規劃過程（由路由演算法或中央控制器決定）。'
  },
  {
    id: 2,
    moduleId: 'overview',
    question: '關於資料平面（Data Plane）與控制平面（Control Plane）之運作尺度，以下哪一個敘述是「完全正確」且符合其物理實作架構的？',
    options: [
      '控制平面在奈秒級（Nanosecond）運行，資料平面在毫秒級（Millisecond）運行',
      '資料平面依靠硬體晶片（例如 ASICs、TCAM）在奈秒（Nanosecond）級別運行，而控制平面運行路由協定（如 OSPF/BGP）在毫秒（Millisecond）級別軟體運行',
      '兩者都在相同的微秒級度中運行，沒有本質的時效功能分野',
      '資料平面主要是集中式的遠端控制器（Remote Controller）運作，控制平面則是本地硬體行為（Per-router）'
    ],
    correctIndex: 1,
    explanation: '這是資料平面與控制平面的核心對比：資料平面是本地硬體轉送行為，追求極速（奈秒級）；而控制平面負責端到端路徑決策，需要運行路由演算法或與 SDN 控制器通訊，為軟體運作尺度（毫秒級）。'
  },
  {
    id: 3,
    moduleId: 'overview',
    question: '網際網路所採用的「最佳努力服務（Best-Effort Service）」模型中，以下哪一項是網路層「所提供」之保證？',
    options: [
      '保證封包能百分之百按順序抵達目的主機',
      '保證封包傳輸過程中的最低可用頻寬與最大端對端延遲',
      '保證封包不會因為路由器緩衝區溢位而被尾部丟棄（Tail Drop）',
      '不提供任何形式的交付、順序、時延或頻寬保證（Best-Effort 代表既無擔保、亦無責任之極簡設計）'
    ],
    correctIndex: 3,
    explanation: '最佳努力（Best-Effort）服務模型是網際網路極簡理念的代表，它對封包遞送不承諾任何品質（QoS）保證（不保證抵達、不保證順序、不保證頻寬或延時），但也正是這種極簡使它極易擴建且運作成本極低。'
  },

  // Module 2: Router Architecture (router-arch)
  {
    id: 4,
    moduleId: 'router-arch',
    question: '現代路由器在輸入埠（Input Port）上採用「去中心化查表轉送（Decentralized Switching & Lookup）」的目的主要是為了解決什麼問題？',
    options: [
      '解決 NAT port 號重寫時轉送表（Translation Table）不夠用的爭端',
      '避免所有到達輸入埠的封包都必須提交給中央路由處理器（Routing Processor）查表而造成严重的效能瓶頸（Bottleneck）',
      '強制讓所有 IPv4 資料報封裝進 IPv6 隧道過渡',
      '提供所有輸出鏈路 WFQ 加權公平佇列的權重決策'
    ],
    correctIndex: 1,
    explanation: '若每個輸入埠的封包都必須向中央路由處理器（Routing Processor）查表，處理器會在海量輸入埠同時送件時瞬間被淹沒。因此在輸入埠本端儲存「轉送表的影子複本（Forwarding Table Copy）」，去中心化獨立並行查表是滿足奈秒級高通量的關鍵。'
  },
  {
    id: 5,
    moduleId: 'router-arch',
    question: '初代路由器採用「藉由記憶體交換（Switching via Memory）」其封包轉送本質是由 CPU 直接解碼，它的交換吞吐能力最大的硬體限制端在於？',
    options: [
      '無法支持 IP 分割（Fragmentation）偏移量的計算',
      '封包需要通過系統主要記憶體匯流排（System Bus）兩次，其交換速率受限於記憶體之存取頻寬與 CPU 的中斷處理速度',
      'TCAM 晶片造價昂貴且功耗極高，容易熱當機',
      '當前 DHCP DORA 交換時，無法及時回傳廣播 Offer'
    ],
    correctIndex: 1,
    explanation: '記憶體交換（Switching via Memory）中，封包是複製到記憶體中由 CPU 解析，然後再複製到輸出埠。這意味著每個資料報都需要通過一次系統匯流排（總計進出兩次），這使得其最大交換通量被記憶體匯流排存取上限鎖死。'
  },
  {
    id: 6,
    moduleId: 'router-arch',
    question: '在多個獨立 TCP 流共 N 個。最新理論實務推薦可用於計算路由器緩衝大小分配（Buffer Sizing）以有效降低「緩衝區膨脹（Bufferbloat）」痛苦的黃金公式是？',
    options: [
      '$$B = RTT \\times C \\times \\sqrt{N}$$',
      '$$B = \\frac{RTT \\times C}{\\sqrt{N}}$$',
      '$$B = RTT \\times C \\times N$$',
      '$$B = RTT \\times C$$'
    ],
    correctIndex: 1,
    explanation: '傳統 RFC 3439 經驗法則是 B = RTT * C；但對於包含 N 個獨立 TCP 連線的大通量流，最新理論與實務推薦可用 B = (RTT * C) / sqrt(N) 的公式縮小緩衝大小，這能有效防止因為排隊太大而帶來的緩衝區膨脹和過長群排時延。'
  },

  // Module 3: Longest Prefix Matching (prefix-match)
  {
    id: 7,
    moduleId: 'prefix-match',
    question: '若路由器的目的地轉送表中，有兩條長度重疊遮罩的條目匹配抵達封包之 IP 標頭，其匹配首選應遵循什麼原則？',
    options: [
      '最短遮罩優先匹配原則（Shortest Mask Match）',
      '最長字首匹配原則（Longest Prefix Matching），即選擇匹配的具有最長二進位首碼之條目',
      '交由中央控制器隨機決定優先級（Priority Match）',
      '尾部優先原則（Tail Drop Match），強制丟棄後置封包'
    ],
    correctIndex: 1,
    explanation: '最長字首匹配（Longest Prefix Matching）是 Internet 轉送決策的磐石。當目的地 IP 同時匹配轉送表的複數個 prefix 區段時，路由器必定選取「最特定的（More specific）」，即子網路遮罩最長、二進位字首對應最完整的那個介面發送。'
  },
  {
    id: 8,
    moduleId: 'prefix-match',
    question: '假設某個路由器的轉送表有以下目的地 IP 匹配條目：\n- 條目 A: 200.23.16.0/21 ➔ 介面 1\n- 條目 B: 200.23.16.0/23 ➔ 介面 2\n若一個目的地 IP 為「200.23.17.58」的 IP 數據報到達，請問應發往哪一個介面？',
    options: [
      '介面 1，因為與前 21 bits 完全相符，且 Prefix 長度較短速度快',
      '介面 2，因為經二進位分析其與 23-bit 的字首匹配成功，且遵循最長字首匹配原則（LPM）',
      '介面 3（otherwise），因為該 IP 與這兩個 prefix 都完全不相符',
      '直接丟棄封包，因為這屬於重疊轉送衝突'
    ],
    correctIndex: 1,
    explanation: '二進位換算：200.23.17.58 的第三個位元（17）二進位是 00010001。比較 200.23.16.0 （16 的二進位是 00010000）。前21位（遮罩21：00010***）兩者皆 match（值=00010）；前23位（遮罩23：0001000*）兩者也 match（值=0001000）。因為 23 遮罩比 21 遮罩更長、更特定，所以介面 2（條目 B）勝出！'
  },
  {
    id: 9,
    moduleId: 'prefix-match',
    question: '三態內容可定址記憶體（TCAM）在骨幹路由器硬體加速查表中扮演極重要角色。以下關於 TCAM 運作機制的敘述，哪一項是「錯誤（Incorrect）」的？',
    options: [
      'TCAM 與傳統依照記憶體地址尋找內容不同，它是給定搜尋內容（如目的 IP），能在單一硬體時脈週期內並行比對所有條目',
      'TCAM 除了 0 與 1，還能存儲第三態「Dont-care（* 萬用字元）」，能極高速秒級完成最長字首匹配查表',
      'TCAM 硬體架構高度並行，其主要優勢是成本極其低廉、製程簡單，且運作時完全不消耗電能與散熱空間',
      '一級大型骨幹路由器（如 Cisco/Juniper）常配備 TCAM 記憶體，可在單一時脈週期中查詢百萬條路由條目'
    ],
    correctIndex: 2,
    explanation: 'TCAM 雖然极快（能於單時脈週期並行查表），但其物理代價是製造極其精密複雜、造價非常高昂，且因為要在一個時脈內並行刺激全表元件，其功耗和發熱量極高。這也是防線在硬體擴展上的主要考量，選項2敘述錯誤。'
  },

  // Module 4: Queueing and Scheduling Simulator (queue-schedule)
  {
    id: 10,
    moduleId: 'queue-schedule',
    question: '在優先權排程（Priority Scheduling）政策中，如果高端優先等級佇列（High-Priority Queue）持續不斷有高頻封包湧入，會對低端優先等級（Low-Priority Queue）造成何種嚴重阻礙？',
    options: [
      '造成所有低端優先級封包的 IP 標頭 checksum 錯誤',
      '造成低端優先佇列完全得不到出線機會，產生嚴重的「飢餓（Starvation）」現象',
      '強制低端佇列直接轉換為 DHCP Discover 發送模式',
      '造成交換結構自動降速到藉由記憶體（Memory）轉送之瓶頸'
    ],
    correctIndex: 1,
    explanation: '優先權排程（Priority Scheduling）的規則是：只要高等級佇列有資料，就一定先為其服務。如果高端流量過大、源源不絕，低端佇列內部的封包將在漫長歲月中得不到任何服務，這在網路中被稱為「飢餓（Starvation）」。'
  },
  {
    id: 11,
    moduleId: 'queue-schedule',
    question: '某條出口鏈路頻寬容量設定為 100 Mbps，實施加權公平佇列（WFQ）排程。當前有三個活躍類別流佇列 A, B, C，其權重分別指定為 3, 1, 1。在所有佇列均持續堆滿封包的極度擁塞飽和條件下，佇列 A 能在該輸出鏈路上獲致維持的最低保證頻寬約為多少 Mbps？',
    options: [
      '30 Mbps',
      '50 Mbps',
      '60 Mbps',
      '100 Mbps'
    ],
    correctIndex: 2,
    explanation: 'WFQ 按權重比例分配頻寬。公式為：A 的服務佔比 = w_A / (w_A + w_B + w_C) = 3 / (3 + 1 + 1) = 3/5 = 60%。因此 A 的最低保證頻寬為 100 Mbps * 60% = 60 Mbps。這能在大流量競爭時，提供可靠的基本頻寬保證。'
  },
  {
    id: 12,
    moduleId: 'queue-schedule',
    question: '在路由器的輸出埠佇列（Output Port Queueing）中，若瞬間進入的封包數大於出口容量，將會先在緩衝區暫存。如果緩衝區滿了，直接丟棄後續抵達的封包，此策略稱為？',
    options: [
      '線頭阻塞（HOL Blocking）',
      '尾部丟棄（Tail Drop）',
      '隨機早期檢測（Random Early Detection, RED）',
      '加權公平佇列（Weighted Fair Queueing）'
    ],
    correctIndex: 1,
    explanation: '當輸出佇列緩衝區放滿時，最簡單直截了當的硬體行徑就是丟棄後續新抵達的所有資料封包，這稱為「尾部丟棄（Tail Drop）」政策。'
  },

  // Module 5: IPv4 Datagram Header and Fragmentation (ipv4-datagram)
  {
    id: 13,
    moduleId: 'ipv4-datagram',
    question: '在一個 IP 切割碎片封包中，其標頭中的 Offset（偏移量）欄位值顯示為「185」。請問這代表該碎片在原完整大資料報中的「實際偏移位元組（Bytes Offset）」是多少？',
    options: [
      '185 Bytes，因為偏移量為一比一對等位元組數',
      '370 Bytes，因為偏移量要乘以 2 位元組',
      '1480 Bytes，因為偏移量以 「8 位元組（8-byte blocks）」為量化計量單位（185 * 8 = 1480）',
      '1500 Bytes，因為其自動對齊標準網格的最大傳輸單元（MTU）'
    ],
    correctIndex: 2,
    explanation: '為了節省 IP 標頭欄位空間，Fragment Offset 欄位是以 「8 位元組（8-byte blocks）」為一個度量刻度。所以要換算原裝封包中的起始偏移位置位元組，必須將 Offset 的值乘以 8（185 * 8 = 1480 位元組）。'
  },
  {
    id: 14,
    moduleId: 'ipv4-datagram',
    question: '一個標準 IPv4 資料報標頭，在「完全不含選項（Options）」之最基礎設定下，其固定包含的安全開銷大小長度通常為多少 Bytes？',
    options: [
      '8 Bytes',
      '20 Bytes',
      '40 Bytes',
      '128 Bytes'
    ],
    correctIndex: 1,
    explanation: '標準 IPv4 資料報標頭固定包含 Version, HLen, TOS, Length, ID, Flags, Offset, TTL, Protocol, Checksum, Source IP 和 Destination IP。在沒有 Options 擴充下，固定長度為 20 位元組（20 Bytes）。'
  },
  {
    id: 15,
    moduleId: 'ipv4-datagram',
    question: '假設一個 4000-byte 的大型 IP 資料報（含 20 bytes 標頭，負載 3980 bytes）遭遇最大傳輸單元 MTU = 1500（含 20 bytes 標頭，資料載重上限為 1480 bytes）的鏈路。路由器必須進行 Fragmentation 分割。以下關於分碎結果敘述，何者為真？',
    options: [
      '封包將分裂成 3 片碎片。第一、二片長度 1500 且 MF = 1，第三片長度 1040 且 MF = 0。第三片偏移量 Offset 為 370',
      '封包將分裂成 2 片。第一片 2000，第二片 2000，MF 均設為 1，Offset 為 0',
      '封包分裂成 3 片。每一片 MF 都是 1，長度分佈各不相同，Offset 為 185',
      '路由器直接丟棄封包，並返還 OSPF 錯誤'
    ],
    correctIndex: 0,
    explanation: '4000-byte 封包負載為 3980：\n- 第一片：長度 1500（負載 1480），MF = 1，Offset = 0\n- 第二片：長度 1500（負載 1480），MF = 1 Albüm，Offset = 1480 / 8 = 185\n- 第三片：長度 = 3980 - 2960 + 20 = 1040（負載 1020），MF = 0，Offset = 2960 / 8 = 370。\n此計算結果非常完美，選項 0 正確描述之。'
  },

  // Module 6: IP Addressing, CIDR and Subnets (ip-addressing)
  {
    id: 16,
    moduleId: 'ip-addressing',
    question: '若某台主機經網絡配置後，其 IP 地址與遮罩表示為：「192.168.1.50/26」。請分析該網路的子網路地址範圍。如果另一台鄰近設備 IP 被設為「192.168.1.100」，二者是否處於同一個「子網路（Subnet Part）」內？',
    options: [
      '在同一個子網內。因為兩者前三個位元組「192.168.1.」前綴一模一樣',
      '不在同一個子網內。因為其 /26 遮罩將該位元段切成四個子網。A 處於第一區（.0 ~ .63），而 B 處於第二區（.64 ~ .127）',
      '在同一個子網內。因為 192.168 屬於私有 IP，遮罩只用來過濾公網不影響區域內直連',
      '無法判定。因為缺乏 DHCP 還回來的預設第一跳閘道器（Gateway IP）'
    ],
    correctIndex: 1,
    explanation: '/26 子網路遮罩（255.255.255.192 二進位最後以 64 位元組為間隔：.0~.63、.64~.127、.128~.191、.192~.255）。因此 .50 處於第一個子網，.100 處於第二個子網，兩者跨越了遮罩邊界，不在同一個子網，選項1正確。'
  },
  {
    id: 17,
    moduleId: 'ip-addressing',
    question: 'CIDR 表示法中，子網路地址結構 a.b.c.d/x，其中的斜線後綴數值「x」有什麼實質物理定義？',
    options: [
      '它代表此子網路在 ICANN 快取分配中所能容納的最大主機數量（即 2 的 x 次方）',
      '它代表 IP 地址的 32 bits 中，從最高位元算起有「x」個 bits 被劃定為「子網路前綴部分（Subnet Prefix Part）」',
      '它指該網段所能設置的 NAT port 號對應表容量',
      '它指每秒只能傳遞 x 次含有 fragment offset 的 IP 碎片'
    ],
    correctIndex: 1,
    explanation: '在無類別網域間路由（CIDR）中，/x 中的 x 代表前綴（Prefix）有 x 個高位元位被指定為子網路部分，剩餘的 (32-x) 位元則保留給本地主機（Host Part）分配。'
  },
  {
    id: 18,
    moduleId: 'ip-addressing',
    question: '在大規模 Internet 骨幹路由中，一條為了修正特定因主機地址遷移，而向外界單獨宣佈的更具體、帶有更長 prefix-mask 字首的路由，在轉送時能正確流入其新家。這主要遵循何種邏輯機制？',
    options: [
      '基於路 aggregation 優先，無視長字首匹配',
      '基於最長字首匹配（LPM）。因為更長的首碼遮罩（More Specific Route）在查表時具備最高匹配優先級',
      '透過 NAT 快對照表進行動態 port 對換',
      '基於 FCFS 政策按照路由資訊抵達的順序排序決定'
    ],
    correctIndex: 1,
    explanation: '當兩條路由匯總條目重疊時，最長字首匹配（LPM）原則會讓更特定的路由（即 /x 數值更大、遮罩更長、More specific route 的新連接宣告）在尋徑轉送中勝出，這是 Internet 控制面與資料面靈活擴充、修正路軌的基礎。'
  },

  // Module 7: Dynamic Host Configuration Protocol (dhcp)
  {
    id: 19,
    moduleId: 'dhcp',
    question: '在客戶端動態獲得 IP 地址的隨插即用（Plug-and-Play）DHCP 四部手勢（D-O-R-A）信號交換流程中，其正確的步驟順序為何？',
    options: [
      'Discover (探尋) ➔ Request (請求) ➔ Offer (提供) ➔ ACK (應答確認)',
      'Discover (探尋) ➔ Offer (提供) ➔ Request (請求) ➔ ACK (應答確認)',
      'Offer (提供) ➔ Discover (探尋) ➔ ACK (應答確認) ➔ Request (請求)',
      'Request (請求) ➔ Offer (提供) ➔ ACK (應答確認) ➔ Discover (探尋)'
    ],
    correctIndex: 1,
    explanation: 'DHCP 著名的 D-O-R-A 四向握手依序為：1. Discover（主機廣播尋找伺服器）；2. Offer（伺服器廣播提供可用 IP 與參數）；3. Request（主機廣播申請採用此 IP 並供其拒絕其他 Offer）；4. ACK（伺服器最終 ACK 確認綁定）。'
  },
  {
    id: 20,
    moduleId: 'dhcp',
    question: '在 DHCP 的封裝物理設計中，它本質上屬於網路層還是應用層？其底層傳輸載負使用的是何種傳輸層協定與連接埠？',
    options: [
      '屬於網路層，其報文不封裝，直接在實體線路上傳遞，使用 port 80',
      '屬於應用層協定（Application Layer），其報文先被封裝進傳輸層之 UDP 封包內。通常，DHCP 伺服器端監聽監聽埠 67，客戶端接收埠為 68',
      '屬於傳輸層協定，直接在 IP 數據包中用 TCP 連接，監聽監聽埠 23',
      '屬於連結層協定，廣播 MAC 為 128 位元'
    ],
    correctIndex: 1,
    explanation: 'DHCP 本質運行在應用層。其訊息是先作為應用層載荷，封裝入傳輸層的 UDP 資料段中，並使用 UDP 協定（目標埠 67 為 DHCP 伺服器，來源埠 68 為 DHCP 客主機），最後外包 IP 廣播和 MAC 廣播發射。'
  },
  {
    id: 21,
    moduleId: 'dhcp',
    question: '新接入通訊的主機在藉由 DHCP 取得正式聯網 IP 之前，由於其尚未獲得合法 IP。在發射第一個「DHCP Discover」探索封包時，其 IP 首部層的 Source IP 以及 Destination IP 廣播正常應寫為什麼？',
    options: [
      'Source: 127.0.0.1; Destination: 本地 Gateway IP',
      'Source: 0.0.0.0; Destination: 255.255.255.255（受限廣播位址）',
      'Source: 192.168.1.1; Destination: 8.8.8.8',
      'Source: 隨機選用一個 C 類地址; Destination: FF:FF:FF:FF:FF:FF'
    ],
    correctIndex: 1,
    explanation: 'because 主機此時沒有分配到 IP，故來源 IP 只能填最底無效狀態 `0.0.0.0`。而為了讓整個子網下的所有 DHCP 伺服器都能收到此求救信號，其目的 IP 必須對整個本地子網廣播，故填入受限網際廣播地址 `255.255.255.255`。'
  },

  // Module 8: Network Address Translation (nat)
  {
    id: 22,
    moduleId: 'nat',
    question: '下列何者是專供本地局域網（RFC 1918）私有定址、無法直接在全球網際網路上公開進行路由（Non-routable in public Internet）的 IP 版保留網段？',
    options: [
      '140.112.0.0/16 和 168.95.1.1',
      '10.0.0.0/8、172.16.0.0/12 和 192.168.0.0/16',
      '128.0.0.0/8 和 200.23.16.0/24',
      '8.8.8.8 和 1.1.1.1'
    ],
    correctIndex: 1,
    explanation: 'RFC 1918 著名且廣為人知的的三大私有 IP 專用保留版塊包括：10.0.0.0/8、172.16.0.0/12（至 172.31.255.255）以及 192.168.0.0/16。這些地址在區域網內部可自由派用，但骨幹公網一律拒絕路由，必須搭配 NAT 轉換上網。'
  },
  {
    id: 23,
    moduleId: 'nat',
    question: '在 NAT 地址轉換中，當內網內部主機 A（10.0.1.2:3345）送出的封包要發往外網伺服器。NAT 路由器會重寫標頭，假設對外公網配置 IP 為 138.76.29.7，路由器在 NAT Table 做出了 138.76.29.7:5001 映射 entry。以下重寫轉送分析敘述，何者正確？',
    options: [
      'outgoing 封包的來源 IP、來源 port 在發送時，會被路由器重寫代換為：來源 IP = 138.76.29.7、來源 port = 5001。外網伺服器隨後回傳封包抵達 138.76.29.7:5001 時，路由器會依據快取對照表，再將目的 IP 重寫改回 10.0.1.2:3345 送入內網',
      'NAT 路由器只會重寫 Source IP，不會去干預第四層傳輸層的 Port 欄位，這也是層級原則的限制',
      '主機 A 獲得的 IP 與 Port 將對整個內網所有主機進行並行同步廣播',
      '封包將被打入 IPv6 隧道過渡空間後直接在第3層解析'
    ],
    correctIndex: 0,
    explanation: '這是 NAT 的核心雙向對譯。在 Outgoing 時，把局域 IP:Port 重寫為 NAT 公網 IP:新配Port，並記錄於 NAT Table。當 Incoming 回包到達該公網 IP:Port 時，反查 NAT Table，重寫目的為局域 IP:Port，達成透明、安全的區域網共享唯一 IP 上網，選項 0 正確。'
  },
  {
    id: 24,
    moduleId: 'nat',
    question: '雖然 NAT 延緩了 IPv4 耗盡的厄運，但它在網路體系結構學術界卻遭受極大批判。以下敘述中，哪一項「不是」反對 NAT 陣營的主要理由？',
    options: [
      'NAT 在第三層（網路層）路由器上，竟然去拆讀並修改第四層（傳輸層）應用級的 Port 號，這嚴重違反了網路層級設計原則（Layer Violations）',
      'NAT 破壞了端對端（End-to-End）邊緣智能的核心理念。因為外部設備無法直接向 NAT 後方設備主動開闢初始化通訊，加大了 P2P、視訊、多人遊戲直連之障礙（需 STUN 等複雜穿透技術）',
      'NAT 使得局域網內部的主機可以對外共用同一個公網 IP 進行安全存取，這對對外界保護了內網細節',
      '當連線量極大時，NAT 對照表容量上限（上限通常受限於 16-bit 埠數即 60000 左右個活躍連線插槽）會造成路由器的硬體頻寬卡死'
    ],
    correctIndex: 2,
    explanation: '保護內網細節並使多設備共用唯一 IP 是 NAT 極其顯著的實際「優點」，而不是學術界反對它的「缺點（Controversies）」。其它三項（層級違反、破壞端對端通訊、16-bit 埠號限制導致效能瓶頸）則是 NAT 被嚴正批判的主要理由。'
  },

  // Module 9: The New Generation Internet Protocol: IPv6 (ipv6)
  {
    id: 25,
    moduleId: 'ipv6',
    question: 'IPv6 定址採用高達 128 位元（128-bit Address Space）長度，這使得其所能提供之實體 IP 首碼儲量空間約是多少？',
    options: [
      '大約 43 億個（$$2^{32}$$），很快就發放完畢了',
      '約為 $$3.4 \\times 10^{38}$$ 個。理論上可以為地球上的每一顆沙子甚至每一個分子都分配一個獨立的、可直接路由的公網 IP',
      '只比 IPv4 增加了六倍，容量仍然十分捉藉在二',
      '大約 65,536 個，其限制在 UDP socket 埠口數目中'
    ],
    correctIndex: 1,
    explanation: 'IPv6 採用了 128 位元的超大定址。這帶來了 2 的 128 次方（約 3.4 * 10^38）個地址，這是一個天文數字，徹底從根源解決了 IP 地址竭盡、宣告枯竭的歷史危機。'
  },
  {
    id: 26,
    moduleId: 'ipv6',
    question: '與 IPv4 標頭相比，IPv6 在標頭設計上引入了許多重大最佳化，以便可以大大減負中途路由器的查表解析運載。以下何種做法是 IPv6 改良標頭的經典表現？',
    options: [
      '移成了對應的 Checksum（首部總和檢查碼）以在 TTL（Hop Limit）變更時，路由器不需不斷重算校驗碼；同時規定路由器「中途不進行 Fragmentation」，直接丟棄並報 ICMP',
      '將標頭長度調整為可變形式，可動態支持加入 128 個 user-option 參數',
      '加大了 fragment offset 的高度，使其在 L3 就高度支持 6 億個碎片的並行排序運補',
      '不設定預設 40 位元組的固定長度，全部採用鏈路層廣播來動態寻址'
    ],
    correctIndex: 0,
    explanation: 'IPv6 將標頭完全定長為 40 Bytes（固定），並移除了 IPv4 累贅的的 Checksum（校驗功能完全外包給 L2 和 L4 完成），這免去了每台路由器改動 TTL 後重新校驗首碼的累贅。同時禁止路由器中途進行 Fragmentation 分碎，由端主機發送前自行用 Path MTU 算好，極大幅度釋放了路由器的轉送頻寬上限。'
  },
  {
    id: 27,
    moduleId: 'ipv6',
    question: '在混合、共存、尚未萬物切換切換的過渡期（mixed IPv4 & IPv6 Networks），如何把一個 IPv6 資料報跨越全是純 IPv4 硬體的「中途走廊島嶼（IPv4 Routers Island）」運送到彼岸？主要運行的技術是？',
    options: [
      '強制骨幹島嶼上的所有路由器停機進行 Flag-day 無縫實體重新佈線',
      '隧道技術（Tunneling）：在入口雙協定棧路由器上，將原裝完整 IPv6 資料報作為一個普通的「Payload 載重資料」，封裝進一個普通的、含有 IPv4 標頭的資料報內發送',
      '利用 NAT Table 把外網 128位元強制做 26 遮罩的截斷對譯',
      '一律利用 DHCP Discover 發送 DORA 交換解耦'
    ],
    correctIndex: 1,
    explanation: '隧道（Tunneling）是歷史過渡最常用的優雅封裝方案：既然中途的 IPv4 路由器不懂 IPv6，我們就把這個 IPv6 封包包覆、裝箱（像一個信封 packet inside packet）塞進標準 IPv4 封包的 Payload 負載中。當通過 IPv4 島嶼時只被視作普通 IPv4 packet 裝運，抵達出口再拆箱吐出乾淨 IPv6，完美完成了穿越，選項 1 正確。'
  },

  // Module 10: Generalized Forwarding, SDN and OpenFlow (sdn-openflow)
  {
    id: 28,
    moduleId: 'sdn-openflow',
    question: '在網路層通用轉送（Generalized Forwarding）中，拋棄了傳統單一局限在目的地 IP 的轉送。OpenFlow 的流表（Flow Table）條目包含 Match，以下哪組可以作為比對條件？',
    options: [
      '只能比對最長目的 IP 首碼（Destination IP），其格式和一維路由表一模一樣',
      '可跨越層級（L1 ~ L4）多個欄位的組合條件進行比對：包含 Ingress Port, MAC 地址, IP 前綴, 以及 TCP/UDP Port 號等多管道大一統比對',
      '只允許比對 BGP 封膠宣告開行路軌和 OSPF 切割權重',
      '完全不限制，可以直接解析內容比對應用層 http 文字內容進行 url 對碰'
    ],
    correctIndex: 1,
    explanation: 'OpenFlow 流表（Flow Table）比對極強。它「通用（Generalized）」抽象了比對條件，能從第一層入境埠（L1 Port）、第二層（L2 MAC）、第三層（L3 IP, protocol）甚至是第四層（L4 Port號）欄位大一統，組成匹配鏈。這使其具備了無與倫比的安全和控制表現，選項 1 正確。'
  },
  {
    id: 29,
    moduleId: 'sdn-openflow',
    question: '在 OpenFlow 比較與動作（Match-plus-Action）中，如果封包在流匹配成功，流表條目能夠執行的內定行為（Actions）「不包含」底下何者？',
    options: [
      '轉送（Forward）：發放到特定的物理輸出埠口',
      '丟棄（Drop）：相當於本端防火牆阻斷，直接拋棄封包',
      '修改欄位（Modify Fields）：例如重寫標頭中的 Port/IP（執行 NAT）',
      '在本端主機自主運行並重寫 OSPF 計算以繞過中央控制面'
    ],
    correctIndex: 3,
    explanation: 'OpenFlow 的動作（Actions）包含 Forward（轉送）、Drop（丟棄）、Modify（改寫，如 NAT）以及封裝上傳（Send to controller）。但它絕不會、也不能在本端去自主破壞集中控制架構運行 OSPF 自行重構，選項 3 是流表不包含且不被允許的動作。'
  },
  {
    id: 30,
    moduleId: 'sdn-openflow',
    question: 'OpenFlow 的流表規則如此靈活與通用（Match-plus-Action）。以下哪一項是通識流表「無法（Cannot）」藉由自定義匹配與動作完美模擬並取代的？',
    options: [
      '作為路由器（Router）：僅比對最特定目標 IP，動作用於 Forward 發送轉送',
      '作為連結交換機（Switch）：比對目的 MAC 連接址，動作設為 Forward 轉往指定埠',
      '作為防火牆（Firewall）：比對來源 IP 及 4 層 Port（如 22 ssh），動作指定為 Drop 拋棄封包',
      '作為 DNS 域名伺服器：在本端比對域名字串，從流表中直接反彈 IP 地址包'
    ],
    correctIndex: 3,
    explanation: '流表完美一統了數據面硬體實作：比 IP+轉發 = 路由器；比 MAC+轉發 = 交換機；比 L4+Drop = 防火牆；比 L4+Modify = NAT。但流表不能、也無法作為一個具有字串查詢、遞迴解析快取的應用級「DNS 域名伺服器（DNS Server）」，選項 3 敘述是不能實現的。'
  },

  // Module 11: Middleboxes and Internet Architecture (middleboxes)
  {
    id: 31,
    moduleId: 'middleboxes',
    question: 'RFC 3234 對「中介設備（Middlebox）」達成了嚴格共識。下列哪一項物理設備，在學術體系結構上「不屬於」 Middlebox 之定義範疇？',
    options: [
      '一個僅執行標準第 3 層 IP 本地最長匹配轉送、不干預其它任何 L4 或加值項目的標準 IP 路由器（Standard IP Router）',
      '執行安全深度數據流包監測（DPI）與入侵清洗的防火牆 / 入侵檢測系統（IDS）',
      '負責為後端伺服器負載分流、公有 IP 和網段轉向的負載平衡器（Load Balancers）',
      '部署在各處節點以就地截擊轉送常用熱點內容的應用級快取主機（CDN Caches）'
    ],
    correctIndex: 0,
    explanation: '學術定義上，凡是執行了「除了標準 IP 轉送以外其它的加值、改寫或中途攔截干預」硬體盒子，即是 Middlebox。因此，標準轉送路由器不是 middlebox，而負載平衡器、防火牆、快取客主機、NAT、NAT對譯器等都是 middleboxes。'
  },
  {
    id: 32,
    moduleId: 'middleboxes',
    question: '網際網路長久以來被稱頌為「沙漏形 / 細腰架構（Hourglass Architecture）」。在細腰（Waist）的最窄中央處，定義了網格底層唯一全人類共用、所有接入實體、不管是上層多樣應用或底層物理介質均需無條件支援的協定是？',
    options: [
      '對應應用層最高普適的 HTTP 協議',
      '第二層乙太網路協定（Ethernet Frame layout）',
      '第四層可靠傳輸 TCP 協議',
      '網路 IP 協定（網際網路協定 / IPv4 和 IPv6 網路層）'
    ],
    correctIndex: 3,
    explanation: 'Internet 設計哲學的核心是「細腰（Thin Waist）/ 沙漏（Hourglass）」：不論上層運行多麼百般樣態的傳遞與應用層（HTTP, email, DNS, DASH）亦或下層採用何等實體傳播（光纖、銅纜、Wi-Fi, 4G），中央必有也是唯一一條將兩端牢牢扣連起來的「細腰（Waist）」，那便是「IP （網際網路協定）」。'
  },
  {
    id: 33,
    moduleId: 'middleboxes',
    question: '中介設備（Middleboxes）的大量部署引發了對於互連網黃金信念「端對端原則（End-to-End Argument）」和「智慧在邊緣（Intelligence at the edge）」的侵蝕與探討。這引發了底下何種發展限制？',
    options: [
      '路由器無法計算 Dijkstra 短徑收斂演算法',
      '使得網芯（Network core）變得日益肥大、沈重且難以改變，未來若要全球大範圍推行新興、安全的高效網際協定將面臨極大阻礙與困難',
      '造成局域內部全部斷線，主機再也拿不到 DHCP 租約',
      '使得 IPv6 固定 40 字組標頭完全無法使用隧道（Tunneling）封裝'
    ],
    correctIndex: 1,
    explanation: '端對端原則（End-to-End Argument）主張網芯應保持透明和簡單，所有複雜、智能決策都必須部署在通訊端點（主機端）。而 middlebox 將複雜的應用干預、過濾和重寫置於控制網格內部。這使得我們想在芯內推廣新型協定（如一開始不被中介所認識的新封包格式）會被中介直接丟棄，網芯日趨板結，窒礙了新型網絡協定的創新。'
  }
];
