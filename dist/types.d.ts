/** 牌の種類 */
export type Suit = "man" | "pin" | "sou" | "honor";
/** 風牌: 1=東, 2=南, 3=西, 4=北 */
export type Wind = 1 | 2 | 3 | 4;
/** 牌 */
export interface Tile {
    suit: Suit;
    value: number;
    name: string;
}
/** 面子・雀頭の種類 */
export type MentsuType = "shuntsu" | "koutsu" | "jantai";
/** 面子または雀頭 */
export interface Mentsu {
    type: MentsuType;
    tiles: Tile[];
    isOpen: boolean;
}
/** 通常手の分解結果 (面子4つ + 雀頭1つ) */
export interface NormalDecomposition {
    kind: "normal";
    mentsuList: Mentsu[];
    jantai: Mentsu;
}
/** 七対子の分解結果 */
export interface ChiitoitsuDecomposition {
    kind: "chiitoitsu";
    pairs: Tile[][];
}
/** 国士無双の分解結果 */
export interface KokushiDecomposition {
    kind: "kokushi";
    tiles: Tile[];
}
export type HandDecomposition = NormalDecomposition | ChiitoitsuDecomposition | KokushiDecomposition;
/** 役 */
export interface Yaku {
    nameJp: string;
    han: number;
    hanOpen?: number;
    isYakuman?: boolean;
}
/** 採点入力 */
export interface ScoringInput {
    /** 14枚の牌名 */
    tiles: string[];
    /** あがり牌 (tiles の中の1枚) */
    winningTile: string;
    /** ツモあがりか */
    isTsumo: boolean;
    /** 立直しているか */
    isRiichi?: boolean;
    /** ダブル立直か */
    isDoubleRiichi?: boolean;
    /** 一発か */
    isIppatsu?: boolean;
    /** 嶺上開花か */
    isRinshan?: boolean;
    /** 海底/河底か */
    isHaitei?: boolean;
    /** 槍槓か */
    isChankan?: boolean;
    /** 自風 (1=東, 2=南, 3=西, 4=北) */
    seatWind?: Wind;
    /** 場風 (1=東, 2=南, 3=西, 4=北) */
    roundWind?: Wind;
    /** ドラ表示牌リスト */
    doraIndicators?: string[];
    /** 副露している面子 (オープン) */
    openMentsu?: OpenMentsu[];
}
/** 副露済み面子の入力形式 */
export interface OpenMentsu {
    type: "chi" | "pon" | "kan";
    tiles: string[];
}
/** 支払い情報 */
export interface Payment {
    /** 子のツモあがり: { dealer: 各親から, nonDealer: 各子から } */
    nonDealerTsumo?: {
        dealer: number;
        nonDealer: number;
    };
    /** 親のツモあがり: all 各子から */
    dealerTsumo?: {
        all: number;
    };
    /** ロンあがり */
    ron?: number;
}
/** 採点結果 */
export interface ScoringResult {
    /** 有効な上がりか */
    isValid: boolean;
    error?: string;
    /** 採用された分解 */
    decomposition?: HandDecomposition;
    /** 役リスト */
    yaku: {
        nameJp: string;
        han: number;
    }[];
    /** ドラ枚数 */
    dora: number;
    /** 合計翻数 */
    han: number;
    /** 符数 */
    fu: number;
    /** 基本点 */
    basicPoints: number;
    /** 支払い情報 */
    payment: Payment;
}
//# sourceMappingURL=types.d.ts.map