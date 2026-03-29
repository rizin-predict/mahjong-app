"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decomposeNormal = decomposeNormal;
exports.decomposeChiitoitsu = decomposeChiitoitsu;
exports.decomposeKokushi = decomposeKokushi;
exports.getAllDecompositions = getAllDecompositions;
const tiles_1 = require("./tiles");
// ---- ユーティリティ --------------------------------------------------------
/** tiles から指定インデックスの牌を除いたコピーを返す */
function removeTileAt(tiles, index) {
    return [...tiles.slice(0, index), ...tiles.slice(index + 1)];
}
/** ソート済み tiles から同じ牌を n 枚取り除く (先頭から) */
function removeFirst(tiles, target, count) {
    const result = [...tiles];
    for (let i = 0; i < count; i++) {
        const idx = result.findIndex((t) => (0, tiles_1.sameTile)(t, target));
        if (idx === -1)
            return null;
        result.splice(idx, 1);
    }
    return result;
}
// ---- 通常手の分解 ----------------------------------------------------------
/**
 * ソート済みの手牌を再帰的に面子に分解する。
 * @returns 分解できるすべての面子リストの配列 (重複あり得る)
 */
function decomposeToMentsu(tiles) {
    if (tiles.length === 0)
        return [[]];
    if (tiles.length % 3 !== 0)
        return [];
    const results = [];
    const first = tiles[0];
    // --- 刻子 (同じ牌3枚) ---
    const afterKoutsu = removeFirst(tiles, first, 3);
    if (afterKoutsu) {
        const koutsu = {
            type: "koutsu",
            tiles: [first, first, first],
            isOpen: false,
        };
        for (const rest of decomposeToMentsu(afterKoutsu)) {
            results.push([koutsu, ...rest]);
        }
    }
    // --- 順子 (連続する3枚の数牌) ---
    if (first.suit !== "honor") {
        const second = tiles.find((t) => t.suit === first.suit && t.value === first.value + 1);
        const third = tiles.find((t) => t.suit === first.suit && t.value === first.value + 2);
        if (second && third) {
            let remaining = [...tiles];
            // first を削除
            remaining.splice(remaining.findIndex((t) => (0, tiles_1.sameTile)(t, first)), 1);
            // second を削除
            remaining.splice(remaining.findIndex((t) => (0, tiles_1.sameTile)(t, second)), 1);
            // third を削除
            remaining.splice(remaining.findIndex((t) => (0, tiles_1.sameTile)(t, third)), 1);
            const shuntsu = {
                type: "shuntsu",
                tiles: [first, second, third],
                isOpen: false,
            };
            for (const rest of decomposeToMentsu(remaining)) {
                results.push([shuntsu, ...rest]);
            }
        }
    }
    return results;
}
/**
 * 通常手 (4面子1雀頭) の全分解を返す。
 * 重複を除いてユニークな分解を返す。
 */
function decomposeNormal(tiles) {
    const sorted = (0, tiles_1.sortTiles)(tiles);
    const results = [];
    const seen = new Set();
    // 各牌を雀頭候補として試す
    for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i];
        const b = sorted[i + 1];
        if (!(0, tiles_1.sameTile)(a, b))
            continue;
        // 同じ雀頭候補が連続する場合はスキップ (重複除去)
        if (i > 0 && (0, tiles_1.sameTile)(sorted[i - 1], a))
            continue;
        // 雀頭を除いた残り12枚
        let rest = [...sorted];
        rest.splice(i, 1);
        rest.splice(i, 1); // i番目を2回削除 (元のi+1が詰まって今はiに)
        const jantai = { type: "jantai", tiles: [a, b], isOpen: false };
        for (const mentsuList of decomposeToMentsu(rest)) {
            if (mentsuList.length !== 4)
                continue;
            // 重複チェック用キー
            const key = serializeDecomposition(mentsuList, jantai);
            if (seen.has(key))
                continue;
            seen.add(key);
            results.push({ kind: "normal", mentsuList, jantai });
        }
    }
    return results;
}
function serializeDecomposition(mentsuList, jantai) {
    const serMentsu = (m) => `${m.type}:${m.tiles.map((t) => t.name).join(",")}`;
    return [
        serMentsu(jantai),
        ...mentsuList.map(serMentsu).sort(),
    ].join("|");
}
// ---- 七対子 ----------------------------------------------------------------
function decomposeChiitoitsu(tiles) {
    if (tiles.length !== 14)
        return null;
    const sorted = (0, tiles_1.sortTiles)(tiles);
    const pairs = [];
    let i = 0;
    while (i < sorted.length) {
        if (i + 1 < sorted.length && (0, tiles_1.sameTile)(sorted[i], sorted[i + 1])) {
            // 同じ牌が3枚以上連続していたら七対子不成立 (4枚は対子2つとして扱わない)
            if (i + 2 < sorted.length && (0, tiles_1.sameTile)(sorted[i], sorted[i + 2])) {
                return null; // 3枚以上は七対子不可
            }
            pairs.push([sorted[i], sorted[i + 1]]);
            i += 2;
        }
        else {
            return null;
        }
    }
    if (pairs.length !== 7)
        return null;
    return { kind: "chiitoitsu", pairs };
}
// ---- 国士無双 --------------------------------------------------------------
function decomposeKokushi(tiles) {
    if (tiles.length !== 14)
        return null;
    const requiredNames = new Set(tiles_1.KOKUSHI_TILES);
    const tileNames = tiles.map((t) => t.name);
    // 13種の幺九牌がすべて揃っているか
    for (const req of requiredNames) {
        if (!tileNames.includes(req))
            return null;
    }
    return { kind: "kokushi", tiles };
}
// ---- 全分解の取得 ----------------------------------------------------------
/**
 * 14枚の手牌からすべての有効な分解を返す。
 * 通常手・七対子・国士無双を網羅する。
 */
function getAllDecompositions(tiles) {
    const results = [];
    // 通常手
    results.push(...decomposeNormal(tiles));
    // 七対子
    const chiitoi = decomposeChiitoitsu(tiles);
    if (chiitoi)
        results.push(chiitoi);
    // 国士無双
    const kokushi = decomposeKokushi(tiles);
    if (kokushi)
        results.push(kokushi);
    return results;
}
//# sourceMappingURL=decompose.js.map