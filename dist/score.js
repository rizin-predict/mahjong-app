"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcBasicPoints = calcBasicPoints;
exports.calcPayment = calcPayment;
exports.hanLabel = hanLabel;
exports.fuHanLabel = fuHanLabel;
// ============================================================
// 基本点計算
// ============================================================
/**
 * 基本点 = 符 × 2^(翻+2)
 * 役満は固定: 8000点 (親12000, 子6000×3)
 */
function calcBasicPoints(han, fu) {
    // 満貫以上は固定値
    const mangan = 2000;
    const haneman = 3000;
    const baiman = 4000;
    const sanbaiman = 6000;
    const yakuman = 8000;
    if (han >= 13)
        return yakuman;
    if (han >= 11)
        return sanbaiman;
    if (han >= 8)
        return baiman;
    if (han >= 6)
        return haneman;
    const basic = fu * Math.pow(2, han + 2);
    // 5翻未満でも満貫上限
    if (han >= 5 || basic >= mangan)
        return mangan;
    return basic;
}
/**
 * 点数を100点単位に切り上げる (子ツモは50点単位)
 */
function roundUp100(n) {
    return Math.ceil(n / 100) * 100;
}
function roundUp50(n) {
    return Math.ceil(n / 50) * 50; // 実際は100単位切り上げの方が一般的
}
// ============================================================
// 支払い計算
// ============================================================
/**
 * 子のツモあがり: 親は2倍払い, 子は1倍払い
 * 親のツモあがり: 全員が同額払い
 * ロン: あがり点数 = 基本点 × 4 (親) or × 6 (子, 親からは×6)
 */
function calcPayment(basicPoints, isDealer, isTsumo) {
    if (isTsumo) {
        if (isDealer) {
            // 親のツモ: 子全員から基本点×2 (100点単位切り上げ)
            const each = roundUp100(basicPoints * 2);
            return { dealerTsumo: { all: each } };
        }
        else {
            // 子のツモ: 親から基本点×2, 子から基本点×1
            const dealer = roundUp100(basicPoints * 2);
            const nonDealer = roundUp100(basicPoints);
            return { nonDealerTsumo: { dealer, nonDealer } };
        }
    }
    else {
        // ロン
        if (isDealer) {
            // 親のロン: 基本点×6
            return { ron: roundUp100(basicPoints * 6) };
        }
        else {
            // 子のロン: 基本点×4
            return { ron: roundUp100(basicPoints * 4) };
        }
    }
}
// ============================================================
// 翻数からのラベル
// ============================================================
function hanLabel(han) {
    if (han >= 13)
        return "役満";
    if (han >= 11)
        return "三倍満";
    if (han >= 8)
        return "倍満";
    if (han >= 6)
        return "跳満";
    if (han >= 5)
        return "満貫";
    // 基本点≥2000 でも満貫
    return `${han}翻`;
}
function fuHanLabel(han, fu) {
    const label = hanLabel(han);
    if (han >= 5)
        return label;
    return `${fu}符${han}翻 (${label})`;
}
//# sourceMappingURL=score.js.map