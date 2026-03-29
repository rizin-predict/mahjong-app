import type { ScoringInput, ScoringResult } from "./types";
/**
 * 手牌と条件から役・符・点数を計算して返す。
 *
 * @example
 * ```ts
 * const result = calcScore({
 *   tiles: ["1m","2m","3m","4m","5m","6m","7m","8m","9m","1z","1z","1z","5z","5z"],
 *   winningTile: "9m",
 *   isTsumo: true,
 *   seatWind: 1,
 *   roundWind: 1,
 * });
 * console.log(result.yaku, result.han, result.fu, result.payment);
 * ```
 */
export declare function calcScore(input: ScoringInput): ScoringResult;
export { fuHanLabel } from "./score";
export type { ScoringInput, ScoringResult, Payment, Wind } from "./types";
//# sourceMappingURL=index.d.ts.map