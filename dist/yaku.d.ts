import type { Tile, NormalDecomposition, ScoringInput, Yaku } from "./types";
export declare function getYakuForNormal(decomp: NormalDecomposition, input: ScoringInput, winTile: Tile): Yaku[];
export declare function getYakuForChiitoitsu(input: ScoringInput): Yaku[];
export declare function getYakuForKokushi(_input: ScoringInput): Yaku[];
export declare function hasValidYaku(yaku: Yaku[]): boolean;
//# sourceMappingURL=yaku.d.ts.map