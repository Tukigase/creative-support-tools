document.addEventListener('DOMContentLoaded', () => {
    const fonts = [
        { name: 'Noto Sans JP', css: "'Noto Sans JP', sans-serif", id: "Noto+Sans+JP:wght@400;700" },
        { name: 'Noto Serif JP', css: "'Noto Serif JP', serif", id: "Noto+Serif+JP:wght@400;700" },
        { name: 'BIZ UDGothic', css: "'BIZ UDGothic', sans-serif", id: "BIZ+UDGothic:wght@400;700" },
        { name: 'BIZ UDMincho', css: "'BIZ UDMincho', serif", id: "BIZ+UDMincho:wght@400;700" },
        { name: 'M PLUS 1p', css: "'M PLUS 1p', sans-serif", id: "M+PLUS+1p:wght@400;700" },
        { name: 'M PLUS Rounded 1c', css: "'M PLUS Rounded 1c', sans-serif", id: "M+PLUS+Rounded+1c:wght@400;700" },
        { name: 'Klee One', css: "'Klee One', cursive", id: "Klee+One:wght@400;600" },
        { name: 'DotGothic16', css: "'DotGothic16', sans-serif", id: "DotGothic16" },
        { name: 'Yusei Magic', css: "'Yusei Magic', sans-serif", id: "Yusei+Magic" },
        { name: 'Kaisei Decol', css: "'Kaisei Decol', serif", id: "Kaisei+Decol:wght@400;700" }
    ];

    const container = document.getElementById('fontListContainer');
    const previewTextarea = document.getElementById('previewText');
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const lineHeightSlider = document.getElementById('lineHeightSlider');
    const letterSpacingSlider = document.getElementById('letterSpacingSlider');
    const fontWeightToggle = document.getElementById('fontWeightToggle');
    const bgColorPicker = document.getElementById('bgColorPicker');
    const textColorPicker = document.getElementById('textColorPicker');

    // 1. フォントカードの動的生成
    fonts.forEach((font, index) => {
        const card = document.createElement('div');
        card.className = 'font-card';
        card.innerHTML = `
            <div class="font-card-header">
                <h3 class="font-name">${font.name}</h3>
            </div>
            <div class="font-preview-area" id="area-${index}">
                <div class="font-preview-text" id="preview-${index}" style="font-family: ${font.css};"></div>
            </div>
            <div class="font-card-footer">
                <button class="action-btn" id="btn-${index}">このスタイルのコードを取得</button>
                <div class="code-export-box" id="codebox-${index}">
                    <code id="code-${index}"></code>
                </div>
            </div>
        `;
        container.appendChild(card);

        // コード出力ボタンのイベント
        document.getElementById(`btn-${index}`).addEventListener('click', () => {
            const codeBox = document.getElementById(`codebox-${index}`);
            const codeContent = document.getElementById(`code-${index}`);
            
            if (codeBox.classList.contains('active')) {
                codeBox.classList.remove('active');
            } else {
                const weight = fontWeightToggle.checked ? 'bold' : 'normal';
                const htmlLink = `\n<link href="https://fonts.googleapis.com/css2?family=${font.id}&display=swap" rel="stylesheet">\n\n`;
                const cssCode = `/* CSS設定 */\n.custom-text {\n  font-family: ${font.css};\n  font-size: ${fontSizeSlider.value}px;\n  line-height: ${lineHeightSlider.value};\n  letter-spacing: ${letterSpacingSlider.value}em;\n  font-weight: ${weight};\n  color: ${textColorPicker.value};\n  background-color: ${bgColorPicker.value};\n}`;
                
                codeContent.textContent = htmlLink + cssCode;
                codeBox.classList.add('active');
            }
        });
    });

    // 2. スタイル一括更新関数
    function updatePreviews() {
        const text = previewTextarea.value;
        const size = fontSizeSlider.value + 'px';
        const lineH = lineHeightSlider.value;
        const letterS = letterSpacingSlider.value + 'em';
        const weight = fontWeightToggle.checked ? 'bold' : 'normal';
        const bgCol = bgColorPicker.value;
        const textCol = textColorPicker.value;

        // 左パネルのバッジ更新
        document.getElementById('fontSizeVal').textContent = size;
        document.getElementById('lineHeightVal').textContent = lineH;
        document.getElementById('letterSpacingVal').textContent = letterS;

        // テキストとフォント設定の更新
        document.querySelectorAll('.font-preview-text').forEach(el => {
            el.textContent = text;
            el.style.fontSize = size;
            el.style.lineHeight = lineH;
            el.style.letterSpacing = letterS;
            el.style.fontWeight = weight;
        });

        // ★ カラーテストをプレビューエリア(枠)に適用
        document.querySelectorAll('.font-preview-area').forEach(el => {
            el.style.backgroundColor = bgCol;
            el.style.color = textCol;
        });
    }

    // 3. イベントリスナー（inputを使うことでカラーピッカーがリアルタイム反映）
    [previewTextarea, fontSizeSlider, lineHeightSlider, letterSpacingSlider, fontWeightToggle, bgColorPicker, textColorPicker].forEach(el => {
        el.addEventListener('input', updatePreviews);
    });

    // 初期化実行
    updatePreviews();
});