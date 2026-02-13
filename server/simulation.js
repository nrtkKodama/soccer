/**
 * server/simulation.js - サッカーシミュレーションエンジン (CommonJS版)
 * eFootball準拠の戦術パラメータ対応
 */

const { FORMATIONS, ATTACK_STRATEGIES, DEFENSE_STRATEGIES } = require('./formations');

const MATCH_STEPS = 200;
const GOAL_Y_MIN = 0.35;
const GOAL_Y_MAX = 0.65;

function dist(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function rand() {
    return Math.random();
}

function getPositions(formationKey, mode = 'normal') {
    const formation = FORMATIONS[formationKey];
    if (!formation) return null;
    return formation.positions.map(p => {
        let xOffset = 0;
        if (mode === 'attack') xOffset = formation.attackBias;
        if (mode === 'defense') xOffset = formation.defenseBias;
        return { ...p, x: Math.max(0.02, Math.min(0.98, p.x + xOffset)), y: p.y };
    });
}

function getMirroredPositions(formationKey, mode = 'normal') {
    const positions = getPositions(formationKey, mode);
    if (!positions) return null;
    return positions.map(p => ({ ...p, x: 1 - p.x }));
}

function simulateMatch(homeTactics, awayTactics) {
    const homeAtk = ATTACK_STRATEGIES[homeTactics.atkStrategy];
    const homeDef = DEFENSE_STRATEGIES[homeTactics.defStrategy];
    const awayAtk = ATTACK_STRATEGIES[awayTactics.atkStrategy];
    const awayDef = DEFENSE_STRATEGIES[awayTactics.defStrategy];

    const homePlayers = getPositions(homeTactics.atkFormation, 'normal').map((p, i) => ({
        ...p, id: i, team: 'home', x: p.x, y: p.y, stamina: 1.0,
    }));
    const awayPlayers = getMirroredPositions(awayTactics.atkFormation, 'normal').map((p, i) => ({
        ...p, id: i, team: 'away', x: p.x, y: p.y, stamina: 1.0,
    }));

    let ball = { x: 0.5, y: 0.5 };
    let possession = 'home';
    let homeGoals = 0, awayGoals = 0;
    let homeShots = 0, awayShots = 0;
    let homePossessionSteps = 0, awayPossessionSteps = 0;
    let homeCrosses = 0, awayCrosses = 0;
    let homeThroughBalls = 0, awayThroughBalls = 0;

    for (let step = 0; step < MATCH_STEPS; step++) {
        const atkTeam = possession === 'home' ? homePlayers : awayPlayers;
        const defTeam = possession === 'home' ? awayPlayers : homePlayers;
        const atkStrategy = possession === 'home' ? homeAtk : awayAtk;
        const defStrategy = possession === 'home' ? awayDef : homeDef;

        if (possession === 'home') homePossessionSteps++;
        else awayPossessionSteps++;

        // 攻守に応じたフォーメーション座標で選手移動
        const homePhase = possession === 'home' ? 'attack' : 'defense';
        const awayPhase = possession === 'away' ? 'attack' : 'defense';
        const homeActiveF = homePhase === 'attack' ? homeTactics.atkFormation : homeTactics.defFormation;
        const awayActiveF = awayPhase === 'attack' ? awayTactics.atkFormation : awayTactics.defFormation;

        const homeTargets = getPositions(homeActiveF, homePhase);
        const awayTargets = getMirroredPositions(awayActiveF, awayPhase);

        // 守備ラインの高さに応じてDFの位置を調整
        const defLineAdjust = possession === 'home' ? (awayDef.lineHeight - 0.5) * 0.08 : (homeDef.lineHeight - 0.5) * 0.08;

        homePlayers.forEach((p, i) => {
            if (i === 0) return;
            const target = homeTargets[i];
            if (target) {
                let tx = target.x;
                // 守備時にDFライン高さ反映
                if (homePhase === 'defense' && (p.role === 'CB' || p.role === 'LB' || p.role === 'RB' || p.role === 'LWB' || p.role === 'RWB')) {
                    tx -= (homeDef.lineHeight - 0.5) * 0.08;
                }
                p.x += (tx - p.x) * 0.15;
                p.y += (target.y - p.y) * 0.15;
                p.role = target.role;
            }
        });
        awayPlayers.forEach((p, i) => {
            if (i === 0) return;
            const target = awayTargets[i];
            if (target) {
                let tx = target.x;
                if (awayPhase === 'defense' && (p.role === 'CB' || p.role === 'LB' || p.role === 'RB' || p.role === 'LWB' || p.role === 'RWB')) {
                    tx += (awayDef.lineHeight - 0.5) * 0.08;
                }
                p.x += (tx - p.x) * 0.15;
                p.y += (target.y - p.y) * 0.15;
                p.role = target.role;
            }
        });

        // ボールキャリア
        let ballCarrier = atkTeam.reduce((closest, p) =>
            dist(p, ball) < dist(closest, ball) ? p : closest, atkTeam[1]);
        ball.x = ballCarrier.x;
        ball.y = ballCarrier.y;

        // 攻撃アクション決定（eFootball戦術パラメータ反映）
        let action = decideAction(ballCarrier, atkTeam, defTeam, atkStrategy, defStrategy, possession);

        if (action === 'shoot') {
            if (possession === 'home') homeShots++;
            else awayShots++;

            const goalX = possession === 'home' ? 1.0 : 0.0;
            const distToGoal = Math.abs(ballCarrier.x - goalX);
            const shootPower = Math.max(0, 1 - distToGoal * 1.5);

            // コンパクトネスが高いほどブロック力UP
            const blockChance = defStrategy.blockRate * (1 - distToGoal * 0.5) * (0.7 + defStrategy.compactness * 0.3);

            if (rand() < shootPower * 0.45 && rand() > blockChance * 0.6) {
                if (possession === 'home') homeGoals++;
                else awayGoals++;
                ball = { x: 0.5, y: 0.5 };
                possession = possession === 'home' ? 'away' : 'home';
            } else {
                if (rand() < 0.6) {
                    possession = possession === 'home' ? 'away' : 'home';
                }
            }
        } else if (action === 'throughBall') {
            // スルーパス: 裏へ抜ける動き
            if (possession === 'home') homeThroughBalls++;
            else awayThroughBalls++;

            const target = findThroughBallTarget(ballCarrier, atkTeam, defTeam, atkStrategy, possession);
            const passDist = dist(ballCarrier, target);
            // スルーパスは精度が低いが成功すれば大チャンス
            const passSuccess = 0.5 + atkStrategy.passAccuracyBonus * 0.5 - passDist * 0.4;

            if (rand() < passSuccess) {
                ball.x = target.x;
                ball.y = target.y;
                // 守備ラインが高いとスルーパスが通りやすい（裏のスペースが空く）
                if (defStrategy.lineHeight > 0.6 && rand() < 0.3) {
                    // シュートチャンス発生
                    if (possession === 'home') homeShots++;
                    else awayShots++;
                    const goalX = possession === 'home' ? 1.0 : 0.0;
                    if (rand() < 0.35) {
                        if (possession === 'home') homeGoals++;
                        else awayGoals++;
                        ball = { x: 0.5, y: 0.5 };
                        possession = possession === 'home' ? 'away' : 'home';
                    }
                }
            } else {
                if (rand() < defStrategy.interceptionRate * (0.8 + defStrategy.coverRange * 0.2)) {
                    possession = possession === 'home' ? 'away' : 'home';
                }
            }
        } else if (action === 'cross') {
            // クロス: サイドからゴール前へ
            if (possession === 'home') homeCrosses++;
            else awayCrosses++;

            const crossSuccess = 0.55 + atkStrategy.passAccuracyBonus * 0.3;
            if (rand() < crossSuccess) {
                // クロスが通った → ヘディングシュートチャンス
                if (possession === 'home') homeShots++;
                else awayShots++;

                const headerChance = 0.25 + (atkStrategy.crossFreq * 0.15);
                const blockChance = defStrategy.blockRate * defStrategy.compactness * 0.6;

                if (rand() < headerChance && rand() > blockChance) {
                    if (possession === 'home') homeGoals++;
                    else awayGoals++;
                    ball = { x: 0.5, y: 0.5 };
                    possession = possession === 'home' ? 'away' : 'home';
                } else {
                    if (rand() < 0.5) {
                        possession = possession === 'home' ? 'away' : 'home';
                    }
                }
            } else {
                if (rand() < defStrategy.interceptionRate) {
                    possession = possession === 'home' ? 'away' : 'home';
                }
            }
        } else if (action === 'pass') {
            const target = findPassTarget(ballCarrier, atkTeam, defTeam, atkStrategy, possession);
            const passDist = dist(ballCarrier, target);
            let passSuccess = 0.7 + atkStrategy.passAccuracyBonus - passDist * 0.3;

            // ビルドアップタイプの影響
            if (atkStrategy.buildUp === 'short') passSuccess += 0.05;
            if (atkStrategy.buildUp === 'long') passSuccess -= 0.05;

            if (rand() < passSuccess) {
                ball.x = target.x;
                ball.y = target.y;
            } else {
                // カバー範囲が広いほどインターセプトしやすい
                const interceptChance = defStrategy.interceptionRate * (0.8 + defStrategy.coverRange * 0.2);
                if (rand() < interceptChance) {
                    possession = possession === 'home' ? 'away' : 'home';
                }
            }
        } else if (action === 'dribble') {
            const dirX = possession === 'home' ? 0.03 : -0.03;

            // サイドアタック時はサイドにドリブル
            let dirY;
            if (atkStrategy.attackArea === 'wide') {
                dirY = (ballCarrier.y < 0.5 ? -1 : 1) * 0.03;
            } else {
                dirY = (rand() - 0.5) * 0.04;
            }

            ballCarrier.x = Math.max(0.02, Math.min(0.98, ballCarrier.x + dirX));
            ballCarrier.y = Math.max(0.02, Math.min(0.98, ballCarrier.y + dirY));
            ball.x = ballCarrier.x;
            ball.y = ballCarrier.y;

            const nearestDef = defTeam.reduce((closest, p) =>
                p.id === 0 ? closest : (dist(p, ball) < dist(closest, ball) ? p : closest), defTeam[1]);

            // タックル: プレス強度とカバー範囲が影響
            const tackleRange = 0.08 + defStrategy.coverRange * 0.03;
            const tackleChance = defStrategy.tackleSuccess * (0.7 + defStrategy.pressIntensity * 0.3);

            if (dist(nearestDef, ball) < tackleRange && rand() < tackleChance) {
                possession = possession === 'home' ? 'away' : 'home';
            }
        }

        // カウンター発動チェック: ボール奪取直後のスピード特性
        // (ポゼッション変化時にカウンター速度が高いチームは即時攻撃可能)
    }

    const totalSteps = homePossessionSteps + awayPossessionSteps;

    return {
        homeGoals, awayGoals,
        homePossession: totalSteps > 0 ? homePossessionSteps / totalSteps : 0.5,
        awayPossession: totalSteps > 0 ? awayPossessionSteps / totalSteps : 0.5,
        homeShots, awayShots,
        winner: homeGoals > awayGoals ? 'home' : (awayGoals > homeGoals ? 'away' : 'draw'),
    };
}

function decideAction(carrier, atkTeam, defTeam, atkStrategy, defStrategy, possession) {
    const goalX = possession === 'home' ? 1.0 : 0.0;
    const distToGoal = Math.abs(carrier.x - goalX);

    // シュートゾーン
    if (distToGoal < 0.3 && carrier.y > GOAL_Y_MIN - 0.1 && carrier.y < GOAL_Y_MAX + 0.1) {
        if (rand() < atkStrategy.shootFrequency) return 'shoot';
    }

    // サイドにいる場合、クロス判定
    if ((carrier.y < 0.25 || carrier.y > 0.75) && distToGoal < 0.4) {
        if (rand() < atkStrategy.crossFreq * 0.5) return 'cross';
    }

    // スルーパス判定（前線近くかつスルーパス多用チームスタイル）
    if (distToGoal < 0.5) {
        if (rand() < atkStrategy.throughBallFreq * 0.3) return 'throughBall';
    }

    const nearestDef = defTeam.reduce((closest, p) =>
        p.id === 0 ? closest : (dist(p, carrier) < dist(closest, carrier) ? p : closest), defTeam[1]);

    if (dist(nearestDef, carrier) < 0.1) {
        // 囲まれている → パスかドリブル
        return rand() < (1 - atkStrategy.dribbleFreq) ? 'pass' : 'dribble';
    }

    // カウンター速度が高いチームはドリブル突破を狙いやすい
    if (atkStrategy.counterSpeed > 0.7 && rand() < 0.35) return 'dribble';

    // ドリブル頻度によるドリブル判定
    if (rand() < atkStrategy.dribbleFreq * 0.4) return 'dribble';

    return 'pass';
}

function findPassTarget(carrier, atkTeam, defTeam, atkStrategy, possession) {
    const goalX = possession === 'home' ? 1.0 : 0.0;
    const forward = atkTeam.filter(p => p.id !== carrier.id && p.id !== 0);

    // 攻撃エリアによるターゲット選好
    if (atkStrategy.attackArea === 'wide') {
        // サイド攻撃: サイドの選手を優先
        forward.sort((a, b) => {
            const aWidth = Math.abs(a.y - 0.5);
            const bWidth = Math.abs(b.y - 0.5);
            return bWidth - aWidth;
        });
    } else if (atkStrategy.attackArea === 'central') {
        // 中央突破: ゴールに近い選手を優先
        forward.sort((a, b) => Math.abs(a.x - goalX) - Math.abs(b.x - goalX));
    } else {
        // バランス: ゴール方向をやや優先
        forward.sort((a, b) => Math.abs(a.x - goalX) - Math.abs(b.x - goalX));
    }

    const candidates = forward.slice(0, Math.min(3, forward.length));
    return candidates[Math.floor(rand() * candidates.length)] || carrier;
}

function findThroughBallTarget(carrier, atkTeam, defTeam, atkStrategy, possession) {
    const goalX = possession === 'home' ? 1.0 : 0.0;
    const forward = atkTeam.filter(p => p.id !== carrier.id && p.id !== 0);

    // スルーパス: 最前線の選手をターゲット
    forward.sort((a, b) => Math.abs(a.x - goalX) - Math.abs(b.x - goalX));
    return forward[0] || carrier;
}

module.exports = { simulateMatch };
