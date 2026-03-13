import React from 'react';

export const MARKETING_SCOPE = [
  { category: "네이버 플레이스 최적화", detail: "상권 분석 기반 키워드 세팅 및 대표 사진 최적화" },
  { category: "블로그 마케팅", detail: "지역 기반 고지수 체험단 및 정보성 포스팅 배포" },
  { category: "인스타그램 운영", detail: "매장 감성을 담은 릴스 제작 및 타겟 광고 집행" },
  { category: "당근마켓 지역광고", detail: "동네 주민 타겟팅 비즈프로필 관리 및 소식 발행" }
];

interface MarketingProposalProps {
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
}

const MarketingProposal: React.FC<MarketingProposalProps> = ({ data, setData }) => {
  return (
    <section className="mt-12 p-8 bg-white border-2 border-slate-900 rounded-[40px]">
      <h3 
        className="text-2xl font-black mb-6 text-slate-900 outline-none"
        contentEditable={true}
        suppressContentEditableWarning={true}
      >
        마케팅 패키지 제안
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {MARKETING_SCOPE.map((item, idx) => (
          <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-indigo-700 outline-none" contentEditable={true} suppressContentEditableWarning={true}>{item.category}</h4>
            <p className="text-sm text-slate-600 outline-none" contentEditable={true} suppressContentEditableWarning={true}>{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MarketingProposal;
