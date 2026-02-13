/**
 * rl-engine.js - 強化学習エンジン（Q-Learning）
 * 
 * 状態: 攻撃フォーメーション × 守備フォーメーション × 攻撃戦略 × 守備戦略
 * 行動: 上記の組み合わせを変更
 * 報酬: 勝利=+3, 引分=+1, 敗北=-1, ゴール差ボーナス, ポゼッションボーナス
 */

import { FORMATIONS, ATTACK_STRATEGIES, DEFENSE_STRATEGIES } from './formations.js';
import { simulateMatch } from './simulation.js';

const FORMATION_KEYS = Object.keys(FORMATIONS);
const ATTACK_KEYS = Object.keys(ATTACK_STRATEGIES);
const DEFENSE_KEYS = Object.keys(DEFENSE_STRATEGIES);

/**
 * Q-Learning Agent
 */
export class QLearningAgent {
    constructor(params = {}) {
        this.learningRate = params.learningRate ?? 0.1;
        this.discountFactor = params.discountFactor ?? 0.95;
        this.epsilon = params.epsilon ?? 1.0;
        this.epsilonDecay = params.epsilonDecay ?? 0.995;
        this.epsilonMin = params.epsilonMin ?? 0.05;

        // Q-Table: stateKey -> { actionKey: qValue }
        this.qTable = {};

        // 学習履歴
        this.history = [];
        this.episodeCount = 0;
        this.bestResult = null;
        this.bestScore = -Infinity;
    }

    /**
     * 状態キー生成（攻撃F|守備F|攻撃戦略|守備戦略）
     */
    _stateKey(atkFormation, defFormation, atkStrategy, defStrategy) {
        return `${atkFormation}|${defFormation}|${atkStrategy}|${defStrategy}`;
    }

    /**
     * 全アクション（戦術組み合わせ）を生成
     */
    _getActions() {
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

    /**
     * Q値取得
     */
    _getQ(stateKey, actionKey) {
        if (!this.qTable[stateKey]) this.qTable[stateKey] = {};
        return this.qTable[stateKey][actionKey] ?? 0;
    }

    /**
     * Q値更新
     */
    _setQ(stateKey, actionKey, value) {
        if (!this.qTable[stateKey]) this.qTable[stateKey] = {};
        this.qTable[stateKey][actionKey] = value;
    }

    /**
     * ε-貪欲法でアクション選択
     */
    selectAction(currentState) {
        const actions = this._getActions();

        if (Math.random() < this.epsilon) {
            return actions[Math.floor(Math.random() * actions.length)];
        }

        const stateKey = this._stateKey(
            currentState.atkFormation, currentState.defFormation,
            currentState.attack, currentState.defense
        );
        let bestAction = actions[0];
        let bestQ = -Infinity;

        for (const action of actions) {
            const actionKey = this._stateKey(
                action.atkFormation, action.defFormation,
                action.attack, action.defense
            );
            const q = this._getQ(stateKey, actionKey);
            if (q > bestQ) {
                bestQ = q;
                bestAction = action;
            }
        }

        return bestAction;
    }

    /**
     * 報酬計算
     */
    _calculateReward(matchResult) {
        let reward = 0;
        if (matchResult.winner === 'home') reward += 3;
        else if (matchResult.winner === 'draw') reward += 1;
        else reward -= 1;

        reward += (matchResult.homeGoals - matchResult.awayGoals) * 0.5;
        reward += (matchResult.homePossession - 0.5) * 2;
        reward += matchResult.homeShots * 0.1;

        return reward;
    }

    /**
     * アクションをsimulateMatch用のtacticsオブジェクトに変換
     */
    _toTactics(action) {
        return {
            atkFormation: action.atkFormation,
            defFormation: action.defFormation,
            atkStrategy: action.attack,
            defStrategy: action.defense,
        };
    }

    /**
     * 1エピソード実行
     */
    runEpisode(currentState = null) {
        if (!currentState) {
            currentState = {
                atkFormation: FORMATION_KEYS[Math.floor(Math.random() * FORMATION_KEYS.length)],
                defFormation: FORMATION_KEYS[Math.floor(Math.random() * FORMATION_KEYS.length)],
                attack: ATTACK_KEYS[Math.floor(Math.random() * ATTACK_KEYS.length)],
                defense: DEFENSE_KEYS[Math.floor(Math.random() * DEFENSE_KEYS.length)],
            };
        }

        const action = this.selectAction(currentState);

        const opponent = {
            atkFormation: FORMATION_KEYS[Math.floor(Math.random() * FORMATION_KEYS.length)],
            defFormation: FORMATION_KEYS[Math.floor(Math.random() * FORMATION_KEYS.length)],
            attack: ATTACK_KEYS[Math.floor(Math.random() * ATTACK_KEYS.length)],
            defense: DEFENSE_KEYS[Math.floor(Math.random() * DEFENSE_KEYS.length)],
        };

        const result = simulateMatch(this._toTactics(action), this._toTactics(opponent));

        const reward = this._calculateReward(result);

        // Q値更新
        const currentStateKey = this._stateKey(
            currentState.atkFormation, currentState.defFormation,
            currentState.attack, currentState.defense
        );
        const actionKey = this._stateKey(
            action.atkFormation, action.defFormation,
            action.attack, action.defense
        );

        const nextActions = this._getActions();
        let maxNextQ = -Infinity;
        for (const nextAction of nextActions) {
            const nextActionKey = this._stateKey(
                nextAction.atkFormation, nextAction.defFormation,
                nextAction.attack, nextAction.defense
            );
            const q = this._getQ(actionKey, nextActionKey);
            if (q > maxNextQ) maxNextQ = q;
        }
        if (maxNextQ === -Infinity) maxNextQ = 0;

        const currentQ = this._getQ(currentStateKey, actionKey);
        const newQ = currentQ + this.learningRate * (reward + this.discountFactor * maxNextQ - currentQ);
        this._setQ(currentStateKey, actionKey, newQ);

        // Epsilon減衰
        this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);

        // 最良結果を記録
        if (reward > this.bestScore) {
            this.bestScore = reward;
            this.bestResult = {
                atkFormation: action.atkFormation,
                defFormation: action.defFormation,
                attack: action.attack,
                defense: action.defense,
                score: reward,
                matchResult: result,
            };
        }

        this.episodeCount++;
        const episodeRecord = {
            episode: this.episodeCount,
            state: currentState,
            action,
            opponent,
            result,
            reward,
            epsilon: this.epsilon,
        };
        this.history.push(episodeRecord);

        return { ...episodeRecord, nextState: action };
    }

