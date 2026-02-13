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

// ===== API: 全網羅探索（worker_threads 並列 + SSE進捗配信） =====
app.post('/api/full-search', async (req, res) => {
    // SSEヘッダ設定
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    const sendSSE = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
        const { matchesPerPair = 1 } = req.body;

        const cpuCount = os.cpus().length;
        const workerCount = Math.min(cpuCount, 8);

        console.log(`[Full Search] Genetic Algorithm: ${workerCount} islands × 50 pop × 20 gen`);

        const workerProgress = {};
        const workerTotals = {};
        const startTime = Date.now();
        const workerPromises = [];

        for (let w = 0; w < workerCount; w++) {
            workerProgress[w] = 0;
            // GA: 50 individual * 20 generations
            workerTotals[w] = 50 * 20;

            const promise = new Promise((resolve, reject) => {
                const worker = new Worker(path.join(__dirname, 'server', 'ga-worker.js'), {
                    workerData: {
                        matchesPerPair,
                        workerId: w,
                    },
                });

                worker.on('message', (msg) => {
                    if (msg.type === 'progress') {
                        workerProgress[msg.workerId] = msg.completed;
                        // 全ワーカーの合計進捗を計算
                        const completedTotal = Object.values(workerProgress).reduce((a, b) => a + b, 0);
                        const grandTotal = Object.values(workerTotals).reduce((a, b) => a + b, 0);
                        const pct = Math.round((completedTotal / grandTotal) * 100);
                        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

                        // 進捗と暫定ベスト情報を送信
                        sendSSE({
                            type: 'progress',
                            percent: pct,
                            completed: completedTotal,
                            total: grandTotal,
                            elapsedSeconds: parseFloat(elapsed),
                            bestFitness: msg.bestFitness
                        });
                        process.stdout.write(`\r[GA Search] ${pct}% (Gen ${msg.generation})`);
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

        // 全ワーカーの結果を統合 (Islands Best)
        const allIndividuals = [];
        for (const res of workerResults) {
            if (res.population) {
                allIndividuals.push(...res.population);
            }
        }

        const matchesPerGen = 50 * 20 * 20; // 20000 matches per worker roughly
        const totalMatches = matchesPerGen * workerCount; // approx
        console.log(`\n[GA Search] Complete: Integrated ${allIndividuals.length} elite individuals`);

        // ランキング生成
        const rankings = allIndividuals
            .map(ind => ({
                action: {
                    atkFormation: ind.atkFormation,
                    defFormation: ind.defFormation,
                    attack: ind.attack,
                    defense: ind.defense,
                    fwType: ind.fwType,
                    mfType: ind.mfType,
                    dfType: ind.dfType
                },
                avgReward: ind.stats.avgReward,
                winRate: ind.stats.winRate,
                avgGoals: ind.stats.avgGoals,
                avgConceded: ind.stats.avgConceded,
                matchCount: ind.stats.matchCount,
            }))
            .sort((a, b) => b.avgReward - a.avgReward);

        const best = rankings[0] || null;

        sendSSE({
            type: 'done',
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
        sendSSE({ type: 'error', message: err.message });
    }

    res.end();
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
