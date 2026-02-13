# CLAUDE.md - Soccer Tactics AI 開発ガイド

## プロジェクト概要

サッカーの最適な戦術をQ-Learning（強化学習）と全網羅探索で自動発見するWebアプリケーション。  
eFootball準拠の戦術パラメータ体系を採用。Express バックエンド＋Vanilla フロントエンドの構成。

## ビルド・実行コマンド

```bash
npm install        # 依存パッケージインストール（express）
npm start          # サーバー起動 → http://localhost:3000
npm run dev        # 開発モード（--watch で自動リロード）
```

テストフレームワークは未導入。動作確認はブラウザ上のUI操作で行う。

## コードベース構造

### フロントエンド（`js/` ディレクトリ、ES Modules）
- `js/formations.js` — フォーメーション6種＋攻撃5種＋守備4種の戦術データ定義
- `js/simulation.js` — 1試合200ステップの試合シミュレーションエンジン
- `js/rl-engine.js` — `QLearningAgent`クラス（ε-貪欲法、Q-Table管理）
- `js/field-renderer.js` — `FieldRenderer`クラス（HTML5 Canvas描画）
- `js/app.js` — UIバインディング・バックエンドAPI通信・Chart.js連携
- `js/simulation-worker.js` — Web Worker（ブラウザ並列探索用）

### バックエンド（`server.js` + `server/` ディレクトリ、CommonJS）
- `server.js` — Express サーバー（REST API 3エンドポイント + 静的ファイル配信）
- `server/formations.js` — 戦術データ（`js/formations.js`のCommonJS版）
- `server/simulation.js` — シミュレーション（`js/simulation.js`のCommonJS版）
- `server/sim-worker.js` — `worker_threads`ワーカー（サーバー並列処理用）

### 重要: 二重定義に注意
フォーメーション・シミュレーションのロジックは **`js/`（ESM）と `server/`（CJS）に二重に存在**する。  
戦術パラメータやシミュレーションロジックを変更する場合は**両方を同時に更新**すること。

## 戦術パラメータ体系

### フォーメーション（6種）
`4-4-2` / `4-3-3` / `3-5-2` / `4-2-3-1` / `5-3-2` / `3-4-3`  
各フォーメーションは `attackBias` / `defenseBias` を持ち、シミュレーションに影響する。

### 攻撃戦略（5種）
`possession` / `shortCounter` / `longCounter` / `sideAttack` / `longBall`  
パラメータ: `passAccuracyBonus`, `shootFrequency`, `pressIntensity`, `counterSpeed`, `buildUp`, `attackArea`, `throughBallFreq`, `crossFreq`, `dribbleFreq`

### 守備戦略（4種）
`forecheck` / `retreat` / `highPress` / `aggressive`  
パラメータ: `tackleSuccess`, `interceptionRate`, `blockRate`, `lineHeight`, `pressIntensity`, `compactness`, `coverRange`

## API 仕様

| メソッド | パス | リクエストボディ | 説明 |
|---------|------|-----------------|------|
| POST | `/api/single-match` | `{ home: Tactics, away: Tactics }` | 1試合実行 |
| POST | `/api/train` | `{ episodes: number }` | Q-Learning学習 |
| POST | `/api/full-search` | `{ matchesPerPair: number }` | 全網羅探索 |

**Tactics 型**: `{ atkFormation, defFormation, atkStrategy, defStrategy }`

## コーディング規約

- **フロントエンド**: ES Modules（`import/export`）、Vanilla JS、クラスベース
- **バックエンド**: CommonJS（`require/module.exports`）
- **CSS**: Vanilla CSS、CSS変数（`--primary`, `--bg-card` 等のダークテーマ変数使用）
- **文字コード**: UTF-8（日本語UIラベル含む）
- **コメント**: 日本語を主体に、関数ヘッダに JSDoc 風コメント
- **インデント**: スペース4つ（サーバー側）、スペース2つ（フロントエンド側）
- **改行**: CRLF

## 状態空間（強化学習）

- **状態**: 攻撃フォーメーション × 守備フォーメーション × 攻撃戦略 × 守備戦略
- **行動**: 上記組み合わせの変更（6×6×5×4 = 720通り）
- **報酬**: 勝利+3 / 引分+1 / 敗北-1 + 得失点差×0.5 + ポゼッション補正 + シュート数補正
