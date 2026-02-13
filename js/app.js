/**
 * app.js - メインアプリケーション
 * 
 * 全モジュールの統合・UI制御・Chart.js連携
 */

import { FORMATIONS, ATTACK_STRATEGIES, DEFENSE_STRATEGIES, getPositions, getMirroredPositions, getFormationList, getAttackStrategyList, getDefenseStrategyList } from './formations.js';
import { simulateMatch } from './simulation.js';
import { QLearningAgent } from './rl-engine.js';
import { FieldRenderer } from './field-renderer.js';

// ===== State =====
let homeFormation = '4-4-2';
let awayFormation = '4-3-3';
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
    buildFormationList();
    buildStrategySelects();
    buildCharts();
    bindEvents();
    updateField();
    handleResize();
}

// ===== Formation List =====
function buildFormationList() {
    const container = document.getElementById('homeFormationList');
    const formations = getFormationList();

    container.innerHTML = formations.map(f => `
    <button class="formation-btn ${f.key === homeFormation ? 'active' : ''}" data-formation="${f.key}">
      <span class="name">${f.name}</span>
      <span class="category-tag ${f.category}">${f.category === 'offensive' ? '攻撃' : f.category === 'defensive' ? '守備' : 'バランス'
        }</span>
    </button>
  `).join('');

    container.querySelectorAll('.formation-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            homeFormation = btn.dataset.formation;
            container.querySelectorAll('.formation-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateField();
            document.getElementById('homeTeamLabel').textContent = homeFormation;
        });
    });
}

// ===== Strategy Selects =====
function buildStrategySelects() {
    const attacks = getAttackStrategyList();
    const defenses = getDefenseStrategyList();
    const formations = getFormationList();

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

    // Away Formation
    const afSelect = document.getElementById('awayFormationSelect');
    afSelect.innerHTML = formations.map(f =>
        `<option value="${f.key}" ${f.key === awayFormation ? 'selected' : ''}>${f.name}</option>`
    ).join('');
    afSelect.addEventListener('change', () => {
        awayFormation = afSelect.value;
        updateField();
        document.getElementById('awayTeamLabel').textContent = awayFormation;
    });

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
    const homePos = getPositions(homeFormation);
    const awayPos = getMirroredPositions(awayFormation);
    renderer.animateTransition(homePos, awayPos);
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
    ];

    sliders.forEach(s => {
        const el = document.getElementById(s.id);
        el.addEventListener('input', () => {
            document.getElementById(s.display).textContent = s.format(parseFloat(el.value));
        });
    });

    // Train button
    document.getElementById('btnTrain').addEventListener('click', startTraining);
    document.getElementById('btnReset').addEventListener('click', resetTraining);
    document.getElementById('btnSingleMatch').addEventListener('click', runSingleMatch);
}

// ===== Training =====
async function startTraining() {
    if (isTraining) return;
    isTraining = true;

    const btn = document.getElementById('btnTrain');
    btn.disabled = true;
    btn.textContent = '⏳ 学習中...';

    // パラメータ更新
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

        // 非同期で少しずつ実行（UIブロック防止）
        await new Promise(resolve => {
            setTimeout(() => {
                agent.train(count);

                // 進捗更新
                const progress = ((i + 1) / batches) * 100;
                document.getElementById('progressBar').style.width = `${progress}%`;
                document.getElementById('progressLabel').textContent = `${Math.round(progress)}%`;

                updateStats();
                updateCharts();

                resolve();
            }, 0);
        });
    }

    // 学習完了
    updateRanking();
    showBestStrategy();
    applyBestStrategyToField();

    btn.disabled = false;
    btn.textContent = '🚀 学習開始';
    isTraining = false;
}

// ===== Stats Update =====
function updateStats() {
    const stats = agent.getStats();
    document.getElementById('statEpisodes').textContent = stats.totalEpisodes;
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

    // Downsample if too many points
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

// ===== Ranking =====
function updateRanking() {
    const ranking = agent.getStrategyRanking(10);
    const tbody = document.getElementById('rankingBody');

    if (ranking.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem;">学習を実行すると結果が表示されます</td></tr>`;
        return;
    }

    tbody.innerHTML = ranking.map((r, i) => {
        const atk = ATTACK_STRATEGIES[r.action.attack];
        const def = DEFENSE_STRATEGIES[r.action.defense];
        return `
      <tr>
        <td class="rank">${i + 1}</td>
        <td class="formation-name">${r.action.formation}</td>
        <td>${atk ? atk.name : r.action.attack}</td>
        <td>${def ? def.name : r.action.defense}</td>
        <td class="q-value">${r.maxQ.toFixed(3)}</td>
      </tr>
    `;
    }).join('');
}

// ===== Best Strategy Banner =====
function showBestStrategy() {
    const best = agent.getBestStrategy();
    if (!best.action) return;

    const banner = document.getElementById('bestStrategyBanner');
    banner.classList.add('visible');

    document.getElementById('bestFormation').textContent = best.action.formation;
    document.getElementById('bestAttack').textContent =
        ATTACK_STRATEGIES[best.action.attack]?.name || best.action.attack;
    document.getElementById('bestDefense').textContent =
        DEFENSE_STRATEGIES[best.action.defense]?.name || best.action.defense;
}

function applyBestStrategyToField() {
    const best = agent.getBestStrategy();
    if (!best.action) return;

    homeFormation = best.action.formation;
    document.getElementById('homeTeamLabel').textContent = homeFormation;

    // Update active formation button
    document.querySelectorAll('#homeFormationList .formation-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.formation === homeFormation);
    });

    // Update strategy selects
    if (best.action.attack) {
        homeAttack = best.action.attack;
        document.getElementById('homeAttackStrategy').value = homeAttack;
    }
    if (best.action.defense) {
        homeDefense = best.action.defense;
        document.getElementById('homeDefenseStrategy').value = homeDefense;
    }

    updateField();
}

// ===== Single Match Test =====
function runSingleMatch() {
    const result = simulateMatch(
        homeFormation, awayFormation,
        homeAttack, homeDefense,
        awayAttack, awayDefense
    );

    // Result animation on field
    const homePos = getPositions(homeFormation, 'attack');
    const awayPos = getMirroredPositions(awayFormation, 'defense');
    renderer.animateTransition(homePos, awayPos, 1000);

    // Show result in alert-like style
    const winnerText = result.winner === 'home' ? '🎉 ホーム勝利！' :
        result.winner === 'away' ? '😔 アウェイ勝利' : '🤝 引き分け';

    const msg = `${winnerText}\n\n` +
        `スコア: ${result.homeGoals} - ${result.awayGoals}\n` +
        `ポゼッション: ${(result.homePossession * 100).toFixed(0)}% - ${(result.awayPossession * 100).toFixed(0)}%\n` +
        `シュート: ${result.homeShots} - ${result.awayShots}`;

    // Use a non-blocking notification
    showMatchNotification(msg, result.winner);
}

function showMatchNotification(msg, winner) {
    // Remove existing notification
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
    updateStats();
    updateRanking();

    // Reset charts
    rewardChart.data.labels = [];
    rewardChart.data.datasets[0].data = [];
    rewardChart.update();
    winRateChart.data.labels = [];
    winRateChart.data.datasets[0].data = [];
    winRateChart.update();

    // Reset progress
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressLabel').textContent = '0%';

    // Reset epsilon slider
    document.getElementById('epsilon').value = 1.0;
    document.getElementById('epValue').textContent = '1.00';

    // Hide best banner
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
