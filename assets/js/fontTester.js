document.addEventListener('DOMContentLoaded', () => {
    // 比較するGoogle Fontsのリスト
    const fonts = [
        { name: 'Noto Sans JP', css: "'Noto Sans JP', sans-serif" },
        { name: 'Noto Serif JP', css: "'Noto Serif JP', serif" },
        { name: 'BIZ UDGothic', css: "'BIZ UDGothic', sans-serif" },
        { name: 'BIZ UDMincho', css: "'BIZ UDMincho', serif" },
        { name: 'M PLUS 1p', css: "'M PLUS 1p', sans-serif" },
        { name: 'M PLUS Rounded 1c', css: "'M PLUS Rounded 1c', sans-serif" },
        { name: 'Klee One', css: "'Klee One', cursive" },
        { name: 'DotGothic16', css: "'DotGothic16', sans-serif" },
        { name: 'Yusei Magic', css: "'Yusei Magic', sans-serif" },
        { name: 'Kaisei Decol', css: "'Kaisei Decol', serif" },
        { name: 'Reggae One', css: "'Reggae One', cursive" },
        { name: 'RocknRoll One', css: "'RocknRoll One', sans-serif" },
        { name: 'Dela Gothic One', css: "'Dela Gothic One', cursive" }
    ];

    const container = document.getElementById('fontListContainer');
    const previewTextarea = document.getElementById('previewText');
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const lineHeightSlider = document.getElementById('lineHeightSlider');
    const letterSpacingSlider = document.getElementById('letterSpacingSlider');
    const fontWeightToggle = document.getElementById('fontWeightToggle');

    const fontSizeVal = document.getElementById('fontSizeVal');
    const lineHeightVal = document.getElementById('lineHeightVal');
    const letterSpacingVal = document.getElementById('letterSpacingVal');

    // 1. フォントカードの動的生成
    fonts.forEach(font => {
        const card = document.createElement('div');
        card.className = 'font-card';
        card.innerHTML = `
            <div class="font-card-header">
                <h3 class="font-name">${font.name}</h3>
                <span class="font-css-code">font-family: ${font.css};</span>
            </div>
            <div class="font-preview-text" style="font-family: ${font.css};">
                ${previewTextarea.value}
            </div>
        `;
        container.appendChild(card);
    });

    // 2. スタイル更新関数
    function updatePreviews() {
        const text = previewTextarea.value;
        const size = fontSizeSlider.value + 'px';
        const lineH = lineHeightSlider.value;
        const letterS = letterSpacingSlider.value + 'em';
        const weight = fontWeightToggle.checked ? 'bold' : 'normal';

        // バッジの表示更新
        fontSizeVal.textContent = size;
        lineHeightVal.textContent = lineH;
        letterSpacingVal.textContent = letterS;

        // すべてのプレビューテキストにスタイルを適用
        document.querySelectorAll('.font-preview-text').forEach(el => {
            el.textContent = text; // テキスト自体の更新
            el.style.fontSize = size;
            el.style.lineHeight = lineH;
            el.style.letterSpacing = letterS;
            el.style.fontWeight = weight;
        });
    }

    // 3. イベントリスナーの設定
    previewTextarea.addEventListener('input', updatePreviews);
    fontSizeSlider.addEventListener('input', updatePreviews);
    lineHeightSlider.addEventListener('input', updatePreviews);
    letterSpacingSlider.addEventListener('input', updatePreviews);
    fontWeightToggle.addEventListener('change', updatePreviews);

    // 初期化実行
    updatePreviews();
});