    /**
     * 複数エピソード実行
     */
    train(episodes = 100, onProgress = null) {
        let currentState = null;
        const batchResults = [];

        for (let i = 0; i < episodes; i++) {
            const result = this.runEpisode(currentState);
            currentState = result.nextState;
            batchResults.push(result);

            if (onProgress && i % 10 === 0) {
                onProgress({
                    episode: this.episodeCount,
                    totalEpisodes: episodes,
                    progress: (i + 1) / episodes,
                    epsilon: this.epsilon,
                    bestResult: this.bestResult,
                    latestReward: result.reward,
                });
            }
        }

        return batchResults;
    }

    /**
     * 最適戦術を取得
     */
    getBestStrategy() {
        const actions = this._getActions();
        let globalBestAction = null;
        let globalBestQ = -Infinity;

        for (const stateKey of Object.keys(this.qTable)) {
            for (const action of actions) {
                const actionKey = this._stateKey(
                    action.atkFormation, action.defFormation,
                    action.attack, action.defense
                );
                const q = this._getQ(stateKey, actionKey);
                if (q > globalBestQ) {
                    globalBestQ = q;
                    globalBestAction = action;
                }
            }
        }

        return {
            action: globalBestAction,
            qValue: globalBestQ,
            bestMatch: this.bestResult,
        };
    }

    /**
     * 戦術ランキング
     */
    getStrategyRanking(topN = 10) {
        const actionScores = {};
        const actions = this._getActions();

        for (const stateKey of Object.keys(this.qTable)) {
            for (const action of actions) {
                const actionKey = this._stateKey(
                    action.atkFormation, action.defFormation,
                    action.attack, action.defense
                );
                const q = this._getQ(stateKey, actionKey);
                if (!actionScores[actionKey] || q > actionScores[actionKey].maxQ) {
                    actionScores[actionKey] = {
                        action,
                        maxQ: q,
                        key: actionKey,
                    };
                }
            }
        }

        return Object.values(actionScores)
            .sort((a, b) => b.maxQ - a.maxQ)
            .slice(0, topN);
    }

    /**
     * 学習統計
     */
    getStats() {
        const recentN = Math.min(50, this.history.length);
        const recent = this.history.slice(-recentN);
        const recentWins = recent.filter(h => h.result.winner === 'home').length;
        const recentAvgReward = recent.reduce((s, h) => s + h.reward, 0) / (recentN || 1);

        return {
            totalEpisodes: this.episodeCount,
            epsilon: this.epsilon,
            qTableSize: Object.keys(this.qTable).length,
            recentWinRate: recentN > 0 ? recentWins / recentN : 0,
            recentAvgReward,
            bestResult: this.bestResult,
            rewardHistory: this.history.map(h => h.reward),
            winRateHistory: this._calculateRollingWinRate(),
        };
    }

    /**
     * ローリング勝率計算
     */
    _calculateRollingWinRate(window = 20) {
        const winRates = [];
        for (let i = 0; i < this.history.length; i++) {
            const start = Math.max(0, i - window + 1);
            const slice = this.history.slice(start, i + 1);
            const wins = slice.filter(h => h.result.winner === 'home').length;
            winRates.push(wins / slice.length);
        }
        return winRates;
    }

    /**
     * リセット
     */
    reset() {
        this.qTable = {};
        this.history = [];
        this.episodeCount = 0;
        this.bestResult = null;
        this.bestScore = -Infinity;
        this.epsilon = 1.0;
    }

    /**
     * パラメータ更新
     */
    updateParams(params) {
        if (params.learningRate !== undefined) this.learningRate = params.learningRate;
        if (params.discountFactor !== undefined) this.discountFactor = params.discountFactor;
        if (params.epsilon !== undefined) this.epsilon = params.epsilon;
        if (params.epsilonDecay !== undefined) this.epsilonDecay = params.epsilonDecay;
    }
}
