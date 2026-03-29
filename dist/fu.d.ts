import type { Tile, NormalDecomposition, ScoringInput } from "./types";
/**
 * 通常手の符計算
 */
export declare function calcFuNormal(decomp: NormalDecomposition, input: ScoringInput, winTile: Tile, hasPinfu: boolean): number;
/**
 * 七対子の符は固定25符
 */
export declare function calcFuChiitoitsu(): number;
/**
 * 国士の符は固定30符 (役満なので通常は使わない)
 */
export declare function calcFuKokushi(): number;
//# sourceMappingURL=fu.d.ts.map