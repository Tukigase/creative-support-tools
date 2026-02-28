document.addEventListener('DOMContentLoaded', () => {
    // 要素の取得
    const bgPicker = document.getElementById('backgroundColorPicker');
    const bgHexSpan = document.getElementById('backgroundHexCode');
    const bgRgbSpan = document.getElementById('backgroundRgbValue');

    const textPicker = document.getElementById('textColorPicker');
    const textHexSpan = document.getElementById('textHexCode');
    const textRgbSpan = document.getElementById('textRgbValue');

    const previewBox = document.getElementById('previewBox');
    const swapBtn = document.getElementById('swapColorsButton');

    // HEXからRGBに変換する共通関数
    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${r}, ${g}, ${b})`;
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
    }

    // ピッカー変更時のイベント
    bgPicker.addEventListener('input', (e) => updateColorInfo('bg', e.target.value));
    textPicker.addEventListener('input', (e) => updateColorInfo('text', e.target.value));

    // 色の入れ替え処理
    swapBtn.addEventListener('click', () => {
        const tempBgColor = bgPicker.value;
        const tempTextColor = textPicker.value;

        // ピッカーの値を入れ替え
        bgPicker.value = tempTextColor;
        textPicker.value = tempBgColor;

        // UIを更新
        updateColorInfo('bg', bgPicker.value);
        updateColorInfo('text', textPicker.value);
    });

    // 初期化処理（最初の色を適用）
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
                    // Alertの代わりにボタンのテキストを変更する（UX向上）
                    const originalText = this.textContent;
                    this.textContent = 'コピー済!';
                    this.classList.add('copied');
                    
                    // 2秒後に元のテキストに戻す
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