/**
 * server/formations.js - フォーメーション・戦略データ (CommonJS版)
 * eFootball準拠の戦術システム
 */

const FORMATIONS = {
    '4-4-2': {
        name: '4-4-2', description: 'バランス型', category: 'balanced',
        positions: [
            { role: 'GK', x: 0.05, y: 0.5 }, { role: 'LB', x: 0.2, y: 0.15 },
            { role: 'CB', x: 0.18, y: 0.38 }, { role: 'CB', x: 0.18, y: 0.62 },
            { role: 'RB', x: 0.2, y: 0.85 }, { role: 'LM', x: 0.45, y: 0.12 },
            { role: 'CM', x: 0.42, y: 0.38 }, { role: 'CM', x: 0.42, y: 0.62 },
            { role: 'RM', x: 0.45, y: 0.88 }, { role: 'ST', x: 0.7, y: 0.35 },
            { role: 'ST', x: 0.7, y: 0.65 },
        ],
        attackBias: 0.08, defenseBias: -0.06,
    },
    '4-3-3': {
        name: '4-3-3', description: '攻撃的', category: 'offensive',
        positions: [
            { role: 'GK', x: 0.05, y: 0.5 }, { role: 'LB', x: 0.2, y: 0.15 },
            { role: 'CB', x: 0.18, y: 0.38 }, { role: 'CB', x: 0.18, y: 0.62 },
            { role: 'RB', x: 0.2, y: 0.85 }, { role: 'CM', x: 0.42, y: 0.3 },
            { role: 'CDM', x: 0.38, y: 0.5 }, { role: 'CM', x: 0.42, y: 0.7 },
            { role: 'LW', x: 0.7, y: 0.12 }, { role: 'ST', x: 0.72, y: 0.5 },
            { role: 'RW', x: 0.7, y: 0.88 },
        ],
        attackBias: 0.1, defenseBias: -0.05,
    },
    '3-5-2': {
        name: '3-5-2', description: '中盤支配型', category: 'balanced',
        positions: [
            { role: 'GK', x: 0.05, y: 0.5 }, { role: 'CB', x: 0.18, y: 0.25 },
            { role: 'CB', x: 0.16, y: 0.5 }, { role: 'CB', x: 0.18, y: 0.75 },
            { role: 'LWB', x: 0.38, y: 0.08 }, { role: 'CM', x: 0.4, y: 0.32 },
            { role: 'CDM', x: 0.36, y: 0.5 }, { role: 'CM', x: 0.4, y: 0.68 },
            { role: 'RWB', x: 0.38, y: 0.92 }, { role: 'ST', x: 0.7, y: 0.38 },
            { role: 'ST', x: 0.7, y: 0.62 },
        ],
        attackBias: 0.09, defenseBias: -0.07,
    },
    '4-2-3-1': {
        name: '4-2-3-1', description: '守備安定型', category: 'defensive',
        positions: [
            { role: 'GK', x: 0.05, y: 0.5 }, { role: 'LB', x: 0.2, y: 0.15 },
            { role: 'CB', x: 0.18, y: 0.38 }, { role: 'CB', x: 0.18, y: 0.62 },
            { role: 'RB', x: 0.2, y: 0.85 }, { role: 'CDM', x: 0.35, y: 0.38 },
            { role: 'CDM', x: 0.35, y: 0.62 }, { role: 'LW', x: 0.55, y: 0.15 },
            { role: 'CAM', x: 0.55, y: 0.5 }, { role: 'RW', x: 0.55, y: 0.85 },
            { role: 'ST', x: 0.73, y: 0.5 },
        ],
        attackBias: 0.07, defenseBias: -0.08,
    },
    '5-3-2': {
        name: '5-3-2', description: '堅守型', category: 'defensive',
        positions: [
            { role: 'GK', x: 0.05, y: 0.5 }, { role: 'LWB', x: 0.22, y: 0.08 },
            { role: 'CB', x: 0.16, y: 0.3 }, { role: 'CB', x: 0.14, y: 0.5 },
            { role: 'CB', x: 0.16, y: 0.7 }, { role: 'RWB', x: 0.22, y: 0.92 },
            { role: 'CM', x: 0.4, y: 0.3 }, { role: 'CM', x: 0.38, y: 0.5 },
            { role: 'CM', x: 0.4, y: 0.7 }, { role: 'ST', x: 0.68, y: 0.38 },
            { role: 'ST', x: 0.68, y: 0.62 },
        ],
        attackBias: 0.06, defenseBias: -0.1,
    },
    '3-4-3': {
        name: '3-4-3', description: '超攻撃型', category: 'offensive',
        positions: [
            { role: 'GK', x: 0.05, y: 0.5 }, { role: 'CB', x: 0.18, y: 0.25 },
            { role: 'CB', x: 0.16, y: 0.5 }, { role: 'CB', x: 0.18, y: 0.75 },
            { role: 'LM', x: 0.42, y: 0.1 }, { role: 'CM', x: 0.4, y: 0.38 },
            { role: 'CM', x: 0.4, y: 0.62 }, { role: 'RM', x: 0.42, y: 0.9 },
            { role: 'LW', x: 0.7, y: 0.15 }, { role: 'ST', x: 0.73, y: 0.5 },
            { role: 'RW', x: 0.7, y: 0.85 },
        ],
        attackBias: 0.12, defenseBias: -0.04,
    },
};

