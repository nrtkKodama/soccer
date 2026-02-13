/**
 * app.js - メインアプリケーション
 * 
 * 全モジュールの統合・UI制御・Chart.js連携
 * 攻守別フォーメーション対応
 */

import { FORMATIONS, ATTACK_STRATEGIES, DEFENSE_STRATEGIES, getPositions, getMirroredPositions, getFormationList, getAttackStrategyList, getDefenseStrategyList } from './formations.js';
import { simulateMatch } from './simulation.js';
import { QLearningAgent } from './rl-engine.js';
import { FieldRenderer } from './field-renderer.js';

// ===== State =====
let homeAtkFormation = '4-3-3';
let homeDefFormation = '4-4-2';
let awayAtkFormation = '4-3-3';
let awayDefFormation = '4-4-2';
let homeAttack = 'possession';
let homeDefense = 'zonal';
let awayAttack = 'counter';
let awayDefense = 'manMark';
let isTraining = false;

// ===== Modules =====
let canvas;
let renderer;
const agent = new QLearningAgent();

// ===== Charts =====
let rewardChart = null;
let winRateChart = null;

// ===== Init =====
function init() {
    canvas = document.getElementById('fieldCanvas');
    renderer = new FieldRenderer(canvas);
    buildFormationSelects();
    buildStrategySelects();
    buildCharts();
    bindEvents();
    updateField();
    handleResize();
}

// ===== Formation Selects (攻守別) =====
function buildFormationSelects() {
    const formations = getFormationList();

    const selects = [
        { id: 'homeAtkFormation', current: homeAtkFormation },
        { id: 'homeDefFormation', current: homeDefFormation },
        { id: 'awayAtkFormation', current: awayAtkFormation },
        { id: 'awayDefFormation', current: awayDefFormation },
    ];

    selects.forEach(s => {
        const el = document.getElementById(s.id);
        if (!el) return;
        el.innerHTML = formations.map(f =>
            `<option value="${f.key}" ${f.key === s.current ? 'selected' : ''}>${f.name}</option>`
        ).join('');
    });
}

// ===== Strategy Selects =====
function buildStrategySelects() {
    const attacks = getAttackStrategyList();
    const defenses = getDefenseStrategyList();

    // Home Attack
    const haSelect = document.getElementById('homeAttackStrategy');
    haSelect.innerHTML = attacks.map(a =>
        `<option value="${a.key}" ${a.key === homeAttack ? 'selected' : ''}>${a.name}</option>`
    ).join('');
    haSelect.addEventListener('change', () => {
        homeAttack = haSelect.value;
        const strat = attacks.find(a => a.key === homeAttack);
        document.getElementById('homeAttackDesc').textContent = strat ? strat.description : '';
    });
    document.getElementById('homeAttackDesc').textContent = attacks.find(a => a.key === homeAttack)?.description || '';

    // Home Defense
    const hdSelect = document.getElementById('homeDefenseStrategy');
    hdSelect.innerHTML = defenses.map(d =>
        `<option value="${d.key}" ${d.key === homeDefense ? 'selected' : ''}>${d.name}</option>`
    ).join('');
    hdSelect.addEventListener('change', () => {
        homeDefense = hdSelect.value;
        const strat = defenses.find(d => d.key === homeDefense);
        document.getElementById('homeDefenseDesc').textContent = strat ? strat.description : '';
    });
    document.getElementById('homeDefenseDesc').textContent = defenses.find(d => d.key === homeDefense)?.description || '';

    // Away Attack
    const aaSelect = document.getElementById('awayAttackStrategy');
    aaSelect.innerHTML = attacks.map(a =>
        `<option value="${a.key}" ${a.key === awayAttack ? 'selected' : ''}>${a.name}</option>`
    ).join('');
    aaSelect.addEventListener('change', () => { awayAttack = aaSelect.value; });

    // Away Defense
    const adSelect = document.getElementById('awayDefenseStrategy');
    adSelect.innerHTML = defenses.map(d =>
        `<option value="${d.key}" ${d.key === awayDefense ? 'selected' : ''}>${d.name}</option>`
    ).join('');
    adSelect.addEventListener('change', () => { awayDefense = adSelect.value; });
}

