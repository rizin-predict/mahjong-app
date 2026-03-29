import type { Payment } from "./types";

// ============================================================
// 基本点計算
// ============================================================

/**
 * 基本点 = 符 × 2^(翻+2)
 * 役満: 8000 × yakumanMultiplier
 */
export function calcBasicPoints(han: number, fu: number, yakumanMultiplier?: number): number {
  if (yakumanMultiplier !== undefined && yakumanMultiplier > 0) {
    return 8000 * yakumanMultiplier;
  }

  const mangan = 2000;
  const haneman = 3000;
  const baiman = 4000;
  const sanbaiman = 6000;
  const yakuman = 8000;

  if (han >= 13) return yakuman;
  if (han >= 11) return sanbaiman;
  if (han >= 8) return baiman;
  if (han >= 6) return haneman;

  const basic = fu * Math.pow(2, han + 2);
  if (han >= 5 || basic >= mangan) return mangan;

  return basic;
}

function roundUp100(n: number): number {
  return Math.ceil(n / 100) * 100;
}

// ============================================================
// 支払い計算
// ============================================================

export function calcPayment(
  basicPoints: number,
  isDealer: boolean,
  isTsumo: boolean
): Payment {
  if (isTsumo) {
    if (isDealer) {
      // 親ツモ: 子全員から基本点×2
      const each = roundUp100(basicPoints * 2);
      return { dealerTsumo: { all: each } };
    } else {
      // 子ツモ: 親から基本点×2, 子から基本点×1
      const dealer = roundUp100(basicPoints * 2);
      const nonDealer = roundUp100(basicPoints);
      return { nonDealerTsumo: { dealer, nonDealer } };
    }
  } else {
    if (isDealer) {
      // 親ロン: 基本点×6
      return { ron: roundUp100(basicPoints * 6) };
    } else {
      // 子ロン: 基本点×4
      return { ron: roundUp100(basicPoints * 4) };
    }
  }
}

// ============================================================
// 表示ラベル
// ============================================================

function yakumanLabel(multiplier: number): string {
  if (multiplier <= 1) return "役満";
  if (multiplier === 2) return "ダブル役満";
  if (multiplier === 3) return "トリプル役満";
  return `${multiplier}倍役満`;
}

export function fuHanLabel(han: number, fu: number, yakumanMultiplier?: number): string {
  if (yakumanMultiplier !== undefined && yakumanMultiplier > 0) {
    return yakumanLabel(yakumanMultiplier);
  }
  if (han >= 13) return "役満";
  if (han >= 11) return "三倍満";
  if (han >= 8) return "倍満";
  if (han >= 6) return "跳満";
  if (han >= 5) return "満貫";
  const basic = fu * Math.pow(2, han + 2);
  if (basic >= 2000) return "満貫";
  return `${fu}符${han}翻`;
}