const ATTACK_STRATEGIES = {
    possession: {
        name: 'ポゼッション', description: 'ショートパスでボール保持し崩す',
        passAccuracyBonus: 0.15, shootFrequency: 0.25, pressIntensity: 0.3, counterSpeed: 0.2,
        buildUp: 'short', attackArea: 'balanced', throughBallFreq: 0.3, crossFreq: 0.2, dribbleFreq: 0.2,
    },
    shortCounter: {
        name: 'ショートカウンター', description: '高い位置で奪い素早く攻める',
        passAccuracyBonus: 0.05, shootFrequency: 0.55, pressIntensity: 0.8, counterSpeed: 0.85,
        buildUp: 'short', attackArea: 'central', throughBallFreq: 0.5, crossFreq: 0.15, dribbleFreq: 0.35,
    },
    longCounter: {
        name: 'ロングカウンター', description: '自陣で守りロングパスで一気に攻める',
        passAccuracyBonus: -0.05, shootFrequency: 0.5, pressIntensity: 0.2, counterSpeed: 0.95,
        buildUp: 'long', attackArea: 'central', throughBallFreq: 0.6, crossFreq: 0.2, dribbleFreq: 0.3,
    },
    sideAttack: {
        name: 'サイドアタック', description: 'サイドを崩してクロスやカットインで攻める',
        passAccuracyBonus: 0.08, shootFrequency: 0.4, pressIntensity: 0.4, counterSpeed: 0.4,
        buildUp: 'side', attackArea: 'wide', throughBallFreq: 0.25, crossFreq: 0.6, dribbleFreq: 0.4,
    },
    longBall: {
        name: 'ロングボール', description: 'ロングフィードで前線に素早く届ける',
        passAccuracyBonus: -0.1, shootFrequency: 0.55, pressIntensity: 0.35, counterSpeed: 0.7,
        buildUp: 'long', attackArea: 'central', throughBallFreq: 0.4, crossFreq: 0.5, dribbleFreq: 0.15,
    },
};

const DEFENSE_STRATEGIES = {
    forecheck: {
        name: 'フォアチェック', description: '高い位置からプレスしてボールを奪う',
        tackleSuccess: 0.6, interceptionRate: 0.55, blockRate: 0.4,
        lineHeight: 0.7, pressIntensity: 0.85, compactness: 0.7, coverRange: 0.6,
    },
    retreat: {
        name: 'リトリート', description: '自陣に戻り守備ブロックを形成して堅く守る',
        tackleSuccess: 0.5, interceptionRate: 0.55, blockRate: 0.7,
        lineHeight: 0.3, pressIntensity: 0.2, compactness: 0.85, coverRange: 0.4,
    },
    highPress: {
        name: 'ハイプレス', description: '前線から連動プレスし即ボールを奪い返す',
        tackleSuccess: 0.65, interceptionRate: 0.6, blockRate: 0.35,
        lineHeight: 0.8, pressIntensity: 0.95, compactness: 0.6, coverRange: 0.7,
    },
    aggressive: {
        name: 'アグレッシブ', description: 'マンマーク気味に激しく寄せてボールホルダーを潰す',
        tackleSuccess: 0.7, interceptionRate: 0.4, blockRate: 0.5,
        lineHeight: 0.55, pressIntensity: 0.75, compactness: 0.5, coverRange: 0.8,
    },
};

const FORMATION_KEYS = Object.keys(FORMATIONS);
const ATTACK_KEYS = Object.keys(ATTACK_STRATEGIES);
const DEFENSE_KEYS = Object.keys(DEFENSE_STRATEGIES);

function getAllActions() {
    const actions = [];
    for (const af of FORMATION_KEYS) {
        for (const df of FORMATION_KEYS) {
            for (const a of ATTACK_KEYS) {
                for (const d of DEFENSE_KEYS) {
                    actions.push({ atkFormation: af, defFormation: df, attack: a, defense: d });
                }
            }
        }
    }
    return actions;
}

module.exports = {
    FORMATIONS, ATTACK_STRATEGIES, DEFENSE_STRATEGIES,
    FORMATION_KEYS, ATTACK_KEYS, DEFENSE_KEYS, getAllActions,
};
