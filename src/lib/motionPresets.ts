/**
 * 공통 Motion (Framer Motion) 애니메이션 프리셋
 * CLAUDE.md: "store common variants/presets in src/lib/motionPresets.ts"
 */

/** 모달 백드롭 (페이드 인/아웃) */
export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/** 모달 시트 (하단 슬라이드 인/아웃) */
export const sheetVariants = {
  hidden: { y: '100%' },
  visible: { y: 0 },
  exit: { y: '100%' },
};

/** 모달 시트 스프링 트랜지션 */
export const sheetTransition = {
  type: 'spring' as const,
  damping: 30,
  stiffness: 300,
};
