import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as htmlToImage from 'html-to-image';
import { Printer, Plus, Trash2, FileText, Wand2, Upload, Image as ImageIcon, RotateCcw, Target, Search, Lightbulb, Settings, X, Activity, TrendingUp, MapPin, BarChart3, Layers, Sparkles, Send, Zap } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { getSystemInstruction } from './utils/PromptManager';
import { SettingsModal } from './components/SettingsModal';
import { loadKeys } from './utils/storage';
import TieredPackageService from './components/TieredPackageService';
import MarketingPackageSection from './components/MarketingPackageSection';

type EstimateItem = {
  category: string;
  detail: string;
  qty: string;
  price: string;
};

type AnalysisReport = {
  locationAnalysis: {
    zoneType: string;       // 상권 유형 (오피스, 주거 등)
    footTraffic: string;    // 유동인구 특성
    accessibility: string;  // 접근성 및 랜드마크
  };
  placeDiagnosis: {
    profile: string;
    keywords: string;
    intro: string;
    notification: string;
    menu: string;
    reservation: string;
    reviews: string;
    blog: string;
    community: string;
    external: string;
  };
  tieredPackages: {
    name: string;
    price: string;
    target: string;
    features: string[];
    isRecommended: boolean;
  }[];
  roiForecast: {
    metric: string;
    current: number;
    afterThreeMonths: number;
    growthRate: string;
  }[];
  keywordStrategy: {
    mainKeywords: { keyword: string; volume: string; ranking?: string }[];
    extendKeywords: { keyword: string; volume: string; ranking?: string }[];
  };
  competitorAnalysis: {
    channels: string;
    messaging: string;
    pricing: string;
    realCompetitors: string; // 실제 경쟁사 명칭 포함
  };
  competitorBattleCard: {
    storeName: string;
    reviews: string;
    blogs: string;
    keywords: string;
    status: 'normal' | 'warning' | 'danger';
    weakness: string;
  }[];
  sentimentAnalysis: {
    positive: string[];
    negative: string[];
    customerVibe: string;
    consulting_tips: string[];
  };
  targetCustomer: {
    genderRatio: { male: number; female: number };
    ageRatio: { "2030": number; "4050": number; "60_plus": number };
    peakDays: string[];
    summary: string;
  };
  marketingStrategy: string;
  enhancedAnalysis: {
    marketShare: {
      ourShare: number;
      competitorShare: number;
      gapAnalysis: string;
    };
    revenueLeakage: {
      monthlyLostTraffic: number;
      estimatedLoss: string;
      recoveryPotential: string;
    };
    technicalHealth: {
      score: number;
      missingElements: string[];
      urgency: 'High' | 'Medium' | 'Low';
    };
    businessStage: {
      current: 'Survival' | 'Growth' | 'Dominance';
      nextGoal: string;
    };
  };
  generatedContent: {
    instagramFeeds: string[];
    blogTitles: string[];
    carrotMarketAd: string;
    imageGenerationPrompt: string;
  };
  visualMockupPrompt: string;
};

const INDUSTRY_COLORS: Record<string, string> = {
  "기본 (퍼플)": "#4B0082", // 딥 퍼플
  "음식점": "#E67E22", // 오렌지
  "IT/모바일": "#2980B9", // 블루
  "뷰티/패션": "#8E44AD", // 퍼플
  "부동산/인테리어": "#16A085", // 청록색 (신뢰, 안정감)
  "자동차/모빌리티": "#34495E", // 다크 네이비 (전문성, 무게감)
  "교육/학원": "#27AE60", // 그린 (성장, 안정)
  "병원/의료": "#00A8FF", // 라이트 블루 (청결, 신뢰)
  "생활서비스/기타": "#F39C12", // 옐로우 오렌지 (친근함, 접근성)
  "일반": "#A52A2A"      // 레드 
};

const INDUSTRY_TEMPLATES: Record<string, { items: { category: string; detail: string; qty: string }[]; focus: string }> = {
  "음식점": {
    items: [
      { category: "플레이스 최적화", detail: "네이버 예약/주문 세팅 및 메뉴 사진 최적화", qty: "1 set" },
      { category: "블로그 마케팅", detail: "지역 맛집 키워드 상위 노출 체험단", qty: "10건" },
      { category: "인스타그램", detail: "릴스 제작 및 감성 피드 운영 (월 8회)", qty: "8회" },
      { category: "리뷰 관리", detail: "영수증 리뷰 및 알림받기 이벤트 지원", qty: "30건" },
      { category: "🎁 특별 무상 지원", detail: "자사 개발 [네이버 블로그 자동 생성 AI 프로그램] 평생 라이선스", qty: "1계정 (무제한)" }
    ],
    focus: "맛, 분위기, 비주얼 중심의 시각적 마케팅과 예약 전환율 분석"
  },
  "IT/모바일": {
    items: [
      { category: "성지 키워드", detail: "지역 휴대폰 성지/싼곳 키워드 노출", qty: "1 set" },
      { category: "지역 커뮤니티", detail: "당근마켓 비즈프로필 및 지역 광고", qty: "1회" },
      { category: "블로그 마케팅", detail: "최신 기종 개통 후기형 기자단", qty: "10건" },
      { category: "SNS 운영", detail: "정책 업데이트 공지 및 이벤트 카드뉴스", qty: "4회" },
      { category: "🎁 특별 무상 지원", detail: "자사 개발 [네이버 블로그 자동 생성 AI 프로그램] 평생 라이선스", qty: "1계정 (무제한)" }
    ],
    focus: "가격 경쟁력, 신뢰도, 최신 기종 재고 정보를 강조한 전환 유도"
  },
  "뷰티/패션": {
    items: [
      { category: "포트폴리오", detail: "시술/착장 고퀄리티 화보 촬영 지원", qty: "1회" },
      { category: "인플루언서", detail: "뷰티/패션 카테고리 협찬 마케팅", qty: "5건" },
      { category: "지도 최적화", detail: "뷰티 관련 키워드 검색 노출", qty: "1 set" },
      { category: "🎁 특별 무상 지원", detail: "자사 개발 [네이버 블로그 자동 생성 AI 프로그램] 평생 라이선스", qty: "1계정 (무제한)" }
    ],
    focus: "트렌디한 스타일링과 시각적 신뢰도 구축"
  },
  "부동산/인테리어": {
    items: [
      { category: "플레이스 최적화", detail: "지역 랜드마크 아파트 및 상가 키워드 세팅", qty: "1 set" },
      { category: "전문 블로그", detail: "매물 분석 및 시공 포트폴리오 전문 포스팅", qty: "월 10회" },
      { category: "커뮤니티 바이럴", detail: "지역 부동산 카페 및 맘카페 정보성 침투", qty: "월 4건" },
      { category: "영상 마케팅", detail: "매물/시공 현장 랜선 투어 유튜브 숏츠 제작", qty: "월 2건" },
      { category: "🎁 특별 무상 지원", detail: "자사 개발 [네이버 블로그 자동 생성 AI 프로그램] 평생 라이선스", qty: "1계정 (무제한)" }
    ],
    focus: "지역 내 전문성과 신뢰도 구축, 고관여 고객의 DB(문의) 확보"
  },
  "자동차/모빌리티": {
    items: [
      { category: "플레이스 최적화", detail: "차종별 시공/수리 전문 키워드 상위 노출", qty: "1 set" },
      { category: "작업기 블로그", detail: "Before & After 중심의 디테일한 시공기 작성", qty: "월 8회" },
      { category: "당근마켓 광고", detail: "세차/정비/썬팅 지역 타겟팅 광고 세팅", qty: "1식" },
      { category: "리뷰 관리", detail: "시공 만족도 영수증 리뷰 및 AS 안내 세팅", qty: "월 20건" },
      { category: "🎁 특별 무상 지원", detail: "자사 개발 [네이버 블로그 자동 생성 AI 프로그램] 평생 라이선스", qty: "1계정 (무제한)" }
    ],
    focus: "시공 퀄리티(결과물) 증명과 차량 동호회 및 지역 기반의 입소문"
  },
  "교육/학원": {
    items: [
      { category: "플레이스 최적화", detail: "지역명+과목(예: 대치동 수학학원) 키워드 세팅", qty: "1 set" },
      { category: "학부모 타겟 블로그", detail: "입시 정보 및 학원 커리큘럼 전문 포스팅", qty: "월 8회" },
      { category: "지역 커뮤니티", detail: "지역 맘카페 교육 정보 제공 및 간접 홍보", qty: "월 4건" },
      { category: "DB 확보 광고", detail: "설명회 모집 및 무료 테스트 신청 랜딩페이지", qty: "1식" },
      { category: "🎁 특별 무상 지원", detail: "자사 개발 [네이버 블로그 자동 생성 AI 프로그램] 평생 라이선스", qty: "1계정 (무제한)" }
    ],
    focus: "원장님의 교육 철학, 진학 성과 증명, 학부모 커뮤니티(맘카페) 내 평판 관리"
  },
  "병원/의료": {
    items: [
      { category: "의료법 준수 최적화", detail: "심평원 데이터 기반 플레이스 합법적 세팅", qty: "1 set" },
      { category: "브랜드 블로그", detail: "원장님 직접 작성 스타일의 전문 의학 칼럼", qty: "월 6회" },
      { category: "리뷰 평판 관리", detail: "네이버 영수증 리뷰 및 친절도 모니터링", qty: "상시" },
      { category: "검색 광고(SA)", detail: "지역+진료과목 파워링크 효율 최적화 세팅", qty: "1식" },
      { category: "🎁 특별 무상 지원", detail: "자사 개발 [네이버 블로그 자동 생성 AI 프로그램] 평생 라이선스", qty: "1계정 (무제한)" }
    ],
    focus: "의료진의 전문성, 최신 장비, 청결 및 친절도 중심의 신뢰 마케팅 (의료법 위반 주의)"
  },
  "생활서비스/기타": {
    items: [
      { category: "당근마켓 최적화", detail: "비즈프로필 단골 맺기 및 동네 홍보 게시글", qty: "월 4회" },
      { category: "플레이스 상위노출", detail: "지역명+서비스(예: 청소, 이사, 꽃집) 키워드", qty: "1 set" },
      { category: "이용 후기 블로그", detail: "실제 고객 만족도 중심의 체험단/기자단", qty: "월 10건" },
      { category: "🎁 특별 무상 지원", detail: "자사 개발 [네이버 블로그 자동 생성 AI 프로그램] 평생 라이선스", qty: "1계정 (무제한)" }
    ],
    focus: "빠른 접근성, 친근함, 이웃의 찐 후기(당근마켓, 영수증 리뷰) 중심의 로컬 마케팅"
  },
  "일반": {
    items: [
      { category: "브랜드 블로그", detail: "업종 전문 지식 기반 정보성 포스팅", qty: "월 12회" },
      { category: "언론 홍보", detail: "신뢰도 향상을 위한 뉴스 기사 송출", qty: "1건" },
      { category: "🎁 특별 무상 지원", detail: "자사 개발 [네이버 블로그 자동 생성 AI 프로그램] 평생 라이선스", qty: "1계정 (무제한)" }
    ],
    focus: "전문성 강조 및 브랜드 인지도 확산"
  }
};

