"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYakuForNormal = getYakuForNormal;
exports.getYakuForChiitoitsu = getYakuForChiitoitsu;
exports.getYakuForKokushi = getYakuForKokushi;
exports.hasValidYaku = hasValidYaku;
const tiles_1 = require("./tiles");
// ============================================================
// ヘルパー
// ============================================================
function tilesOf(decomp) {
    return [
        ...decomp.jantai.tiles,
        ...decomp.mentsuList.flatMap((m) => m.tiles),
    ];
}
function allTiles(decomp, allInputTiles) {
    return allInputTiles;
}
/** 面子が刻子か槓子か */
function isKoutsuFamily(m) {
    return m.type === "koutsu";
}
/** 面子が順子か */
function isShuntsu(m) {
    return m.type === "shuntsu";
}
// ============================================================
// 通常手の役判定
// ============================================================
/** 門前清自摸和 */
function isMenzenTsumo(input, _decomp) {
    return (input.isTsumo &&
        (!input.openMentsu || input.openMentsu.length === 0));
}
/** 立直 */
function isRiichi(input) {
    return !!input.isRiichi && !input.isDoubleRiichi;
}
/** ダブル立直 */
function isDoubleRiichi(input) {
    return !!input.isDoubleRiichi;
}
/** 一発 */
function isIppatsu(input) {
    return !!input.isIppatsu;
}
/** 嶺上開花 */
function isRinshan(input) {
    return !!input.isRinshan;
}
/** 海底摸月 / 河底撈魚 */
function isHaitei(input) {
    return !!input.isHaitei;
}
/** 槍槓 */
function isChankan(input) {
    return !!input.isChankan;
}
/** 断么九 - 全ての牌が中張牌 */
function isTanyaoYaku(decomp) {
    return tilesOf(decomp).every(tiles_1.isTanyao);
}
/** 平和 - 全て順子 + 無役牌雀頭 + 両面待ち
 *  ※待ちの種類は winningTile から判定する */