// ===== Field Update =====
function updateField() {
    // 攻撃時フォーメーションでフィールド表示
    const homePos = getPositions(homeAtkFormation);
    const awayPos = getMirroredPositions(awayAtkFormation);
    renderer.animateTransition(homePos, awayPos);

    document.getElementById('homeTeamLabel').textContent = `攻:${homeAtkFormation} / 守:${homeDefFormation}`;
    document.getElementById('awayTeamLabel').textContent = `攻:${awayAtkFormation} / 守:${awayDefFormation}`;
}

// ===== Chart.js =====
function buildCharts() {
    const chartDefaults = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#64748b', font: { size: 10 } },
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#64748b', font: { size: 10 } },
            },
        },
    };

    rewardChart = new Chart(document.getElementById('rewardChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '報酬',
                data: [],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 1.5,
                fill: true,
                tension: 0.3,
                pointRadius: 0,
            }],
        },
        options: {
            ...chartDefaults,
            scales: {
                ...chartDefaults.scales,
                y: {
                    ...chartDefaults.scales.y,
                    title: { display: true, text: '報酬', color: '#64748b', font: { size: 10 } },
                },
                x: {
                    ...chartDefaults.scales.x,
                    title: { display: true, text: 'エピソード', color: '#64748b', font: { size: 10 } },
                },
            },
        },
    });

    winRateChart = new Chart(document.getElementById('winRateChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '勝率',
                data: [],
                borderColor: '#34d399',
                backgroundColor: 'rgba(52, 211, 153, 0.1)',
                borderWidth: 1.5,
                fill: true,
                tension: 0.3,
                pointRadius: 0,
            }],
        },
        options: {
            ...chartDefaults,
            scales: {
                ...chartDefaults.scales,
                y: {
                    ...chartDefaults.scales.y,
                    min: 0,
                    max: 1,
                    title: { display: true, text: '勝率', color: '#64748b', font: { size: 10 } },
                },
                x: {
                    ...chartDefaults.scales.x,
                    title: { display: true, text: 'エピソード', color: '#64748b', font: { size: 10 } },
                },
            },
        },
    });
}

// ===== Events =====
function bindEvents() {
    // Param sliders
    const sliders = [
        { id: 'learningRate', display: 'lrValue', format: v => v.toFixed(2) },
        { id: 'discountFactor', display: 'dfValue', format: v => v.toFixed(2) },
        { id: 'epsilon', display: 'epValue', format: v => v.toFixed(2) },
        { id: 'epsilonDecay', display: 'edValue', format: v => v.toFixed(3) },
        { id: 'episodeCount', display: 'epCountValue', format: v => Math.round(v).toString() },
        { id: 'matchesPerPair', display: 'mppValue', format: v => Math.round(v).toString() },
    ];

    sliders.forEach(s => {
        const el = document.getElementById(s.id);
        if (!el) return;
        el.addEventListener('input', () => {
            document.getElementById(s.display).textContent = s.format(parseFloat(el.value));
        });
    });

    // Formation selects
    document.getElementById('homeAtkFormation')?.addEventListener('change', (e) => {
        homeAtkFormation = e.target.value;
        updateField();
    });
    document.getElementById('homeDefFormation')?.addEventListener('change', (e) => {
        homeDefFormation = e.target.value;
        updateField();
    });
    document.getElementById('awayAtkFormation')?.addEventListener('change', (e) => {
        awayAtkFormation = e.target.value;
        updateField();
    });
    document.getElementById('awayDefFormation')?.addEventListener('change', (e) => {
        awayDefFormation = e.target.value;
        updateField();
    });

    // Train button
    document.getElementById('btnTrain').addEventListener('click', startTraining);
    document.getElementById('btnReset').addEventListener('click', resetTraining);
    document.getElementById('btnSingleMatch').addEventListener('click', runSingleMatch);
    document.getElementById('btnFullSearch').addEventListener('click', startFullSearch);
}

