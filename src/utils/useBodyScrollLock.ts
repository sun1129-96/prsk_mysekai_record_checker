import { useEffect } from 'react';

// 複数モーダルが同時に開く場合に対応するためのアクティブロックカウンタ
let lockCount = 0;
let originalOverflow = '';
let originalPaddingRight = '';

/**
 * ダイアログやモーダル表示時に背後のメインコンテンツのスクロールをロックするカスタムフック
 * @param isLocked ロックを有効化するかどうか
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;

    if (lockCount === 0) {
      // 現在のスタイルを退避
      originalOverflow = document.body.style.overflow;
      originalPaddingRight = document.body.style.paddingRight;

      // スクロールバー消失による横揺れ（レイアウトシフト）を防止
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      document.body.style.overflow = 'hidden';
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      }
    };
  }, [isLocked]);
}

