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

    // HEXからRGBに変換する関数
    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${r}, ${g}, ${b})`;
    }

    // 相対輝度の計算 (WCAG標準)
    function getLuminance(hex) {
        let rgb = [
            parseInt(hex.slice(1, 3), 16) / 255,
            parseInt(hex.slice(3, 5), 16) / 255,
            parseInt(hex.slice(5, 7), 16) / 255
        ];
        let a = rgb.map((v) => {
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    // コントラスト比の計算
    function getContrastRatio(hex1, hex2) {
        const lum1 = getLuminance(hex1);
        const lum2 = getLuminance(hex2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
    }

    // 色をUIに反映する関数
    function updateColorInfo(type, hexValue) {
        if (type === 'bg') {
            bgHexSpan.textContent = hexValue;
            bgRgbSpan.textContent = hexToRgb(hexValue);
            previewBox.style.backgroundColor = hexValue;
        } else if (type === 'text') {
            textHexSpan.textContent = hexValue;
            textRgbSpan.textContent = hexToRgb(hexValue);
            previewBox.style.color = hexValue;
        }

        // コントラスト判定とバッジの更新
        const ratio = getContrastRatio(bgPicker.value, textPicker.value).toFixed(2);
        if (ratio >= 4.5) {
            contrastBadge.textContent = `✅ 見やすい (比率: ${ratio}:1)`;
            contrastBadge.className = 'contrast-badge pass';
        } else {
            contrastBadge.textContent = `⚠️ 見づらい (比率: ${ratio}:1)`;
            contrastBadge.className = 'contrast-badge fail';
        }

        // LocalStorageに現在の色を保存
        localStorage.setItem('cst_bg_color', bgPicker.value);
        localStorage.setItem('cst_text_color', textPicker.value);
    }

    // ピッカー変更時のイベント
    bgPicker.addEventListener('input', (e) => updateColorInfo('bg', e.target.value));
    textPicker.addEventListener('input', (e) => updateColorInfo('text', e.target.value));

    // 色の入れ替え処理
    swapBtn.addEventListener('click', () => {
        const tempBgColor = bgPicker.value;
        const tempTextColor = textPicker.value;
        bgPicker.value = tempTextColor;
        textPicker.value = tempBgColor;
        updateColorInfo('bg', bgPicker.value);
        updateColorInfo('text', textPicker.value);
    });

    // ▼ 初期化処理 ▼
    // LocalStorageから前回の色を読み込み（なければHTMLのデフォルト値を使用）
    const savedBg = localStorage.getItem('cst_bg_color');
    const savedText = localStorage.getItem('cst_text_color');
    if (savedBg) bgPicker.value = savedBg;
    if (savedText) textPicker.value = savedText;
    
    updateColorInfo('bg', bgPicker.value);
    updateColorInfo('text', textPicker.value);

    // コピーボタンの処理
    const copyButtons = document.querySelectorAll('.copy-button');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.dataset.copyTarget;
            const textToCopy = document.getElementById(targetId).textContent;
            
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    const originalText = this.textContent;
                    this.textContent = 'コピー済!';
                    this.classList.add('copied');
                    setTimeout(() => {
                        this.textContent = originalText;
                        this.classList.remove('copied');
                    }, 2000);
                })
                .catch(err => {
                    console.error('クリップボードへの書き込みに失敗しました', err);
                    alert('コピーに失敗しました。');
                });
        });
    });
});