/**
 * server/sim-worker.js - worker_threads ワーカー
 * 
 * 割り当てられたホーム戦術バッチを全対戦相手に対してシミュレーションし、
 * 集計結果を親スレッドに返す。
 */

const { parentPort, workerData } = require('worker_threads');
const { simulateMatch } = require('./simulation');
const { getAllActions } = require('./formations');

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

const { homeActions, matchesPerPair, workerId } = workerData;
const allOppActions = getAllActions();
const results = {};
let completed = 0;

for (const home of homeActions) {
    const homeKey = `${home.atkFormation}|${home.defFormation}|${home.attack}|${home.defense}`;
    const stats = {
        action: home,
        key: homeKey,
        totalWins: 0, totalDraws: 0, totalLosses: 0,
        totalGoals: 0, totalConceded: 0, totalPossession: 0,
        totalShots: 0, totalReward: 0, matchCount: 0,
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

    // 進捗報告（20戦術ごと）
    if (completed % 20 === 0 || completed === homeActions.length) {
        parentPort.postMessage({
            type: 'progress',
            workerId,
            completed,
            total: homeActions.length,
        });
    }
}

// 完了通知
parentPort.postMessage({
    type: 'done',
    workerId,
    results,
});