// ===== Training (Q-Learning) =====
async function startTraining() {
    if (isTraining) return;
    isTraining = true;

    const btn = document.getElementById('btnTrain');
    btn.disabled = true;
    btn.textContent = '⏳ 学習中...';
    document.getElementById('btnFullSearch').disabled = true;

    agent.updateParams({
        learningRate: parseFloat(document.getElementById('learningRate').value),
        discountFactor: parseFloat(document.getElementById('discountFactor').value),
        epsilon: parseFloat(document.getElementById('epsilon').value),
        epsilonDecay: parseFloat(document.getElementById('epsilonDecay').value),
    });

    const totalEpisodes = parseInt(document.getElementById('episodeCount').value);
    const batchSize = 10;
    const batches = Math.ceil(totalEpisodes / batchSize);

    for (let i = 0; i < batches; i++) {
        const count = Math.min(batchSize, totalEpisodes - i * batchSize);

        await new Promise(resolve => {
            setTimeout(() => {
                agent.train(count);
                const progress = ((i + 1) / batches) * 100;
                document.getElementById('progressBar').style.width = `${progress}%`;
                document.getElementById('progressLabel').textContent = `${Math.round(progress)}%`;
                updateStats();
                updateCharts();
                resolve();
            }, 0);
        });
    }

    updateRanking();
    showBestStrategy();
    applyBestStrategyToField();

    btn.disabled = false;
    btn.textContent = '🚀 Q-Learning';
    document.getElementById('btnFullSearch').disabled = false;
    isTraining = false;
}

// ===== Full Search (全網羅探索) =====
let fullSearchResults = null;

