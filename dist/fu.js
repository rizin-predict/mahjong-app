"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcFuNormal = calcFuNormal;
exports.calcFuChiitoitsu = calcFuChiitoitsu;
exports.calcFuKokushi = calcFuKokushi;
const tiles_1 = require("./tiles");
// ============================================================
// 符計算
// ============================================================
/**
 * 面子の符を計算する。
 * 刻子: 中張=2, 么九=4 (副露は半分)
 * 槓子: 中張=8, 么九=16 (副露は半分)
 * 順子: 0
 */
function mentsuFu(mentsu) {
    if (mentsu.type === "shuntsu" || mentsu.type === "jantai")
        return 0;
    const tile = mentsu.tiles[0];
    const isYao = (0, tiles_1.isYaochuu)(tile);
    let base = isYao ? 4 : 2;
    // 槓は4倍 (簡易実装: openMentsuで槓を表現)
    // 暗刻は2倍
    if (!mentsu.isOpen)
        base *= 2;
    return base;
}
/**
 * 雀頭の符を計算する。
 * 役牌 (場風・自風・三元牌) は2符, それ以外は0符
 */
function jantaiFu(jantai, seatWind, roundWind) {
    const tile = jantai.tiles[0];
    if (!(0, tiles_1.isHonor)(tile))
        return 0;
    if ((0, tiles_1.isSangen)(tile))
        return 2;
    if (seatWind && tile.value === seatWind)
        return 2;
    if (roundWind && tile.value === roundWind)
        return 2;
    return 0;
}
/**
 * 待ちの符を計算する。
 * 嵌張 (カンチャン), 辺張 (ペンチャン), 単騎 = 2符
 * 双碰 (シャンポン), 両面 = 0符
 */
function matiFu(decomp, winTile) {
    // 単騎待ちか確認 (雀頭があがり牌)
    if ((0, tiles_1.sameTile)(winTile, decomp.jantai.tiles[0]))
        return 2;
    for (const m of decomp.mentsuList) {
        if (!m.tiles.some((t) => (0, tiles_1.sameTile)(t, winTile)))
            continue;
        if (m.type === "koutsu") {
            // 双碰待ち = 0符
            return 0;
        }
        // 順子の場合
        const sorted = [...m.tiles].sort((a, b) => a.value - b.value);
        const minVal = sorted[0].value;
        const maxVal = sorted[2].value;
        const midVal = sorted[1].value;
        if (winTile.value === midVal) {
            // 嵌張 = 2符
            return 2;
        }
        if ((winTile.value === minVal && maxVal === 9) ||
            (winTile.value === maxVal && minVal === 1)) {
            // 辺張 = 2符
            return 2;
        }
        // 両面 = 0符
        return 0;
    }
    return 0;
}
/**
 * 通常手の符計算
 */
function calcFuNormal(decomp, input, winTile, hasPinfu) {
    const isOpen = !!(input.openMentsu && input.openMentsu.length > 0);
    // 平和
    if (hasPinfu) {
        return input.isTsumo ? 20 : 30;
    }
    let fu = 30; // 基本符 (副露あり: 30→20は門前加符で調整)
    // 副露アガリの基本符は30 (鳴き手は基本符20+加符で30に丸め)
    if (isOpen)
        fu = 20;
    // ツモ加符
    if (input.isTsumo && !isOpen)
        fu += 2; // 門前ツモは2符 (平和以外)
    // 面子符
    for (const m of decomp.mentsuList) {
        fu += mentsuFu(m);
    }
    // 雀頭符
    fu += jantaiFu(decomp.jantai, input.seatWind, input.roundWind);
    // 待ち符
    fu += matiFu(decomp, winTile);
    // 10符単位に切り上げ
    return Math.ceil(fu / 10) * 10;
}
/**
 * 七対子の符は固定25符
 */
function calcFuChiitoitsu() {
    return 25;
}
/**
 * 国士の符は固定30符 (役満なので通常は使わない)
 */
function calcFuKokushi() {
    return 30;
}
//# sourceMappingURL=fu.js.map