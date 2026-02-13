/**
 * formations.js - サッカーフォーメーション定義・管理
 * 
 * 各フォーメーションの選手座標（フィールド比率 0-1）を定義。
 * GK(1) + フィールドプレイヤー(10) = 11人
 */

// フィールド座標系: x=0(左)~1(右), y=0(上)~1(下)
// 攻撃方向: 左→右

export const POSITIONS = {
  GK: 'GK',
  CB: 'CB',
  LB: 'LB',
  RB: 'RB',
  LWB: 'LWB',
  RWB: 'RWB',
  CDM: 'CDM',
  CM: 'CM',
  LM: 'LM',
  RM: 'RM',
  CAM: 'CAM',
  LW: 'LW',
  RW: 'RW',
  CF: 'CF',
  ST: 'ST',
};

/**
 * フォーメーション定義
 * positions: { role, x, y } の配列 (11人)
 * attackModifier: 攻撃時の座標オフセット
 * defenseModifier: 守備時の座標オフセット
 */
export const FORMATIONS = {
  '4-4-2': {
    name: '4-4-2',
    description: 'バランス型。攻守の安定感に優れる',
    category: 'balanced',
    positions: [
      { role: 'GK', x: 0.05, y: 0.5 },
      { role: 'LB', x: 0.2, y: 0.15 },
      { role: 'CB', x: 0.18, y: 0.38 },
      { role: 'CB', x: 0.18, y: 0.62 },
      { role: 'RB', x: 0.2, y: 0.85 },
      { role: 'LM', x: 0.45, y: 0.12 },
      { role: 'CM', x: 0.42, y: 0.38 },
      { role: 'CM', x: 0.42, y: 0.62 },
      { role: 'RM', x: 0.45, y: 0.88 },
      { role: 'ST', x: 0.7, y: 0.35 },
      { role: 'ST', x: 0.7, y: 0.65 },
    ],
    attackBias: 0.08,
    defenseBias: -0.06,
  },

  '4-3-3': {
    name: '4-3-3',
    description: '攻撃的。前線3枚でプレスとカウンターに強い',
    category: 'offensive',
    positions: [
      { role: 'GK', x: 0.05, y: 0.5 },
      { role: 'LB', x: 0.2, y: 0.15 },
      { role: 'CB', x: 0.18, y: 0.38 },
      { role: 'CB', x: 0.18, y: 0.62 },
      { role: 'RB', x: 0.2, y: 0.85 },
      { role: 'CM', x: 0.42, y: 0.3 },
      { role: 'CDM', x: 0.38, y: 0.5 },
      { role: 'CM', x: 0.42, y: 0.7 },
      { role: 'LW', x: 0.7, y: 0.12 },
      { role: 'ST', x: 0.72, y: 0.5 },
      { role: 'RW', x: 0.7, y: 0.88 },
    ],
    attackBias: 0.1,
    defenseBias: -0.05,
  },

  '3-5-2': {
    name: '3-5-2',
    description: '中盤支配型。ウイングバックの運動量が鍵',
    category: 'balanced',
    positions: [
      { role: 'GK', x: 0.05, y: 0.5 },
      { role: 'CB', x: 0.18, y: 0.25 },
      { role: 'CB', x: 0.16, y: 0.5 },
      { role: 'CB', x: 0.18, y: 0.75 },
      { role: 'LWB', x: 0.38, y: 0.08 },
      { role: 'CM', x: 0.4, y: 0.32 },
      { role: 'CDM', x: 0.36, y: 0.5 },
      { role: 'CM', x: 0.4, y: 0.68 },
      { role: 'RWB', x: 0.38, y: 0.92 },
      { role: 'ST', x: 0.7, y: 0.38 },
      { role: 'ST', x: 0.7, y: 0.62 },
    ],
    attackBias: 0.09,
    defenseBias: -0.07,
  },

  '4-2-3-1': {
    name: '4-2-3-1',
    description: '守備安定型。ダブルボランチで中盤を制圧',
    category: 'defensive',
    positions: [
      { role: 'GK', x: 0.05, y: 0.5 },
      { role: 'LB', x: 0.2, y: 0.15 },
      { role: 'CB', x: 0.18, y: 0.38 },
      { role: 'CB', x: 0.18, y: 0.62 },
      { role: 'RB', x: 0.2, y: 0.85 },
      { role: 'CDM', x: 0.35, y: 0.38 },
      { role: 'CDM', x: 0.35, y: 0.62 },
      { role: 'LW', x: 0.55, y: 0.15 },
      { role: 'CAM', x: 0.55, y: 0.5 },
      { role: 'RW', x: 0.55, y: 0.85 },
      { role: 'ST', x: 0.73, y: 0.5 },
    ],
    attackBias: 0.07,
    defenseBias: -0.08,
  },

  '5-3-2': {
    name: '5-3-2',
    description: '堅守型。5バックでゴール前を固める',
    category: 'defensive',
    positions: [
      { role: 'GK', x: 0.05, y: 0.5 },
      { role: 'LWB', x: 0.22, y: 0.08 },
      { role: 'CB', x: 0.16, y: 0.3 },
      { role: 'CB', x: 0.14, y: 0.5 },
      { role: 'CB', x: 0.16, y: 0.7 },
      { role: 'RWB', x: 0.22, y: 0.92 },
      { role: 'CM', x: 0.4, y: 0.3 },
      { role: 'CM', x: 0.38, y: 0.5 },
      { role: 'CM', x: 0.4, y: 0.7 },
      { role: 'ST', x: 0.68, y: 0.38 },
      { role: 'ST', x: 0.68, y: 0.62 },
    ],
    attackBias: 0.06,
    defenseBias: -0.1,
  },

  '3-4-3': {
    name: '3-4-3',
    description: '超攻撃型。前線3枚＋中盤4枚で圧倒する',
    category: 'offensive',
    positions: [
      { role: 'GK', x: 0.05, y: 0.5 },
      { role: 'CB', x: 0.18, y: 0.25 },
      { role: 'CB', x: 0.16, y: 0.5 },
      { role: 'CB', x: 0.18, y: 0.75 },
      { role: 'LM', x: 0.42, y: 0.1 },
      { role: 'CM', x: 0.4, y: 0.38 },
      { role: 'CM', x: 0.4, y: 0.62 },
      { role: 'RM', x: 0.42, y: 0.9 },
      { role: 'LW', x: 0.7, y: 0.15 },
      { role: 'ST', x: 0.73, y: 0.5 },
      { role: 'RW', x: 0.7, y: 0.85 },
    ],
    attackBias: 0.12,
    defenseBias: -0.04,
  },
};