async function startFullSearch() {
    if (isTraining) return;
    isTraining = true;

    const btn = document.getElementById('btnFullSearch');
    btn.disabled = true;
    btn.textContent = '⏳ 全探索中...';
    document.getElementById('btnTrain').disabled = true;

    agent.reset();
    agent.updateParams({
        learningRate: parseFloat(document.getElementById('learningRate').value),
    });

    const matchesPerPair = parseInt(document.getElementById('matchesPerPair')?.value || '3');

    // 全アクション生成（攻撃F × 守備F × 攻撃戦略 × 守備戦略 = 6×6×4×4=576 通り）
    const allActions = agent._getActions();
    const totalCombos = allActions.length * allActions.length;
    const totalMatches = totalCombos * matchesPerPair;
    document.getElementById('progressLabel').textContent = `0% (${totalMatches.toLocaleString()}試合)`;

    const strategyStats = {};
    let completedHome = 0;

    for (const home of allActions) {
        await new Promise(resolve => {
            setTimeout(() => {
                const homeKey = `${home.atkFormation}|${home.defFormation}|${home.attack}|${home.defense}`;
                if (!strategyStats[homeKey]) {
                    strategyStats[homeKey] = {
                        action: home, key: homeKey,
                        totalWins: 0, totalDraws: 0, totalLosses: 0,
                        totalGoals: 0, totalConceded: 0, totalPossession: 0,
                        totalShots: 0, totalReward: 0, matchCount: 0,
                    };
                }

                for (const opp of allActions) {
                    for (let m = 0; m < matchesPerPair; m++) {
                        const result = simulateMatch(
                            { atkFormation: home.atkFormation, defFormation: home.defFormation, atkStrategy: home.attack, defStrategy: home.defense },
                            { atkFormation: opp.atkFormation, defFormation: opp.defFormation, atkStrategy: opp.attack, defStrategy: opp.defense }
                        );
                        const reward = agent._calculateReward(result);
                        const s = strategyStats[homeKey];
                        s.matchCount++;
                        s.totalReward += reward;
                        s.totalGoals += result.homeGoals;
                        s.totalConceded += result.awayGoals;
                        s.totalPossession += result.homePossession;
                        s.totalShots += result.homeShots;
                        if (result.winner === 'home') s.totalWins++;
                        else if (result.winner === 'draw') s.totalDraws++;
                        else s.totalLosses++;

                        agent.episodeCount++;
                    }
                }

                completedHome++;
                const progress = (completedHome / allActions.length) * 100;
                document.getElementById('progressBar').style.width = `${progress}%`;
                document.getElementById('progressLabel').textContent =
                    `${Math.round(progress)}% (${agent.episodeCount.toLocaleString()}試合完了)`;
                updateStats();

                resolve();
            }, 0);
        });
    }

    // ランキング生成
    fullSearchResults = Object.values(strategyStats)
        .map(s => ({
            ...s,
            avgReward: s.totalReward / s.matchCount,
            winRate: s.totalWins / s.matchCount,
            drawRate: s.totalDraws / s.matchCount,
            lossRate: s.totalLosses / s.matchCount,
            avgGoals: s.totalGoals / s.matchCount,
            avgConceded: s.totalConceded / s.matchCount,
            avgPossession: s.totalPossession / s.matchCount,
        }))
        .sort((a, b) => b.avgReward - a.avgReward);

    // bestResult 更新
    if (fullSearchResults.length > 0) {
        const best = fullSearchResults[0];
        agent.bestResult = {
            atkFormation: best.action.atkFormation,
            defFormation: best.action.defFormation,
            attack: best.action.attack,
            defense: best.action.defense,
            score: best.avgReward,
            winRate: best.winRate,
            avgGoals: best.avgGoals,
            avgConceded: best.avgConceded,
        };
        agent.bestScore = best.avgReward;
    }

    updateStats();
    updateCharts();
    updateFullSearchRanking();
    showBestStrategy();
    applyBestStrategyToField();

    btn.disabled = false;
    btn.textContent = '🔍 全網羅探索';
    document.getElementById('btnTrain').disabled = false;
    document.getElementById('progressLabel').textContent = '完了!';
    isTraining = false;
}

// ===== Stats Update =====
function updateStats() {
    const stats = agent.getStats();
    document.getElementById('statEpisodes').textContent = stats.totalEpisodes.toLocaleString();
    document.getElementById('statWinRate').textContent = `${(stats.recentWinRate * 100).toFixed(0)}%`;
    document.getElementById('statAvgReward').textContent = stats.recentAvgReward.toFixed(2);
    document.getElementById('statEpsilon').textContent = stats.epsilon.toFixed(3);
    document.getElementById('statQSize').textContent = stats.qTableSize;
    document.getElementById('statBestScore').textContent =
        stats.bestResult ? stats.bestResult.score.toFixed(2) : '-';
}

// ===== Charts Update =====
function updateCharts() {
    const stats = agent.getStats();

    const maxPoints = 200;
    const rewards = stats.rewardHistory;
    const winRates = stats.winRateHistory;

    let sampledRewards, sampledWinRates, labels;

    if (rewards.length > maxPoints) {
        const step = Math.ceil(rewards.length / maxPoints);
        sampledRewards = [];
        sampledWinRates = [];
        labels = [];
        for (let i = 0; i < rewards.length; i += step) {
            const end = Math.min(i + step, rewards.length);
            const slice = rewards.slice(i, end);
            sampledRewards.push(slice.reduce((a, b) => a + b, 0) / slice.length);
            if (winRates.length > i) {
                const wSlice = winRates.slice(i, end);
                sampledWinRates.push(wSlice.reduce((a, b) => a + b, 0) / wSlice.length);
            }
            labels.push(i + 1);
        }
    } else {
        sampledRewards = rewards;
        sampledWinRates = winRates;
        labels = rewards.map((_, i) => i + 1);
    }

    rewardChart.data.labels = labels;
    rewardChart.data.datasets[0].data = sampledRewards;
    rewardChart.update('none');

    winRateChart.data.labels = labels;
    winRateChart.data.datasets[0].data = sampledWinRates;
    winRateChart.update('none');
}

