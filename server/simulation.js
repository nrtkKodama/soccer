/**
 * server/simulation.js - サッカーシミュレーションエンジン (CommonJS版)
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
        return {
            ...p,
            x: Math.max(0.02, Math.min(0.98, p.x + xOffset)),
            y: p.y,
        };
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

    for (let step = 0; step < MATCH_STEPS; step++) {
        const atkTeam = possession === 'home' ? homePlayers : awayPlayers;
        const defTeam = possession === 'home' ? awayPlayers : homePlayers;
        const atkStrategy = possession === 'home' ? homeAtk : awayAtk;
        const defStrategy = possession === 'home' ? awayDef : homeDef;

        if (possession === 'home') homePossessionSteps++;
        else awayPossessionSteps++;

        const homePhase = possession === 'home' ? 'attack' : 'defense';
        const awayPhase = possession === 'away' ? 'attack' : 'defense';
        const homeActiveFormation = homePhase === 'attack' ? homeTactics.atkFormation : homeTactics.defFormation;
        const awayActiveFormation = awayPhase === 'attack' ? awayTactics.atkFormation : awayTactics.defFormation;

        const homeTargetPositions = getPositions(homeActiveFormation, homePhase);
        const awayTargetPositions = getMirroredPositions(awayActiveFormation, awayPhase);

        homePlayers.forEach((p, i) => {
            if (i === 0) return;
            const target = homeTargetPositions[i];
            if (target) {
                p.x += (target.x - p.x) * 0.15;
                p.y += (target.y - p.y) * 0.15;
                p.role = target.role;
            }
        });
        awayPlayers.forEach((p, i) => {
            if (i === 0) return;
            const target = awayTargetPositions[i];
            if (target) {
                p.x += (target.x - p.x) * 0.15;
                p.y += (target.y - p.y) * 0.15;
                p.role = target.role;
            }
        });

        let ballCarrier = atkTeam.reduce((closest, p) =>
            dist(p, ball) < dist(closest, ball) ? p : closest, atkTeam[1]);
        ball.x = ballCarrier.x;
        ball.y = ballCarrier.y;

        let action = decideAction(ballCarrier, atkTeam, defTeam, atkStrategy, defStrategy, possession);

        if (action === 'shoot') {
            if (possession === 'home') homeShots++;
            else awayShots++;

            const goalX = possession === 'home' ? 1.0 : 0.0;
            const distToGoal = Math.abs(ballCarrier.x - goalX);
            const shootPower = Math.max(0, 1 - distToGoal * 1.5);
            const blockChance = defStrategy.blockRate * (1 - distToGoal * 0.5);

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
        } else if (action === 'pass') {
            const target = findPassTarget(ballCarrier, atkTeam, defTeam, atkStrategy, possession);
            const passDist = dist(ballCarrier, target);
            const passSuccess = 0.7 + atkStrategy.passAccuracyBonus - passDist * 0.3;

            if (rand() < passSuccess) {
                ball.x = target.x;
                ball.y = target.y;
            } else {
                if (rand() < defStrategy.interceptionRate) {
                    possession = possession === 'home' ? 'away' : 'home';
                }
            }
        } else if (action === 'dribble') {
            const dirX = possession === 'home' ? 0.03 : -0.03;
            const dirY = (rand() - 0.5) * 0.04;
            ballCarrier.x = Math.max(0.02, Math.min(0.98, ballCarrier.x + dirX));
            ballCarrier.y = Math.max(0.02, Math.min(0.98, ballCarrier.y + dirY));
            ball.x = ballCarrier.x;
            ball.y = ballCarrier.y;

            const nearestDef = defTeam.reduce((closest, p) =>
                p.id === 0 ? closest : (dist(p, ball) < dist(closest, ball) ? p : closest), defTeam[1]);

            if (dist(nearestDef, ball) < 0.08 && rand() < defStrategy.tackleSuccess) {
                possession = possession === 'home' ? 'away' : 'home';
            }
        }
    }

    const totalSteps = homePossessionSteps + awayPossessionSteps;

    return {
        homeGoals,
        awayGoals,
        homePossession: totalSteps > 0 ? homePossessionSteps / totalSteps : 0.5,
        awayPossession: totalSteps > 0 ? awayPossessionSteps / totalSteps : 0.5,
        homeShots,
        awayShots,
        winner: homeGoals > awayGoals ? 'home' : (awayGoals > homeGoals ? 'away' : 'draw'),
    };
}

function decideAction(carrier, atkTeam, defTeam, atkStrategy, defStrategy, possession) {
    const goalX = possession === 'home' ? 1.0 : 0.0;
    const distToGoal = Math.abs(carrier.x - goalX);

    if (distToGoal < 0.3 && carrier.y > GOAL_Y_MIN - 0.1 && carrier.y < GOAL_Y_MAX + 0.1) {
        if (rand() < atkStrategy.shootFrequency) return 'shoot';
    }

    const nearestDef = defTeam.reduce((closest, p) =>
        p.id === 0 ? closest : (dist(p, carrier) < dist(closest, carrier) ? p : closest), defTeam[1]);

    if (dist(nearestDef, carrier) < 0.1) {
        return rand() < 0.6 ? 'pass' : 'dribble';
    }

    if (atkStrategy.counterSpeed > 0.7 && rand() < 0.4) return 'dribble';

    return rand() < 0.5 ? 'pass' : 'dribble';
}

function findPassTarget(carrier, atkTeam, defTeam, atkStrategy, possession) {
    const goalX = possession === 'home' ? 1.0 : 0.0;
    const forward = atkTeam.filter(p => p.id !== carrier.id && p.id !== 0);
    forward.sort((a, b) => Math.abs(a.x - goalX) - Math.abs(b.x - goalX));
    const candidates = forward.slice(0, Math.min(3, forward.length));
    return candidates[Math.floor(rand() * candidates.length)] || carrier;
}

module.exports = { simulateMatch };
