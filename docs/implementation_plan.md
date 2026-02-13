# 選手特性を考慮した全網羅探索の実装

ユーザーの要望「どのような選手を配置するかも考慮したうえで全探索を行ってください」に応えるため、シミュレーションと探索ロジックを拡張する。
個々の選手（11人）を探索するのは計算量が爆発するため、**ライン別（FW/MF/DF）の選手タイプ**を探索対象とする。

## Proposed Changes

### 1. データ定義の拡張

#### [MODIFY] [js/formations.js] & [server/formations.js]

- **`PLAYER_TYPES` 定義を追加**
  - **FW**: `Speed` (スピード), `Power` (パワー/決定力), `Technique` (テクニック/パス)
  - **MF**: `Playmaker` (パス重視), `Box2Box` (スタミナ/守備), `Attacker` (ドリブル/シュート)
  - **DF**: `Stopper` (対人/フィジカル), `Cover` (スピード/守備センス), `BuildUp` (パス/テクニック)
  - 各タイプにステータス補正値（speed, power, technique, defense）を設定。

- **`getAllActions()` の拡張**
  - 既存の `Formation x Strategy` に加え、`fwType`, `mfType`, `dfType` の組み合わせを追加。
  - 組み合わせ数: $720 \times 3 \times 3 \times 3 = 19,440$ 通り。

### 2. シミュレーションロジックの改修

#### [MODIFY] [js/simulation.js] & [server/simulation.js]

- `simulateMatch` の引数拡張
  - `homeTactics`, `awayTactics` に `playerTypes` ({ fw, mf, df }) を含める。

- 選手ステータス生成
  - 試合開始時に、各ポジションのロール（FW/MF/DF判定）と選択されたタイプに基づいて、選手の能力値（Speed, Power, Tech, Def）を決定。

- **行動判定へのステータス反映**
  - **ドリブル/突破**: `Speed` vs `Defense/Speed`
  - **タックル**: `Defense/Power` vs `Technique`
  - **シュート決定率**: `Power/Technique`
  - **パス成功率**: `Technique` vs `Defense`

### 3. UIの更新

#### [MODIFY] [js/app.js] & [index.html]

- **全探索結果の表示**
  - 最適な「FW/MF/DFタイプ」を表示するセクションを追加。
- **ポジション別推奨（Position Guide）の動的更新**
  - 現在の「Position Guide」テーブルの「アドバイス」欄を、探索で得られた最適タイプに基づいて書き換える。
  - 例: FWタイプが「Speed」なら、CFのアドバイスに「スピードのある裏抜けタイプが有効」と表示。

## Verification Plan

1. **事前確認**: `getAllActions` の件数が意図通り増えているか（約1.9万）。
2. **動作確認**: 全探索を実行し、終了まで待機（数秒〜数十秒想定）。
3. **結果確認**: 「最強戦術」にFW/MF/DFのタイプが表示されるか。
4. **ガイド確認**: 推奨選手テーブルがそのタイプに沿った内容になっているか。
