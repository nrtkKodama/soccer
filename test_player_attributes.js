const { getAllActions, PLAYER_TYPES } = require('./server/formations');
const { simulateMatch } = require('./server/simulation');

// Test 1: Check getAllActions expansion
console.log('--- Test 1: Search Space Expansion ---');
const actions = getAllActions();
console.log(`Total actions generated: ${actions.length}`);
const expectedActions = 7 * 7 * 5 * 4 * 3 * 3 * 3; // Formations(7) * Formations(7) * Atk(5) * Def(4) * FW(3) * MF(3) * DF(3)
console.log(`Expected actions: ${expectedActions}`);

if (actions.length === expectedActions) {
    console.log('PASS: Search space expanded correctly.');
} else {
    console.error(`FAIL: Expected ${expectedActions}, got ${actions.length}`);
}

// Check first action structure
const firstAction = actions[0];
console.log('Sample Action:', firstAction);
if (firstAction.fwType && firstAction.mfType && firstAction.dfType) {
    console.log('PASS: Action contains player types.');
} else {
    console.error('FAIL: Action missing player types.');
}

// Test 2: Simulate Match with Player Types
console.log('\n--- Test 2: Simulation with Player Types ---');
const homeTactics = {
    atkFormation: '4-3-3',
    defFormation: '4-4-2',
    atkStrategy: 'possession',
    defStrategy: 'press',
    fwType: 'Speed',
    mfType: 'Playmaker',
    dfType: 'Cover'
};
const awayTactics = {
    atkFormation: '4-4-2',
    defFormation: '4-4-2',
    atkStrategy: 'counter',
    defStrategy: 'retreat',
    fwType: 'Power',
    mfType: 'Box2Box',
    dfType: 'Stopper'
};

try {
    const result = simulateMatch(homeTactics, awayTactics);
    console.log('Simulation Result:', result);
    if (result.winner && result.homeGoals >= 0) {
        console.log('PASS: Simulation completed successfully.');
    } else {
        console.error('FAIL: Simulation result invalid.');
    }
} catch (err) {
    console.error('FAIL: Simulation threw error:', err);
}
