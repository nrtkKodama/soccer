/**
 * formations.js - サッカーフォーメーション定義・管理
 * 
 * eFootball準拠の戦術システム:
 * - チームスタイル（攻撃戦略）: ポゼッション, ショートカウンター, ロングカウンター, サイドアタック, ロングボール
 * - 守備タイプ（守備戦略）: フォアチェック, リトリート, ハイプレス, アグレッシブ
 * - ビルドアップ: ショートパス or ロングパス（チームスタイルに連動）
 * - 攻撃エリア: 中央 or サイド or バランス（チームスタイルに連動）
 * - 守備ライン: 高/中/低（守備タイプに連動）
 * - プレッシング: 積極/バランス/消極（守備タイプに連動）
 */

// フィールド座標系: x=0(左)~1(右), y=0(上)~1(下)
// 攻撃方向: 左→右

export const POSITIONS = {
  GK: 'GK', CB: 'CB', LB: 'LB', RB: 'RB',
  LWB: 'LWB', RWB: 'RWB', CDM: 'CDM', CM: 'CM',
  LM: 'LM', RM: 'RM', CAM: 'CAM', LW: 'LW',
  RW: 'RW', CF: 'CF', ST: 'ST',
};

/**
 * フォーメーション定義
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
 * 攻撃戦略（eFootball チームスタイル準拠）
 * 
 * パラメータ:
 * - passAccuracyBonus: パス精度ボーナス（ビルドアップの質）
 * - shootFrequency: シュート頻度（攻撃の積極性）
 * - pressIntensity: 攻撃時のプレス強度（ボールロスト後の即時プレス）
 * - counterSpeed: カウンターの速さ（切替速度）
 * - buildUp: ビルドアップタイプ (short/long/side)
 * - attackArea: 攻撃エリア (central/wide/balanced)
 * - throughBallFreq: スルーパス頻度
 * - crossFreq: クロス頻度
 * - dribbleFreq: ドリブル突破頻度
 */
export const ATTACK_STRATEGIES = {
  possession: {
    name: 'ポゼッション',
    description: 'ショートパスでボールを保持し、崩してゴールを狙う',
    passAccuracyBonus: 0.15,
    shootFrequency: 0.25,
    pressIntensity: 0.3,
    counterSpeed: 0.2,
    buildUp: 'short',
    attackArea: 'balanced',
    throughBallFreq: 0.3,
    crossFreq: 0.2,
    dribbleFreq: 0.2,
  },
  shortCounter: {
    name: 'ショートカウンター',
    description: '高い位置でボールを奪い、素早くショートパスで攻める',
    passAccuracyBonus: 0.05,
    shootFrequency: 0.55,
    pressIntensity: 0.8,
    counterSpeed: 0.85,
    buildUp: 'short',
    attackArea: 'central',
    throughBallFreq: 0.5,
    crossFreq: 0.15,
    dribbleFreq: 0.35,
  },
  longCounter: {
    name: 'ロングカウンター',
    description: '自陣で守り、ボール奪取後にロングパスで一気に攻める',
    passAccuracyBonus: -0.05,
    shootFrequency: 0.5,
    pressIntensity: 0.2,
    counterSpeed: 0.95,
    buildUp: 'long',
    attackArea: 'central',
    throughBallFreq: 0.6,
    crossFreq: 0.2,
    dribbleFreq: 0.3,
  },
  sideAttack: {
    name: 'サイドアタック',
    description: 'サイドを崩してクロスやカットインからチャンスを作る',
    passAccuracyBonus: 0.08,
    shootFrequency: 0.4,
    pressIntensity: 0.4,
    counterSpeed: 0.4,
    buildUp: 'side',
    attackArea: 'wide',
    throughBallFreq: 0.25,
    crossFreq: 0.6,
    dribbleFreq: 0.4,
  },
  longBall: {
    name: 'ロングボール',
    description: 'ロングフィードで前線ターゲットに素早くボールを届ける',
    passAccuracyBonus: -0.1,
    shootFrequency: 0.55,
    pressIntensity: 0.35,
    counterSpeed: 0.7,
    buildUp: 'long',
    attackArea: 'central',
    throughBallFreq: 0.4,
    crossFreq: 0.5,
    dribbleFreq: 0.15,
  },
};

/**
 * 守備戦略（eFootball 守備タイプ準拠）
 * 
 * パラメータ:
 * - tackleSuccess: タックル成功率
 * - interceptionRate: インターセプト率
 * - blockRate: シュートブロック率
 * - lineHeight: DFラインの高さ (0=低, 1=高)
 * - pressIntensity: 守備プレス強度 (0=消極, 1=積極)
 * - compactness: コンパクトネス（選手間の距離）
 * - coverRange: カバー範囲の広さ
 */
export const DEFENSE_STRATEGIES = {
  forecheck: {
    name: 'フォアチェック',
    description: '高い位置から積極的にプレスをかけてボールを奪う',
    tackleSuccess: 0.6,
    interceptionRate: 0.55,
    blockRate: 0.4,
    lineHeight: 0.7,
    pressIntensity: 0.85,
    compactness: 0.7,
    coverRange: 0.6,
  },
  retreat: {
    name: 'リトリート',
    description: '自陣に戻って守備ブロックを形成し堅く守る',
    tackleSuccess: 0.5,
    interceptionRate: 0.55,
    blockRate: 0.7,
    lineHeight: 0.3,
    pressIntensity: 0.2,
    compactness: 0.85,
    coverRange: 0.4,
  },
  highPress: {
    name: 'ハイプレス',
    description: '前線から連動してプレスし即座にボールを奪い返す',
    tackleSuccess: 0.65,
    interceptionRate: 0.6,
    blockRate: 0.35,
    lineHeight: 0.8,
    pressIntensity: 0.95,
    compactness: 0.6,
    coverRange: 0.7,
  },
  aggressive: {
    name: 'アグレッシブ',
    description: 'マンマーク気味に激しく寄せてボールホルダーを潰す',
    tackleSuccess: 0.7,
    interceptionRate: 0.4,
    blockRate: 0.5,
    lineHeight: 0.55,
    pressIntensity: 0.75,
    compactness: 0.5,
    coverRange: 0.8,
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
  return positions.map(p => ({ ...p, x: 1 - p.x }));
}

/**
 * フォーメーション一覧取得
 */
export function getFormationList() {
  return Object.entries(FORMATIONS).map(([key, f]) => ({
    key, name: f.name, description: f.description, category: f.category,
  }));
}

export function getAttackStrategyList() {
  return Object.entries(ATTACK_STRATEGIES).map(([key, s]) => ({
    key, name: s.name, description: s.description,
  }));
}

export function getDefenseStrategyList() {
  return Object.entries(DEFENSE_STRATEGIES).map(([key, s]) => ({
    key, name: s.name, description: s.description,
  }));
}
