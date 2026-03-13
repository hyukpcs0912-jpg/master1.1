import React from 'react';

type Package = {
  name: string;
  price: string;
  target: string;
  isRecommended?: boolean;
};

interface MarketingPackageSectionProps {
  packages: Package[];
  data?: any;
}

const MarketingPackageSection: React.FC<MarketingPackageSectionProps> = ({ packages, data }) => {
  return (
    <div className="mt-10 border-2 border-indigo-600 rounded-3xl overflow-hidden bg-white shadow-xl">
      <div className="bg-indigo-600 p-4">
        <h2 className="text-white text-xl font-black text-center">전용 마케팅 패키지 제안</h2>
      </div>
      
      {/* 패키지 카드 섹션 (에디터 연동) */}
      <div className="grid grid-cols-3 gap-0 divide-x divide-indigo-100">
        {packages.slice(0, 3).map((pkg, idx) => (
          <div key={idx} className="p-6 text-center hover:bg-indigo-50 transition-colors">
            <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase mb-2 inline-block">
              {pkg.target}
            </span>
            <h3 className="text-lg font-black text-slate-800">{pkg.name}</h3>
            <p className="text-xl font-black text-indigo-700 mt-2">{pkg.price}원</p>
          </div>
        ))}
      </div>

      {/* 무조건 포함되는 독점 혜택 섹션 */}
      <div className="bg-slate-900 p-6 text-center border-t-4 border-yellow-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="animate-bounce">🎁</span>
          <h4 className="text-yellow-400 font-black text-lg">특별 무상 지원 및 혜택</h4>
          <span className="animate-bounce">🔥</span>
        </div>
        <p className="text-white font-bold leading-relaxed text-sm md:text-base">
          자사 개발 <span className="text-yellow-400">[네이버 블로그 자동 생성 AI 프로그램]</span> 평생 라이선스<br/>
          <span className="text-indigo-300">특별 혜택: 1계정 (사용 횟수 무제한 제공)</span>
        </p>
      </div>
    </div>
  );
};

export default MarketingPackageSection;
