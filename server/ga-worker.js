/**
 * server/ga-worker.js - 遺伝的アルゴリズム (GA) ワーカー
 * 
 * 1. 初期集団生成 (Random Population)
 * 2. 適応度評価 (Fitness Evaluation) -> シミュレーション実行
 * 3. 選択・交叉・突然変異 (Evolution)
 * 4. 次世代へ
 */

const { parentPort, workerData } = require('worker_threads');
const { simulateMatch } = require('./simulation');
const { getAllActions, FORMATIONS, ATTACK_STRATEGIES, DEFENSE_STRATEGIES, PLAYER_TYPES } = require('./formations');

// 定数定義
const POPULATION_SIZE = 50;
const GENERATIONS = 20;
const OPPONENT_SAMPLE_SIZE = 20; // 1個体あたりの評価対戦数
const ELITE_COUNT = 5; // 上位5個体はそのまま残す
const MUTATION_RATE = 0.1;

// 遺伝子定義 (Chromosome)
// [atkFormation, defFormation, attack, defense, fwType, mfType, dfType]

// パラメータ空間の準備
const formationKeys = Object.keys(FORMATIONS);
const attackKeys = Object.keys(ATTACK_STRATEGIES);
const defenseKeys = Object.keys(DEFENSE_STRATEGIES);
const fwTypes = Object.keys(PLAYER_TYPES.FW);
const mfTypes = Object.keys(PLAYER_TYPES.MF);
const dfTypes = Object.keys(PLAYER_TYPES.DF);

// ヘルパー: ランダムな遺伝子を生成
function createRandomIndividual() {
    return {
        atkFormation: formationKeys[Math.floor(Math.random() * formationKeys.length)],
        defFormation: formationKeys[Math.floor(Math.random() * formationKeys.length)],
        attack: attackKeys[Math.floor(Math.random() * attackKeys.length)],
        defense: defenseKeys[Math.floor(Math.random() * defenseKeys.length)],
        fwType: fwTypes[Math.floor(Math.random() * fwTypes.length)],
        mfType: mfTypes[Math.floor(Math.random() * mfTypes.length)],
        dfType: dfTypes[Math.floor(Math.random() * dfTypes.length)],
        fitness: 0,
        stats: null // 評価結果を格納
    };
}

// ヘルパー: 報酬計算
function calculateReward(result) {
    let reward = 0;
    if (result.winner === 'home') reward += 3;
    else if (result.winner === 'draw') reward += 1;
    else reward -= 1;
    reward += (result.homeGoals - result.awayGoals) * 0.5;
    return reward;
}

