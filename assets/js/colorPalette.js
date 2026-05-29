document.addEventListener('DOMContentLoaded', () => {
    // 1. 7つの色設定を定義
    const paletteSettings = [
        { id: 'bg-base', varName: '--bg-base', label: 'ベース（背景）', defaultHex: '#1E293B', desc: 'サイト全体のメイン背景色' },
        { id: 'bg-header', varName: '--bg-header', label: 'ヘッダー', defaultHex: '#1E293B', desc: '画面上部のナビゲーション領域' },
        { id: 'bg-footer', varName: '--bg-footer', label: 'フッター', defaultHex: '#0F172A', desc: '画面下部の領域' },
        { id: 'main-btn', varName: '--main-btn', label: 'メイン（ボタン）', defaultHex: '#38BDF8', desc: '主要なアクションボタン' },
        { id: 'main-text', varName: '--main-text', label: 'メインテキスト', defaultHex: '#F8FAFC', desc: '通常の文章、見出し文字' },
        { id: 'sub-text', varName: '--sub-text', label: 'サブテキスト', defaultHex: '#94A3B8', desc: '補足情報、ラベル、境界線' },
        { id: 'accent', varName: '--accent', label: 'アクセント', defaultHex: '#FACC15', desc: 'ホバー時のハイライト等' }
    ];

    const inputsArea = document.getElementById('colorInputsArea');
    const mockupWindow = document.getElementById('mockupWindow');
    const cssOutputCode = document.getElementById('cssOutputCode');
    const mdOutputCode = document.getElementById('mdOutputCode');

    // 2. 左パネル：入力UIの動的生成
    paletteSettings.forEach(setting => {
        const row = document.createElement('div');
        row.className = 'color-row';
        row.innerHTML = `
            <input type="color" id="${setting.id}" value="${setting.defaultHex}">
            <label for="${setting.id}">${setting.label}</label>
            <span class="hex-val" id="${setting.id}-hex">${setting.defaultHex}</span>
        `;
        inputsArea.appendChild(row);

        // 色が変更されたときのイベントリスナー
        const inputEl = document.getElementById(setting.id);
        inputEl.addEventListener('input', (e) => {
            const newHex = e.target.value.toUpperCase();
            document.getElementById(`${setting.id}-hex`).textContent = newHex;
            updatePalette();
        });
    });

    // 3. 全体更新関数（モックアップ反映・コード出力）
    function updatePalette() {
        let cssString = `:root {\n`;
        let mdString = `| 役割 | プレビュー | カラーコード | 用途・備考 |\n| :--- | :---: | :--- | :--- |\n`;

        paletteSettings.forEach(setting => {
            const hex = document.getElementById(setting.id).value.toUpperCase();

            // モックアップへのCSS変数リアルタイム適用
            mockupWindow.style.setProperty(setting.varName, hex);

            // 出力用コードの構築
            cssString += `    ${setting.varName}: ${hex};\n`;
            mdString += `| ${setting.label} | ![${hex}](https://placehold.co/15x15/${hex.replace('#', '')}/${hex.replace('#', '')}.png) | \`${hex}\` | ${setting.desc} |\n`;
        });

        cssString += `}`;
        cssOutputCode.textContent = cssString;
        mdOutputCode.textContent = mdString;
    }

    // 4. 右パネル：タブ切り替え処理
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.export-content').forEach(c => c.classList.remove('active'));

            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.add('active');
        });
    });

    // 5. 右パネル：コピーボタン処理
    document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', function () {
            const targetId = this.dataset.copyTarget;
            const textToCopy = document.getElementById(targetId).textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = this.textContent;
                this.textContent = 'コピー済!';
                this.style.backgroundColor = '#10B981';
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.backgroundColor = '';
                }, 2000);
            });
        });
    });

    // 6. 右パネル：インポート処理
    const importBtn = document.getElementById('importBtn');
    const importCssText = document.getElementById('importCssText');

    importBtn.addEventListener('click', () => {
        const cssText = importCssText.value;
        if (!cssText) return;

        let updatedCount = 0;
        paletteSettings.forEach(setting => {
            const regex = new RegExp(`${setting.varName}\\s*:\\s*(#[0-9A-Fa-f]{6})`, 'i');
            const match = cssText.match(regex);

            if (match && match[1]) {
                const newHex = match[1].toUpperCase();
                document.getElementById(setting.id).value = newHex;
                document.getElementById(`${setting.id}-hex`).textContent = newHex;
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            updatePalette();
            const originalText = importBtn.textContent;
            importBtn.textContent = `${updatedCount}色をインポートしました！`;
            importBtn.style.backgroundColor = '#10B981';
            importBtn.style.color = '#FFFFFF';
            setTimeout(() => {
                importBtn.textContent = originalText;
                importBtn.style.backgroundColor = '';
                importBtn.style.color = '';
            }, 2500);
            importCssText.value = '';
        } else {
            alert('有効なCSS変数が見つかりませんでした。出力された :root { ... } の形式を貼り付けてください。');
        }
    });

    // アプリ起動時の初回実行
    updatePalette();

    // =========================================
    // 色彩理論（ハーモニー）自動生成ロジック
    // =========================================
    
    // ★追加：軽量化時に消した関数を計算用に復活！
    function hexToRgbArray(hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }
    function rgbArrayToHex(rgb) { return "#" + rgb.map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join(''); }
    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) h = s = 0;
        else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h * 360, s * 100, l * 100];
    }

    // HSLからRGBへの変換関数
    function hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;
        if (s === 0) { r = g = b = l; } 
        else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [r * 255, g * 255, b * 255];
    }

    // HEXからHSLへ変換するラッパー
    function hexToHsl(hex) {
        return rgbToHsl(...hexToRgbArray(hex));
    }

    // ハーモニー生成処理
    document.querySelectorAll('.harmony-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.target.dataset.type;
            
            // 基準となる「ベース（背景）」の色を取得
            const baseHex = document.getElementById('bg-base').value;
            let [h, s, l] = hexToHsl(baseHex);
            
            // 彩度や明度が低すぎると色が潰れるので、計算用に最低限の値を確保
            if (s < 20) s = 40;
            const isDark = l < 50; 
            
            let newColors = {};

            if (type === 'analogous') {
                // 類似色 (色相を少しずつズラす)
                newColors['bg-header'] = rgbArrayToHex(hslToRgb((h + 15) % 360, s, l));
                newColors['bg-footer'] = rgbArrayToHex(hslToRgb((h - 15 + 360) % 360, s, isDark ? Math.max(l - 10, 5) : Math.min(l + 10, 95)));
                newColors['main-btn']  = rgbArrayToHex(hslToRgb((h + 30) % 360, Math.min(s + 20, 100), isDark ? 60 : 40));
                newColors['accent']    = rgbArrayToHex(hslToRgb((h - 30 + 360) % 360, Math.min(s + 30, 100), isDark ? 70 : 30));
            } 
            else if (type === 'complementary') {
                // 補色 (色相を180度反転)
                const compH = (h + 180) % 360;
                newColors['bg-header'] = rgbArrayToHex(hslToRgb(h, s, isDark ? l + 5 : l - 5));
                newColors['bg-footer'] = rgbArrayToHex(hslToRgb(h, s, isDark ? Math.max(l - 10, 5) : Math.min(l + 10, 95)));
                newColors['main-btn']  = rgbArrayToHex(hslToRgb(compH, Math.min(s + 20, 100), isDark ? 60 : 40));
                newColors['accent']    = rgbArrayToHex(hslToRgb(compH, Math.min(s + 40, 100), isDark ? 70 : 30));
            }
            else if (type === 'triadic') {
                // 3色配色 (色相を120度ずつ配置)
                const h2 = (h + 120) % 360;
                const h3 = (h + 240) % 360;
                newColors['bg-header'] = rgbArrayToHex(hslToRgb(h, s, isDark ? l + 5 : l - 5));
                newColors['bg-footer'] = rgbArrayToHex(hslToRgb(h, s, isDark ? Math.max(l - 10, 5) : Math.min(l + 10, 95)));
                newColors['main-btn']  = rgbArrayToHex(hslToRgb(h2, Math.min(s + 20, 100), isDark ? 60 : 40));
                newColors['accent']    = rgbArrayToHex(hslToRgb(h3, Math.min(s + 20, 100), isDark ? 70 : 30));
            }

            // テキスト色は背景の明るさに応じて白か黒（濃いグレー）に調整
            newColors['main-text'] = isDark ? '#F8FAFC' : '#1E293B';
            newColors['sub-text']  = isDark ? '#94A3B8' : '#64748B';

            // 画面の input 値を更新し、プレビューに反映
            Object.keys(newColors).forEach(id => {
                document.getElementById(id).value = newColors[id];
                document.getElementById(`${id}-hex`).textContent = newColors[id].toUpperCase();
            });
            updatePalette();
        });
    });
});