function isPinfu(decomp, input, winTile) {
    const isOpen = input.openMentsu && input.openMentsu.length > 0;
    if (isOpen)
        return false;
    // 全て順子か
    if (!decomp.mentsuList.every(isShuntsu))
        return false;
    // 雀頭が役牌でないか
    const head = decomp.jantai.tiles[0];
    if ((0, tiles_1.isSangen)(head))
        return false;
    if (input.seatWind && head.suit === "honor" && head.value === input.seatWind)
        return false;
    if (input.roundWind && head.suit === "honor" && head.value === input.roundWind)
        return false;
    // 両面待ちか (あがり牌が順子の端2枚のどちらかで、中間の牌でない)
    for (const m of decomp.mentsuList) {
        const vals = m.tiles.map((t) => t.value).sort((a, b) => a - b);
        const suit = m.tiles[0].suit;
        if ((0, tiles_1.sameTile)(winTile, m.tiles[0]) || (0, tiles_1.sameTile)(winTile, m.tiles[2])) {
            // あがり牌がこの順子の端牌か
            if ((0, tiles_1.sameTile)(winTile, { suit, value: vals[0], name: "" })) {
                // 左端: 右端が9でなければ両面
                if (vals[2] !== 9)
                    return true;
            }
            else if ((0, tiles_1.sameTile)(winTile, { suit, value: vals[2], name: "" })) {
                // 右端: 左端が1でなければ両面
                if (vals[0] !== 1)
                    return true;
            }
        }
    }
    return false;
}
/** 一盃口 - 同じ順子が2組 (門前のみ) */
function isIipeiko(decomp, input) {
    if (input.openMentsu && input.openMentsu.length > 0)
        return false;
    const shuntsus = decomp.mentsuList.filter(isShuntsu);
    for (let i = 0; i < shuntsus.length; i++) {
        for (let j = i + 1; j < shuntsus.length; j++) {
            const a = shuntsus[i].tiles;
            const b = shuntsus[j].tiles;
            if (a.every((t, k) => (0, tiles_1.sameTile)(t, b[k])))
                return true;
        }
    }
    return false;
}
/** 二盃口 - 一盃口の組が2組 (門前のみ) */
function isRyanpeiko(decomp, input) {
    if (input.openMentsu && input.openMentsu.length > 0)
        return false;
    const shuntsus = decomp.mentsuList.filter(isShuntsu);
    if (shuntsus.length !== 4)
        return false;
    // 4つの順子を2ペアに分けられるか
    const used = [false, false, false, false];
    let pairs = 0;
    for (let i = 0; i < shuntsus.length; i++) {
        if (used[i])
            continue;
        for (let j = i + 1; j < shuntsus.length; j++) {
            if (used[j])
                continue;
            const a = shuntsus[i].tiles;
            const b = shuntsus[j].tiles;
            if (a.every((t, k) => (0, tiles_1.sameTile)(t, b[k]))) {
                used[i] = used[j] = true;
                pairs++;
                break;
            }
        }
    }
    return pairs === 2;
}
/** 役牌 (三元牌・場風・自風) */
function getYakuhaiYaku(decomp, input) {
    const result = [];
    for (const m of decomp.mentsuList) {
        if (!isKoutsuFamily(m))
            continue;
        const t = m.tiles[0];
        if (!(0, tiles_1.isHonor)(t))
            continue;
        if (t.value === 5)
            result.push({ nameJp: "役牌(白)", han: 1, hanOpen: 1 });
        else if (t.value === 6)
            result.push({ nameJp: "役牌(發)", han: 1, hanOpen: 1 });
        else if (t.value === 7)
            result.push({ nameJp: "役牌(中)", han: 1, hanOpen: 1 });
        else if (input.roundWind && t.value === input.roundWind)
            result.push({ nameJp: "役牌(場風)", han: 1, hanOpen: 1 });
        else if (input.seatWind && t.value === input.seatWind)
            result.push({ nameJp: "役牌(自風)", han: 1, hanOpen: 1 });
    }
    return result;
}
/** 対々和 - 全て刻子 */
function isToitoi(decomp) {
    return decomp.mentsuList.every(isKoutsuFamily);
}
/** 三暗刻 - 暗刻が3つ以上 */
function sanAnkou(decomp, input, winTile) {
    // ロン上がりの場合、ロン牌で完成した刻子は明刻扱い
    let count = 0;
    for (const m of decomp.mentsuList) {
        if (!isKoutsuFamily(m))
            continue;
        if (!m.isOpen) {
            // ロン上がりで待ち牌がこの刻子の牌なら明刻
            if (!input.isTsumo && (0, tiles_1.sameTile)(winTile, m.tiles[0]))
                continue;
            count++;
        }
    }
    return count;
}
/** 三色同順 - 3種の数牌に同じ順子 */
function isSanshokuDoujun(decomp) {
    const shuntsus = decomp.mentsuList.filter(isShuntsu);
    for (let i = 0; i < shuntsus.length; i++) {
        for (let j = i + 1; j < shuntsus.length; j++) {
            for (let k = j + 1; k < shuntsus.length; k++) {
                const a = shuntsus[i], b = shuntsus[j], c = shuntsus[k];
                const suits = new Set([a.tiles[0].suit, b.tiles[0].suit, c.tiles[0].suit]);
                if (!suits.has("honor") && suits.size === 3) {
                    const valA = a.tiles[0].value;
                    if (valA === b.tiles[0].value && valA === c.tiles[0].value)
                        return true;
                }
            }
        }
    }
    return false;
}
/** 三色同刻 - 3種の数牌に同じ刻子 */
function isSanshokuDoukou(decomp) {
    const koutsus = decomp.mentsuList.filter(isKoutsuFamily);
    for (let i = 0; i < koutsus.length; i++) {
        for (let j = i + 1; j < koutsus.length; j++) {
            for (let k = j + 1; k < koutsus.length; k++) {
                const a = koutsus[i], b = koutsus[j], c = koutsus[k];
                const suits = new Set([a.tiles[0].suit, b.tiles[0].suit, c.tiles[0].suit]);
                if (!suits.has("honor") && suits.size === 3) {
                    const valA = a.tiles[0].value;
                    if (valA === b.tiles[0].value && valA === c.tiles[0].value)
                        return true;
                }
            }
        }
    }
    return false;
}
/** 一気通貫 - 同スートで 1-2-3, 4-5-6, 7-8-9 */
function isIttsu(decomp) {
    const shuntsus = decomp.mentsuList.filter(isShuntsu);
    const suits = ["man", "pin", "sou"];
    for (const suit of suits) {
        const same = shuntsus.filter((m) => m.tiles[0].suit === suit);
        const starts = new Set(same.map((m) => m.tiles[0].value));
        if (starts.has(1) && starts.has(4) && starts.has(7))
            return true;
    }
    return false;
}
/** 混全帯么九 (チャンタ) - 全ての面子・雀頭に么九牌 */
function isChanta(decomp) {
    const allSets = [decomp.jantai, ...decomp.mentsuList];
    return (allSets.every((m) => m.tiles.some(tiles_1.isYaochuu)) &&
        // 少なくとも1つの順子を含む (対々和との区別)
        decomp.mentsuList.some(isShuntsu) &&
        // 字牌を含む (純チャンとの区別)
        allSets.some((m) => m.tiles.some(tiles_1.isHonor)));
}
/** 純全帯么九 (ジュンチャン) - 全面子・雀頭に端牌 (字牌なし) */
function isJunchan(decomp) {
    const allSets = [decomp.jantai, ...decomp.mentsuList];
    return (allSets.every((m) => m.tiles.some((t) => !(0, tiles_1.isHonor)(t) && (0, tiles_1.isYaochuu)(t))) &&
        decomp.mentsuList.some(isShuntsu));
}
/** 混老頭 - 全て么九牌 かつ 字牌を含む */
function isHonroutou(decomp) {
    const all = tilesOf(decomp);
    return all.every(tiles_1.isYaochuu) && all.some(tiles_1.isHonor);
}
/** 混一色 (ホンイツ) - 字牌 + 1種の数牌のみ */
function isHonitsu(decomp) {
    const all = tilesOf(decomp);
    const numberSuits = new Set(all.filter((t) => !(0, tiles_1.isHonor)(t)).map((t) => t.suit));
    return numberSuits.size === 1 && all.some(tiles_1.isHonor);
}
/** 清一色 (チンイツ) - 1種の数牌のみ */
function isChinitsu(decomp) {
    const all = tilesOf(decomp);
    if (all.some(tiles_1.isHonor))
        return false;
    const suits = new Set(all.map((t) => t.suit));
    return suits.size === 1;
}
/** 小三元 - 三元牌の刻子2つ + 雀頭1つ */
function isShouSangen(decomp) {
    const sangenKoutsu = decomp.mentsuList.filter((m) => isKoutsuFamily(m) && (0, tiles_1.isSangen)(m.tiles[0])).length;
    const sangenJantai = (0, tiles_1.isSangen)(decomp.jantai.tiles[0]);
    return sangenKoutsu === 2 && sangenJantai;
}
// ============================================================
// 役満
// ============================================================
/** 四暗刻 */
function isSuuankou(decomp, input, winTile) {
    return sanAnkou(decomp, input, winTile) === 4;
}
/** 大三元 */
function isDaisangen(decomp) {
    const sangenKoutsu = decomp.mentsuList.filter((m) => isKoutsuFamily(m) && (0, tiles_1.isSangen)(m.tiles[0])).length;
    return sangenKoutsu === 3;
}
/** 小四喜 */
function isShousuushii(decomp) {
    const kazeKoutsu = decomp.mentsuList.filter((m) => isKoutsuFamily(m) && (0, tiles_1.isKaze)(m.tiles[0])).length;
    const kazeJantai = (0, tiles_1.isKaze)(decomp.jantai.tiles[0]);
    return kazeKoutsu === 3 && kazeJantai;
}
/** 大四喜 */
function isDaisuushii(decomp) {
    return decomp.mentsuList.filter((m) => isKoutsuFamily(m) && (0, tiles_1.isKaze)(m.tiles[0])).length === 4;
}
/** 字一色 */
function isTsuuiisou(decomp) {
    return tilesOf(decomp).every(tiles_1.isHonor);
}
/** 清老頭 */
function isChinroutou(decomp) {
    const all = tilesOf(decomp);
    return all.every((t) => !(0, tiles_1.isHonor)(t) && (t.value === 1 || t.value === 9));
}
/** 緑一色 */
function isRyuuiisou(decomp) {
    return tilesOf(decomp).every(tiles_1.isGreen);
}
/** 九蓮宝燈 - 1112345678999 + 任意1枚 同スート */
function isChurenPoutou(decomp) {
    const all = tilesOf(decomp);
    if (all.some(tiles_1.isHonor))
        return false;
    const suits = new Set(all.map((t) => t.suit));
    if (suits.size !== 1)
        return false;
    const values = all.map((t) => t.value).sort((a, b) => a - b);
    // 1112345678999 が含まれるか: 各値の最小枚数
    const counts = new Array(10).fill(0);
    values.forEach((v) => counts[v]++);
    const required = [0, 3, 1, 1, 1, 1, 1, 1, 1, 3]; // index = value
    for (let i = 1; i <= 9; i++) {
        if (counts[i] < required[i])
            return false;
    }
    return true;
}
// ============================================================
// 通常手の役を全て取得
// ============================================================
function getYakuForNormal(decomp, input, winTile) {
    const result = [];
    const isOpen = !!(input.openMentsu && input.openMentsu.length > 0);
    // ---- 役満チェック ----
    const yakuman = [];
    if (isSuuankou(decomp, input, winTile))
        yakuman.push({ nameJp: "四暗刻", han: 13, isYakuman: true });
    if (isDaisangen(decomp))
        yakuman.push({ nameJp: "大三元", han: 13, isYakuman: true });
    if (isShousuushii(decomp))
        yakuman.push({ nameJp: "小四喜", han: 13, isYakuman: true });
    if (isDaisuushii(decomp))
        yakuman.push({ nameJp: "大四喜", han: 13, isYakuman: true });
    if (isTsuuiisou(decomp))
        yakuman.push({ nameJp: "字一色", han: 13, isYakuman: true });
    if (isChinroutou(decomp))
        yakuman.push({ nameJp: "清老頭", han: 13, isYakuman: true });
    if (isRyuuiisou(decomp))
        yakuman.push({ nameJp: "緑一色", han: 13, isYakuman: true });
    if (isChurenPoutou(decomp))
        yakuman.push({ nameJp: "九蓮宝燈", han: 13, isYakuman: true });
    if (yakuman.length > 0)
        return yakuman;
    // ---- 通常役チェック ----
    // ダブル立直 (2翻) - 立直より先にチェック
    if (isDoubleRiichi(input))
        result.push({ nameJp: "ダブル立直", han: 2 });
    else if (isRiichi(input))
        result.push({ nameJp: "立直", han: 1 });
    if (isIppatsu(input))
        result.push({ nameJp: "一発", han: 1 });
    if (isRinshan(input))
        result.push({ nameJp: "嶺上開花", han: 1, hanOpen: 1 });
    if (isChankan(input))
        result.push({ nameJp: "槍槓", han: 1, hanOpen: 1 });
    if (isHaitei(input)) {
        result.push({
            nameJp: input.isTsumo ? "海底摸月" : "河底撈魚",
            han: 1,
            hanOpen: 1,
        });
    }
    if (!isOpen && isMenzenTsumo(input, decomp))
        result.push({ nameJp: "門前清自摸和", han: 1 });
    if (!isOpen && isPinfu(decomp, input, winTile))
        result.push({ nameJp: "平和", han: 1 });
    if (isTanyaoYaku(decomp))
        result.push({ nameJp: "断么九", han: 1, hanOpen: 1 });
    if (!isOpen && isRyanpeiko(decomp, input))
        result.push({ nameJp: "二盃口", han: 3 });
    else if (!isOpen && isIipeiko(decomp, input))
        result.push({ nameJp: "一盃口", han: 1 });
    result.push(...getYakuhaiYaku(decomp, input));
    if (isSanshokuDoujun(decomp))
        result.push({ nameJp: "三色同順", han: 2, hanOpen: 1 });
    if (isSanshokuDoukou(decomp))
        result.push({ nameJp: "三色同刻", han: 2, hanOpen: 2 });
    if (isIttsu(decomp))
        result.push({ nameJp: "一気通貫", han: 2, hanOpen: 1 });
    if (isJunchan(decomp))
        result.push({ nameJp: "純全帯么九", han: 3, hanOpen: 2 });
    else if (isChanta(decomp))
        result.push({ nameJp: "混全帯么九", han: 2, hanOpen: 1 });
    if (isToitoi(decomp))
        result.push({ nameJp: "対々和", han: 2, hanOpen: 2 });
    const sanAnkouCount = sanAnkou(decomp, input, winTile);
    if (sanAnkouCount >= 3)
        result.push({ nameJp: "三暗刻", han: 2, hanOpen: 2 });
    if (isHonroutou(decomp))
        result.push({ nameJp: "混老頭", han: 2, hanOpen: 2 });
    if (isShouSangen(decomp))
        result.push({ nameJp: "小三元", han: 2, hanOpen: 2 });
    if (isChinitsu(decomp))
        result.push({ nameJp: "清一色", han: 6, hanOpen: 5 });
    else if (isHonitsu(decomp))
        result.push({ nameJp: "混一色", han: 3, hanOpen: 2 });
    return result;
}
// ============================================================
// 七対子の役
// ============================================================
function getYakuForChiitoitsu(input) {
    const result = [];
    if (isDoubleRiichi(input))
        result.push({ nameJp: "ダブル立直", han: 2 });
    else if (isRiichi(input))
        result.push({ nameJp: "立直", han: 1 });
    if (isIppatsu(input))
        result.push({ nameJp: "一発", han: 1 });
    if (isHaitei(input))
        result.push({ nameJp: "海底摸月", han: 1 });
    if (isMenzenTsumo({ ...input }, null))
        result.push({ nameJp: "門前清自摸和", han: 1 });
    result.push({ nameJp: "七対子", han: 2 });
    return result;
}
// ============================================================
// 国士無双の役
// ============================================================
function getYakuForKokushi(_input) {
    return [{ nameJp: "国士無双", han: 13, isYakuman: true }];
}
// ============================================================
// 有効な役があるかチェック
// ============================================================
function hasValidYaku(yaku) {
    return yaku.length > 0;
}
//# sourceMappingURL=yaku.js.map