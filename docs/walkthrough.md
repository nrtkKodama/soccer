# Position Guide Feature Walkthrough

Implemented a new feature to display player position recommendations and advice based on the selected formation (eFootball-style).

## Changes

### 1. Data (`js/formations.js`)
- Added `POSITION_PROFILES`: Detailed stats, playstyles, and descriptions for all 15 roles (GK, CB, ST, etc.).
- Added `FORMATION_POSITION_NOTES`: Specific tactical advice for each position depending on the formation (e.g., "Covering is essential for side CBs in 3-5-2").
- Exported `getFormationGuide(formationKey)` helper.

### 2. UI (`index.html` & `styles.css`)
- Added a "Position Guide" card below the field.
- Styled with the existing dark theme (glassmorphism).
- Added badges for key stats and playstyles.

### 3. Logic (`js/app.js`)
- Implemented `updatePositionGuide()` to render the table dynamically.
- Hooked into `updateField()` so it updates automatically when the formation changes.

## Verification Scenarios (Position Guide)

### Scenario 1: Basic Display
1. Open the app.
2. The "Position Guide" panel should appear below the field.
3. It should show the current Home formation (e.g., "4-3-3").
4. The table should list all 11 positions with their roles (GK, LB, CB...).

### Scenario 2: Formation Change
1. Change the Home **Attack Formation** to "3-5-2".
2. The guide title should update to "3-5-2".
3. The table rows should update to reflect 3-5-2 positions (e.g., LWB/RWB instead of LB/RB).
4. Specific notes (e.g., for WBs) should reference high stamina/work rate.

### Scenario 3: Content Accuracy
1. Check a specific role like **ST** (Striker).
2. Key stats should include "Finishing", "Offensive Awareness".
3. Playstyle should say "Line Breaker / Box Striker".

---

## Feature 2: Player Optimization Search and Simulation

Implemented player attribute logic into the simulation engine and expanded the full search to find optimal player type combinations.

### Changes

#### 1. Simulation Logic (`js/simulation.js` & `server/simulation.js`)
- **Player Types**: Introduced FW (Speed/Power/Technique), MF (Playmaker/Box2Box/Attacker), and DF (Stopper/Cover/BuildUp) types.
- **Stat Integration**: Match events (Shooting, Passing, Dribbling, Tackling) now use player attributes to determine success rates.
  - Shooting: Dependent on Power and Technique.
  - Dribbling: Dependent on Speed vs Defense.
  - Passing: Dependent on Technique vs Interception (Defense).

#### 2. Search Space (`js/formations.js` & `server/formations.js`)
- Expanded `getAllActions` to iterate through all combinations of player types (3x3x3 = 27 variations) for each formation/strategy pair.
- Total search space increased to ~26,500 combinations for deeper tactical analysis.

#### 3. UI Updates (`index.html` & `js/app.js`)
- **Ranking Table**: Added columns for "FW Type", "MF Type", and "DF Type".
- **Best Strategy Banner**: Now displays the optimal player types found by the search.

### Verification Scenarios (Player Optimization)

#### Scenario 1: Full Search Execution
1. Click **"Full Search"**. (Note: Execution time will be longer due to the expanded search space).
2. Monitor the progress bar.
3. Upon completion, check the **"Best Strategy" banner**. It should display the recommended player types (e.g., FW: Speed, MF: Playmaker).
4. Verify "Best Strategy" displays win rate, score, and robust stat breakdown including player types.

#### Scenario 2: Ranking Table Details
1. Scroll down to the **"Tactical Ranking" table**.
2. Verify that the new columns **"FW Type"**, **"MF Type"**, and **"DF Type"** are populated for the top results.
3. Confirm that different combinations appear in the ranking, reflecting the optimization process.