/**
 * 攻撃戦略
 */
export const ATTACK_STRATEGIES = {
  possession: {
    name: 'ポゼッション',
    description: 'ボール保持率を高め、パスで崩す',
    passAccuracyBonus: 0.1,
    shootFrequency: 0.3,
    pressIntensity: 0.3,
    counterSpeed: 0.2,
  },
  counter: {
    name: 'カウンター',
    description: '素早い切替で一気にゴールを狙う',
    passAccuracyBonus: -0.05,
    shootFrequency: 0.6,
    pressIntensity: 0.4,
    counterSpeed: 0.9,
  },
  highPress: {
    name: 'ハイプレス',
    description: '前線から積極的にボールを奪う',
    passAccuracyBonus: 0.0,
    shootFrequency: 0.5,
    pressIntensity: 0.9,
    counterSpeed: 0.5,
  },
  wingPlay: {
    name: 'サイド攻撃',
    description: 'サイドを起点にクロスを上げる',
    passAccuracyBonus: 0.05,
    shootFrequency: 0.45,
    pressIntensity: 0.4,
    counterSpeed: 0.4,
  },
};

/**
 * 守備戦略
 */
export const DEFENSE_STRATEGIES = {
  zonal: {
    name: 'ゾーンディフェンス',
    description: 'エリアを分担して守る',
    tackleSuccess: 0.55,
    interceptionRate: 0.5,
    blockRate: 0.5,
    lineHeight: 0.4,
  },
  manMark: {
    name: 'マンマーク',
    description: '相手選手に1対1で付く',
    tackleSuccess: 0.65,
    interceptionRate: 0.35,
    blockRate: 0.6,
    lineHeight: 0.45,
  },
  pressing: {
    name: 'プレッシング',
    description: '積極的にボールホルダーに寄せる',
    tackleSuccess: 0.6,
    interceptionRate: 0.55,
    blockRate: 0.4,
    lineHeight: 0.55,
  },
  deepBlock: {
    name: 'ディープブロック',
    description: '低い位置にブロックを形成して守る',
    tackleSuccess: 0.5,
    interceptionRate: 0.6,
    blockRate: 0.7,
    lineHeight: 0.3,
  },
};

/**
 * フォーメーションのポジションを取得（攻守モード対応）
 */
export function getPositions(formationKey, mode = 'normal') {
  const formation = FORMATIONS[formationKey];
  if (!formation) return null;

  return formation.positions.map(p => {
    let xOffset = 0;
    if (mode === 'attack') xOffset = formation.attackBias;
    if (mode === 'defense') xOffset = formation.defenseBias;

    return {
      ...p,
      x: Math.max(0.02, Math.min(0.98, p.x + xOffset)),
      y: p.y,
    };
  });
}

/**
 * 対戦相手のフォーメーション（左右反転）
 */
export function getMirroredPositions(formationKey, mode = 'normal') {
  const positions = getPositions(formationKey, mode);
  if (!positions) return null;

  return positions.map(p => ({
    ...p,
    x: 1 - p.x,
  }));
}

/**
 * フォーメーション一覧取得
 */
export function getFormationList() {
  return Object.entries(FORMATIONS).map(([key, f]) => ({
    key,
    name: f.name,
    description: f.description,
    category: f.category,
  }));
}

export function getAttackStrategyList() {
  return Object.entries(ATTACK_STRATEGIES).map(([key, s]) => ({
    key,
    name: s.name,
    description: s.description,
  }));
}

export function getDefenseStrategyList() {
  return Object.entries(DEFENSE_STRATEGIES).map(([key, s]) => ({
    key,
    name: s.name,
    description: s.description,
  }));
}
