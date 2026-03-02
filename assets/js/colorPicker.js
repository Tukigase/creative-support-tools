document.addEventListener('DOMContentLoaded', () => {
    const bgPicker = document.getElementById('backgroundColorPicker');
    const bgHexSpan = document.getElementById('backgroundHexCode');
    const bgRgbSpan = document.getElementById('backgroundRgbValue');

    const textPicker = document.getElementById('textColorPicker');
    const textHexSpan = document.getElementById('textHexCode');
    const textRgbSpan = document.getElementById('textRgbValue');

    const previewBox = document.getElementById('previewBox');
    const swapBtn = document.getElementById('swapColorsButton');
    const contrastBadge = document.getElementById('contrastBadge');

    // HEXからRGB配列を取得する関数
    function hexToRgbArray(hex) {
        return [
            parseInt(hex.slice(1, 3), 16),
            parseInt(hex.slice(3, 5), 16),
            parseInt(hex.slice(5, 7), 16)
        ];
    }

    // RGBからHEX文字列を生成する関数
    function rgbArrayToHex(rgb) {
        return "#" + rgb.map(x => {
            const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join('');
    }

    // RGBからHSL(色相, 彩度, 明度)に変換する関数
    function rgbToHsl(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) {
            h = s = 0;
        } else {
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

    // 色覚特性（P/D/T型）シミュレーション関数 (標準的な変換マトリクスを利用)
    function simulateColorblindness(rgb, type) {
        const [r, g, b] = rgb;
        let R, G, B;
        if (type === 'P') {
            R = 0.56667 * r + 0.43333 * g + 0 * b;
            G = 0.55833 * r + 0.44167 * g + 0 * b;
            B = 0 * r + 0.24167 * g + 0.75833 * b;
        } else if (type === 'D') {
            R = 0.625 * r + 0.375 * g + 0 * b;
            G = 0.7 * r + 0.3 * g + 0 * b;
            B = 0 * r + 0.3 * g + 0.7 * b;
        } else if (type === 'T') {
            R = 0.95 * r + 0.05 * g + 0 * b;
            G = 0 * r + 0.43333 * g + 0.56667 * b;
            B = 0 * r + 0.475 * g + 0.525 * b;
        }
        return [R, G, B];
    }

    // WCAG輝度計算
    function getLuminance(rgbArray) {
        let a = rgbArray.map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    // コントラスト比計算
    function getContrastRatio(rgb1, rgb2) {
        const lum1 = getLuminance(rgb1);
        const lum2 = getLuminance(rgb2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
    }

    // 色と判定をUIに反映する関数
    function updateColorInfo() {
        const bgHex = bgPicker.value;
        const textHex = textPicker.value;
        const bgRgb = hexToRgbArray(bgHex);
        const textRgb = hexToRgbArray(textHex);

        // 基本情報の更新
        bgHexSpan.textContent = bgHex;
        bgRgbSpan.textContent = `rgb(${bgRgb.join(', ')})`;
        previewBox.style.backgroundColor = bgHex;

        textHexSpan.textContent = textHex;
        textRgbSpan.textContent = `rgb(${textRgb.join(', ')})`;
        previewBox.style.color = textHex;

        // 1. 複合判定ロジック (輝度・色相・彩度による評価)
        const ratio = getContrastRatio(bgRgb, textRgb).toFixed(2);
        const bgHsl = rgbToHsl(...bgRgb);
        const textHsl = rgbToHsl(...textRgb);

        // 色相の差 (0〜180度)
        const deltaH = Math.min(Math.abs(bgHsl[0] - textHsl[0]), 360 - Math.abs(bgHsl[0] - textHsl[0]));
        // どちらも一定以上の鮮やかさか？ (特例Pass用)
        const isSaturated = bgHsl[1] > 40 && textHsl[1] > 40;

        // ★新規追加: チカチカするハレーションの判定
        // 条件: 両方とも彩度が80%以上 ＆ 明度の差が30未満 ＆ 色相が60度以上離れている
        const isHalation = bgHsl[1] > 80 && textHsl[1] > 80 &&
            Math.abs(bgHsl[2] - textHsl[2]) < 30 &&
            deltaH > 60;

        // --- ここから判定分岐 ---
        if (isHalation) {
            // 最優先でハレーションを「罰（NG）」として弾く！
            contrastBadge.textContent = `❌ チカチカして目が疲れる色です (ハレーション)`;
            contrastBadge.className = 'contrast-badge fail';
        } else if (ratio >= 4.5) {
            contrastBadge.textContent = `✅ 完璧に見やすい (AAA / 比率: ${ratio})`;
            contrastBadge.className = 'contrast-badge pass';
        } else if (ratio >= 3.0) {
            contrastBadge.textContent = `🆗 見やすい (AA / 比率: ${ratio})`;
            contrastBadge.className = 'contrast-badge pass';
        } else if (ratio >= 2.5) {
            contrastBadge.textContent = `⚠️ 許容範囲 (大文字推奨 / 比率: ${ratio})`;
            contrastBadge.className = 'contrast-badge warning';
        } else if (deltaH > 90 && isSaturated) {
            contrastBadge.textContent = `✅ 色の対比で読める (比率: ${ratio})`;
            contrastBadge.className = 'contrast-badge special-pass';
        } else {
            contrastBadge.textContent = `❌ 見づらい (NG / 比率: ${ratio})`;
            contrastBadge.className = 'contrast-badge fail';
        }
        // 2. ユニバーサルシミュレーションの更新
        const types = ['P', 'D', 'T'];
        types.forEach(type => {
            const simBgRgb = simulateColorblindness(bgRgb, type);
            const simTextRgb = simulateColorblindness(textRgb, type);

            const chipBg = document.getElementById(`chip${type}_bg`);
            const chipText = document.getElementById(`chip${type}_text`);

            chipBg.style.backgroundColor = rgbArrayToHex(simBgRgb);
            chipText.style.color = rgbArrayToHex(simTextRgb);
        });

        // LocalStorageに保存
        localStorage.setItem('cst_bg_color', bgHex);
        localStorage.setItem('cst_text_color', textHex);
    }

    // ピッカー変更時のイベント
    bgPicker.addEventListener('input', updateColorInfo);
    textPicker.addEventListener('input', updateColorInfo);

    // 色の入れ替え処理
    swapBtn.addEventListener('click', () => {
        const tempBgColor = bgPicker.value;
        bgPicker.value = textPicker.value;
        textPicker.value = tempBgColor;
        updateColorInfo();
    });

    // 初期化処理
    const savedBg = localStorage.getItem('cst_bg_color');
    const savedText = localStorage.getItem('cst_text_color');
    if (savedBg) bgPicker.value = savedBg;
    if (savedText) textPicker.value = savedText;
    updateColorInfo();

    // コピーボタン処理 (既存のまま)
    const copyButtons = document.querySelectorAll('.copy-button');
    copyButtons.forEach(button => {
        button.addEventListener('click', function () {
            const targetId = this.dataset.copyTarget;
            const textToCopy = document.getElementById(targetId).textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = this.textContent;
                this.textContent = 'コピー済!';
                this.classList.add('copied');
                setTimeout(() => {
                    this.textContent = originalText;
                    this.classList.remove('copied');
                }, 2000);
            });
        });
    });
});