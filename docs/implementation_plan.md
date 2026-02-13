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

> [!TIP]
> **Optimization Strategy**: 全探索の代わりに**遺伝的アルゴリズム (Genetic Algorithm)** を採用し、効率的に最強戦術を探索する。
> - **個体 (Individual)**: 1つの戦術セット（攻撃F、守備F、攻撃戦術、守備戦術、FW/MF/DFタイプ）。
> - **集団 (Population)**: 1世代あたり **50個体**。
> - **評価 (Fitness)**: ランダムに選出された対戦相手（20チーム）との試合を行い、平均勝ち点・得失点差から適応度を算出。
> - **進化 (Evolution)**:
>   - **選択 (Selection)**: 適応度の高い上位個体を残す（エリート保存）。
>   - **交叉 (Crossover)**: 親個体の遺伝子（戦術パラメータ）を組み合わせて子を生成。
>   - **突然変異 (Mutation)**: 一定確率でパラメータをランダムに変更し、局所解を回避。
> - **世代数**: 20世代（計 $50 \times 20 = 1000$ 回の評価で収束を目指す）。

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
