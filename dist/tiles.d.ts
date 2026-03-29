import type { Tile } from "./types";
/**
 * 牌名文字列を Tile オブジェクトに変換する。
 * 例: "1m" -> { suit:"man", value:1, name:"1m" }
 *     "7z" -> { suit:"honor", value:7, name:"7z" }
 */
export declare function parseTile(name: string): Tile;
export declare function parseTiles(names: string[]): Tile[];
/** 2枚の牌を比較 (ソート用) */
export declare function compareTiles(a: Tile, b: Tile): number;
export declare function sortTiles(tiles: Tile[]): Tile[];
/** 同じ牌か */
export declare function sameTile(a: Tile, b: Tile): boolean;
/** 字牌か */
export declare function isHonor(tile: Tile): boolean;
/** 老頭牌 (1・9・字牌) か */
export declare function isYaochuu(tile: Tile): boolean;
/** 中張牌 (2-8の数牌) か */
export declare function isTanyao(tile: Tile): boolean;
/** 三元牌か (白=5z, 發=6z, 中=7z) */
export declare function isSangen(tile: Tile): boolean;
/** 風牌か (東=1z, 南=2z, 西=3z, 北=4z) */
export declare function isKaze(tile: Tile): boolean;
/** 緑色の牌か (緑一色用: 2s,3s,4s,6s,8s,6z) */
export declare function isGreen(tile: Tile): boolean;
/** ドラ表示牌から実際のドラ牌を返す */
export declare function doraFromIndicator(indicator: Tile): Tile;
/** 手牌のドラ枚数を数える */
export declare function countDora(tiles: Tile[], doraIndicators: Tile[]): number;
export declare const KOKUSHI_TILES: string[];
//# sourceMappingURL=tiles.d.ts.map