/**
 * simulation-worker.js - Web Worker for parallel match simulation
 * 
 * メインスレッドから受け取ったホーム戦術のバッチを、
 * 全対戦相手に対してシミュレーションし、集計結果を返す。
 */

import { FORMATIONS, ATTACK_STRATEGIES, DEFENSE_STRATEGIES, getPositions, getMirroredPositions } from './formations.js';
import { simulateMatch } from './simulation.js';

// 報酬計算（rl-engine.jsと同じロジック）
function calculateReward(matchResult) {
    let reward = 0;
    if (matchResult.winner === 'home') reward += 3;
    else if (matchResult.winner === 'draw') reward += 1;
    else reward -= 1;
    reward += (matchResult.homeGoals - matchResult.awayGoals) * 0.5;
    reward += (matchResult.homePossession - 0.5) * 2;
    reward += matchResult.homeShots * 0.1;
    return reward;
}

// 全アクション生成
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

const allOppActions = getAllActions();

/**
 * メッセージハンドラ
 * 
 * 受信: { homeActions: Action[], matchesPerPair: number, workerId: number }
 * 送信(進捗): { type: 'progress', workerId, completed, total }
 * 送信(完了): { type: 'done', workerId, results: { [key]: stats } }
 */
self.onmessage = function (e) {
    const { homeActions, matchesPerPair, workerId } = e.data;
    const results = {};
    let completed = 0;

    for (const home of homeActions) {
        const homeKey = `${home.atkFormation}|${home.defFormation}|${home.attack}|${home.defense}`;
        const stats = {
            action: home,
            key: homeKey,
            totalWins: 0,
            totalDraws: 0,
            totalLosses: 0,
            totalGoals: 0,
            totalConceded: 0,
            totalPossession: 0,
            totalShots: 0,
            totalReward: 0,
            matchCount: 0,
        };

        for (const opp of allOppActions) {
            for (let m = 0; m < matchesPerPair; m++) {
                const result = simulateMatch(
                    { atkFormation: home.atkFormation, defFormation: home.defFormation, atkStrategy: home.attack, defStrategy: home.defense },
                    { atkFormation: opp.atkFormation, defFormation: opp.defFormation, atkStrategy: opp.attack, defStrategy: opp.defense }
                );
                const reward = calculateReward(result);
                stats.matchCount++;
                stats.totalReward += reward;
                stats.totalGoals += result.homeGoals;
                stats.totalConceded += result.awayGoals;
                stats.totalPossession += result.homePossession;
                stats.totalShots += result.homeShots;
                if (result.winner === 'home') stats.totalWins++;
                else if (result.winner === 'draw') stats.totalDraws++;
                else stats.totalLosses++;
            }
        }

        results[homeKey] = stats;
        completed++;

        // 進捗通知（10戦術ごと）
        if (completed % 10 === 0 || completed === homeActions.length) {
            self.postMessage({
                type: 'progress',
                workerId,
                completed,
                total: homeActions.length,
            });
        }
    }

    self.postMessage({
        type: 'done',
        workerId,
        results,
    });
};
