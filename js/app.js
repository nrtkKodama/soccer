/**
 * app.js - メインアプリケーション
 * 
 * UIのみ担当。シミュレーション処理はすべてバックエンドAPIに委託。
 */

import { FORMATIONS, ATTACK_STRATEGIES, DEFENSE_STRATEGIES, getPositions, getMirroredPositions, getFormationList, getAttackStrategyList, getDefenseStrategyList, getFormationGuide } from './formations.js';
import { FieldRenderer } from './field-renderer.js';

// ===== State =====
let homeAtkFormation = '4-3-3';
let homeDefFormation = '4-4-2';
let awayAtkFormation = '4-3-3';
let awayDefFormation = '4-4-2';
let homeAttack = 'possession';
let homeDefense = 'forecheck';
let awayAttack = 'shortCounter';
let awayDefense = 'aggressive';
let isTraining = false;

// ===== Modules =====
let canvas;
let renderer;

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

// ===== Formation Selects =====
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

    const aaSelect = document.getElementById('awayAttackStrategy');
    aaSelect.innerHTML = attacks.map(a =>
        `<option value="${a.key}" ${a.key === awayAttack ? 'selected' : ''}>${a.name}</option>`
    ).join('');
    aaSelect.addEventListener('change', () => { awayAttack = aaSelect.value; });

    const adSelect = document.getElementById('awayDefenseStrategy');
    adSelect.innerHTML = defenses.map(d =>
        `<option value="${d.key}" ${d.key === awayDefense ? 'selected' : ''}>${d.name}</option>`
    ).join('');
    adSelect.addEventListener('change', () => { awayDefense = adSelect.value; });
}

// ===== Field Update =====
function updateField() {
    const homePos = getPositions(homeAtkFormation);
    const awayPos = getMirroredPositions(awayAtkFormation);
    renderer.animateTransition(homePos, awayPos);
    document.getElementById('homeTeamLabel').textContent = `攻:${homeAtkFormation} / 守:${homeDefFormation}`;
    document.getElementById('awayTeamLabel').textContent = `攻:${awayAtkFormation} / 守:${awayDefFormation}`;

    updatePositionGuide();
}