// AI 시안 생성기 컴포넌트
const AISianGenerator = ({ 
  analysisData, 
  isGenerating, 
  onGenerate, 
  generatedImage, 
  setGeneratedImage 
}: { 
  analysisData: any;
  isGenerating: boolean;
  onGenerate: () => void;
  generatedImage: string | null;
  setGeneratedImage: (img: string | null) => void;
}) => {
  const [isAsked, setIsAsked] = useState(false);
  
  const mockupDescription = analysisData?.analysisReport?.visualMockupPrompt || 
    `${analysisData?.industryType || '해당'} 업종에 최적화된 프리미엄 SNS 광고 배너 시안`;

  return (
    <div className="mt-8 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-[30px] p-8 text-white shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-10">
        <Sparkles size={100} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
            <ImageIcon size={20} className="text-white" />
          </div>
          <h3 className="text-xl font-black tracking-tight uppercase">AI Visual Mockup Strategy</h3>
        </div>

        {generatedImage ? (
           <div className="relative group rounded-xl overflow-hidden border-2 border-purple-500/50 shadow-2xl mb-6">
             <img src={generatedImage} alt="Generated Marketing Draft" className="w-full h-auto object-cover" />
             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
               <a 
                 href={generatedImage} 
                 download="marketing_draft.png" 
                 className="bg-white text-purple-900 px-4 py-2 rounded-full font-bold text-sm hover:bg-purple-100 transition-colors flex items-center gap-2"
               >
                 <Upload size={16} /> 다운로드
               </a>
               <button 
                  onClick={() => setGeneratedImage(null)}
                  className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-red-600 transition-colors"
               >
                  다시 만들기
               </button>
             </div>
           </div>
        ) : (
          <>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6">
              <p className="text-sm font-bold text-indigo-200 mb-2 uppercase tracking-widest">AI 제안 시안 컨셉</p>
              <p className="text-lg font-medium leading-relaxed italic">
                "{mockupDescription}"
              </p>
            </div>

            {!isAsked ? (
              <button 
                onClick={() => setIsAsked(true)}
                className="w-full bg-white text-indigo-900 py-4 rounded-2xl font-black text-lg hover:scale-[1.02] transition-all shadow-xl flex items-center justify-center gap-2"
              >
                시안 확인하기
              </button>
            ) : (
              <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-xl font-bold mb-4 text-center">
                  소리님, 위 컨셉으로 광고 시안을 <br/>
                  <span className="text-yellow-400">나노바나나</span>로 그려드릴까요? 🎨
                </p>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className="flex-1 bg-yellow-400 text-indigo-950 py-4 rounded-2xl font-black text-lg hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {isGenerating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin"></div>
                        그리는 중...
                      </div>
                    ) : (
                      "네, 그려주세요!"
                    )}
                  </button>
                  <button 
                    onClick={() => setIsAsked(false)}
                    className="px-6 bg-white/10 text-white py-4 rounded-2xl font-bold hover:bg-white/20 transition-all"
                  >
                    아니오
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// AI 자동 생성 마케팅 콘텐츠 섹션 컴포넌트
const AutoContentSection = ({ 
  contents, 
  onGenerateBanner, 
  isBannerGenerating, 
  bannerImage, 
  onDeleteBanner 
}: { 
  contents: any, 
  onGenerateBanner: () => void, 
  isBannerGenerating: boolean, 
  bannerImage: string | null, 
  onDeleteBanner: () => void 
}) => {
  return (
    <section className="mt-12 p-8 bg-slate-50 rounded-[40px] border-2 border-slate-200">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg">
          <FileText size={24} />
        </div>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">AI 자동 생성 마케팅 콘텐츠</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instagram Section */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h4 className="flex items-center gap-2 text-pink-600 font-black mb-4 uppercase tracking-tighter">
            <span className="w-2 h-2 bg-pink-500 rounded-full" /> Instagram Captions
          </h4>
          <div className="space-y-4">
            {contents?.instaCaptions?.map((text: string, i: number) => (
              <div key={i} className="bg-slate-50 p-4 rounded-xl text-xs leading-relaxed text-slate-600 border-l-4 border-pink-200">
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Blog & Local Ad Section */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h4 className="flex items-center gap-2 text-emerald-600 font-black mb-4 uppercase tracking-tighter">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" /> Blog Title Strategy
            </h4>
            <ul className="space-y-2">
              {contents?.blogTitles?.map((title: string, i: number) => (
                <li key={i} className="text-sm font-bold text-slate-700 flex items-start gap-2">
                  <span className="text-emerald-500">Q.</span> {title}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100">
            <h4 className="flex items-center gap-2 text-orange-600 font-black mb-4 uppercase tracking-tighter">
              <span className="w-2 h-2 bg-orange-500 rounded-full" /> 당근마켓 지역광고 문구
            </h4>
            <div className="bg-orange-50 p-4 rounded-xl text-sm font-medium text-orange-800 italic">
              "{contents?.localAdCopy}"
            </div>
          </div>

          {/* Banner Generation Section */}
          <div className="bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-800 text-white">
            <div className="flex justify-between items-center mb-4">
              <h4 className="flex items-center gap-2 text-yellow-400 font-black uppercase tracking-tighter">
                <Sparkles size={16} /> Banner Prompt (Nano Banana Pro)
              </h4>
              <button
                onClick={onGenerateBanner}
                disabled={isBannerGenerating}
                className="bg-yellow-400 text-slate-900 px-4 py-2 rounded-xl text-xs font-black hover:bg-yellow-300 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg active:scale-95"
              >
                {isBannerGenerating ? (
                  <div className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                ) : <ImageIcon size={14} />}
                이미지 생성하기
              </button>
            </div>
            <p className="text-xs font-mono opacity-60 leading-relaxed mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
              {contents?.imagePrompt}
            </p>

            {bannerImage && (
              <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-2xl animate-in zoom-in-95 duration-300">
                <img 
                  src={bannerImage} 
                  alt="AI Generated Banner" 
                  className="w-full h-auto"
                  referrerPolicy="no-referrer"
                />
                <div className="bg-slate-800/80 backdrop-blur-md p-3 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nano Banana Pro Result</span>
                  <button 
                    onClick={onDeleteBanner}
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors"
                  >
                    삭제하기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// 💡 [추가] 안전한 API 키 호출 함수
const getSafeApiKey = () => {
  let apiKey = "";
  try {
    const keys = loadKeys();
    if (keys && keys.gemini) apiKey = keys.gemini;
  } catch(e) {}
  
  // Vercel 환경변수 (VITE_ prefix 확인)
  try {
    if (import.meta.env.VITE_GEMINI_API_KEY) {
      apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch (e) {}

  // process가 존재하는 환경에서만 값을 찾도록 방어
  if (typeof process !== 'undefined' && process.env) {
    apiKey = (process.env as any).API_KEY || apiKey;
  }

  return apiKey;
};

export default function App() {
  const [prompt, setPrompt] = useState(""); // 빈칸으로 두어 AI가 타겟 지역과 업종에만 집중하게 만듭니다.
  const [placeUrl, setPlaceUrl] = useState("");
  const [targetRegion, setTargetRegion] = useState(""); // 명확한 타겟 지역과 상호명
  const [microLocation, setMicroLocation] = useState(""); // 예: "그랑시티자이 2 차 상가"
  const [targetScope, setTargetScope] = useState<'local' | 'national'>('local');
  const [targetBudget, setTargetBudget] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [isBannerGenerating, setIsBannerGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const estimateRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);


  const [isCompetitorModalOpen, setIsCompetitorModalOpen] = useState(false);
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [competitorName, setCompetitorName] = useState(""); // 👈 신규 추가: 정확도를 높이기 위한 매장명
  const [isCompetitorAnalyzing, setIsCompetitorAnalyzing] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({
    storeName: "",
    reviews: "",
    blogs: "",
    keywords: "",
    status: "normal" as "normal" | "warning" | "danger",
    weakness: ""
  });

  useEffect(() => {
    // 브라우저 환경이 아닐 경우(SSR)를 대비한 체크
    if (typeof window === 'undefined') return;

    // API 키 체크는 사용자가 버튼 누를 때 하도록 두거나, 
    // 렌더링 직후에만 실행되도록 보장
    const timeout = setTimeout(() => {
      const currentApiKey = getSafeApiKey();
      if (!currentApiKey) {
        setIsSettingsOpen(true);
      }
    }, 500);
    
    return () => clearTimeout(timeout);
  }, []);

  // 경쟁사 URL 자동 분석 함수 (업그레이드 버전)
  const analyzeCompetitor = async () => {
    if (!competitorUrl.trim() && !competitorName.trim()) {
      alert("정확한 분석을 위해 매장명이나 URL을 입력해주세요.");
      return;
    }

    setIsCompetitorAnalyzing(true);
    try {
      let apiKey = getSafeApiKey();
      if (!apiKey) {
        alert("API Key가 설정되지 않았습니다. 설정 메뉴에서 API Key를 입력해주세요.");
        setIsSettingsOpen(true); // 설정 창 띄우기 추가
        setIsCompetitorAnalyzing(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // 👈 프롬프트 강화: 검색 도구를 어떻게 쓸지 구체적으로 지시
      const promptText = `
      [경쟁사 정밀 분석 미션]
      타겟 업체명: ${competitorName || '제공되지 않음 (URL을 통해 직접 파악할 것)'}
      관련 URL: ${competitorUrl}

      지시사항:
      1. 반드시 'googleSearch' 도구를 사용하여 위 업체명과 URL을 기반으로 실제 매장 정보를 검색하세요.
      2. 검색 결과 스니펫을 분석하여 이 매장의 네이버 플레이스 영수증 리뷰 수, 네이버 블로그 리뷰 수를 최대한 근접하게 유추하세요.
      3. 고객들의 불만 사항이나 약점(예: 주차 불가, 비싼 가격, 불친절 등)을 하나 찾아내세요.
      4. 도출된 결과를 반드시 아래 JSON 형식으로만 반환하세요.

      {
        "storeName": "${competitorName || '검색된 매장명'}",
        "reviews": "예: 120",
        "blogs": "예: 45",
        "keywords": "상위 노출 강함 / 보통 / 약함 중 택 1",
        "status": "danger / warning / normal 중 택 1 (강력한 경쟁사면 danger)",
        "weakness": "찾아낸 치명적 약점 1가지"
      }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: promptText }] },
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const resultText = response.text || "{}";
      const cleanedText = resultText.replace(/```json\n|\n```/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedText);

      // 분석된 데이터를 즉시 아래 수동 입력 폼에 꽂아줍니다.
      setNewCompetitor({
        storeName: parsed.storeName || competitorName || "",
        reviews: parsed.reviews || "0",
        blogs: parsed.blogs || "0",
        keywords: parsed.keywords || "-",
        status: parsed.status || "warning",
        weakness: parsed.weakness || "분석 불가"
      });
      
    } catch (error) {
      console.error("경쟁사 분석 실패:", error);
      alert("데이터를 완벽히 불러오지 못했습니다. 일부 정보는 직접 입력해주세요.");
    } finally {
      setIsCompetitorAnalyzing(false);
    }
  };

  const closeCompetitorModal = () => {
    setNewCompetitor({
      storeName: "",
      reviews: "",
      blogs: "",
      keywords: "",
      status: "normal",
      weakness: ""
    });
    setCompetitorUrl("");
    setCompetitorName("");
    setIsCompetitorModalOpen(false);
  };

  const addCompetitorManual = () => {
    if (!newCompetitor.storeName) {
      alert("경쟁사 이름을 입력해주세요.");
      return;
    }
    
    setData(prev => ({
      ...prev,
      analysisReport: {
        ...prev.analysisReport!,
        competitorBattleCard: [
          ...(prev.analysisReport?.competitorBattleCard || []),
          newCompetitor
        ]
      }
    }));
    
    closeCompetitorModal();
  };

  useEffect(() => {
    // 💡 [추가] API 키가 없으면 자동으로 설정 창 띄우기
    const currentApiKey = getSafeApiKey();
    if (!currentApiKey) {
      setIsSettingsOpen(true);
    }
  }, []);

  const saveImage = async (ref: React.RefObject<HTMLDivElement>, fileName: string) => {
    if (!ref.current) return;

    try {
      const image = await htmlToImage.toPng(ref.current, {
        pixelRatio: 2, 
        backgroundColor: '#ffffff',
        filter: (node: HTMLElement) => {
          if (node.classList && node.classList.contains('print:hidden')) {
            return false;
          }
          return true;
        }
      });
      
      // 모바일 및 PC 모두 호환되는 일반 다운로드 방식
      const link = document.createElement('a');
      link.href = image;
      link.download = `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`✅ [${fileName}.png] 다운로드가 완료되었습니다.`);
      
    } catch (err) {
      console.error("이미지 저장 오류:", err);
      alert("이미지 생성 중 오류가 발생했습니다. 브라우저 콘솔을 확인해주세요.");
    }
  };

  useEffect(() => {
    // Keys are now managed by SettingsModal and storage.ts
  }, []);

  const handleIndustryChange = (selectedType: string) => {
    setData(prev => ({
      ...prev,
      industryType: selectedType,
      // items 덮어쓰기 삭제! (이제 기본 9개 항목이 절대 지워지지 않음)
      summaryColor: INDUSTRY_COLORS[selectedType] || "#333333"
    }));
  };

  // [데이터 고정] 사진 기반 8대 전략 + AI 무상 지원 항목
  const INITIAL_MARKETING_ITEMS: EstimateItem[] = [
    { category: "N플레이스 최적화 세팅 지원", detail: "대표사진 *영상 세팅, 대표키워드 설정, 소식/알림/이벤트세팅, 스마트콜/톡톡 점검, 예약세팅", qty: "1 set", price: "0원" },
    { category: "N플레이스 활성화 지원", detail: "플레이스 방문수 월 1,500건 / 즐겨찾기(저장) 지원", qty: "월 1식", price: "0원" },
    { category: "N플레이스 리뷰 지원", detail: "영수증 리뷰 / 예약 리뷰 : 월 8건", qty: "월 1식", price: "0원" },
    { category: "체험단 지원 (고급형)", detail: "준최 상위 지수 : 월 4팀", qty: "월 1식", price: "0원" },
    { category: "블로그 리뷰 지원 (일반형)", detail: "준최 : 월 6건", qty: "월 1식", price: "0원" },
    { category: "SNS 지원 (인스타)", detail: "컨텐츠 : 월 6건 (*릴스 1건 포함)", qty: "월 1식", price: "0원" },
    { category: "커뮤니티 개설 및 단골 관리", detail: "카카오채널(이벤트&프로모션 알림), 당근채널(지역 고객 타겟팅)", qty: "각 1채널", price: "0원" },
    { category: "커뮤니티 침투 지원", detail: "당근마켓(당근 게시물 침투 1건), 맘카페(N맘카페 침투 1건)", qty: "월 1식", price: "0원" },
    { category: "🎁 특별 무상 지원", detail: "자사 개발 [네이버 블로그 자동 생성 AI 프로그램] 평생 라이선스 🔥 특별 혜택", qty: "1계정 (무제한)", price: "무상" }
  ];

  // [기본 설정] 공급자 정보 및 초기 데이터 세팅
  const DEFAULT_DATA = {
    industryType: "기본 (퍼플)",
    companyName: "HMD",       // 👈 회사명 수정 (예: "컴퍼니")
    representative: "권두다",          // 👈 대표자명 수정
    date: "2026.03.09",              // 👈 기본 표시 날짜 수정
    validity: "견적 3일 유효",
    storeName: "타겟 매장명 입력",
    items: INITIAL_MARKETING_ITEMS, 
    regularPrice: 2000000,           // 👈 기본 정상가 
    dcRate: 20,                      // 👈 기본 할인율(%)
    period: 3,                       // 👈 기본 계약 기간(개월)
    summaryColor: "#001f3f",
    address: "서울시 강남구 논현동0000", // 👈 마케팅 회사 실제 주소로 수정
    businessNo: "000-00-00000",             // 👈 사업자등록번호 수정
    email: "hyukpcs0912@gmail.com",              // 👈 대표 이메일 수정
    terms: "본 상품은 이벤트 가격이 적용된 상품으로서, 중도 해약 시 정상가를 기준으로 일할 계산하여 환불됩니다.", // 👈 하단에 들어갈 계약 약관 내용 수정
    analysisReport: {
      locationAnalysis: {
        zoneType: "주거 밀집 및 재래시장 상권",
        footTraffic: "30대 이상 주부 및 5060세대 유동인구가 많음",
        accessibility: "연무시장 입구 맞은편에 위치하여 가시성이 좋으나 주차 공간 확보 필요"
      },
      placeDiagnosis: {
        profile: "대표사진이 다소 어둡고 메뉴판 가독성이 떨어집니다. 밝고 선명한 고화질 사진으로 교체하고, 메뉴판은 텍스트 위주로 깔끔하게 재구성하는 것이 좋습니다.",
        keywords: "현재 '휴대폰 성지' 키워드만 설정되어 있습니다. '수원 휴대폰 싼곳', '연무동 핸드폰 매장' 등 지역 기반 세부 키워드를 추가하여 노출 범위를 넓혀야 합니다.",
        intro: "매장 위치 설명이 부족합니다. '연무시장 입구 맞은편'과 같이 랜드마크를 활용한 구체적인 설명을 추가하고, 주차 가능 여부를 명시해주세요.",
        notification: "현재 진행 중인 이벤트 알림이 없습니다. '개통 고객 필름 무료 교체' 등 소소한 이벤트를 등록하여 방문 유도를 강화하세요.",
        menu: "최신 기종 가격 정보가 업데이트되지 않았습니다. 주요 기종별 할인가를 명시하여 고객의 호기심을 자극하세요.",
        reservation: "네이버 예약 기능이 비활성화되어 있습니다. 상담 예약 기능을 도입하여 고객 편의를 높이고 노쇼를 방지하세요.",
        reviews: "최근 3개월간 리뷰가 없습니다. 영수증 리뷰 이벤트를 통해 긍정적인 리뷰를 적극적으로 확보해야 합니다.",
        blog: "블로그 노출이 전무합니다. 지역 맛집/일상 블로거를 활용한 체험단 마케팅으로 자연스러운 바이럴 효과를 노려보세요.",
        community: "지역 맘카페 등 커뮤니티 활동이 없습니다. 지역 주민들에게 친근하게 다가갈 수 있는 정보성 콘텐츠로 소통을 시작하세요.",
        external: "인스타그램 계정이 있으나 게시물이 부족합니다. 매장 일상, 개통 후기 등 꾸준한 업로드가 필요합니다."
      },
      tieredPackages: [
        {
          name: "Basic (실속형)",
          price: "1,200,000",
          target: "초기 예산 절약",
          features: ["플레이스 기본 세팅", "영수증 리뷰 20건", "블로그 체험단 5건"],
          isRecommended: false
        },
        {
          name: "Standard (추천)",
          price: "2,420,000",
          target: "가성비 & 효율",
          features: ["플레이스 상위 노출 최적화", "프리미엄 블로그 10건", "인스타그램 관리 4주"],
          isRecommended: true
        },
        {
          name: "Premium (집중형)",
          price: "4,500,000",
          target: "지역 시장 장악",
          features: ["전 채널(블로그/인스타/당근) 풀패키지", "유튜브 숏츠 제작", "실시간 리뷰 대응"],
          isRecommended: false
        }
      ],
      roiForecast: [
        { metric: "월간 플레이스 노출", current: 1200, afterThreeMonths: 5800, growthRate: "383%" },
        { metric: "월간 매장 방문자", current: 150, afterThreeMonths: 480, growthRate: "220%" },
        { metric: "월간 문의/예약", current: 15, afterThreeMonths: 65, growthRate: "333%" }
      ],
      keywordStrategy: {
        mainKeywords: [
          { keyword: "수원 휴대폰 성지", volume: "12,500", ranking: "3위" },
          { keyword: "연무동 핸드폰", volume: "3,200", ranking: "12위" },
          { keyword: "장안구 휴대폰", volume: "2,800", ranking: "8위" }
        ],
        extendKeywords: [
          { keyword: "수원 아이폰15 즉시개통", volume: "1,500", ranking: "5위" },
          { keyword: "연무시장 핸드폰 가게", volume: "800", ranking: "순위 밖" },
          { keyword: "수원 효도폰 추천", volume: "1,200", ranking: "15위" }
        ]
      },
      competitorAnalysis: {
        channels: "인근 경쟁사 A는 블로그 체험단을 월 10건 이상 진행하며 상위 노출을 장악하고 있습니다.",
        messaging: "'최저가 보장', '불법 보조금 최대 지원' 등 자극적인 문구로 가격 민감 고객을 공략하고 있습니다.",
        pricing: "제휴 카드 할인 포함 실구매가를 강조하여 저렴해 보이는 효과를 주고 있습니다.",
        realCompetitors: "A모바일 (직선거리 200m), B텔레콤 (연무시장 내)"
      },
      competitorBattleCard: [
        { storeName: "우리 매장", reviews: "45", blogs: "12", keywords: "노출 부족", status: "warning", weakness: "온라인 존재감 미약" },
        { storeName: "경쟁사 A", reviews: "320", blogs: "150", keywords: "상위 노출", status: "danger", weakness: "불친절한 응대 리뷰 다수" },
        { storeName: "경쟁사 B", reviews: "180", blogs: "80", keywords: "중위 노출", status: "normal", weakness: "주차 공간 협소" }
      ],
      sentimentAnalysis: {
        positive: ["친절함", "빠른 개통", "사은품 풍성"],
        negative: ["주차 불편", "복잡한 설명", "대기 시간"],
        customerVibe: "전반적으로 신뢰도는 높으나 접근 편의성 개선이 시급한 상태입니다.",
        consulting_tips: ["매장 앞 전용 주차 구역 안내 표지판 설치", "어르신 전용 쉬운 요금제 안내판 제작"]
      },
      targetCustomer: {
        genderRatio: { male: 60, female: 40 },
        ageRatio: { "2030": 55, "4050": 30, "60_plus": 15 },
        peakDays: ["토", "일"],
        summary: "가격 비교에 능숙한 2030세대와 상담을 중요시하는 5060세대가 주 고객층입니다. 세대별 맞춤 상담 전략이 필요합니다."
      },
      marketingStrategy: "2030 타겟으로는 '수원 성지' 키워드 상위 노출과 커뮤니티 바이럴을 통해 '가격 경쟁력'을 어필하고, 5060 타겟으로는 당근마켓 지역 광고와 친절한 상담 후기를 강조하여 '신뢰도'를 높이는 투트랙 전략을 제안합니다.",
      enhancedAnalysis: {
        marketShare: {
          ourShare: 15,
          competitorShare: 45,
          gapAnalysis: "경쟁사 A는 블로그 체험단과 인스타그램 광고를 통해 2030 세대 유입을 독점하고 있습니다."
        },
        revenueLeakage: {
          monthlyLostTraffic: 1200,
          estimatedLoss: "약 1,200 만원",
          recoveryPotential: "월 800만원 수준 회복 가능"
        },
        technicalHealth: {
          score: 65,
          missingElements: ["네이버 톡톡", "N예약", "플레이스 광고"],
          urgency: "High"
        },
        businessStage: {
          current: "Survival",
          nextGoal: "지역 내 인지도 3위권 진입을 위한 리뷰 100개 돌파"
        }
      },
      generatedContent: {
        instagramFeeds: [
          "📱 수원 휴대폰 성지, 아직도 모르세요? #수원휴대폰 #연무동핸드폰 #특가이벤트",
          "부모님 효도폰, 고민하지 마세요! 🎁 #효도폰 #부모님선물 #가성비갑"
        ],
        blogTitles: [
          "수원 연무동 휴대폰 성지, 솔직 방문 후기 (가격 공개)",
          "아이폰15 즉시개통 가능한 곳! 재고 확보 완료",
          "호갱 탈출! 휴대폰 싸게 사는 법 대공개"
        ],
        carrotMarketAd: "🥕 우리 동네 단골 휴대폰 가게! 당근 보고 왔다고 하면 필름 무료 교체 해드려요~",
        imageGenerationPrompt: "Modern and clean mobile phone store interior, bright lighting, latest smartphones on display, friendly staff consulting with a customer, high resolution, realistic style"
      },
      visualMockupPrompt: "Modern and clean mobile phone store interior, bright lighting, latest smartphones on display, friendly staff consulting with a customer, high resolution, realistic style"
    } as AnalysisReport | null
  };

  const [data, setData] = useState(DEFAULT_DATA);

  // [수정된 로직] 가격 계산 부분을 별도의 함수로 분리하여 useEffect 최적화
  const calculateTieredPrices = useCallback((regularPrice: number, dcRate: number) => {
    const currentEventPrice = Math.floor(regularPrice * (1 - dcRate / 100));
    return {
      basic: Math.floor(currentEventPrice * 0.6).toLocaleString(),
      standard: currentEventPrice.toLocaleString(),
      premium: Math.floor(currentEventPrice * 1.7).toLocaleString()
    };
  }, []);

  useEffect(() => {
    if (!data.analysisReport?.tieredPackages) return;

    const { basic, standard, premium } = calculateTieredPrices(data.regularPrice, data.dcRate);
    const currentPkgs = data.analysisReport.tieredPackages;

    if (currentPkgs[1].price !== standard) {
      setData(prev => ({
        ...prev,
        analysisReport: {
          ...prev.analysisReport!,
          tieredPackages: [
            { ...currentPkgs[0], price: basic },
            { ...currentPkgs[1], price: standard },
            { ...currentPkgs[2], price: premium }
          ]
        }
      }));
    }
  }, [data.regularPrice, data.dcRate, calculateTieredPrices]);

  const handleReset = () => {
    if (window.confirm("모든 데이터를 초기값으로 되돌리시겠습니까?")) {
      setData(DEFAULT_DATA);
      setLogoBase64("");
      setPrompt("이든통신 휴대폰 매장 마케팅 견적서 부탁해");
      setPlaceUrl("");
      setTargetBudget("");
    }
  };

  const eventPrice = Math.floor(data.regularPrice * (1 - data.dcRate / 100));

  const handleItemChange = (index: number, field: keyof EstimateItem, value: string) => {
    const newItems = [...data.items];
    newItems[index][field] = value;
    setData({ ...data, items: newItems });
  };

  const handlePackageChange = (index: number, field: string, value: string) => {
    if (!data.analysisReport || !data.analysisReport.tieredPackages) return;

    const newPackages = [...data.analysisReport.tieredPackages];
    newPackages[index] = { ...newPackages[index], [field]: value };

    setData({
      ...data,
      analysisReport: {
        ...data.analysisReport,
        tieredPackages: newPackages
      }
    });
  };

  const addItem = () => {
    setData({
      ...data,
      items: [...data.items, { category: "", detail: "", qty: "", price: "" }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = data.items.filter((_, i) => i !== index);
    setData({ ...data, items: newItems });
  };

  const handlePrint = () => {
    // 인쇄 전용 스타일 태그 동적 생성
    const style = document.createElement('style');
    style.innerHTML = `
      @page { size: A4; margin: 0; }
      @media print {
        body { margin: 0; -webkit-print-color-adjust: exact; }
        .print-hidden { display: none !important; }
        .A4-page { 
          margin: 0 !important; 
          box-shadow: none !important; 
          width: 210mm !important; 
          height: 297mm !important; 
          page-break-after: always;
        }
      }
    `;
    document.head.appendChild(style);
    
    window.print();
    
    // 인쇄 후 스타일 제거
    setTimeout(() => {
      document.head.removeChild(style);
    }, 1000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateEstimate = async () => {
    // 대상 지역 이 비어있으면 경고
    if (!targetRegion.trim()) {
      alert("정확한 분석을 위해 '타겟 지역 및 상호명'을 반드시 입력해 주세요. (예: 안산 상록구 해양1로199 두다모바일)");
      return;
    }
    
    setIsGenerating(true);
    try {
      let apiKey = getSafeApiKey();
      if (!apiKey) {
        alert("API Key가 설정되지 않았습니다. 설정 메뉴에서 API Key를 입력해주세요.");
        setIsSettingsOpen(true); // 설정 창 띄우기 추가
        setIsGenerating(false);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      
      // 🚨 수정: 특정 템플릿이 아닌, 사용자가 세팅한(화면에 보이는) 9개 항목 리스트를 통째로 전달
      const templateItemsStr = JSON.stringify(data.items, null, 2); 
      const currentFocus = INDUSTRY_TEMPLATES[data.industryType]?.focus || "일반적인 마케팅 효율 분석";

      const scopeInstruction = targetScope === 'national'
        ? `[전국 단위 분석 모드]\n- 특정 지역의 주소에 얽매이지 말고 '대한민국 전체' 시장 트렌드를 분석하세요.\n- 온라인 검색량, SNS 언급량, 업계 1위 브랜드와의 격차를 분석하세요.\n- 타겟은 특정 동네 주민이 아니라 전국 단위의 잠재 고객군으로 설정하세요.`
        : `[지역 기반 분석 모드]\n- 입력된 [타겟 지역] 주변 3~5km 반경의 실제 경쟁사 데이터를 분석하세요.`;

      const fullScopeInstruction = `${scopeInstruction}

[★ 견적 실행 항목 (project_scope) 작성 절대 규칙 ★]
아래 항목들은 당사의 '고정 마케팅 서비스 리스트'입니다. 
AI가 임의로 판단하여 항목을 덜어내거나 개수를 줄이는 것을 절대 금지합니다. 
반드시 아래 제공된 목록 전체(${data.items.length}개)를 단 하나도 누락 없이 배열에 포함하여 출력하세요. 
(단, 타겟 업종의 상황에 맞춰 'detail(세부내용)' 부분만 워딩을 센스있게 다듬어주는 것은 허용합니다.)
${templateItemsStr}

해당 지역(${targetRegion})에서 이 업종의 1~5위 업체와 비교하여 팩트 위주로 작성하세요.

[🚨 분석 심화 지침 - 팩트 폭격 모드]
VOC 분석: 단순 텍스트 나열 금지. 긍정/부정 비율을 %로 계산하고, 경쟁 1위 업체와의 '신뢰 점수 격차'를 수치로 제시할 것.
컨설턴트 제언: "7일 안에 네이버 톡톡을 켜지 않으면 모바일 문의의 40%를 버리는 것과 같습니다"처럼 구체적인 행동 지표(Action Item)를 3단계로 줄 것.
키워드 전략 (강제 규칙): 메인 키워드(main_keywords)와 확장 키워드(extend_keywords)는 반드시 각각 정확히 5개씩 도출할 것.
경쟁사 배틀 카드 (강제 규칙): competitor_battle_card 배열은 '우리 매장' 1개와 '실제 주변 경쟁사' 4개를 포함하여 반드시 정확히 5개의 객체로 꽉 채워서 반환할 것. 

[★ 경쟁사 분석 거짓말 방지 및 팩트 기반 원칙 (중요) ★]
경쟁사의 '리뷰 수(reviews)'와 '블로그 수(blogs)'는 구글 검색 스니펫에서 명확히 확인된 경우에만 숫자로 적고, 확인이 불가능하면 절대 임의의 숫자를 지어내지 말고 "N/A" 또는 "직접 확인 필요"로 기재할 것. 
대신, 해당 경쟁사의 온라인 평판이나 검색 노출 상태를 기반으로 한 '약점(weakness)' 분석에 AI의 추론 능력을 100% 집중하여 사장님이 영업 시 써먹을 수 있는 날카로운 무기를 제공할 것.`;

      const jsonStructure = `{
  "industry_type": "음식점" | "IT/모바일" | "뷰티/패션" | "일반",
  "location_analysis": {
    "zone_type": "상권 유형 설명",
    "foot_traffic": "유동인구 분석",
    "accessibility": "접근성 및 랜드마크"
  },
  "estimate_info": { "company_name": "공급자", "date": "발행일", "validity": "유효기간" },
  "client_info": { "store_name": "분석된 실제 매장명" },
  "project_scope": [ { "category": "항목", "detail": "내용", "qty": "수량", "price": "비용(패키지 포함/무상 지원 등)" } ],
  "pricing": { "regular_price": 3200000, "event_price": 2420000, "vat": 0, "total_amount": 14520000 },
  "terms": "계약 약관",
  "analysis_report": {
    "place_diagnosis": {
      "profile": "대표사진 진단 내용",
      "keywords": "대표키워드 진단 내용",
      "intro": "소개/오시는길 진단 내용",
      "notification": "알림/이벤트 진단 내용",
      "menu": "메뉴 진단 내용",
      "reservation": "예약 진단 내용",
      "reviews": "리뷰 진단 내용",
      "blog": "블로그 진단 내용",
      "community": "커뮤니티 진단 내용",
      "external": "외부채널 진단 내용"
    },
    "tiered_packages": [
      { "name": "Basic", "price": "1,200,000", "target": "가성비 중심", "features": ["기본 리뷰 10건", "플레이스 세팅"], "is_recommended": false },
      { "name": "Standard", "price": "2,420,000", "target": "가성비 & 효율", "features": ["플레이스 상위 노출 최적화", "프리미엄 블로그 10건"], "is_recommended": true },
      { "name": "Premium", "price": "4,500,000", "target": "지역 시장 장악", "features": ["전 채널 풀패키지", "유튜브 숏츠 제작"], "is_recommended": false }
    ],
    "roi_forecast": [
      { "metric": "월간 플레이스 노출", "current": 1200, "after_three_months": 5800, "growth_rate": "383%" },
      { "metric": "월간 매장 방문자", "current": 150, "after_three_months": 480, "growth_rate": "220%" },
      { "metric": "월간 문의/예약", "current": 15, "after_three_months": 65, "growth_rate": "333%" }
    ],
    "competitor_battle_card": [
      { "store_name": "우리 매장", "reviews": "직접 확인 필요", "blogs": "직접 확인 필요", "keywords": "노출 진단 필요", "status": "warning", "weakness": "온라인 존재감 진단 필요" },
      { "store_name": "실제 경쟁사 1", "reviews": "N/A", "blogs": "직접 확인 필요", "keywords": "상위 노출", "status": "danger", "weakness": "방문자 리뷰 중 '주차 불편' 키워드 다수 포착됨" },
      { "store_name": "실제 경쟁사 2", "reviews": "120", "blogs": "N/A", "keywords": "중위 노출", "status": "warning", "weakness": "최신 블로그 리뷰가 6개월 전으로 멈춰 있음" },
      { "store_name": "실제 경쟁사 3", "reviews": "N/A", "blogs": "N/A", "keywords": "하위 노출", "status": "normal", "weakness": "대표 사진 가독성 불량 및 특색 없는 소개글" },
      { "store_name": "실제 경쟁사 4", "reviews": "N/A", "blogs": "직접 확인 필요", "keywords": "상위 노출", "status": "danger", "weakness": "높은 인지도 대비 네이버 톡톡/예약 미활용으로 이탈 발생" }
    ],
    "sentiment_analysis": {
      "positive": ["친절함", "빠른 개통"],
      "negative": ["주차 불편", "복잡한 설명"],
      "customer_vibe": "전반적으로 신뢰도는 높으나 접근 편의성 개선이 시급한 상태",
      "consulting_tips": ["매장 앞 전용 주차 구역 안내 표지판 설치", "어르신 전용 쉬운 요금제 안내판 제작"]
    },
    "keyword_strategy": {
      "main_keywords": [ { "keyword": "키워드", "volume": "검색량", "ranking": "현재 순위(숫자 혹은 '순위 밖')" } ],
      "extend_keywords": [ { "keyword": "키워드", "volume": "검색량", "ranking": "현재 순위(숫자 혹은 '순위 밖')" } ]
    },
    "competitor_analysis": {
      "channels": "경쟁 채널",
      "messaging": "경쟁 메시지",
      "pricing": "가격 전략",
      "real_competitors": "실제 파악된 경쟁사 목록"
    },
    "target_customer": {
      "gender_ratio": { "male": 60, "female": 40 },
      "age_ratio": { "2030": 55, "4050": 30, "60_plus": 15 },
      "peak_days": ["토", "일"],
      "summary": "타겟 분석 요약"
    },
    "marketing_strategy": "최종 전략",
    "enhanced_analysis": {
      "market_share": {
        "our_share": 15,
        "top_competitor_share": 45,
        "gap_analysis": "점유율 격차 원인 분석"
      },
      "revenue_leakage": {
        "monthly_lost_traffic": 1200,
        "estimated_monthly_loss": "약 1,200 만원",
        "recovery_potential": "월 800만원 수준 회복 가능"
      },
      "technical_health": {
        "score": 65,
        "missing_elements": ["네이버 톡톡", "N예약", "플레이스 광고"],
        "urgency": "High"
      },
      "business_stage": {
        "current": "Survival",
        "next_goal": "지역 내 인지도 3위권 진입을 위한 리뷰 100개 돌파"
      }
    },
    "generated_content": {
      "instagram_feeds": ["피드 1", "피드 2"],
      "blog_titles": ["제목 1", "제목 2", "제목 3"],
      "carrot_market_ad": "당근마켓 광고 문구",
      "image_generation_prompt": "배너 생성 프롬프트"
    },
    "visual_mockup_prompt": "이미지 생성용 영문 프롬프트 (고화질, 사실적 묘사 필수)"
  }
}`;

      const systemInstruction = getSystemInstruction(data.industryType, currentFocus, fullScopeInstruction, jsonStructure);

      // 분석을 위한 도구 설정
      const tools = [
        { googleSearch: {} }
      ];
      
      const contentParts = [];
      // 1. 타겟 지역을 단 하나뿐인 절대 기준으로 멱살 잡고 고정
      contentParts.push({ text: `[★ 절대 기준 위치 (가장 중요) ★]: ${targetRegion}\n오직 이 지역(${targetRegion})의 상권과 유동인구, 경쟁사만을 1순위로 분석할 것. 다른 지역(예: 시흥, 거북섬 등)의 데이터가 섞이는 것을 엄격히 금지함.` });
      
      contentParts.push({ text: `[★ 절대 규칙: 업종 강제 고정 ★]
현재 타겟 비즈니스의 업종은 [${data.industryType}]입니다. 
절대 기존에 설정된 예시나 휴대폰/통신 매장에 대한 내용을 출력하지 마세요. 
반드시 [${data.industryType}]에 맞는 키워드, 타겟 고객, 문제점, 컨설팅 팁, 마케팅 패키지를 구성해야 합니다.` });
      
      if (placeUrl.trim()) {
        contentParts.push({ text: `참고용 URL: ${placeUrl}` });
      }
      
      // 🚨 범인 삭제: contentParts.push({ text: `기본 주소: ${data.address}` }); 
      // (마케팅 회사의 거북섬 주소가 AI에게 넘어가지 않도록 아예 줄을 지웠습니다.)
      
      if (prompt.trim()) {
        contentParts.push({ text: `사용자 추가 요청사항: ${prompt}` });
      }
      
      if (targetBudget.trim()) {
        contentParts.push({ text: `[고객 월 목표 예산]: ${targetBudget}\n※ 주의: 이 예산은 전체 금액이 아닌 '1개월(월간)' 기준 예산입니다. 3단계 패키지(Basic/Standard/Premium)의 가격과 구성을 제안할 때, 반드시 이 월 예산을 중심(Standard)으로 합리적으로 세팅하세요.` });
      }
      contentParts.push({ text: `위 정보를 바탕으로, 반드시 지정된 [타겟 지역 및 상호명]과 [${data.industryType}] 업종에 맞는 상권을 분석하여 JSON 견적서를 작성해줘.` });

      const contents = [
        {
          role: "user",
          parts: contentParts
        }
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: {
          systemInstruction,
          maxOutputTokens: 8192,
          tools: tools,
          responseMimeType: "application/json"
        }
      });

      let result;
      try {
        const text = response.text || "{}";
        // Enhanced JSON parsing logic
        const cleanedText = text.replace(/```json\n|\n```/g, "").replace(/```/g, "").trim();
        const firstBrace = cleanedText.indexOf('{');
        const lastBrace = cleanedText.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
          const jsonString = cleanedText.substring(firstBrace, lastBrace + 1);
          result = JSON.parse(jsonString);
        } else {
          result = JSON.parse(cleanedText);
        }
      } catch (e) {
        console.error("JSON Parse Error:", e);
        console.log("Raw Response:", response.text);
        throw new Error("AI 응답 형식이 올바르지 않아 처리할 수 없습니다. 다시 시도해주세요.");
      }
      
      setData(prev => ({
        ...prev,
        industryType: result.industry_type || "일반",
        companyName: result.estimate_info?.company_name || prev.companyName,
        date: result.estimate_info?.date || prev.date,
        validity: result.estimate_info?.validity || prev.validity,
        storeName: result.client_info?.store_name || prev.storeName,
        // 🚨 방어막: AI가 준 리스트가 기존 개수보다 적으면 무시하고 기존 9개를 유지!
        items: (Array.isArray(result.project_scope) && result.project_scope.length >= prev.items.length) 
               ? result.project_scope 
               : prev.items,
        regularPrice: result.pricing?.regular_price || prev.regularPrice,
        eventPrice: result.pricing?.event_price || prev.regularPrice * (1 - prev.dcRate / 100),
        dcRate: result.pricing?.event_price && result.pricing?.regular_price 
          ? Math.round((1 - result.pricing.event_price / result.pricing.regular_price) * 100) 
          : prev.dcRate,
        terms: result.terms || prev.terms,
        analysisReport: result.analysis_report ? {
          locationAnalysis: {
            zoneType: result.location_analysis?.zone_type || "",
            footTraffic: result.location_analysis?.foot_traffic || "",
            accessibility: result.location_analysis?.accessibility || "",
          },
          placeDiagnosis: {
            profile: result.analysis_report.place_diagnosis?.profile || "",
            keywords: result.analysis_report.place_diagnosis?.keywords || "",
            intro: result.analysis_report.place_diagnosis?.intro || "",
            notification: result.analysis_report.place_diagnosis?.notification || "",
            menu: result.analysis_report.place_diagnosis?.menu || "",
            reservation: result.analysis_report.place_diagnosis?.reservation || "",
            reviews: result.analysis_report.place_diagnosis?.reviews || "",
            blog: result.analysis_report.place_diagnosis?.blog || "",
            community: result.analysis_report.place_diagnosis?.community || "",
            external: result.analysis_report.place_diagnosis?.external || ""
          },
          tieredPackages: Array.isArray(result.analysis_report.tiered_packages) 
            ? result.analysis_report.tiered_packages.map((pkg: any) => ({
                name: pkg.name || "패키지명",
                price: pkg.price || "0",
                target: pkg.target || "",
                features: Array.isArray(pkg.features) ? pkg.features : [],
                isRecommended: !!pkg.is_recommended
              }))
            : [],
          roiForecast: Array.isArray(result.analysis_report.roi_forecast)
            ? result.analysis_report.roi_forecast.map((item: any) => ({
                metric: item.metric || "지표",
                current: Number(item.current) || 0,
                afterThreeMonths: Number(item.after_three_months) || 0,
                growthRate: item.growth_rate || "0%"
              }))
            : [],
          competitorBattleCard: Array.isArray(result.analysis_report.competitor_battle_card)
            ? result.analysis_report.competitor_battle_card.map((item: any) => ({
                storeName: item.store_name || "매장명 미상",
                reviews: item.reviews || "0",
                blogs: item.blogs || "0",
                keywords: item.keywords || "-",
                status: item.status || "normal",
                weakness: item.weakness || "분석 대기 중"
              }))
            : [],
          sentimentAnalysis: result.analysis_report.sentiment_analysis ? {
            positive: Array.isArray(result.analysis_report.sentiment_analysis.positive) 
              ? result.analysis_report.sentiment_analysis.positive 
              : [],
            negative: Array.isArray(result.analysis_report.sentiment_analysis.negative) 
              ? result.analysis_report.sentiment_analysis.negative 
              : [],
            customerVibe: result.analysis_report.sentiment_analysis.customer_vibe || "",
            consulting_tips: Array.isArray(result.analysis_report.sentiment_analysis.consulting_tips) 
              ? result.analysis_report.sentiment_analysis.consulting_tips 
              : []
          } : {
            positive: [], negative: [], customerVibe: "", consulting_tips: []
          },
          keywordStrategy: {
            mainKeywords: Array.isArray(result.analysis_report.keyword_strategy?.main_keywords) 
              ? result.analysis_report.keyword_strategy.main_keywords.map((kw: any) => ({
                  keyword: kw.keyword || "",
                  volume: kw.volume || "0",
                  ranking: kw.ranking || "순위 밖"
                }))
              : [],
            extendKeywords: Array.isArray(result.analysis_report.keyword_strategy?.extend_keywords) 
              ? result.analysis_report.keyword_strategy.extend_keywords.map((kw: any) => ({
                  keyword: kw.keyword || "",
                  volume: kw.volume || "0",
                  ranking: kw.ranking || "순위 밖"
                }))
              : []
          },
          competitorAnalysis: {
            channels: result.analysis_report.competitor_analysis?.channels || "",
            messaging: result.analysis_report.competitor_analysis?.messaging || "",
            pricing: result.analysis_report.competitor_analysis?.pricing || "",
            realCompetitors: result.analysis_report.competitor_analysis?.real_competitors || ""
          },
          targetCustomer: {
            genderRatio: {
              male: result.analysis_report.target_customer?.gender_ratio?.male || 50,
              female: result.analysis_report.target_customer?.gender_ratio?.female || 50
            },
            ageRatio: {
              "2030": result.analysis_report.target_customer?.age_ratio?.["2030"] || 33,
              "4050": result.analysis_report.target_customer?.age_ratio?.["4050"] || 33,
              "60_plus": result.analysis_report.target_customer?.age_ratio?.["60_plus"] || 34
            },
            peakDays: Array.isArray(result.analysis_report.target_customer?.peak_days) 
              ? result.analysis_report.target_customer.peak_days 
              : [],
            summary: result.analysis_report.target_customer?.summary || ""
          },
          marketingStrategy: result.analysis_report.marketing_strategy || "",
          enhancedAnalysis: result.analysis_report.enhanced_analysis ? {
            marketShare: {
              ourShare: result.analysis_report.enhanced_analysis.market_share?.our_share || 0,
              competitorShare: result.analysis_report.enhanced_analysis.market_share?.top_competitor_share || 0,
              gapAnalysis: result.analysis_report.enhanced_analysis.market_share?.gap_analysis || ""
            },
            revenueLeakage: {
              monthlyLostTraffic: result.analysis_report.enhanced_analysis.revenue_leakage?.monthly_lost_traffic || 0,
              estimatedLoss: result.analysis_report.enhanced_analysis.revenue_leakage?.estimated_monthly_loss || "",
              recoveryPotential: result.analysis_report.enhanced_analysis.revenue_leakage?.recovery_potential || ""
            },
            technicalHealth: {
              score: result.analysis_report.enhanced_analysis.technical_health?.score || 0,
              missingElements: result.analysis_report.enhanced_analysis.technical_health?.missing_elements || [],
              urgency: result.analysis_report.enhanced_analysis.technical_health?.urgency || "Low"
            },
            businessStage: {
              current: result.analysis_report.enhanced_analysis.business_stage?.current || "Survival",
              nextGoal: result.analysis_report.enhanced_analysis.business_stage?.next_goal || ""
            }
          } : undefined,
          generatedContent: result.analysis_report.generated_content ? {
            instagramFeeds: Array.isArray(result.analysis_report.generated_content.instagram_feeds) 
              ? result.analysis_report.generated_content.instagram_feeds 
              : [],
            blogTitles: Array.isArray(result.analysis_report.generated_content.blog_titles) 
              ? result.analysis_report.generated_content.blog_titles 
              : [],
            carrotMarketAd: result.analysis_report.generated_content.carrot_market_ad || "",
            imageGenerationPrompt: result.analysis_report.generated_content.image_generation_prompt || ""
          } : undefined,
          visualMockupPrompt: result.analysis_report.visual_mockup_prompt || result.analysis_report.generated_content?.image_generation_prompt || ""
        } : prev.analysisReport
      }));

    } catch (error: any) {
      console.error("분석 실패:", error);
      alert("상권 분석 중 오류가 발생했습니다. URL이 정확한지 확인해 주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async (type: 'mockup' | 'banner' = 'mockup') => {
    const isBanner = type === 'banner';
    const prompt = isBanner 
      ? data.analysisReport?.generatedContent?.imageGenerationPrompt 
      : data.analysisReport?.visualMockupPrompt;

    if (!prompt) {
      alert("이미지 생성 프롬프트가 없습니다. 먼저 견적서를 생성해주세요.");
      return;
    }

    if (isBanner) setIsBannerGenerating(true);
    else setIsImageGenerating(true);

    try {
      // Nano Banana Pro (gemini-3-pro-image-preview) requires platform key selection
      const modelName = isBanner ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
      
      let apiKey = getSafeApiKey();

      if (isBanner) {
        // Check for platform key selection for Pro model
        const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
        if (!hasKey) {
          await (window as any).aistudio?.openSelectKey();
        }
        // Use the platform injected key if available, otherwise fallback to custom key
        // Note: process.env.API_KEY is injected by the platform
        apiKey = (process.env as any).API_KEY || apiKey;
      }

      if (!apiKey) {
        alert("API Key가 설정되지 않았습니다. 설정 메뉴에서 API Key를 입력해주세요.");
        setIsSettingsOpen(true);
        if (isBanner) setIsBannerGenerating(false);
        else setIsImageGenerating(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            ...(isBanner ? { imageSize: "1K" } : {})
          }
        },
      });

      let imageUrl = null;
      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            imageUrl = `data:image/png;base64,${base64EncodeString}`;
            break;
          }
        }
      }

      if (imageUrl) {
        if (isBanner) setBannerImage(imageUrl);
        else setGeneratedImage(imageUrl);
      } else {
        alert("이미지 생성에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error: any) {
      console.error("이미지 생성 오류:", error);
      if (error.message?.includes("Requested entity was not found")) {
        alert("API 키 권한이 없거나 만료되었습니다. 다시 선택해주세요.");
        await (window as any).aistudio?.openSelectKey();
      } else {
        alert("이미지 생성 중 오류가 발생했습니다.");
      }
    } finally {
      if (isBanner) setIsBannerGenerating(false);
      else setIsImageGenerating(false);
    }
  };

  const themeColor = INDUSTRY_COLORS[data.industryType] || INDUSTRY_COLORS["일반"];

  if (typeof window === 'undefined') return <div>Loading...</div>; // SSR 방지

  return (
    <div className="flex h-screen bg-gray-100 font-sans">

      {/* Left Panel - Editor (Hidden when printing) */}
      <div className="w-[450px] shrink-0 bg-white border-r border-gray-200 flex flex-col print:hidden shadow-lg z-10">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2" style={{ color: themeColor }}>
            <FileText size={24} />
            <h2 className="text-xl font-bold text-gray-800">견적서 에디터</h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="API 설정"
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={handleReset}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="초기화"
            >
              <RotateCcw size={20} />
            </button>
            <button 
              onClick={() => saveImage(estimateRef, `견적서_${data.storeName}`)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <ImageIcon size={16} />
              <span>이미지 저장</span>
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-md transition-colors shadow-sm text-sm font-medium hover:opacity-90"
              style={{ backgroundColor: themeColor }}
            >
              <Printer size={16} />
              <span>PDF 저장</span>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI Generation */}
          <div className="space-y-3 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
            <h3 className="text-sm font-bold text-indigo-800 flex items-center gap-1">
              <Wand2 size={16} /> AI 맞춤형 견적서 자동 생성
            </h3>
            {/* [추가된 핵심 필드] - AI의 분석 앵커 역할 */}
            <div>
              <label className="block text-xs font-bold text-red-600 mb-1">
                ★ 정확한 타겟 지역 및 상호명 (필수)
              </label>
              <input
                type="text"
                value={targetRegion}
                onChange={e => setTargetRegion(e.target.value)}
                placeholder="예: 경기도 시흥시 이든통신, 서울특별시 성동구 금호동 교촌치킨"
                className="w-full border-2 border-red-300 rounded-md p-2 text-sm focus:ring-red-500 focus:border-red-500 outline-none bg-white font-bold"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                ※ 정확한 읍/면/동 지역을 입력해야 분석 결과가 엉뚱한 곳으로 튀지 않습니다.
              </p>
            </div>

            {/* 상세 위치 입력 */}
            <div>
              <label className="block text-xs font-bold text-indigo-600 mb-1">
                상세 위치 (선택)
              </label>
              <input
                type="text"
                value={microLocation}
                onChange={e => setMicroLocation(e.target.value)}
                placeholder="예: 자이아파트 단지 내, 혹은 OO빌딩 주변"
                className="w-full border border-indigo-200 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* 분석 범위 선택 */}
            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1">분석 범위 설정</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="targetScope"
                    value="local"
                    checked={targetScope === 'local'}
                    onChange={() => setTargetScope('local')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">지역 기반 (동네 상권)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="targetScope"
                    value="national"
                    checked={targetScope === 'national'}
                    onChange={() => setTargetScope('national')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">전국 단위 (온라인/브랜드)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-indigo-700 mb-1">네이버 플레이스 URL (선택)</label>
              <input 
                type="text"
                value={placeUrl}
                onChange={e => setPlaceUrl(e.target.value)}
                placeholder="예: https://map.naver.com/p/entry/place/..."
                className="w-full border border-indigo-200 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none mb-2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1">월 목표 예산(선택)</label>
              <input 
                type="text"
                value={targetBudget}
                onChange={e => setTargetBudget(e.target.value)}
                placeholder="예: 월 100만원 선"
                className="w-full border border-indigo-200 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none mb-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-indigo-700 mb-1">요청사항</label>
              <textarea 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="예: 각 항목별 예산 범위를 지정해서 견적서 작성해줘"
                className="w-full border border-indigo-200 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none h-20"
              />
            </div>
            <button 
              onClick={generateEstimate}
              disabled={isGenerating}
              className="w-full bg-indigo-600 text-white py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  API 데이터 수집 및 분석 중...
                </>
              ) : (
                <>
                  <Wand2 size={16} /> AI로 분석 및 생성하기
                </>
              )}
            </button>
            {apiError && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 whitespace-pre-wrap">
                <div className="font-bold mb-1 flex items-center gap-1"><Activity size={14} /> API 통신 오류</div>
                {apiError}
              </div>
            )}
          </div>

          {/* Logo Upload */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">로고 설정</h3>
            <div className="flex items-center gap-4">
              {logoBase64 ? (
                <div className="relative w-24 h-12 border border-gray-200 rounded flex items-center justify-center p-1 bg-white">
                  <img src={logoBase64} alt="Logo" className="max-h-full max-w-full object-contain" />
                  <button 
                    onClick={() => setLogoBase64("")}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-12 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 bg-gray-50">
                  <ImageIcon size={20} />
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleLogoUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 text-gray-700"
              >
                <Upload size={14} /> 이미지 업로드
              </button>
            </div>
          </div>

          {/* Supplier Info */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">공급자 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">회사명</label>
                <input 
                  type="text" 
                  value={data.companyName} 
                  onChange={e => setData({...data, companyName: e.target.value})} 
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">대표자명</label>
                <input 
                  type="text" 
                  value={data.representative} 
                  onChange={e => setData({...data, representative: e.target.value})} 
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
              <input 
                type="text" 
                value={data.address} 
                onChange={e => setData({...data, address: e.target.value})} 
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사업자번호</label>
                <input 
                  type="text" 
                  value={data.businessNo} 
                  onChange={e => setData({...data, businessNo: e.target.value})} 
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input 
                  type="text" 
                  value={data.email} 
                  onChange={e => setData({...data, email: e.target.value})} 
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm" 
                />
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">기본 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">업종 (테마 색상)</label>
                <select 
                  value={data.industryType}
                  onChange={e => handleIndustryChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                >
                  <option value="기본 (퍼플)">기본 (퍼플)</option>
                  <option value="일반">일반 (레드)</option>
                  <option value="음식점">음식점 (오렌지)</option>
                  <option value="IT/모바일">IT/모바일 (블루)</option>
                  <option value="뷰티/패션">뷰티/패션 (퍼플)</option>
                  <option value="부동산/인테리어">부동산/인테리어 (청록)</option>
                  <option value="자동차/모빌리티">자동차/모빌리티 (네이비)</option>
                  <option value="교육/학원">교육/학원 (그린)</option>
                  <option value="병원/의료">병원/의료 (라이트블루)</option>
                  <option value="생활서비스/기타">생활서비스/기타 (옐로우)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">매장명 (수신자)</label>
                <input 
                  type="text" 
                  value={data.storeName} 
                  onChange={e => setData({...data, storeName: e.target.value})} 
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">발행일</label>
                <input 
                  type="text" 
                  value={data.date} 
                  onChange={e => setData({...data, date: e.target.value})} 
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">유효기간</label>
                <input 
                  type="text" 
                  value={data.validity} 
                  onChange={e => setData({...data, validity: e.target.value})} 
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm" 
                />
              </div>
            </div>
          </div>
          
          {/* Pricing */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">금액 및 할인 설정</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">정상가 (원)</label>
                <input 
                  type="number" 
                  value={data.regularPrice} 
                  onChange={e => setData({...data, regularPrice: Number(e.target.value)})} 
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">관리 기간 (개월)</label>
                <input 
                  type="number" 
                  value={data.period} 
                  onChange={e => setData({...data, period: Number(e.target.value)})} 
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">할인율 (%)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={data.dcRate} 
                    onChange={e => setData({...data, dcRate: Number(e.target.value)})} 
                    className="w-full accent-indigo-600" 
                  />
                  <span className="text-sm font-medium w-8 text-right">{data.dcRate}%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">요약 박스 색상</label>
                <input 
                  type="color" 
                  value={data.summaryColor} 
                  onChange={e => setData({...data, summaryColor: e.target.value})} 
                  className="w-full h-9 p-1 border border-gray-300 rounded-md cursor-pointer" 
                />
              </div>
            </div>
            <div className="bg-indigo-50 p-3 rounded-md text-sm text-indigo-800 font-medium flex justify-between">
              <span>월 할인가:</span>
              <span>￦ {eventPrice.toLocaleString()}</span>
            </div>
            <div className="bg-indigo-100 p-3 rounded-md text-sm text-indigo-900 font-bold flex justify-between">
              <span>총 합계 ({data.period}개월):</span>
              <span>￦ {(eventPrice * data.period).toLocaleString()}</span>
            </div>
          </div>

          {/* Items */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">견적 항목</h3>
              <button onClick={addItem} className="text-sm text-indigo-600 flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded transition-colors">
                <Plus size={14} /> 항목 추가
              </button>
            </div>
            
            <div className="space-y-3">
              {data.items.map((item, i) => (
                <div key={i} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative group shadow-sm">
                  <button 
                    onClick={() => removeItem(i)} 
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-white transition-colors"
                    title="항목 삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="space-y-2 mt-2">
                    <input 
                      placeholder="카테고리 (예: 네이버 최적화)" 
                      value={item.category} 
                      onChange={e => handleItemChange(i, 'category', e.target.value)} 
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none" 
                    />
                    <input 
                      placeholder="세부사항" 
                      value={item.detail} 
                      onChange={e => handleItemChange(i, 'detail', e.target.value)} 
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none" 
                    />
                    <input 
                      placeholder="수량 (예: 1 set)" 
                      value={item.qty} 
                      onChange={e => handleItemChange(i, 'qty', e.target.value)} 
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Packages Editing */}
          {data.analysisReport && data.analysisReport.tieredPackages && data.analysisReport.tieredPackages.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">전용 마케팅 패키지 수정</h3>
              <div className="space-y-4">
                {data.analysisReport.tieredPackages.map((pkg, i) => (
                  <div key={i} className="p-4 border border-indigo-100 rounded-lg bg-indigo-50/30 space-y-2 relative shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-indigo-800 flex items-center gap-1">
                        패키지 {i + 1} {pkg.isRecommended && <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded">추천</span>}
                      </span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">패키지명</label>
                      <input 
                        value={pkg.name} 
                        onChange={e => handlePackageChange(i, 'name', e.target.value)} 
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">패키지 금액 (원)</label>
                      <input 
                        value={pkg.price} 
                        onChange={e => handlePackageChange(i, 'price', e.target.value)} 
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-bold text-indigo-700" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">타겟 설명</label>
                      <input 
                        value={pkg.target} 
                        onChange={e => handlePackageChange(i, 'target', e.target.value)} 
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white" 
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-2 font-bold italic">
                * 여기서 금액과 패키지명을 수정하면 우측 리포트에 즉시 반영됩니다.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Right Panel - Live Preview */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center gap-8 print:p-0 print:block bg-gray-200">
        
        {/* 견적서 페이지 */}
        <div ref={estimateRef} className="A4-page w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[30px] shrink-0 print:shadow-none print:m-0 relative font-noto text-[#333]">
          
          {/* Loading Overlay */}
          {isGenerating && (
            <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm rounded-lg">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <h3 className="text-xl font-bold text-indigo-800 mb-2">AI가 견적서를 생성하고 있습니다</h3>
              <p className="text-gray-600 text-sm">상권 분석 및 마케팅 전략 수립 중...</p>
            </div>
          )}

          {/* Header */}
          <div className="flex justify-between items-end border-b-[4px] pb-4 mb-4" style={{ borderColor: themeColor }}>
            <div className="logo flex items-center gap-4">
              {logoBase64 && (
                <img src={logoBase64} alt="Logo" style={{ height: '50px' }} />
              )}
              <h1 className="text-3xl font-bold m-0" style={{ color: themeColor }}>{data.companyName}</h1>
            </div>
            <div className="text-right text-xs text-gray-600">
              <p className="m-0 mb-1">견적번호: HMD-{data.storeName}-01</p>
              <p className="m-0">발행일: {data.date}</p>
              <p className="m-0">유효기간: {data.validity}</p>
            </div>
          </div>

          {/* Summary Box (New Design) - Increased size by 50% */}
          <div className="mb-10 flex justify-between items-start">
            <div className="w-[30%]">
              <h2 className="text-2xl font-bold mb-8">{data.storeName} 귀하</h2>
              <div className="space-y-2">
                <p className="text-xl font-bold text-gray-800">세부사항 및 특기사항</p>
                <div className="text-[16px] text-gray-500 leading-relaxed pt-3">
                  <p>{data.period}개월 관리대행</p>
                  <p>부가세 별도</p>
                </div>
              </div>
            </div>
            
            <div className="w-[65%] pt-12">
              <div className="space-y-4 mb-6">
                {/* Subtotal Row */}
                <div className="flex items-center text-[18px]">
                  <span className="w-24 text-gray-400">Subtotal</span>
                  <span className="flex-1 text-indigo-900 font-bold text-center text-lg">월 비용</span>
                  <span className="flex-1 text-gray-400 text-center">₩ {data.regularPrice.toLocaleString()} (정상가)</span>
                  <span className="w-32 text-right font-bold text-indigo-900 text-lg">{eventPrice.toLocaleString()}</span>
                </div>
                {/* Package Row */}
                <div className="flex items-center text-[18px]">
                  <span className="w-24 invisible">Subtotal</span>
                  <span className="flex-1 text-center font-medium">주목패키지</span>
                  <span className="flex-1 text-right pr-6">{data.period}개월 보장</span>
                  <span className="w-32 invisible">0</span>
                </div>
              </div>

              {/* Total Pill */}
              <div className="rounded-xl p-5 flex justify-between items-center shadow-md" style={{ backgroundColor: data.summaryColor }}>
                <div className="flex items-center gap-6">
                  <span className="bg-white text-[14px] font-black px-4 py-1.5 rounded-md uppercase" style={{ color: data.summaryColor }}>Total</span>
                  <span className="text-[20px] font-medium text-white">합계금액(VAT 제외)</span>
                </div>
                <span className="text-4xl font-bold text-white">{(eventPrice * data.period).toLocaleString()}</span>
              </div>
              
              <div className="text-[14px] text-gray-400 text-right mt-3">
                * VAT 별도 | * 네이버 스토어 분할결제 가능
              </div>
            </div>
          </div>

          {/* 견적 항목 테이블 */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4 border-l-4 border-indigo-600 pl-3">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Service Scope & Details</h3>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y-2 border-slate-900">
                  <th className="py-3 px-4 text-[11px] text-left font-black text-slate-500 uppercase tracking-wider">실행 항목</th>
                  <th className="py-3 px-4 text-[11px] text-left font-black text-slate-500 uppercase tracking-wider">상세 실행 내용</th>
                  <th className="py-3 px-4 text-[11px] text-center font-black text-slate-500 uppercase tracking-wider w-24">수량</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((item, i) => {
                  // 항목이 8개 이상이면 여백을 조금 줄여서 밀림 방지
                  const pyClass = data.items.length > 8 ? "py-4" : "py-6";
                  const fontSize = data.items.length > 8 ? "text-base" : "text-lg";
                  
                  // 🎁 특별 혜택인지 감지하는 마법의 스위치
                  const isSpecial = item.category.includes("무상") || item.category.includes("🎁");

                  return (
                    <tr key={i} className={`group transition-all page-break-inside-avoid ${isSpecial ? 'bg-red-50/80 border-y-2 border-red-200' : 'hover:bg-indigo-50/30'}`}>
                      <td className={`${pyClass} px-6 ${fontSize} font-black ${isSpecial ? 'text-red-700' : 'text-slate-800'} whitespace-nowrap align-top`}>
                        <span className={`border-l-4 ${isSpecial ? 'border-red-500' : 'border-indigo-500'} pl-3 flex items-center gap-1`}>
                          {item.category}
                        </span>
                      </td>
                      <td className={`${pyClass} px-6 text-[15px] ${isSpecial ? 'text-red-800 font-bold' : 'text-slate-600 font-medium'} leading-7`}>
                        {item.detail}
                        {/* 특별 혜택일 경우 눈에 띄는 뱃지 추가 */}
                        {isSpecial && (
                          <span className="ml-3 inline-flex items-center gap-1 bg-red-600 text-white text-[11px] px-2.5 py-1 rounded-full animate-pulse print:animate-none shadow-sm">
                            🔥 특별 혜택
                          </span>
                        )}
                      </td>
                      <td className={`${pyClass} px-4 text-[15px] ${isSpecial ? 'text-red-800 font-bold' : 'text-slate-800'} font-bold text-center align-middle`}>
                        {item.qty}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* Signature Section */}
          <div className="mt-10 flex justify-between gap-10">
            <div className="flex-1 border border-gray-300 p-4 rounded-md relative bg-gray-50/30">
              <div className="text-[10px] text-gray-500 font-bold mb-6">공급자 (제공자)</div>
              <p className="m-0 font-bold text-base">{data.companyName}</p>
              <div className="border-b border-dashed border-gray-400 w-4/5 my-3"></div>
              <span className="text-[11px]">대표자 {data.representative} (인)</span>
              <div className="absolute right-5 bottom-4 text-gray-400 text-xs border border-gray-300 p-1.5 rounded-full w-7 h-7 flex items-center justify-center">인</div>
            </div>
            <div className="flex-1 border border-gray-300 p-4 rounded-md relative bg-gray-50/30">
              <div className="text-[10px] text-gray-500 font-bold mb-6">신청인 (클라이언트)</div>
              <p className="m-0 font-bold text-base">{data.storeName}</p>
              <div className="border-b border-dashed border-gray-400 w-4/5 my-3"></div>
              <span className="text-[11px]">성명/직인 (서명)</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto">
            <div className="text-[11px] text-gray-500 border-t border-gray-200 pt-5">
              <p className="mb-2">사업자번호: {data.businessNo} | 주소: {data.address} | 문의: {data.email}</p>
              <p className="mb-3 font-semibold text-gray-700">■ 본 마케팅 제안서의 내용은 비밀 유지 협약에 따라 보호받습니다.</p>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-600 leading-relaxed italic">
                {data.terms}
              </div>
            </div>
          </div>

        </div>

        {/* 분석 리포트 페이지 */}
        {data.analysisReport && (
          <div ref={analysisRef} className="A4-page w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[30px] shrink-0 print:shadow-none print:m-0 print:break-before-page mt-8 font-noto relative text-[#333]">
            {/* 개별 페이지 이미지 저장 버튼 (에디터용) */}
            <div className="absolute top-4 right-4 print:hidden">
              <button 
                onClick={() => saveImage(analysisRef, `분석리포트_${data.storeName}`)}
                className="bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <ImageIcon size={20} />
              </button>
            </div>

            <div className="border-b-[4px] pb-4 mb-8" style={{ borderColor: themeColor }}>
              <h2 className="text-3xl font-bold" style={{ color: themeColor }}>맞춤형 마케팅 전략 제안서</h2>
              <p className="text-gray-600 mt-2">{data.storeName} 맞춤 분석 리포트</p>
            </div>

            <div className="space-y-6">
              {/* 4. 신규 추가: 위치 및 상권 분석 섹션 */}
              <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: themeColor }}>
                  <div className="bg-white p-2 rounded shadow-sm text-indigo-600"><MapPin size={20} /></div> 상권 위치 분석
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-md shadow-sm border border-indigo-100">
                    <span className="text-xs font-bold text-indigo-400 block mb-1">상권 유형</span>
                    <p className="text-sm font-medium">{data.analysisReport.locationAnalysis?.zoneType || "분석 대기 중"}</p>
                  </div>
                  <div className="bg-white p-4 rounded-md shadow-sm border border-indigo-100">
                    <span className="text-xs font-bold text-indigo-400 block mb-1">유동인구</span>
                    <p className="text-sm font-medium">{data.analysisReport.locationAnalysis?.footTraffic || "분석 대기 중"}</p>
                  </div>
                  <div className="bg-white p-4 rounded-md shadow-sm border border-indigo-100">
                    <span className="text-xs font-bold text-indigo-400 block mb-1">접근성/랜드마크</span>
                    <p className="text-sm font-medium">{data.analysisReport.locationAnalysis?.accessibility || "분석 대기 중"}</p>
                  </div>
                </div>
              </div>

              {/* Enhanced Analysis Section */}
              {data.analysisReport.enhancedAnalysis && (
                <div className="space-y-6">
                  {/* 1. Digital Market Share */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: themeColor }}>
                      <TrendingUp size={20} /> 디지털 점유율 분석
                    </h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">우리 매장</span>
                          <span className="font-bold">{data.analysisReport.enhancedAnalysis.marketShare.ourShare}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${data.analysisReport.enhancedAnalysis.marketShare.ourShare}%` }}></div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">1위 경쟁사</span>
                          <span className="font-bold text-red-600">{data.analysisReport.enhancedAnalysis.marketShare.competitorShare}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${data.analysisReport.enhancedAnalysis.marketShare.competitorShare}%` }}></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-100">
                      💡 {data.analysisReport.enhancedAnalysis.marketShare.gapAnalysis}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 2. Revenue Leakage */}
                    <div className="bg-red-50 p-6 rounded-lg border border-red-100">
                      <h3 className="text-lg font-bold mb-3 text-red-800 flex items-center gap-2">
                        <Activity size={20} /> 예상 매출 누수
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-red-200 pb-2">
                          <span className="text-sm text-red-700">월간 놓친 고객</span>
                          <span className="font-bold text-red-900">{data.analysisReport.enhancedAnalysis.revenueLeakage.monthlyLostTraffic.toLocaleString()}명</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-red-200 pb-2">
                          <span className="text-sm text-red-700">예상 손실액</span>
                          <span className="font-bold text-red-900 text-lg">{data.analysisReport.enhancedAnalysis.revenueLeakage.estimatedLoss}</span>
                        </div>
                        <p className="text-xs text-red-600 mt-2 font-medium">
                          🚀 {data.analysisReport.enhancedAnalysis.revenueLeakage.recoveryPotential}
                        </p>
                      </div>
                    </div>

                    {/* 3. Technical Health & Business Stage */}
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-gray-700 flex items-center gap-2"><Settings size={16} /> 기술 진단 점수</h4>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            data.analysisReport.enhancedAnalysis.technicalHealth.score >= 80 ? 'bg-green-100 text-green-800' :
                            data.analysisReport.enhancedAnalysis.technicalHealth.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {data.analysisReport.enhancedAnalysis.technicalHealth.score}점 / {data.analysisReport.enhancedAnalysis.technicalHealth.urgency}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {data.analysisReport.enhancedAnalysis.technicalHealth.missingElements.map((el, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                              {el}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                         <h4 className="font-bold text-indigo-800 text-sm mb-1">현재 비즈니스 단계: {data.analysisReport.enhancedAnalysis.businessStage.current}</h4>
                         <p className="text-xs text-indigo-600">
                           🎯 {data.analysisReport.enhancedAnalysis.businessStage.nextGoal}
                         </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Content Section */}
              {data.analysisReport.generatedContent && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: themeColor }}>
                    <div className="bg-white p-2 rounded shadow-sm"><Wand2 size={20} /></div> AI 자동 생성 콘텐츠
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Instagram Feeds */}
                    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
                      <span className="text-xs font-bold text-pink-500 block mb-2 flex items-center gap-1">
                        <ImageIcon size={12} /> 인스타그램 피드 문구
                      </span>
                      <ul className="list-disc list-inside space-y-1">
                        {data.analysisReport.generatedContent.instagramFeeds.map((feed, idx) => (
                          <li key={idx} className="text-sm text-gray-700">{feed}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Blog Titles */}
                    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
                      <span className="text-xs font-bold text-green-600 block mb-2 flex items-center gap-1">
                        <FileText size={12} /> 블로그 추천 제목
                      </span>
                      <ul className="list-disc list-inside space-y-1">
                        {data.analysisReport.generatedContent.blogTitles.map((title, idx) => (
                          <li key={idx} className="text-sm text-gray-700">{title}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Carrot Market Ad */}
                    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
                      <span className="text-xs font-bold text-orange-500 block mb-2 flex items-center gap-1">
                        <Target size={12} /> 당근마켓 광고 문구
                      </span>
                      <p className="text-sm text-gray-700">{data.analysisReport.generatedContent.carrotMarketAd}</p>
                    </div>

                    {/* Image Generation Prompt */}
                    <div className="bg-gray-800 p-4 rounded-md shadow-sm border border-gray-700 text-white">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                          <ImageIcon size={12} /> 배너 생성 프롬프트 (Nano Banana Pro)
                        </span>
                        <button
                          onClick={() => handleGenerateImage('banner')}
                          disabled={isBannerGenerating}
                          className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-[10px] font-bold hover:bg-yellow-300 transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {isBannerGenerating ? (
                            <div className="w-2 h-2 border border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                          ) : <Sparkles size={10} />}
                          이미지 생성하기
                        </button>
                      </div>
                      <p className="text-xs font-mono opacity-80 break-all mb-2">
                        {data.analysisReport.generatedContent.imageGenerationPrompt}
                      </p>

                      {bannerImage && (
                        <div className="mt-4 rounded-lg overflow-hidden border border-gray-600 bg-black/20">
                          <img 
                            src={bannerImage} 
                            alt="AI Generated Banner" 
                            className="w-full h-auto"
                            referrerPolicy="no-referrer"
                          />
                          <div className="bg-gray-900/50 p-2 flex justify-between items-center">
                            <span className="text-[10px] text-gray-400">Nano Banana Pro 생성 결과</span>
                            <button 
                              onClick={() => setBannerImage(null)}
                              className="text-[10px] text-red-400 hover:text-red-300"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 네이버 플레이스 종합 진단 */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: themeColor }}>
                  <div className="bg-white p-2 rounded shadow-sm"><Activity size={20} /></div> 네이버 플레이스 종합 진단
                </h3>
                <div className="flex flex-col gap-2">
                  {[
                    { label: '대표사진', value: data.analysisReport.placeDiagnosis?.profile },
                    { label: '대표키워드', value: data.analysisReport.placeDiagnosis?.keywords },
                    { label: '소개/오시는길', value: data.analysisReport.placeDiagnosis?.intro },
                    { label: '알림/이벤트 세팅', value: data.analysisReport.placeDiagnosis?.notification },
                    { label: '상품(메뉴) 세팅', value: data.analysisReport.placeDiagnosis?.menu },
                    { label: '예약 세팅', value: data.analysisReport.placeDiagnosis?.reservation },
                    { label: '영수증 리뷰 현황', value: data.analysisReport.placeDiagnosis?.reviews },
                    { label: '블로그 노출 현황', value: data.analysisReport.placeDiagnosis?.blog },
                    { label: '지역 커뮤니티 노출', value: data.analysisReport.placeDiagnosis?.community },
                    { label: '외부채널(인스타 등)', value: data.analysisReport.placeDiagnosis?.external },
                  ].map((item, idx) => (
                    <div key={idx} className="flex bg-white border border-gray-100 rounded-md overflow-hidden shadow-sm">
                      <div className="w-36 bg-gray-100 p-3 font-bold text-gray-700 flex items-center justify-center text-center text-sm border-r border-gray-200 shrink-0">
                        {item.label}
                      </div>
                      <div className="p-3 text-gray-600 text-sm flex-1 flex items-center">
                        {item.value || "분석 대기 중"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* [신규] 감성 분석 (리뷰 분석) */}
              <section className="bg-amber-50 rounded-[40px] p-10 border-2 border-amber-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Lightbulb size={120} className="text-amber-500" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <Search className="text-amber-600" size={24} />
                    <h3 className="text-2xl font-black tracking-tight text-amber-900">Voice of Customer & Consulting</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> Positive Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {data.analysisReport.sentimentAnalysis?.positive?.map((word, i) => (
                          <span key={i} className="px-3 py-1.5 bg-white border border-emerald-100 rounded-xl text-xs font-bold text-emerald-700 shadow-sm">#{word}</span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" /> Negative Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {data.analysisReport.sentimentAnalysis?.negative?.map((word, i) => (
                          <span key={i} className="px-3 py-1.5 bg-white border border-red-100 rounded-xl text-xs font-bold text-red-700 shadow-sm">#{word}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 border border-amber-200">
                    <h4 className="text-amber-900 font-black mb-3">💡 비즈니스 컨설턴트 제언</h4>
                    <p className="text-sm text-amber-800 leading-relaxed mb-6 font-medium">"{data.analysisReport.sentimentAnalysis?.customerVibe}"</p>
                    <div className="grid grid-cols-1 gap-3">
                      {data.analysisReport.sentimentAnalysis?.consulting_tips?.map((tip, i) => (
                        <div key={i} className="flex items-center gap-3 bg-amber-100/50 p-3 rounded-xl text-xs font-bold text-amber-900">
                          <div className="w-5 h-5 bg-amber-600 text-white rounded-full flex items-center justify-center shrink-0">{i+1}</div>
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* 키워드 노출 전략 */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: themeColor }}>
                  <div className="bg-white p-2 rounded shadow-sm"><TrendingUp size={20} /></div> 키워드 노출 전략
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 메인 키워드 */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="bg-slate-800 text-white px-4 py-3 font-bold text-sm flex justify-between items-center">
                      <span>메인 키워드 타겟팅 현황</span>
                      <span className="text-[10px] bg-slate-700 px-2 py-1 rounded">PC / Mobile 합산</span>
                    </div>
                    <div className="flex bg-slate-50 text-[11px] font-black text-slate-500 border-b border-gray-200">
                      <div className="flex-1 p-3 text-center border-r border-gray-200">키워드</div>
                      <div className="w-24 p-3 text-center border-r border-gray-200">현재 순위</div>
                      <div className="w-32 p-3 text-center">월간 검색량</div>
                    </div>
                    {data.analysisReport.keywordStrategy?.mainKeywords?.length > 0 ? (
                      data.analysisReport.keywordStrategy.mainKeywords.map((kw, idx) => (
                        <div key={idx} className="flex text-sm border-b border-gray-100 last:border-0 hover:bg-slate-50 transition-colors">
                          <div className="flex-1 p-3 flex items-center border-r border-gray-100 text-slate-700 font-bold">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
                            {kw.keyword}
                          </div>
                          <div className="w-24 p-3 flex justify-center items-center border-r border-gray-100">
                            <span className={`px-2 py-1 text-[11px] font-bold rounded-full ${
                              kw.ranking && parseInt(kw.ranking) <= 5 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {kw.ranking || '순위 밖'}
                            </span>
                          </div>
                          <div className="w-32 p-3 text-center text-slate-600 font-medium flex flex-col justify-center">
                            {kw.volume}
                            <div className="flex justify-center gap-2 mt-1 text-[9px] text-gray-400">
                              <span>PC 30%</span><span>MO 70%</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-400 text-xs">데이터 없음</div>
                    )}
                  </div>

                  {/* 확장 키워드 */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="bg-slate-800 text-white px-4 py-3 font-bold text-sm flex justify-between items-center">
                      <span>확장 키워드 노출 전략</span>
                      <span className="text-[10px] bg-slate-700 px-2 py-1 rounded">PC / Mobile 합산</span>
                    </div>
                    <div className="flex bg-slate-50 text-[11px] font-black text-slate-500 border-b border-gray-200">
                      <div className="flex-1 p-3 text-center border-r border-gray-200">키워드</div>
                      <div className="w-24 p-3 text-center border-r border-gray-200">현재 순위</div>
                      <div className="w-32 p-3 text-center">월간 검색량</div>
                    </div>
                    {data.analysisReport.keywordStrategy?.extendKeywords?.length > 0 ? (
                      data.analysisReport.keywordStrategy.extendKeywords.map((kw, idx) => (
                        <div key={idx} className="flex text-sm border-b border-gray-100 last:border-0 hover:bg-slate-50 transition-colors">
                          <div className="flex-1 p-3 flex items-center border-r border-gray-100 text-slate-700 font-bold">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                            {kw.keyword}
                          </div>
                          <div className="w-24 p-3 flex justify-center items-center border-r border-gray-100">
                            <span className={`px-2 py-1 text-[11px] font-bold rounded-full ${
                              kw.ranking && parseInt(kw.ranking) <= 5 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {kw.ranking || '순위 밖'}
                            </span>
                          </div>
                          <div className="w-32 p-3 text-center text-slate-600 font-medium flex flex-col justify-center">
                            {kw.volume}
                            <div className="flex justify-center gap-2 mt-1 text-[9px] text-gray-400">
                              <span>PC 30%</span><span>MO 70%</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-400 text-xs">데이터 없음</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: themeColor }}>
                  <div className="bg-white p-2 rounded shadow-sm"><Target size={20} /></div> 가망 고객 세밀 분석
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* 성별 비율 차트 */}
                  <div className="bg-white p-5 border border-gray-100 rounded-xl shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-4 text-sm flex justify-between">
                      <span>성별 비중</span>
                      <span className="text-indigo-600">남 {data.analysisReport.targetCustomer?.genderRatio?.male}% / 여 {data.analysisReport.targetCustomer?.genderRatio?.female}%</span>
                    </h4>
                    <div className="w-full flex h-4 rounded-full overflow-hidden mb-2">
                      <div className="bg-blue-500 h-full" style={{ width: `${data.analysisReport.targetCustomer?.genderRatio?.male}%` }}></div>
                      <div className="bg-pink-400 h-full" style={{ width: `${data.analysisReport.targetCustomer?.genderRatio?.female}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 font-bold mt-1">
                      <span className="text-blue-600">남성</span>
                      <span className="text-pink-500">여성</span>
                    </div>
                  </div>

                  {/* 연령별 차트 */}
                  <div className="bg-white p-5 border border-gray-100 rounded-xl shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-4 text-sm flex justify-between">
                      <span>주요 연령대</span>
                      <span className="text-indigo-600">
                        {Math.max(
                          data.analysisReport.targetCustomer?.ageRatio?.["2030"] || 0,
                          data.analysisReport.targetCustomer?.ageRatio?.["4050"] || 0,
                          data.analysisReport.targetCustomer?.ageRatio?.["60_plus"] || 0
                        ) === data.analysisReport.targetCustomer?.ageRatio?.["2030"] ? "2030세대 집중" : 
                         Math.max(
                          data.analysisReport.targetCustomer?.ageRatio?.["2030"] || 0,
                          data.analysisReport.targetCustomer?.ageRatio?.["4050"] || 0,
                          data.analysisReport.targetCustomer?.ageRatio?.["60_plus"] || 0
                        ) === data.analysisReport.targetCustomer?.ageRatio?.["4050"] ? "4050세대 집중" : "60대 이상 집중"}
                      </span>
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[10px] mb-1"><span>20~30대</span><span className="font-bold">{data.analysisReport.targetCustomer?.ageRatio?.["2030"]}%</span></div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full" style={{ width: `${data.analysisReport.targetCustomer?.ageRatio?.["2030"]}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] mb-1"><span>40~50대</span><span className="font-bold">{data.analysisReport.targetCustomer?.ageRatio?.["4050"]}%</span></div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-400 h-full" style={{ width: `${data.analysisReport.targetCustomer?.ageRatio?.["4050"]}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] mb-1"><span>60대 이상</span><span className="font-bold">{data.analysisReport.targetCustomer?.ageRatio?.["60_plus"]}%</span></div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-300 h-full" style={{ width: `${data.analysisReport.targetCustomer?.ageRatio?.["60_plus"]}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 요일별 방문 트렌드 */}
                  <div className="bg-white p-5 border border-gray-100 rounded-xl shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-4 text-sm">요일별 방문 트렌드</h4>
                    <div className="flex items-end justify-between h-16 gap-1">
                      {['월', '화', '수', '목', '금', '토', '일'].map((day) => {
                        const isPeak = data.analysisReport.targetCustomer?.peakDays?.includes(day);
                        const height = isPeak ? '100%' : '40%';
                        return (
                          <div key={day} className="flex flex-col items-center flex-1 gap-1">
                            <div className={`w-full rounded-t-sm ${isPeak ? 'bg-indigo-500' : 'bg-gray-300'}`} style={{ height }}></div>
                            <span className={`text-[10px] ${isPeak ? 'font-bold text-indigo-700' : 'text-gray-500'}`}>{day}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="bg-indigo-50 p-4 border border-indigo-100 rounded-md">
                  <h4 className="font-bold text-indigo-900 mb-1 text-sm">💡 타겟 공략 인사이트</h4>
                  <p className="text-indigo-800 leading-relaxed text-sm">
                    {data.analysisReport.targetCustomer?.summary || "타겟 고객 분석 내용이 이곳에 표시됩니다."}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: themeColor }}>
                  <div className="bg-white p-2 rounded shadow-sm"><Search size={20} /></div> 심층 경쟁사 분석
                </h3>
                <div className="space-y-4">
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md">
                    <span className="text-xs font-bold text-red-400 block mb-1">파악된 주변 경쟁사</span>
                    <p className="text-sm font-bold text-red-700">{data.analysisReport.competitorAnalysis?.realCompetitors || "분석 대기 중"}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-1">주요 마케팅 채널</h4>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{data.analysisReport.competitorAnalysis?.channels || "분석 대기 중"}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-1">핵심 메시지 (Messaging)</h4>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{data.analysisReport.competitorAnalysis?.messaging || "분석 대기 중"}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-1">가격 및 프로모션 전략</h4>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{data.analysisReport.competitorAnalysis?.pricing || "분석 대기 중"}</p>
                  </div>
                </div>
              </div>

              {/* 7. [신규] 경쟁사 배틀 카드 섹션 */}
              <section className="mt-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-red-600 text-white p-2 rounded-lg shadow-lg">
                    <Target size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                      상위 5개 경쟁사 배틀 카드
                    </h3>
                    <p className="text-xs text-red-600 font-bold uppercase tracking-widest">
                      실시간 상권 점유율 및 디지털 화력 비교 분석
                    </p>
                  </div>
                </div>
                <div className="bg-white border-[3px] border-slate-900 rounded-[40px] overflow-hidden shadow-[15px_15px_0px_#f8fafc,15px_15px_0px_2px_#0f172a]">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white border-b-2 border-slate-900">
                        <th className="py-5 px-4 text-left font-black tracking-widest uppercase border-r border-slate-700">Competitor</th>
                        <th className="py-5 px-4 text-center font-black border-r border-slate-700">리뷰 화력</th>
                        <th className="py-5 px-4 text-center font-black border-r border-slate-700">블로그 지수</th>
                        <th className="py-5 px-4 text-center font-black border-r border-slate-700">상단 노출</th>
                        <th className="py-5 px-4 text-left font-black bg-red-600 text-white">공격 포인트 (Weakness)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-200">
                      {data.analysisReport.competitorBattleCard?.slice(0, 6).map((item, idx) => {
                        const isMine = item.storeName.includes("우리") || idx === 0;
                        return (
                          <tr key={idx} className={`${isMine ? 'bg-indigo-50/80' : 'bg-white'} hover:bg-slate-50 transition-colors`}>
                            <td className="py-4 px-4 font-black border-r border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${isMine ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                                  {idx + 1}
                                </span>
                                {item.storeName}
                                {isMine && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full animate-pulse">우리 매장</span>}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center border-r border-slate-100 font-bold text-slate-600">{item.reviews}개</td>
                            <td className="py-4 px-4 text-center border-r border-slate-100 font-bold text-slate-600">{item.blogs}개</td>
                            <td className={`py-4 px-4 text-center border-r border-slate-100 font-black ${item.status === 'danger' ? 'text-red-500' : 'text-emerald-500'}`}>
                              {item.keywords}
                            </td>
                            <td className="py-4 px-4 text-xs font-bold text-red-700 leading-tight">
                              • {item.weakness}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-between items-center px-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                    * 데이터 소스: 네이버 플레이스 & 구글 검색 실시간 트래픽 분석 (2026 기준)
                  </p>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div><span className="text-[10px] font-bold">안전</span></div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div><span className="text-[10px] font-bold">위험/미흡</span></div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setIsCompetitorModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} /> 경쟁사 직접 추가
                  </button>
                </div>
              </section>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: themeColor }}>
                  <div className="bg-white p-2 rounded shadow-sm"><Lightbulb size={20} /></div> 맞춤형 마케팅 전략
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{data.analysisReport.marketingStrategy || "분석 대기 중"}</p>
              </div>

              {/* 4. [업그레이드] 세분화된 마케팅 패키지 제안 UI */}
              <TieredPackageService packages={data.analysisReport.tieredPackages || []} />

              {/* 4-2. [신규] 전용 마케팅 패키지 및 AI 혜택 섹션 */}
              <MarketingPackageSection 
                packages={data.analysisReport.tieredPackages || []} 
                data={data} 
              />

              {/* 5. [신규] 성과 예측(ROI) 시뮬레이션 UI */}
              <div className="mt-10 bg-gray-900 text-white p-8 rounded-2xl">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-400">
                  <BarChart3 size={20} /> 3개월 후 예상 성과 시뮬레이션
                </h3>
                <div className="space-y-8">
                  {data.analysisReport.roiForecast?.length > 0 ? (
                    data.analysisReport.roiForecast.map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{item.metric}</span>
                          <span className="text-indigo-400 font-bold">약 {item.growthRate} 성장 예상</span>
                        </div>
                        <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
                          {/* 현재 수치 바 */}
                          <div className="absolute top-0 left-0 h-full bg-gray-500 transition-all duration-1000" style={{ width: '20%' }}></div>
                          {/* 예측 수치 바 */}
                          <div className="absolute top-0 left-0 h-full bg-indigo-500 opacity-60 transition-all duration-1000" style={{ width: '85%' }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400">
                          <span>현재: {(Number(item.current) || 0).toLocaleString()}</span>
                          <span>3개월 후: {(Number(item.afterThreeMonths) || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">성과 예측 데이터가 없습니다.</div>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 mt-6 text-center">*본 수치는 지역 평균 데이터 및 검색량을 기반으로 한 예측치로 실제와 다를 수 있습니다.</p>
              </div>

              {/* 6. [신규] AI 마케팅 시안 제작 */}
              <AISianGenerator 
                analysisData={data}
                isGenerating={isImageGenerating}
                onGenerate={handleGenerateImage}
                generatedImage={generatedImage}
                setGeneratedImage={setGeneratedImage}
              />

              {/* 7. [신규] AI 자동 생성 마케팅 콘텐츠 */}
              {data.analysisReport.generatedContent && (
                <AutoContentSection 
                  contents={{
                    instaCaptions: data.analysisReport.generatedContent.instagramFeeds,
                    blogTitles: data.analysisReport.generatedContent.blogTitles,
                    localAdCopy: data.analysisReport.generatedContent.carrotMarketAd,
                    imagePrompt: data.analysisReport.generatedContent.imageGenerationPrompt
                  }} 
                  onGenerateBanner={() => handleGenerateImage('banner')}
                  isBannerGenerating={isBannerGenerating}
                  bannerImage={bannerImage}
                  onDeleteBanner={() => setBannerImage(null)}
                />
              )}
            </div>
            
            {/* Footer */}
            <div className="absolute bottom-[30px] left-[30px] right-[30px]">
              <div className="mt-4 text-[10px] text-gray-500 border-t border-gray-200 pt-3 text-center">
                <p>{data.companyName} | {data.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Settings Modal is now handled by the SettingsModal component at the bottom */}

      {/* Competitor Manual Add Modal */}
      {isCompetitorModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-[450px] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-indigo-50">
              <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                <Target size={18} /> 경쟁사 분석 및 추가
              </h3>
              <button onClick={closeCompetitorModal} className="text-gray-500 hover:text-gray-800">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              
              {/* [업그레이드] URL 및 매장명 자동 분석 영역 */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 shadow-inner">
                <label className="block text-xs font-black text-indigo-700 mb-2 flex items-center gap-1">
                  <Wand2 size={14}/> AI 자동 분석 (정확도 향상)
                </label>
                <div className="flex flex-col gap-2">
                  <input 
                    type="text" 
                    value={competitorName}
                    onChange={e => setCompetitorName(e.target.value)}
                    placeholder="경쟁사 매장명 (예: 연무동 A모바일)"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={competitorUrl}
                      onChange={e => setCompetitorUrl(e.target.value)}
                      placeholder="네이버 플레이스 URL (선택)"
                      className="flex-1 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-500"
                    />
                    <button 
                      onClick={analyzeCompetitor}
                      disabled={isCompetitorAnalyzing}
                      className="bg-indigo-600 text-white px-5 rounded-lg text-sm font-bold whitespace-nowrap hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-md transition-all active:scale-95"
                    >
                      {isCompetitorAnalyzing ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : "분석 시작"}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  * 매장명만 입력해도 AI가 구글링을 통해 대략적인 수치를 잡아옵니다.
                </p>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs text-gray-400 font-bold">또는 직접 입력</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">매장명 <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={newCompetitor.storeName}
                  onChange={e => setNewCompetitor({...newCompetitor, storeName: e.target.value})}
                  placeholder="예: 경쟁사 A 모바일"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">리뷰 수</label>
                  <input 
                    type="text" 
                    value={newCompetitor.reviews}
                    onChange={e => setNewCompetitor({...newCompetitor, reviews: e.target.value})}
                    placeholder="예: 120"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">블로그 수</label>
                  <input 
                    type="text" 
                    value={newCompetitor.blogs}
                    onChange={e => setNewCompetitor({...newCompetitor, blogs: e.target.value})}
                    placeholder="예: 45"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">키워드 노출 상태</label>
                <input 
                  type="text" 
                  value={newCompetitor.keywords}
                  onChange={e => setNewCompetitor({...newCompetitor, keywords: e.target.value})}
                  placeholder="예: 상위 노출 / 노출 미미"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">위협 수준</label>
                <div className="flex gap-2">
                  {['normal', 'warning', 'danger'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setNewCompetitor({...newCompetitor, status: status as any})}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize border-2 transition-all ${
                        newCompetitor.status === status 
                          ? status === 'danger' ? 'border-red-500 bg-red-50 text-red-600'
                          : status === 'warning' ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-emerald-500 bg-emerald-50 text-emerald-600'
                          : 'border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      {status === 'danger' ? '위험' : status === 'warning' ? '경계' : '일반'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">공략 포인트 (약점)</label>
                <input 
                  type="text" 
                  value={newCompetitor.weakness}
                  onChange={e => setNewCompetitor({...newCompetitor, weakness: e.target.value})}
                  placeholder="예: 불친절, 주차 불편"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
              <button 
                onClick={closeCompetitorModal}
                className="px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                취소
              </button>
              <button 
                onClick={addCompetitorManual}
                className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                추가하기
              </button>
            </div>
          </div>
        </div>
      )}

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onKeysUpdated={() => {}}
      />
    </div>
  );
}