// ===== Ranking (Q-Learning) =====
function updateRanking() {
    const ranking = agent.getStrategyRanking(10);
    const tbody = document.getElementById('rankingBody');

    if (ranking.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:2rem;">学習を実行すると結果が表示されます</td></tr>`;
        return;
    }

    tbody.innerHTML = ranking.map((r, i) => {
        const atk = ATTACK_STRATEGIES[r.action.attack];
        const def = DEFENSE_STRATEGIES[r.action.defense];
        return `
      <tr>
        <td class="rank">${i + 1}</td>
        <td class="formation-name">${r.action.atkFormation}</td>
        <td class="formation-name">${r.action.defFormation}</td>
        <td>${atk ? atk.name : r.action.attack}</td>
        <td>${def ? def.name : r.action.defense}</td>
        <td class="q-value">${r.maxQ.toFixed(3)}</td>
        <td>-</td>
        <td>-</td>
      </tr>
    `;
    }).join('');
}

// ===== Ranking (Full Search) =====
function updateFullSearchRanking() {
    const tbody = document.getElementById('rankingBody');

    if (!fullSearchResults || fullSearchResults.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:2rem;">全網羅探索を実行すると結果が表示されます</td></tr>`;
        return;
    }

    const top = fullSearchResults.slice(0, 15);
    tbody.innerHTML = top.map((r, i) => {
        const atk = ATTACK_STRATEGIES[r.action.attack];
        const def = DEFENSE_STRATEGIES[r.action.defense];
        return `
      <tr>
        <td class="rank">${i + 1}</td>
        <td class="formation-name">${r.action.atkFormation}</td>
        <td class="formation-name">${r.action.defFormation}</td>
        <td>${atk ? atk.name : r.action.attack}</td>
        <td>${def ? def.name : r.action.defense}</td>
        <td class="q-value">${r.avgReward.toFixed(3)}</td>
        <td style="color:var(--accent-green)">${(r.winRate * 100).toFixed(1)}%</td>
        <td style="color:var(--text-secondary)">${r.avgGoals.toFixed(2)} - ${r.avgConceded.toFixed(2)}</td>
      </tr>
    `;
    }).join('');
}

// ===== Best Strategy Banner =====
function showBestStrategy() {
    const bestResult = agent.bestResult;
    if (!bestResult) return;

    const banner = document.getElementById('bestStrategyBanner');
    banner.classList.add('visible');

    document.getElementById('bestAtkFormation').textContent = bestResult.atkFormation;
    document.getElementById('bestDefFormation').textContent = bestResult.defFormation;
    document.getElementById('bestAttack').textContent =
        ATTACK_STRATEGIES[bestResult.attack]?.name || bestResult.attack;
    document.getElementById('bestDefense').textContent =
        DEFENSE_STRATEGIES[bestResult.defense]?.name || bestResult.defense;

    const statsEl = document.getElementById('bestExtraStats');
    if (statsEl && bestResult.winRate !== undefined) {
        statsEl.innerHTML = `
            <div class="best-item">
                <div class="best-item-label">勝率</div>
                <div class="best-item-value" style="color:var(--accent-green)">${(bestResult.winRate * 100).toFixed(1)}%</div>
            </div>
            <div class="best-item">
                <div class="best-item-label">平均得点</div>
                <div class="best-item-value" style="color:var(--accent-cyan)">${bestResult.avgGoals?.toFixed(2) || '-'}</div>
            </div>
            <div class="best-item">
                <div class="best-item-label">平均失点</div>
                <div class="best-item-value" style="color:var(--accent-red)">${bestResult.avgConceded?.toFixed(2) || '-'}</div>
            </div>
        `;
        statsEl.style.display = 'grid';
    }
}

