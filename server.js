/**
 * server.js - Express サーバー
 * 
 * 静的ファイル配信 + REST API（シミュレーション処理はworker_threadsで並列実行）
 */

const express = require('express');
const path = require('path');
const os = require('os');
const { Worker } = require('worker_threads');
const { simulateMatch } = require('./server/simulation');
const { getAllActions, ATTACK_STRATEGIES, DEFENSE_STRATEGIES } = require('./server/formations');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 静的ファイル配信
app.use(express.static(path.join(__dirname)));

// ===== API: 1試合テスト =====
app.post('/api/single-match', (req, res) => {
    try {
        const { home, away } = req.body;
        const result = simulateMatch(home, away);
        res.json(result);
    } catch (err) {
        console.error('Single match error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ===== API: Q-Learning 学習 =====
app.post('/api/train', (req, res) => {
    try {
        const { episodes = 500 } = req.body;
        const allActions = getAllActions();
        const history = [];
        let bestResult = null;
        let bestScore = -Infinity;

        for (let i = 0; i < episodes; i++) {
            const home = allActions[Math.floor(Math.random() * allActions.length)];
            const opp = allActions[Math.floor(Math.random() * allActions.length)];

            const result = simulateMatch(
                { atkFormation: home.atkFormation, defFormation: home.defFormation, atkStrategy: home.attack, defStrategy: home.defense },
                { atkFormation: opp.atkFormation, defFormation: opp.defFormation, atkStrategy: opp.attack, defStrategy: opp.defense }
            );

            const reward = calculateReward(result);
            history.push({ action: home, reward, result });

            if (reward > bestScore) {
                bestScore = reward;
                bestResult = {
                    atkFormation: home.atkFormation,
                    defFormation: home.defFormation,
                    attack: home.attack,
                    defense: home.defense,
                    score: reward,
                    matchResult: result,
                };
            }
        }

        // ランキング生成: アクション別に平均報酬を集計
        const actionStats = {};
        for (const h of history) {
            const key = `${h.action.atkFormation}|${h.action.defFormation}|${h.action.attack}|${h.action.defense}`;
            if (!actionStats[key]) {
                actionStats[key] = { action: h.action, total: 0, count: 0, wins: 0, goals: 0, conceded: 0 };
            }
            const s = actionStats[key];
            s.total += h.reward;
            s.count++;
            if (h.result.winner === 'home') s.wins++;
            s.goals += h.result.homeGoals;
            s.conceded += h.result.awayGoals;
        }

        const rankings = Object.values(actionStats)
            .map(s => ({
                action: s.action,
                avgReward: s.total / s.count,
                winRate: s.wins / s.count,
                avgGoals: s.goals / s.count,
                avgConceded: s.conceded / s.count,
                matchCount: s.count,
            }))
            .sort((a, b) => b.avgReward - a.avgReward)
            .slice(0, 15);

        res.json({
            totalEpisodes: episodes,
            rankings,
            best: bestResult,
        });
    } catch (err) {
        console.error('Train error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ===== API: 全網羅探索（worker_threads 並列） =====
app.post('/api/full-search', async (req, res) => {
    try {
        const { matchesPerPair = 1 } = req.body;
        const allActions = getAllActions();

        const cpuCount = os.cpus().length;
        const workerCount = Math.min(cpuCount, 8);
        const chunkSize = Math.ceil(allActions.length / workerCount);

        console.log(`[Full Search] ${allActions.length} tactics × ${allActions.length} opponents × ${matchesPerPair} matches = ${(allActions.length * allActions.length * matchesPerPair).toLocaleString()} total matches`);
        console.log(`[Full Search] Using ${workerCount} worker threads (${cpuCount} CPUs detected)`);

        const startTime = Date.now();

        const workerPromises = [];

        for (let w = 0; w < workerCount; w++) {
            const start = w * chunkSize;
            const end = Math.min(start + chunkSize, allActions.length);
            const chunk = allActions.slice(start, end);

            if (chunk.length === 0) continue;

            const promise = new Promise((resolve, reject) => {
                const worker = new Worker(path.join(__dirname, 'server', 'sim-worker.js'), {
                    workerData: {
                        homeActions: chunk,
                        matchesPerPair,
                        workerId: w,
                    },
                });

                worker.on('message', (msg) => {
                    if (msg.type === 'progress') {
                        // サーバーログに進捗表示
                        const pct = ((msg.completed / msg.total) * 100).toFixed(0);
                        process.stdout.write(`\r[Worker ${msg.workerId}] ${pct}% (${msg.completed}/${msg.total})`);
                    }
                    if (msg.type === 'done') {
                        resolve(msg.results);
                    }
                });

                worker.on('error', reject);
                worker.on('exit', (code) => {
                    if (code !== 0) reject(new Error(`Worker ${w} exited with code ${code}`));
                });
            });

            workerPromises.push(promise);
        }

        const workerResults = await Promise.all(workerPromises);

        // 全ワーカーの結果を統合
        const allResults = {};
        for (const results of workerResults) {
            Object.assign(allResults, results);
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const totalMatches = Object.values(allResults).reduce((sum, s) => sum + s.matchCount, 0);
        console.log(`\n[Full Search] Complete: ${totalMatches.toLocaleString()} matches in ${elapsed}s`);

        // ランキング生成
        const rankings = Object.values(allResults)
            .map(s => ({
                action: s.action,
                avgReward: s.totalReward / s.matchCount,
                winRate: s.totalWins / s.matchCount,
                drawRate: s.totalDraws / s.matchCount,
                lossRate: s.totalLosses / s.matchCount,
                avgGoals: s.totalGoals / s.matchCount,
                avgConceded: s.totalConceded / s.matchCount,
                avgPossession: s.totalPossession / s.matchCount,
                matchCount: s.matchCount,
            }))
            .sort((a, b) => b.avgReward - a.avgReward);

        const best = rankings[0] || null;

        res.json({
            rankings: rankings.slice(0, 30),
            totalMatches,
            workerCount,
            elapsedSeconds: parseFloat(elapsed),
            best: best ? {
                atkFormation: best.action.atkFormation,
                defFormation: best.action.defFormation,
                attack: best.action.attack,
                defense: best.action.defense,
                score: best.avgReward,
                winRate: best.winRate,
                avgGoals: best.avgGoals,
                avgConceded: best.avgConceded,
            } : null,
        });
    } catch (err) {
        console.error('Full search error:', err);
        res.status(500).json({ error: err.message });
    }
});

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

app.listen(PORT, () => {
    console.log(`\n⚽ Soccer Tactics AI Server`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   CPUs: ${os.cpus().length} cores`);
    console.log(`   Workers: up to ${Math.min(os.cpus().length, 8)} threads\n`);
});