// ===== Position Guide =====
function updatePositionGuide() {
    const guide = getFormationGuide(homeAtkFormation);
    const tbody = document.getElementById('positionGuideBody');
    const formationNameEl = document.getElementById('guideFormationName');

    if (formationNameEl) formationNameEl.textContent = homeAtkFormation;
    if (!tbody) return;

    tbody.innerHTML = guide.map(item => {
        const badges = item.keyStats.map(stat => `<span class="stat-badge">${stat}</span>`).join('');
        const noteHtml = item.note ? `<span class="guide-note-highlight">💡 ${item.note}</span>` : '';

        return `
            <tr>
                <td>${item.index + 1}</td>
                <td>
                    <span class="pos-role">${item.role}</span>
                    <span class="pos-name">${item.label}</span>
                </td>
                <td><div class="stat-badges">${badges}</div></td>
                <td><span class="playstyle-tag">${item.playstyle}</span></td>
                <td>
                    ${noteHtml}
                    <span class="guide-note">${item.description}</span>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== Chart.js =====
function buildCharts() {
    const chartDefaults = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 } } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 } } },
        },
    };

    rewardChart = new Chart(document.getElementById('rewardChart'), {
        type: 'line',
        data: { labels: [], datasets: [{ label: '報酬', data: [], borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderWidth: 1.5, fill: true, tension: 0.3, pointRadius: 0 }] },
        options: { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, title: { display: true, text: '報酬', color: '#64748b', font: { size: 10 } } }, x: { ...chartDefaults.scales.x, title: { display: true, text: 'エピソード', color: '#64748b', font: { size: 10 } } } } },
    });

    winRateChart = new Chart(document.getElementById('winRateChart'), {
        type: 'line',
        data: { labels: [], datasets: [{ label: '勝率', data: [], borderColor: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.1)', borderWidth: 1.5, fill: true, tension: 0.3, pointRadius: 0 }] },
        options: { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, min: 0, max: 1, title: { display: true, text: '勝率', color: '#64748b', font: { size: 10 } } }, x: { ...chartDefaults.scales.x, title: { display: true, text: 'エピソード', color: '#64748b', font: { size: 10 } } } } },
    });
}

// ===== Events =====
function bindEvents() {
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

    document.getElementById('homeAtkFormation')?.addEventListener('change', (e) => { homeAtkFormation = e.target.value; updateField(); });
    document.getElementById('homeDefFormation')?.addEventListener('change', (e) => { homeDefFormation = e.target.value; updateField(); });
    document.getElementById('awayAtkFormation')?.addEventListener('change', (e) => { awayAtkFormation = e.target.value; updateField(); });
    document.getElementById('awayDefFormation')?.addEventListener('change', (e) => { awayDefFormation = e.target.value; updateField(); });

    document.getElementById('btnTrain').addEventListener('click', startTraining);
    document.getElementById('btnReset').addEventListener('click', resetAll);
    document.getElementById('btnSingleMatch').addEventListener('click', runSingleMatch);
    document.getElementById('btnFullSearch').addEventListener('click', startFullSearch);
}

// ===== Training (Q-Learning via Backend) =====
async function startTraining() {
    if (isTraining) return;
    isTraining = true;
    setButtonsDisabled(true);
    document.getElementById('btnTrain').textContent = '⏳ 学習中...';
    document.getElementById('progressBar').style.width = '50%';
    document.getElementById('progressLabel').textContent = 'サーバーで学習中...';

    try {
        const episodes = parseInt(document.getElementById('episodeCount').value);
        const res = await fetch('/api/train', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ episodes }),
        });
        const data = await res.json();

        document.getElementById('progressBar').style.width = '100%';
        document.getElementById('progressLabel').textContent = `完了! (${data.totalEpisodes}エピソード)`;

        document.getElementById('statEpisodes').textContent = data.totalEpisodes.toLocaleString();

        displayRanking(data.rankings);

        if (data.best) {
            displayBest(data.best);
            applyBestToField(data.best);
        }
    } catch (err) {
        console.error('Training error:', err);
        document.getElementById('progressLabel').textContent = 'エラー: ' + err.message;
    }

    document.getElementById('btnTrain').textContent = '🚀 Q-Learning';
    setButtonsDisabled(false);
    isTraining = false;
}

// ===== Full Search (全網羅探索 via Backend + SSE進捗) =====
async function startFullSearch() {
    if (isTraining) return;
    isTraining = true;
    setButtonsDisabled(true);
    document.getElementById('btnFullSearch').textContent = '⏳ 全探索中...';
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressLabel').textContent = 'サーバーに接続中...';

    try {
        const matchesPerPair = parseInt(document.getElementById('matchesPerPair')?.value || '1');
        const res = await fetch('/api/full-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchesPerPair }),
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalData = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // SSEメッセージをパース（"data: {...}\n\n" 形式）
            const lines = buffer.split('\n\n');
            buffer = lines.pop(); // 最後の未完成行をバッファに保持

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data: ')) continue;
                try {
                    const data = JSON.parse(trimmed.slice(6));
                    if (data.type === 'progress') {
                        document.getElementById('progressBar').style.width = data.percent + '%';
                        let label = `${data.percent}% (Gen ${Math.ceil(data.completed / 50)}/20) ${data.elapsedSeconds}s`;
                        if (data.bestFitness !== undefined) {
                            label += ` | Best Score: ${data.bestFitness.toFixed(3)}`;
                        }
                        document.getElementById('progressLabel').textContent = label;
                    } else if (data.type === 'done') {
                        finalData = data;
                    } else if (data.type === 'error') {
                        throw new Error(data.message);
                    }
                } catch (parseErr) {
                    if (parseErr instanceof SyntaxError) continue; // malformed JSON — skip
                    throw parseErr; // re-throw server errors
                }
            }
        }

        if (finalData) {
            document.getElementById('progressBar').style.width = '100%';
            document.getElementById('progressLabel').textContent =
                `完了! ${finalData.totalMatches.toLocaleString()}試合 / ${finalData.workerCount}コア / ${finalData.elapsedSeconds}秒`;

            document.getElementById('statEpisodes').textContent = finalData.totalMatches.toLocaleString();
            displayRanking(finalData.rankings);

            if (finalData.best) {
                displayBest(finalData.best);
                applyBestToField(finalData.best);
            }
        }
    } catch (err) {
        console.error('Full search error:', err);
        document.getElementById('progressLabel').textContent = 'エラー: ' + err.message;
    }

    document.getElementById('btnFullSearch').textContent = '🔍 全網羅探索';
    setButtonsDisabled(false);
    isTraining = false;
}

// ===== Single Match (via Backend) =====
async function runSingleMatch() {
    try {
        const res = await fetch('/api/single-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                home: { atkFormation: homeAtkFormation, defFormation: homeDefFormation, atkStrategy: homeAttack, defStrategy: homeDefense },
                away: { atkFormation: awayAtkFormation, defFormation: awayDefFormation, atkStrategy: awayAttack, defStrategy: awayDefense },
            }),
        });
        const result = await res.json();

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
    } catch (err) {
        console.error('Single match error:', err);
        showMatchNotification('エラー: ' + err.message, 'draw');
    }
}

// ===== Display Helpers =====
function displayRanking(rankings) {
    const tbody = document.getElementById('rankingBody');
    if (!rankings || rankings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;color:var(--text-muted);padding:2rem;">結果なし</td></tr>`;
        return;
    }
    tbody.innerHTML = rankings.slice(0, 15).map((r, i) => {
        const atk = ATTACK_STRATEGIES[r.action.attack];
        const def = DEFENSE_STRATEGIES[r.action.defense];
        return `
      <tr>
        <td class="rank">${i + 1}</td>
        <td class="formation-name">${r.action.atkFormation}</td>
        <td class="formation-name">${r.action.defFormation}</td>
        <td>${atk ? atk.name : r.action.attack}</td>
        <td>${def ? def.name : r.action.defense}</td>
        <td>${r.action.fwType || '-'}</td>
        <td>${r.action.mfType || '-'}</td>
        <td>${r.action.dfType || '-'}</td>
        <td class="q-value">${r.avgReward.toFixed(3)}</td>
        <td style="color:var(--accent-green)">${(r.winRate * 100).toFixed(1)}%</td>
        <td style="color:var(--text-secondary)">${r.avgGoals.toFixed(2)} - ${r.avgConceded.toFixed(2)}</td>
      </tr>`;
    }).join('');
}

function displayBest(best) {
    const banner = document.getElementById('bestStrategyBanner');
    banner.classList.add('visible');

    document.getElementById('bestAtkFormation').textContent = best.atkFormation;
    document.getElementById('bestDefFormation').textContent = best.defFormation;
    document.getElementById('bestAttack').textContent =
        ATTACK_STRATEGIES[best.attack]?.name || best.attack;
    document.getElementById('bestDefense').textContent =
        DEFENSE_STRATEGIES[best.defense]?.name || best.defense;

    // Additional best strategy info
    const extraStats = document.getElementById('bestExtraStats');
    if (extraStats) {
        let html = '';
        if (best.fwType) html += `<div class="best-item"><div class="best-item-label">FW型</div><div class="best-item-value">${best.fwType}</div></div>`;
        if (best.mfType) html += `<div class="best-item"><div class="best-item-label">MF型</div><div class="best-item-value">${best.mfType}</div></div>`;
        if (best.dfType) html += `<div class="best-item"><div class="best-item-label">DF型</div><div class="best-item-value">${best.dfType}</div></div>`;

        if (best.winRate !== undefined) {
            html += `
            <div class="best-item">
                <div class="best-item-label">勝率</div>
                <div class="best-item-value" style="color:var(--accent-green)">${(best.winRate * 100).toFixed(1)}%</div>
            </div>
            <div class="best-item">
                <div class="best-item-label">平均得点</div>
                <div class="best-item-value" style="color:var(--accent-cyan)">${best.avgGoals?.toFixed(2) || '-'}</div>
            </div>
            <div class="best-item">
                <div class="best-item-label">平均失点</div>
                <div class="best-item-value" style="color:var(--accent-red)">${best.avgConceded?.toFixed(2) || '-'}</div>
            </div>`;
        }
        extraStats.innerHTML = html;
        extraStats.style.display = 'grid';
    }
}

function applyBestToField(best) {
    homeAtkFormation = best.atkFormation;
    homeDefFormation = best.defFormation;

    const atkSel = document.getElementById('homeAtkFormation');
    const defSel = document.getElementById('homeDefFormation');
    if (atkSel) atkSel.value = homeAtkFormation;
    if (defSel) defSel.value = homeDefFormation;

    if (best.attack) {
        homeAttack = best.attack;
        document.getElementById('homeAttackStrategy').value = homeAttack;
    }
    if (best.defense) {
        homeDefense = best.defense;
        document.getElementById('homeDefenseStrategy').value = homeDefense;
    }
    updateField();
}

function setButtonsDisabled(disabled) {
    document.getElementById('btnTrain').disabled = disabled;
    document.getElementById('btnFullSearch').disabled = disabled;
    document.getElementById('btnSingleMatch').disabled = disabled;
}

function showMatchNotification(msg, winner) {
    const existing = document.querySelector('.match-notification');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = 'match-notification';
    div.style.cssText = `
    position: fixed; top: 5rem; right: 1.5rem;
    background: ${winner === 'home' ? 'rgba(52, 211, 153, 0.15)' : winner === 'away' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(251, 191, 36, 0.15)'};
    border: 1px solid ${winner === 'home' ? 'rgba(52, 211, 153, 0.3)' : winner === 'away' ? 'rgba(248, 113, 113, 0.3)' : 'rgba(251, 191, 36, 0.3)'};
    color: var(--text-primary); padding: 1rem 1.5rem; border-radius: 12px; font-size: 0.85rem;
    white-space: pre-line; backdrop-filter: blur(20px); z-index: 1000;
    animation: slideIn 0.4s ease; box-shadow: 0 10px 40px rgba(0,0,0,0.4); max-width: 320px;`;
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
function resetAll() {
    rewardChart.data.labels = [];
    rewardChart.data.datasets[0].data = [];
    rewardChart.update();
    winRateChart.data.labels = [];
    winRateChart.data.datasets[0].data = [];
    winRateChart.update();

    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressLabel').textContent = '0%';
    document.getElementById('statEpisodes').textContent = '0';
    document.getElementById('statWinRate').textContent = '0%';
    document.getElementById('statAvgReward').textContent = '0.00';
    document.getElementById('statEpsilon').textContent = '-';
    document.getElementById('statQSize').textContent = '-';
    document.getElementById('statBestScore').textContent = '-';

    document.getElementById('bestStrategyBanner').classList.remove('visible');
    document.getElementById('rankingBody').innerHTML =
        `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:2rem;">学習または全網羅探索を実行すると結果が表示されます</td></tr>`;
}

// ===== Resize =====
function handleResize() {
    window.addEventListener('resize', () => { renderer.resize(); updateField(); });
}

// ===== Start =====
document.addEventListener('DOMContentLoaded', init);
