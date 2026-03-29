"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KOKUSHI_TILES = void 0;
exports.parseTile = parseTile;
exports.parseTiles = parseTiles;
exports.compareTiles = compareTiles;
exports.sortTiles = sortTiles;
exports.sameTile = sameTile;
exports.isHonor = isHonor;
exports.isYaochuu = isYaochuu;
exports.isTanyao = isTanyao;
exports.isSangen = isSangen;
exports.isKaze = isKaze;
exports.isGreen = isGreen;
exports.doraFromIndicator = doraFromIndicator;
exports.countDora = countDora;
// ---- パース ----------------------------------------------------------------
/**
 * 牌名文字列を Tile オブジェクトに変換する。
 * 例: "1m" -> { suit:"man", value:1, name:"1m" }
 *     "7z" -> { suit:"honor", value:7, name:"7z" }
 */
function parseTile(name) {
    const lower = name.toLowerCase().trim();
    const value = parseInt(lower.slice(0, -1), 10);
    const suitChar = lower.slice(-1);
    if (isNaN(value))
        throw new Error(`Invalid tile: ${name}`);
    let suit;
    switch (suitChar) {
        case "m":
            suit = "man";
            break;
        case "p":
            suit = "pin";
            break;
        case "s":
            suit = "sou";
            break;
        case "z":
            suit = "honor";
            break;
        default:
            throw new Error(`Invalid suit char "${suitChar}" in tile: ${name}`);
    }
    if (suit === "honor" && (value < 1 || value > 7))
        throw new Error(`Invalid honor tile value ${value}: ${name}`);
    if (suit !== "honor" && (value < 1 || value > 9))
        throw new Error(`Invalid tile value ${value}: ${name}`);
    return { suit, value, name: lower };
}
function parseTiles(names) {
    return names.map(parseTile);
}
// ---- 比較・ソート ----------------------------------------------------------
/** スート順序 */
const SUIT_ORDER = {
    man: 0,
    pin: 1,
    sou: 2,
    honor: 3,
};
/** 2枚の牌を比較 (ソート用) */
function compareTiles(a, b) {
    const so = SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
    if (so !== 0)
        return so;
    return a.value - b.value;
}
function sortTiles(tiles) {
    return [...tiles].sort(compareTiles);
}
/** 同じ牌か */
function sameTile(a, b) {
    return a.suit === b.suit && a.value === b.value;
}
// ---- 牌の性質 --------------------------------------------------------------
/** 字牌か */
function isHonor(tile) {
    return tile.suit === "honor";
}
/** 老頭牌 (1・9・字牌) か */
function isYaochuu(tile) {
    return isHonor(tile) || tile.value === 1 || tile.value === 9;
}
/** 中張牌 (2-8の数牌) か */
function isTanyao(tile) {
    return !isYaochuu(tile);
}
/** 三元牌か (白=5z, 發=6z, 中=7z) */
function isSangen(tile) {
    return tile.suit === "honor" && tile.value >= 5;
}
/** 風牌か (東=1z, 南=2z, 西=3z, 北=4z) */
function isKaze(tile) {
    return tile.suit === "honor" && tile.value <= 4;
}
/** 緑色の牌か (緑一色用: 2s,3s,4s,6s,8s,6z) */
function isGreen(tile) {
    if (tile.suit === "sou")
        return [2, 3, 4, 6, 8].includes(tile.value);
    if (tile.suit === "honor")
        return tile.value === 6; // 發
    return false;
}
// ---- ドラ計算 --------------------------------------------------------------
/** ドラ表示牌から実際のドラ牌を返す */
function doraFromIndicator(indicator) {
    if (indicator.suit === "honor") {
        // 風牌: 1->2->3->4->1, 三元牌: 5->6->7->5
        const isWind = indicator.value <= 4;
        const next = isWind
            ? ((indicator.value % 4) + 1)
            : (((indicator.value - 5) % 3) + 5);
        return { suit: "honor", value: next, name: `${next}z` };
    }
    // 数牌: 9->1
    const next = (indicator.value % 9) + 1;
    const suitChar = indicator.suit === "man" ? "m" : indicator.suit === "pin" ? "p" : "s";
    return { suit: indicator.suit, value: next, name: `${next}${suitChar}` };
}
/** 手牌のドラ枚数を数える */
function countDora(tiles, doraIndicators) {
    const doras = doraIndicators.map(doraFromIndicator);
    return tiles.reduce((count, tile) => {
        return count + doras.filter((d) => sameTile(d, tile)).length;
    }, 0);
}
// ---- 国士無双の端牌リスト --------------------------------------------------
exports.KOKUSHI_TILES = [
    "1m", "9m", "1p", "9p", "1s", "9s",
    "1z", "2z", "3z", "4z", "5z", "6z", "7z",
];
//# sourceMappingURL=tiles.js.map