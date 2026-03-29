import type { Tile, NormalDecomposition, ChiitoitsuDecomposition, KokushiDecomposition, HandDecomposition } from "./types";
/**
 * 通常手 (4面子1雀頭) の全分解を返す。
 * 重複を除いてユニークな分解を返す。
 */
export declare function decomposeNormal(tiles: Tile[]): NormalDecomposition[];
export declare function decomposeChiitoitsu(tiles: Tile[]): ChiitoitsuDecomposition | null;
export declare function decomposeKokushi(tiles: Tile[]): KokushiDecomposition | null;
/**
 * 14枚の手牌からすべての有効な分解を返す。
 * 通常手・七対子・国士無双を網羅する。
 */
export declare function getAllDecompositions(tiles: Tile[]): HandDecomposition[];
//# sourceMappingURL=decompose.d.ts.map