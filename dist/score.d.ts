import type { Payment } from "./types";
/**
 * 基本点 = 符 × 2^(翻+2)
 * 役満は固定: 8000点 (親12000, 子6000×3)
 */
export declare function calcBasicPoints(han: number, fu: number): number;
/**
 * 子のツモあがり: 親は2倍払い, 子は1倍払い
 * 親のツモあがり: 全員が同額払い
 * ロン: あがり点数 = 基本点 × 4 (親) or × 6 (子, 親からは×6)
 */
export declare function calcPayment(basicPoints: number, isDealer: boolean, isTsumo: boolean): Payment;
export declare function hanLabel(han: number): string;
export declare function fuHanLabel(han: number, fu: number): string;
//# sourceMappingURL=score.d.ts.map