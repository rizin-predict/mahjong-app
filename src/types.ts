/** 牌の種類 */
export type Suit = "man" | "pin" | "sou" | "honor";

/** 風牌: 1=東, 2=南, 3=西, 4=北 */
export type Wind = 1 | 2 | 3 | 4;

/** 牌 */
export interface Tile {
  suit: Suit;
  value: number; // 1-9 (字牌は 1=東,2=南,3=西,4=北,5=白,6=發,7=中)
  name: string; // 元の文字列 e.g. "1m", "5z"
}

/** 面子・雀頭の種類 */
export type MentsuType = "shuntsu" | "koutsu" | "kantsu" | "jantai";

/** 面子または雀頭 */
export interface Mentsu {
  type: MentsuType;
  tiles: Tile[];
  isOpen: boolean; // 副露済みか
}

/** 通常手の分解結果 (面子4つ + 雀頭1つ) */
export interface NormalDecomposition {
  kind: "normal";
  mentsuList: Mentsu[]; // 4面子
  jantai: Mentsu; // 雀頭
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

export type HandDecomposition =
  | NormalDecomposition
  | ChiitoitsuDecomposition
  | KokushiDecomposition;

/** 役 */
export interface Yaku {
  nameJp: string;
  han: number; // 門前時の翻数 (役満は 13)
  hanOpen?: number; // 副露時の翻数 (undefined = 食い下がりなし or 副露不可)
  isYakuman?: boolean;
  /** 役満倍数: 1=一倍役満, 2=ダブル役満 (複合時は合算される) */
  yakumanMultiplier?: number;
}

/** 採点入力 (自風・場風は calcScore の独立した引数として渡す) */
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
  /** ドラ表示牌リスト */
  doraIndicators?: string[];
  /** 副露している面子 (オープン) */
  openMentsu?: OpenMentsu[];
}

/** 内部計算コンテキスト: ScoringInput に自風・場風を付加したもの */
export interface ScoringContext extends ScoringInput {
  seatWind: Wind;
  roundWind: Wind;
}

/** 副露済み面子の入力形式 */
export interface OpenMentsu {
  type: "chi" | "pon" | "ankan" | "minkan";
  tiles: string[];
}

/** 支払い情報 */
export interface Payment {
  /** 子のツモあがり: { dealer: 各親から, nonDealer: 各子から } */
  nonDealerTsumo?: { dealer: number; nonDealer: number };
  /** 親のツモあがり: all 各子から */
  dealerTsumo?: { all: number };
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
  yaku: { nameJp: string; han: number }[];
  /** ドラ枚数 */
  dora: number;
  /** 合計翻数 */
  han: number;
  /** 符数 */
  fu: number;
  /** 基本点 */
  basicPoints: number;
  /** 役満倍数 (1=役満, 2=ダブル役満, 3=トリプル役満...) */
  yakumanMultiplier?: number;
  /** 支払い情報 */
  payment: Payment;
}
