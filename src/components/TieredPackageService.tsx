import React from 'react';

type Package = {
  name: string;
  price: string;
  target: string;
  isRecommended?: boolean;
};

interface TieredPackageServiceProps {
  packages: Package[];
}

const TieredPackageService: React.FC<TieredPackageServiceProps> = ({ packages }) => {
  return (
    <div className="grid grid-cols-4 divide-x-2 divide-slate-100 border-t-2 border-slate-900">
      {/* 카테고리 열 (고정) */}
      <div className="bg-slate-50 flex flex-col font-bold text-slate-600 text-[11px] text-center divide-y divide-slate-200">
        <div className="h-28 flex items-center justify-center bg-slate-100 uppercase tracking-widest text-xs">구분</div>
        <div className="py-4 flex-1 flex items-center justify-center">N플레이스 최적화</div>
        <div className="py-4 flex-1 flex items-center justify-center">N플레이스 리뷰</div>
        <div className="py-4 flex-1 flex items-center justify-center">블로그/SNS</div>
        <div className="py-4 flex-1 flex items-center justify-center">타겟 인사이트</div>
      </div>

      {/* 에디터와 연동된 패키지 열 (실시간 반영) */}
      {packages?.map((pkg, idx) => (
        <div key={idx} className={`flex flex-col text-center divide-y divide-slate-100 ${pkg.isRecommended ? 'bg-indigo-50/30' : 'bg-white'}`}>
          <div className="h-28 p-4 flex flex-col justify-center items-center">
            {/* 에디터의 'pkg.name'과 연동 */}
            <h4 className="font-black text-lg text-slate-800">{pkg.name}</h4>
            <div className="text-sm font-black mt-1 text-indigo-700">월 {pkg.price}원</div>
          </div>
          <div className="py-4 px-2 text-[11px] text-slate-700">사진속 최적화 세팅 포함</div>
          <div className="py-4 px-2 text-[11px] text-slate-700">리뷰 지원 (에디터 연동)</div>
          <div className="py-4 px-2 text-[11px] text-slate-700">체험단/릴스 구성</div>
          {/* 에디터의 'pkg.target'과 연동 */}
          <div className="py-4 px-2 text-[11px] font-bold text-indigo-600 bg-indigo-50/50">
            {pkg.target}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TieredPackageService;
