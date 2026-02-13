# ⚽ Soccer Tactics AI - フォーメーション強化学習

Q-Learningによる強化学習で、サッカーの最適なフォーメーション・攻撃戦略・守備戦略を自動探索するWebアプリケーションです。

## ファイル構成

| ファイル | 説明 |
|---------|------|
| `index.html` | メインHTML（UI構造全体） |
| `styles.css` | ダークテーマCSS |
| `js/formations.js` | 6種フォーメーション＋攻守戦略定義 |
| `js/simulation.js` | 試合シミュレーションエンジン |
| `js/rl-engine.js` | Q-Learning強化学習エンジン |
| `js/field-renderer.js` | Canvas描画＋アニメーション |
| `js/app.js` | アプリ統合＋UI制御 |

## 起動方法

ES Modulesを使用しているため、ローカルサーバーが必要です。以下のいずれかを実行してください：

```bash
# Node.js がある場合
npx -y http-server -p 8080 -c-1

# Python がある場合
python -m http.server 8080

# VS Code の場合
# Live Server 拡張機能で index.html を右クリック → "Open with Live Server"
```

その後 `http://localhost:8080` にアクセスしてください。

## 主な機能

### フォーメーション選択と可視化
- 4-4-2 / 4-3-3 / 3-5-2 / 4-2-3-1 / 5-3-2 / 3-4-3 の6種
- Canvas上で選手がアニメーション付きで配置変更

### 攻撃・守備戦略
- **攻撃**: ポゼッション / カウンター / ハイプレス / サイド攻撃
- **守備**: ゾーン / マンマーク / プレッシング / ディープブロック

### 強化学習（Q-Learning）
- 「🚀 学習開始」で自動探索開始
- 学習率・割引率・探索率をスライダーで調整可能
- 学習後に**最適フォーメーション＋戦術**をフィールドに自動反映
- 報酬推移・勝率推移のチャートをリアルタイム表示
- Q値に基づく戦術ランキングテーブル

### 1試合テスト
- 「⚡ 1試合テスト」で現在の設定同士の対戦結果を即座に確認

## 技術スタック

- HTML5 Canvas（フィールド・選手描画）
- Vanilla CSS（ダークテーマUI）
- Vanilla JavaScript（ES Modules）
- Chart.js（学習結果グラフ）
