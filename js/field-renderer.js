/**
 * field-renderer.js - サッカーフィールド描画エンジン
 * 
 * HTML5 Canvas上にフィールド・選手・ボールを描画する。
 */

const FIELD_COLOR = '#1a5e2a';
const STRIPE_COLOR = '#1d6b30';
const LINE_COLOR = 'rgba(255, 255, 255, 0.85)';
const HOME_COLOR = '#4a90d9';
const HOME_SECONDARY = '#2563eb';
const AWAY_COLOR = '#e74c3c';
const AWAY_SECONDARY = '#dc2626';
const BALL_COLOR = '#ffffff';

export class FieldRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.animationPlayers = [];
        this.animationBall = { x: 0.5, y: 0.5 };
        this.targetPlayers = [];
        this.animating = false;
        this.dpr = window.devicePixelRatio || 1;
        this.resize();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const w = rect.width;
        const h = w * 0.65;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.canvas.width = w * this.dpr;
        this.canvas.height = h * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);
        this.w = w;
        this.h = h;
    }

    /**
     * フィールド描画
     */
    drawField() {
        const { ctx, w, h } = this;

        // 芝のストライプ
        const stripeCount = 12;
        const stripeW = w / stripeCount;
        for (let i = 0; i < stripeCount; i++) {
            ctx.fillStyle = i % 2 === 0 ? FIELD_COLOR : STRIPE_COLOR;
            ctx.fillRect(i * stripeW, 0, stripeW, h);
        }

        ctx.strokeStyle = LINE_COLOR;
        ctx.lineWidth = 2;

        // 外枠
        const margin = 10;
        const fw = w - margin * 2;
        const fh = h - margin * 2;
        ctx.strokeRect(margin, margin, fw, fh);

        // センターライン
        ctx.beginPath();
        ctx.moveTo(w / 2, margin);
        ctx.lineTo(w / 2, h - margin);
        ctx.stroke();

        // センターサークル
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, Math.min(fw, fh) * 0.12, 0, Math.PI * 2);
        ctx.stroke();

        // センタースポット
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2);
        ctx.fillStyle = LINE_COLOR;
        ctx.fill();

        // ペナルティエリア（左）
        const peW = fw * 0.16;
        const peH = fh * 0.44;
        ctx.strokeRect(margin, h / 2 - peH / 2, peW, peH);

        // ゴールエリア（左）
        const gaW = fw * 0.06;
        const gaH = fh * 0.2;
        ctx.strokeRect(margin, h / 2 - gaH / 2, gaW, gaH);

        // ペナルティエリア（右）
        ctx.strokeRect(w - margin - peW, h / 2 - peH / 2, peW, peH);

        // ゴールエリア（右）
        ctx.strokeRect(w - margin - gaW, h / 2 - gaH / 2, gaW, gaH);

        // ペナルティスポット
        ctx.beginPath();
        ctx.arc(margin + peW * 0.7, h / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w - margin - peW * 0.7, h / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // ペナルティアーク
        ctx.beginPath();
        ctx.arc(margin + peW * 0.7, h / 2, Math.min(fw, fh) * 0.12, -0.6, 0.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w - margin - peW * 0.7, h / 2, Math.min(fw, fh) * 0.12, Math.PI - 0.6, Math.PI + 0.6);
        ctx.stroke();

        // コーナーアーク
        const cornerR = 8;
        [
            [margin, margin, 0, Math.PI / 2],
            [w - margin, margin, Math.PI / 2, Math.PI],
            [margin, h - margin, -Math.PI / 2, 0],
            [w - margin, h - margin, Math.PI, Math.PI * 1.5],
        ].forEach(([cx, cy, s, e]) => {
            ctx.beginPath();
            ctx.arc(cx, cy, cornerR, s, e);
            ctx.stroke();
        });

        // ゴールネット（左）
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        const goalH = fh * 0.2;
        ctx.fillRect(margin - 8, h / 2 - goalH / 2, 8, goalH);
        // ゴールネット（右）
        ctx.fillRect(w - margin, h / 2 - goalH / 2, 8, goalH);
    }

    /**
     * 選手描画
     */
    drawPlayer(x, y, team, number, role, highlight = false) {
        const { ctx, w, h } = this;
        const px = x * w;
        const py = y * h;
        const radius = Math.min(w, h) * 0.025;

        // 影
        ctx.beginPath();
        ctx.ellipse(px, py + radius + 2, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();

        // 選手の円
        const gradient = ctx.createRadialGradient(px - radius * 0.3, py - radius * 0.3, radius * 0.1, px, py, radius);
        if (role === 'GK') {
            gradient.addColorStop(0, team === 'home' ? '#fbbf24' : '#a3e635');
            gradient.addColorStop(1, team === 'home' ? '#d97706' : '#65a30d');
        } else {
            gradient.addColorStop(0, team === 'home' ? '#60a5fa' : '#f87171');
            gradient.addColorStop(1, team === 'home' ? HOME_SECONDARY : AWAY_SECONDARY);
        }

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // ハイライト
        if (highlight) {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 3;
            ctx.stroke();
        } else {
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // 背番号
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(10, radius * 0.85)}px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number, px, py);

        // ポジション名（下に小さく）
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = `${Math.max(8, radius * 0.55)}px 'Inter', sans-serif`;
        ctx.fillText(role, px, py + radius + 12);
    }

    /**
     * ボール描画
     */
    drawBall(x, y) {
        const { ctx, w, h } = this;
        const px = x * w;
        const py = y * h;
        const r = Math.min(w, h) * 0.012;

        // 影
        ctx.beginPath();
        ctx.ellipse(px + 2, py + 2, r, r * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();

        // ボール
        const grad = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, r * 0.1, px, py, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, '#cccccc');
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }

    /**
     * フォーメーション全体を描画
     */
    drawFormation(homePositions, awayPositions, ball = null) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawField();

        if (homePositions) {
            homePositions.forEach((p, i) => {
                this.drawPlayer(p.x, p.y, 'home', i === 0 ? 1 : i + 1, p.role);
            });
        }

        if (awayPositions) {
            awayPositions.forEach((p, i) => {
                this.drawPlayer(p.x, p.y, 'away', i === 0 ? 1 : i + 1, p.role);
            });
        }

        if (ball) {
            this.drawBall(ball.x, ball.y);
        } else {
            this.drawBall(0.5, 0.5);
        }
    }

    /**
     * アニメーション付きフォーメーション切替
     */
    animateTransition(newHomePlayers, newAwayPlayers, duration = 800) {
        if (!this.animationPlayers.length) {
            this.animationPlayers = [
                ...(newHomePlayers || []).map(p => ({ ...p, team: 'home' })),
                ...(newAwayPlayers || []).map(p => ({ ...p, team: 'away' })),
            ];
        }

        const startPositions = this.animationPlayers.map(p => ({ x: p.x, y: p.y }));
        const targets = [
            ...(newHomePlayers || []).map(p => ({ x: p.x, y: p.y, role: p.role })),
            ...(newAwayPlayers || []).map(p => ({ x: p.x, y: p.y, role: p.role })),
        ];

        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(1, elapsed / duration);
            // easeInOutCubic
            const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawField();

            const homeCount = newHomePlayers ? newHomePlayers.length : 0;

            this.animationPlayers.forEach((p, i) => {
                const start = startPositions[i];
                const end = targets[i];
                if (!start || !end) return;

                p.x = start.x + (end.x - start.x) * ease;
                p.y = start.y + (end.y - start.y) * ease;
                p.role = end.role;

                const team = i < homeCount ? 'home' : 'away';
                const num = i < homeCount ? (i === 0 ? 1 : i + 1) : (i - homeCount === 0 ? 1 : i - homeCount + 1);
                this.drawPlayer(p.x, p.y, team, num, p.role);
            });

            this.drawBall(0.5, 0.5);

            if (t < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }
}