// メイン処理
(async () => {
    const { matchesPerPair, workerId } = workerData;

    // 全アクションリスト（対戦相手のサンプリング用）
    const allActions = getAllActions();

    // 1. 初期集団生成
    let population = Array.from({ length: POPULATION_SIZE }, createRandomIndividual);
    let bestIndividual = null;

    for (let gen = 0; gen < GENERATIONS; gen++) {
        // --- 評価 (Evaluation) ---
        // 対戦相手プールをランダムに生成 (世代ごとに変えることで過学習を防ぐ)
        const opponents = [];
        for (let i = 0; i < OPPONENT_SAMPLE_SIZE; i++) {
            opponents.push(allActions[Math.floor(Math.random() * allActions.length)]);
        }

        // 各個体の適応度を計算
        for (let i = 0; i < population.length; i++) {
            const ind = population[i];
            let totalReward = 0;
            let wins = 0, draws = 0, losses = 0;
            let goals = 0, conceded = 0;

            for (const opp of opponents) {
                // 対戦実行
                const result = simulateMatch(
                    { atkFormation: ind.atkFormation, defFormation: ind.defFormation, atkStrategy: ind.attack, defStrategy: ind.defense, fwType: ind.fwType, mfType: ind.mfType, dfType: ind.dfType },
                    { atkFormation: opp.atkFormation, defFormation: opp.defFormation, atkStrategy: opp.attack, defStrategy: opp.defense, fwType: opp.fwType, mfType: opp.mfType, dfType: opp.dfType }
                );

                totalReward += calculateReward(result);
                goals += result.homeGoals;
                conceded += result.awayGoals;
                if (result.winner === 'home') wins++;
                else if (result.winner === 'draw') draws++;
                else losses++;
            }

            ind.fitness = totalReward / OPPONENT_SAMPLE_SIZE;
            ind.stats = {
                avgReward: ind.fitness,
                winRate: wins / OPPONENT_SAMPLE_SIZE,
                avgGoals: goals / OPPONENT_SAMPLE_SIZE,
                avgConceded: conceded / OPPONENT_SAMPLE_SIZE,
                matchCount: OPPONENT_SAMPLE_SIZE
            };
        }

        // --- ソート (Sort) ---
        population.sort((a, b) => b.fitness - a.fitness);

        // ベスト個体更新
        if (!bestIndividual || population[0].fitness > bestIndividual.fitness) {
            bestIndividual = JSON.parse(JSON.stringify(population[0]));
        }

        // 進捗報告
        parentPort.postMessage({
            type: 'progress',
            workerId,
            generation: gen + 1,
            completed: (gen + 1) * POPULATION_SIZE, // 累計評価数
            total: GENERATIONS * POPULATION_SIZE,
            bestFitness: population[0].fitness,
            bestStats: population[0].stats
        });

        // 最終世代なら終了
        if (gen === GENERATIONS - 1) break;

        // --- 進化 (Evolution) ---
        const nextGen = [];

        // 1. エリート保存 (Elitism)
        for (let i = 0; i < ELITE_COUNT; i++) {
            nextGen.push(population[i]);
        }

        // 2. 選択・交叉・突然変異
        while (nextGen.length < POPULATION_SIZE) {
            // トーナメント選択
            const p1 = tournamentSelect(population);
            const p2 = tournamentSelect(population);

            // 一様交叉 (Uniform Crossover)
            const child = crossover(p1, p2);

            // 突然変異 (Mutation)
            mutate(child);

            nextGen.push(child);
        }

        population = nextGen;
    }

    // 完了通知
    parentPort.postMessage({
        type: 'done',
        workerId,
        best: bestIndividual,
        population: population // 上位個体を返す（ランキング表示用）
    });
})();

// トーナメント選択
function tournamentSelect(pop) {
    const k = 3;
    let best = null;
    for (let i = 0; i < k; i++) {
        const ind = pop[Math.floor(Math.random() * pop.length)];
        if (!best || ind.fitness > best.fitness) {
            best = ind;
        }
    }
    return best;
}

// 一様交叉
function crossover(p1, p2) {
    const child = { ...p1 }; // 基本はp1
    // 50%の確率でp2の遺伝子を採用
    if (Math.random() < 0.5) child.atkFormation = p2.atkFormation;
    if (Math.random() < 0.5) child.defFormation = p2.defFormation;
    if (Math.random() < 0.5) child.attack = p2.attack;
    if (Math.random() < 0.5) child.defense = p2.defense;
    if (Math.random() < 0.5) child.fwType = p2.fwType;
    if (Math.random() < 0.5) child.mfType = p2.mfType;
    if (Math.random() < 0.5) child.dfType = p2.dfType;
    child.fitness = 0;
    child.stats = null;
    return child;
}

// 突然変異
function mutate(ind) {
    if (Math.random() < MUTATION_RATE) ind.atkFormation = formationKeys[Math.floor(Math.random() * formationKeys.length)];
    if (Math.random() < MUTATION_RATE) ind.defFormation = formationKeys[Math.floor(Math.random() * formationKeys.length)];
    if (Math.random() < MUTATION_RATE) ind.attack = attackKeys[Math.floor(Math.random() * attackKeys.length)];
    if (Math.random() < MUTATION_RATE) ind.defense = defenseKeys[Math.floor(Math.random() * defenseKeys.length)];
    if (Math.random() < MUTATION_RATE) ind.fwType = fwTypes[Math.floor(Math.random() * fwTypes.length)];
    if (Math.random() < MUTATION_RATE) ind.mfType = mfTypes[Math.floor(Math.random() * mfTypes.length)];
    if (Math.random() < MUTATION_RATE) ind.dfType = dfTypes[Math.floor(Math.random() * dfTypes.length)];
}
