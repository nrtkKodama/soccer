# ⚽ Soccer Tactics AI - フォーメーション強化学習

Q-Learningによる強化学習と全網羅探索で、サッカーの最適なフォーメーション・攻撃戦略・守備戦略を自動探索するWebアプリケーションです。  
eFootball準拠の戦術システムを採用し、攻守それぞれで独立したフォーメーションと戦術パラメータを設定できます。

## アーキテクチャ

```
┌─ ブラウザ (Frontend) ──────────────────────────┐
│  index.html + styles.css                       │
│  js/app.js          … UI制御・API通信           │
│  js/formations.js   … フォーメーション定義 (ESM)│
│  js/simulation.js   … シミュレーションエンジン  │
│  js/rl-engine.js    … Q-Learning エージェント   │
│  js/field-renderer.js … Canvas描画              │
│  js/simulation-worker.js … Web Worker (並列探索)│
└────────── REST API ────────────────────────────┘
                ↕  fetch
┌─ Express サーバー (Backend) ───────────────────┐
│  server.js            … API + 静的ファイル配信  │
│  server/formations.js … 戦術データ (CommonJS)   │
│  server/simulation.js … シミュレーション (CJS)  │
│  server/sim-worker.js … worker_threads ワーカー │
└────────────────────────────────────────────────┘
```

## ファイル構成

| ファイル | 説明 |
|---------|------|
| `index.html` | メインHTML（UI構造全体） |
| `styles.css` | ダークテーマCSS |
| `js/formations.js` | 6種フォーメーション＋攻守戦略定義（ES Modules） |
| `js/simulation.js` | 試合シミュレーションエンジン |
| `js/rl-engine.js` | Q-Learning 強化学習エンジン（`QLearningAgent`クラス） |
| `js/field-renderer.js` | Canvas描画＋アニメーション（`FieldRenderer`クラス） |
| `js/app.js` | アプリ統合＋UI制御＋バックエンドAPI通信 |
| `js/simulation-worker.js` | Web Worker（ブラウザ側の並列シミュレーション） |
| `server.js` | Express サーバー（REST API＋静的配信） |
| `server/formations.js` | 戦術データ（CommonJS版） |
| `server/simulation.js` | シミュレーションロジック（CommonJS版） |
| `server/sim-worker.js` | `worker_threads` ワーカー（サーバー側並列処理） |
| `package.json` | npm設定（Express依存） |

## 起動方法

```bash
# 依存パッケージをインストール
npm install

# サーバー起動
npm start
# または開発モード（自動リロード）
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてください。

## 主な機能

### フォーメーション選択と可視化
- **6種フォーメーション**: 4-4-2 / 4-3-3 / 3-5-2 / 4-2-3-1 / 5-3-2 / 3-4-3
- 攻撃時・守備時で**別々のフォーメーション**を指定可能
- Canvas上で選手がアニメーション付きで配置変更

### 攻撃戦略（eFootball チームスタイル準拠）
| 戦略 | 特徴 |
|------|------|
| ポゼッション | ショートパスでボール保持し崩す |
| ショートカウンター | 高い位置で奪い素早く攻める |
| ロングカウンター | 自陣で守りロングパスで一気に攻める |
| サイドアタック | サイドを崩してクロスやカットインで攻める |
| ロングボール | ロングフィードで前線ターゲットに素早く届ける |

### 守備戦略（eFootball 守備タイプ準拠）
| 戦略 | 特徴 |
|------|------|
| フォアチェック | 高い位置からプレスしてボールを奪う |
| リトリート | 自陣に戻り守備ブロックを形成して堅く守る |
| ハイプレス | 前線から連動プレスし即ボールを奪い返す |
| アグレッシブ | マンマーク気味に激しく寄せてボールホルダーを潰す |

### 強化学習（Q-Learning）
- 「🚀 Q-Learning」で自動探索開始
- 学習率・割引率・探索率・減衰率をスライダーで調整可能
- 学習後に**最適フォーメーション＋戦術**をフィールドに自動反映
- 報酬推移・勝率推移のチャートをリアルタイム表示
- Q値に基づく戦術ランキングテーブル

### 全網羅探索（CPU並列化）
- 「🔍 全網羅探索」で全戦術組み合わせを網羅的に対戦
- **サーバー側**: `worker_threads`による並列化（最大8スレッド）
- **ブラウザ側**: Web Workerによるバックグラウンド処理
- 対戦回数/組み合わせを設定可能（1〜5回）
- プログレスバーで探索進捗をリアルタイム表示

### 1試合テスト
- 「⚡ 1試合テスト」で現在の設定同士の対戦結果を即座に確認
- ゴール数・ポゼッション・シュート数を表示

## 技術スタック

- **Backend**: Node.js + Express + worker_threads
- **Frontend**: HTML5 Canvas + Vanilla CSS + Vanilla JavaScript (ES Modules)
- **グラフ**: Chart.js 4.x
- **並列処理**: Web Workers (ブラウザ) / worker_threads (Node.js)

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| `POST` | `/api/single-match` | 1試合シミュレーション実行 |
| `POST` | `/api/train` | Q-Learning 学習実行 |
| `POST` | `/api/full-search` | 全網羅探索（並列処理） |
