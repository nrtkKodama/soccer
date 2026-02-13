/**
 * simulation.js - サッカーシミュレーションエンジン
 * 
 * 2チーム間の試合をステップベースでシミュレートする。
 * 各ステップでボール移動・パス・シュート・タックルを判定。
 */

import { FORMATIONS, ATTACK_STRATEGIES, DEFENSE_STRATEGIES, getPositions, getMirroredPositions } from './formations.js';

const MATCH_STEPS = 200;  // 1試合のステップ数
const FIELD_W = 1.0;
const FIELD_H = 1.0;
const GOAL_Y_MIN = 0.35;
const GOAL_Y_MAX = 0.65;

/**
 * 距離計算
 */
function dist(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * ランダム値 [0, 1)
 */
function rand() {
    return Math.random();
}

/**
 * 1試合シミュレーション
 * @returns {{ homeGoals, awayGoals, possession, homeShots, awayShots, events }}
 */
export function simulateMatch(homeFormation, awayFormation, homeAttack, homeDefense, awayAttack, awayDefense) {
    const homeAtk = ATTACK_STRATEGIES[homeAttack];
    const homeDef = DEFENSE_STRATEGIES[homeDefense];
    const awayAtk = ATTACK_STRATEGIES[awayAttack];
    const awayDef = DEFENSE_STRATEGIES[awayDefense];

    // 選手配置取得
    const homePlayers = getPositions(homeFormation, 'normal').map((p, i) => ({
        ...p, id: i, team: 'home',
        baseX: p.x, baseY: p.y,
        stamina: 1.0,
    }));

    const awayPlayers = getMirroredPositions(awayFormation, 'normal').map((p, i) => ({
        ...p, id: i, team: 'away',
        baseX: p.x, baseY: p.y,
        stamina: 1.0,
    }));

    let ball = { x: 0.5, y: 0.5 };
    let possession = 'home';
    let homeGoals = 0;
    let awayGoals = 0;
    let homeShots = 0;
    let awayShots = 0;
    let homePossessionSteps = 0;
    let awayPossessionSteps = 0;
    const events = [];

    for (let step = 0; step < MATCH_STEPS; step++) {
        const atkTeam = possession === 'home' ? homePlayers : awayPlayers;
        const defTeam = possession === 'home' ? awayPlayers : homePlayers;
        const atkStrategy = possession === 'home' ? homeAtk : awayAtk;
        const defStrategy = possession === 'home' ? awayDef : homeDef;
        const atkFormation = possession === 'home' ? FORMATIONS[homeFormation] : FORMATIONS[awayFormation];

        // ポゼッション追跡
        if (possession === 'home') homePossessionSteps++;
        else awayPossessionSteps++;

        // ボールに最も近い攻撃側選手
        let ballCarrier = atkTeam.reduce((closest, p) =>
            dist(p, ball) < dist(closest, ball) ? p : closest, atkTeam[1]);

        // ボールをキャリアに移動
        ball.x = ballCarrier.x;
        ball.y = ballCarrier.y;

        // --- 攻撃アクション決定 ---
        let action = decideAction(ballCarrier, atkTeam, defTeam, atkStrategy, defStrategy, possession);

        if (action === 'shoot') {
            // シュート判定
            if (possession === 'home') homeShots++;
            else awayShots++;

            const goalX = possession === 'home' ? 1.0 : 0.0;
            const distToGoal = Math.abs(ballCarrier.x - goalX);
            const shootPower = Math.max(0, 1 - distToGoal * 1.5);
            const blockChance = defStrategy.blockRate * (1 - distToGoal * 0.5);

            if (rand() < shootPower * 0.45 && rand() > blockChance * 0.6) {
                // ゴール！
                if (possession === 'home') {
                    homeGoals++;
                    events.push({ step, type: 'goal', team: 'home', player: ballCarrier.id });
                } else {
                    awayGoals++;
                    events.push({ step, type: 'goal', team: 'away', player: ballCarrier.id });
                }
                // キックオフ位置にリセット
                ball = { x: 0.5, y: 0.5 };
                possession = possession === 'home' ? 'away' : 'home';
            } else {
                events.push({ step, type: 'shot_blocked', team: possession });
                // GKキャッチ
                if (rand() < 0.6) {
                    possession = possession === 'home' ? 'away' : 'home';
                }
            }
        } else if (action === 'pass') {
            // パス判定
            const target = findPassTarget(ballCarrier, atkTeam, defTeam, atkStrategy, possession);
            const passDist = dist(ballCarrier, target);
            const passSuccess = 0.7 + atkStrategy.passAccuracyBonus - passDist * 0.3;

            if (rand() < passSuccess) {
                ball.x = target.x;
                ball.y = target.y;
            } else {
                // インターセプト
                if (rand() < defStrategy.interceptionRate) {
                    possession = possession === 'home' ? 'away' : 'home';
                    events.push({ step, type: 'interception', team: possession });
                }
            }
        } else if (action === 'dribble') {
            // ドリブル
            const dirX = possession === 'home' ? 0.03 : -0.03;
            const dirY = (rand() - 0.5) * 0.04;
            ballCarrier.x = Math.max(0.02, Math.min(0.98, ballCarrier.x + dirX));
            ballCarrier.y = Math.max(0.02, Math.min(0.98, ballCarrier.y + dirY));
            ball.x = ballCarrier.x;
            ball.y = ballCarrier.y;

            // タックル判定
            const nearestDef = defTeam.reduce((closest, p) =>
                p.id === 0 ? closest : (dist(p, ball) < dist(closest, ball) ? p : closest), defTeam[1]);

            if (dist(nearestDef, ball) < 0.08 && rand() < defStrategy.tackleSuccess) {
                possession = possession === 'home' ? 'away' : 'home';
                events.push({ step, type: 'tackle', team: possession });
            }
        }

        // 選手移動（ポジションに戻る動き + 攻守応じた動き）
        movePlayersTowardPositions(homePlayers, possession === 'home' ? 'attack' : 'defense', FORMATIONS[homeFormation]);
        movePlayersTowardPositions(awayPlayers, possession === 'away' ? 'attack' : 'defense', FORMATIONS[awayFormation]);
    }

    const totalSteps = homePossessionSteps + awayPossessionSteps;

    return {
        homeGoals,
        awayGoals,
        homePossession: totalSteps > 0 ? homePossessionSteps / totalSteps : 0.5,
        awayPossession: totalSteps > 0 ? awayPossessionSteps / totalSteps : 0.5,
        homeShots,
        awayShots,
        events,
        winner: homeGoals > awayGoals ? 'home' : (awayGoals > homeGoals ? 'away' : 'draw'),
    };
}

/**
 * 攻撃アクション決定
 */
function decideAction(carrier, atkTeam, defTeam, atkStrategy, defStrategy, possession) {
    const goalX = possession === 'home' ? 1.0 : 0.0;
    const distToGoal = Math.abs(carrier.x - goalX);

    // シュートゾーン（ゴールに近い）
    if (distToGoal < 0.3 && carrier.y > GOAL_Y_MIN - 0.1 && carrier.y < GOAL_Y_MAX + 0.1) {
        if (rand() < atkStrategy.shootFrequency) return 'shoot';
    }

    // ディフェンダーが近いかチェック
    const nearestDef = defTeam.reduce((closest, p) =>
        p.id === 0 ? closest : (dist(p, carrier) < dist(closest, carrier) ? p : closest), defTeam[1]);

    if (dist(nearestDef, carrier) < 0.1) {
        return rand() < 0.6 ? 'pass' : 'dribble';
    }

    // カウンター戦略の場合ドリブル優先
    if (atkStrategy.counterSpeed > 0.7 && rand() < 0.4) return 'dribble';

    return rand() < 0.5 ? 'pass' : 'dribble';
}

/**
 * パスターゲット選択
 */
function findPassTarget(carrier, atkTeam, defTeam, atkStrategy, possession) {
    const goalX = possession === 'home' ? 1.0 : 0.0;
    const forward = atkTeam.filter(p => p.id !== carrier.id && p.id !== 0);

    // ゴール方向に近い味方を優先
    forward.sort((a, b) => {
        const aScore = Math.abs(a.x - goalX) - Math.abs(b.x - goalX);
        return aScore;
    });

    // 上位3人からランダム選択
    const candidates = forward.slice(0, Math.min(3, forward.length));
    return candidates[Math.floor(rand() * candidates.length)] || carrier;
}

/**
 * 選手をポジションに戻す（攻守切替アニメーション用）
 */
function movePlayersTowardPositions(players, mode, formation) {
    const bias = mode === 'attack' ? formation.attackBias :
        mode === 'defense' ? formation.defenseBias : 0;

    players.forEach((p, i) => {
        if (i === 0) return; // GKは固定
        const targetX = p.baseX + bias;
        const targetY = p.baseY;
        p.x += (targetX - p.x) * 0.1;
        p.y += (targetY - p.y) * 0.1;
    });
}

/**
 * バッチシミュレーション（複数試合）
 */
export function simulateBatch(homeFormation, awayFormation, homeAttack, homeDefense, awayAttack, awayDefense, count = 10) {
    const results = [];
    for (let i = 0; i < count; i++) {
        results.push(simulateMatch(homeFormation, awayFormation, homeAttack, homeDefense, awayAttack, awayDefense));
    }

    const wins = results.filter(r => r.winner === 'home').length;
    const draws = results.filter(r => r.winner === 'draw').length;
    const losses = results.filter(r => r.winner === 'away').length;
    const avgGoals = results.reduce((s, r) => s + r.homeGoals, 0) / count;
    const avgConceded = results.reduce((s, r) => s + r.awayGoals, 0) / count;
    const avgPossession = results.reduce((s, r) => s + r.homePossession, 0) / count;

    return {
        results,
        wins,
        draws,
        losses,
        winRate: wins / count,
        avgGoals,
        avgConceded,
        avgPossession,
    };
}