function applyBestStrategyToField() {
    const bestResult = agent.bestResult;
    if (!bestResult) return;

    homeAtkFormation = bestResult.atkFormation;
    homeDefFormation = bestResult.defFormation;

    // Update formation selects
    const atkSel = document.getElementById('homeAtkFormation');
    const defSel = document.getElementById('homeDefFormation');
    if (atkSel) atkSel.value = homeAtkFormation;
    if (defSel) defSel.value = homeDefFormation;

    // Update strategy selects
    if (bestResult.attack) {
        homeAttack = bestResult.attack;
        document.getElementById('homeAttackStrategy').value = homeAttack;
    }
    if (bestResult.defense) {
        homeDefense = bestResult.defense;
        document.getElementById('homeDefenseStrategy').value = homeDefense;
    }

    updateField();
}

// ===== Single Match Test =====
function runSingleMatch() {
    const result = simulateMatch(
        { atkFormation: homeAtkFormation, defFormation: homeDefFormation, atkStrategy: homeAttack, defStrategy: homeDefense },
        { atkFormation: awayAtkFormation, defFormation: awayDefFormation, atkStrategy: awayAttack, defStrategy: awayDefense }
    );

    const homePos = getPositions(homeAtkFormation, 'attack');
    const awayPos = getMirroredPositions(awayAtkFormation, 'defense');
    renderer.animateTransition(homePos, awayPos, 1000);

    const winnerText = result.winner === 'home' ? '🎉 ホーム勝利！' :
        result.winner === 'away' ? '😔 アウェイ勝利' : '🤝 引き分け';

    const msg = `${winnerText}\n\n` +
        `スコア: ${result.homeGoals} - ${result.awayGoals}\n` +
        `ポゼッション: ${(result.homePossession * 100).toFixed(0)}% - ${(result.awayPossession * 100).toFixed(0)}%\n` +
        `シュート: ${result.homeShots} - ${result.awayShots}`;

    showMatchNotification(msg, result.winner);
}

function showMatchNotification(msg, winner) {
    const existing = document.querySelector('.match-notification');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = 'match-notification';
    div.style.cssText = `
    position: fixed;
    top: 5rem;
    right: 1.5rem;
    background: ${winner === 'home' ? 'rgba(52, 211, 153, 0.15)' : winner === 'away' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(251, 191, 36, 0.15)'};
    border: 1px solid ${winner === 'home' ? 'rgba(52, 211, 153, 0.3)' : winner === 'away' ? 'rgba(248, 113, 113, 0.3)' : 'rgba(251, 191, 36, 0.3)'};
    color: var(--text-primary);
    padding: 1rem 1.5rem;
    border-radius: 12px;
    font-size: 0.85rem;
    white-space: pre-line;
    backdrop-filter: blur(20px);
    z-index: 1000;
    animation: slideIn 0.4s ease;
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    max-width: 320px;
  `;
    div.textContent = msg;

    document.body.appendChild(div);
    setTimeout(() => {
        div.style.transition = 'all 0.4s ease';
        div.style.opacity = '0';
        div.style.transform = 'translateY(-10px)';
        setTimeout(() => div.remove(), 400);
    }, 4000);
}

// ===== Reset =====
function resetTraining() {
    agent.reset();
    fullSearchResults = null;
    updateStats();
    updateRanking();

    rewardChart.data.labels = [];
    rewardChart.data.datasets[0].data = [];
    rewardChart.update();
    winRateChart.data.labels = [];
    winRateChart.data.datasets[0].data = [];
    winRateChart.update();

    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressLabel').textContent = '0%';

    document.getElementById('epsilon').value = 1.0;
    document.getElementById('epValue').textContent = '1.00';

    document.getElementById('bestStrategyBanner').classList.remove('visible');
}

// ===== Resize Handler =====
function handleResize() {
    window.addEventListener('resize', () => {
        renderer.resize();
        updateField();
    });
}

// ===== Start =====
document.addEventListener('DOMContentLoaded', init);
