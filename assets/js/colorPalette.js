document.addEventListener('DOMContentLoaded', () => {
    // ユーザー提案の7項目の定義
    const paletteSettings = [
        { id: 'bg-base', varName: '--bg-base', label: 'ベース（背景）', defaultHex: '#1E293B', desc: 'サイト全体のメイン背景色' },
        { id: 'bg-header', varName: '--bg-header', label: 'ヘッダー', defaultHex: '#1E293B', desc: '画面上部のナビゲーション領域' },
        { id: 'bg-footer', varName: '--bg-footer', label: 'フッター', defaultHex: '#0F172A', desc: '画面下部の領域' },
        { id: 'main-btn', varName: '--main-btn', label: 'メイン（ボタン）', defaultHex: '#38BDF8', desc: '主要なアクションボタン、強調リンク' },
        { id: 'main-text', varName: '--main-text', label: 'メインテキスト', defaultHex: '#F8FAFC', desc: '通常の文章、見出し文字' },
        { id: 'sub-text', varName: '--sub-text', label: 'サブテキスト', defaultHex: '#94A3B8', desc: '補足情報、ラベル、境界線' },
        { id: 'accent', varName: '--accent', label: 'アクセント', defaultHex: '#FACC15', desc: 'ホバー時のハイライト、注意喚起' }
    ];

    const inputsArea = document.getElementById('colorInputsArea');
    const mockupWindow = document.getElementById('mockupWindow');
    const cssOutputCode = document.getElementById('cssOutputCode');
    const mdOutputCode = document.getElementById('mdOutputCode');

    // 1. 入力UIの動的生成
    paletteSettings.forEach(setting => {
        const row = document.createElement('div');
        row.className = 'color-row';
        row.innerHTML = `
            <label for="${setting.id}">${setting.label}</label>
            <input type="color" id="${setting.id}" value="${setting.defaultHex}">
            <span class="hex-val" id="${setting.id}-hex">${setting.defaultHex}</span>
            <span class="role-desc">${setting.desc}</span>
        `;
        inputsArea.appendChild(row);

        // イベントリスナーの追加
        const inputEl = document.getElementById(setting.id);
        const hexSpan = document.getElementById(`${setting.id}-hex`);

        inputEl.addEventListener('input', (e) => {
            const newHex = e.target.value.toUpperCase();
            hexSpan.textContent = newHex;
            updatePalette();
        });
    });

    // 2. プレビューとコード出力の更新関数
    function updatePalette() {
        let cssString = `:root {\n`;

        // Markdownテーブルのヘッダー
        let mdString = `| 役割 | プレビュー | カラーコード | 用途・備考 |\n`;
        mdString += `| :--- | :---: | :--- | :--- |\n`;

        paletteSettings.forEach(setting => {
            const inputEl = document.getElementById(setting.id);
            const currentHex = inputEl.value.toUpperCase();

            // モックアップへのCSS変数リアルタイム適用
            mockupWindow.style.setProperty(setting.varName, currentHex);

            // CSS文字列の構築
            cssString += `    ${setting.varName}: ${currentHex};\n`;

            // Markdown文字列の構築 (QiitaやGitHubで色がプレビューされるバッジ記法を活用)
            mdString += `| ${setting.label} | ![${currentHex}](https://placehold.co/15x15/${currentHex.replace('#', '')}/${currentHex.replace('#', '')}.png) | \`${currentHex}\` | ${setting.desc} |\n`;
        });

        cssString += `}`;

        cssOutputCode.textContent = cssString;
        mdOutputCode.textContent = mdString;
        checkIntegratedContrast();
    }

    // 色計算関数群 (colorPickerから移植)
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
    function simulateColorblindness(rgb, type) {
        const [r, g, b] = rgb; let R, G, B;
        if (type === 'P') { R = 0.56667 * r + 0.43333 * g; G = 0.55833 * r + 0.44167 * g; B = 0.24167 * g + 0.75833 * b; }
        else if (type === 'D') { R = 0.625 * r + 0.375 * g; G = 0.7 * r + 0.3 * g; B = 0.3 * g + 0.7 * b; }
        else if (type === 'T') { R = 0.95 * r + 0.05 * g; G = 0.43333 * g + 0.56667 * b; B = 0.475 * g + 0.525 * b; }
        return [R, G, B];
    }
    function getLuminance(rgbArray) {
        let a = rgbArray.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }
    function getContrastRatio(rgb1, rgb2) {
        const lum1 = getLuminance(rgb1), lum2 = getLuminance(rgb2);
        return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
    }

    // ★ 判定ロジック
    function checkIntegratedContrast() {
        const bgId = document.getElementById('bgRoleSelect').value;
        const textId = document.getElementById('textRoleSelect').value;

        // 選択された項目の現在のHEXを取得
        const bgHex = document.getElementById(bgId).value;
        const textHex = document.getElementById(textId).value;

        const bgRgb = hexToRgbArray(bgHex);
        const textRgb = hexToRgbArray(textHex);
        const bgHsl = rgbToHsl(...bgRgb);
        const textHsl = rgbToHsl(...textRgb);

        const ratio = getContrastRatio(bgRgb, textRgb).toFixed(2);
        const deltaH = Math.min(Math.abs(bgHsl[0] - textHsl[0]), 360 - Math.abs(bgHsl[0] - textHsl[0]));
        const isHalation = bgHsl[1] > 80 && textHsl[1] > 80 && Math.abs(bgHsl[2] - textHsl[2]) < 30 && deltaH > 60;

        const badge = document.getElementById('integratedContrastBadge');
        if (isHalation) {
            badge.textContent = `❌ チカチカして目が疲れます (ハレーション)`; badge.className = 'contrast-badge fail';
        } else if (ratio >= 4.5) {
            badge.textContent = `✅ 完璧に見やすい (AAA / 比率: ${ratio})`; badge.className = 'contrast-badge pass';
        } else if (ratio >= 3.0) {
            badge.textContent = `🆗 見やすい (AA / 比率: ${ratio})`; badge.className = 'contrast-badge pass';
        } else if (ratio >= 2.5) {
            badge.textContent = `⚠️ 大文字推奨 (比率: ${ratio})`; badge.className = 'contrast-badge warning';
        } else {
            badge.textContent = `❌ 見づらい (NG / 比率: ${ratio})`; badge.className = 'contrast-badge fail';
        }

        ['P', 'D', 'T'].forEach(type => {
            const chipBg = document.getElementById(`chip${type}_bg`);
            const chipText = document.getElementById(`chip${type}_text`);
            chipBg.style.backgroundColor = rgbArrayToHex(simulateColorblindness(bgRgb, type));
            chipText.style.color = rgbArrayToHex(simulateColorblindness(textRgb, type));
        });
    }

    // プルダウンが変更された時に判定を更新
    document.getElementById('bgRoleSelect').addEventListener('change', checkIntegratedContrast);
    document.getElementById('textRoleSelect').addEventListener('change', checkIntegratedContrast);

    // タブ切り替え処理
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.export-content').forEach(c => c.classList.remove('active'));

            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.add('active');
        });
    });

    // コピーボタン処理
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
                    this.style.backgroundColor = 'rgba(255,255,255,0.1)';
                }, 2000);
            });
        });
    });

    // インポート処理
    const importBtn = document.getElementById('importBtn');
    const importCssText = document.getElementById('importCssText');

    importBtn.addEventListener('click', () => {
        const cssText = importCssText.value;
        if (!cssText) return;

        let updatedCount = 0;

        paletteSettings.forEach(setting => {
            // 正規表現で、各CSS変数名とその後ろのHEXコードを探し出す
            // 例: /--bg-base\s*:\s*(#[0-9A-Fa-f]{6})/i
            const regex = new RegExp(`${setting.varName}\\s*:\\s*(#[0-9A-Fa-f]{6})`, 'i');
            const match = cssText.match(regex);

            if (match && match[1]) {
                const newHex = match[1].toUpperCase();

                // input[type="color"] と表示用のテキストを更新
                document.getElementById(setting.id).value = newHex;
                document.getElementById(`${setting.id}-hex`).textContent = newHex;
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            // 色が1つでも更新されたらプレビューを再描画
            updatePalette();

            // 成功のフィードバックをボタンのアニメーションで表現
            const originalText = importBtn.textContent;
            importBtn.textContent = `${updatedCount}色をインポートしました！`;
            importBtn.style.backgroundColor = '#10B981';
            importBtn.style.color = '#FFFFFF';
            setTimeout(() => {
                importBtn.textContent = originalText;
                importBtn.style.backgroundColor = '';
                importBtn.style.color = '';
            }, 2500);

            // 読み込み後はテキストエリアを空にする（任意）
            importCssText.value = '';
        } else {
            alert('有効なCSS変数が見つかりませんでした。出力された :root { ... } の形式を貼り付けてください。');
        }
    });

    // 初期化実行
    updatePalette();
});