document.addEventListener('DOMContentLoaded', () => {
    // 1. デフォルトの厳選Google Fonts 20種
    const defaultFonts = [
        { name: 'Noto Sans JP', css: "'Noto Sans JP', sans-serif", id: "Noto+Sans+JP:wght@400;700", isCustom: false },
        { name: 'BIZ UDGothic', css: "'BIZ UDGothic', sans-serif", id: "BIZ+UDGothic:wght@400;700", isCustom: false },
        { name: 'M PLUS 1p', css: "'M PLUS 1p', sans-serif", id: "M+PLUS+1p:wght@400;700", isCustom: false },
        { name: 'M PLUS Rounded 1c', css: "'M PLUS Rounded 1c', sans-serif", id: "M+PLUS+Rounded+1c:wght@400;700", isCustom: false },
        { name: 'Zen Kaku Gothic New', css: "'Zen Kaku Gothic New', sans-serif", id: "Zen+Kaku+Gothic+New:wght@400;700", isCustom: false },
        { name: 'Zen Maru Gothic', css: "'Zen Maru Gothic', sans-serif", id: "Zen+Maru+Gothic:wght@400;700", isCustom: false },
        { name: 'Noto Serif JP', css: "'Noto Serif JP', serif", id: "Noto+Serif+JP:wght@400;700", isCustom: false },
        { name: 'BIZ UDMincho', css: "'BIZ UDMincho', serif", id: "BIZ+UDMincho:wght@400;700", isCustom: false },
        { name: 'Shippori Mincho', css: "'Shippori Mincho', serif", id: "Shippori+Mincho:wght@400;700", isCustom: false },
        { name: 'Kaisei Decol', css: "'Kaisei Decol', serif", id: "Kaisei+Decol:wght@400;700", isCustom: false },
        { name: 'Klee One', css: "'Klee One', cursive", id: "Klee+One:wght@400;600", isCustom: false },
        { name: 'Yusei Magic', css: "'Yusei Magic', sans-serif", id: "Yusei+Magic", isCustom: false },
        { name: 'Kiwi Maru', css: "'Kiwi Maru', serif", id: "Kiwi+Maru:wght@400;500", isCustom: false },
        { name: 'Yuji Syuku', css: "'Yuji Syuku', serif", id: "Yuji+Syuku", isCustom: false },
        { name: 'DotGothic16', css: "'DotGothic16', sans-serif", id: "DotGothic16", isCustom: false },
        { name: 'Dela Gothic One', css: "'Dela Gothic One', cursive", id: "Dela+Gothic+One", isCustom: false },
        { name: 'RocknRoll One', css: "'RocknRoll One', sans-serif", id: "RocknRoll+One", isCustom: false },
        { name: 'Reggae One', css: "'Reggae One', cursive", id: "Reggae+One", isCustom: false },
        { name: 'Train One', css: "'Train One', cursive", id: "Train+One", isCustom: false },
        { name: 'Hachi Maru Pop', css: "'Hachi Maru Pop', cursive", id: "Hachi+Maru+Pop", isCustom: false }
    ];

    // LocalStorageからカスタムフォントを読み込む
    let customFonts = JSON.parse(localStorage.getItem('myCustomFonts')) || [];
    let allFonts = [...customFonts, ...defaultFonts];

    // JSでGoogle Fontsを自動読み込み
    const fontQuery = defaultFonts.map(f => `family=${f.id}`).join('&');
    const fontLink = document.createElement('link');
    fontLink.href = `https://fonts.googleapis.com/css2?${fontQuery}&display=swap`;
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    const container = document.getElementById('fontListContainer');
    const previewTextarea = document.getElementById('previewText');
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const lineHeightSlider = document.getElementById('lineHeightSlider');
    const letterSpacingSlider = document.getElementById('letterSpacingSlider');
    const fontWeightToggle = document.getElementById('fontWeightToggle');
    const bgColorPicker = document.getElementById('bgColorPicker');
    const textColorPicker = document.getElementById('textColorPicker');

    // カードを1枚生成する関数
    function createFontCard(font, index) {
        const card = document.createElement('div');
        card.className = 'font-card';
        card.id = `card-${index}`;
        
        // カスタムフォントなら削除ボタンを付ける
        const deleteBtnHtml = font.isCustom ? `<button class="delete-btn" onclick="deleteCustomFont(${index})">削除</button>` : '';

        card.innerHTML = `
            <div class="font-card-header">
                <div style="display: flex; align-items: center;">
                    <h3 class="font-name">${font.name}</h3>
                    ${deleteBtnHtml}
                </div>
            </div>
            <div class="font-preview-area" id="area-${index}">
                <div class="font-preview-text" id="preview-${index}" style="font-family: ${font.css};"></div>
            </div>
            <div class="font-card-footer">
                <button class="action-btn" id="btn-${index}">このスタイルのコードを取得</button>
                <div class="code-export-box" id="codebox-${index}">
                    <button class="copy-button" id="copybtn-${index}">コピー</button>
                    <code id="code-${index}"></code>
                </div>
            </div>
        `;
        return card;
    }

    // イベントリスナーをカードに付与する関数
    function attachCardEvents(font, index) {
        document.getElementById(`btn-${index}`).addEventListener('click', () => {
            const codeBox = document.getElementById(`codebox-${index}`);
            const codeContent = document.getElementById(`code-${index}`);
            
            if (codeBox.classList.contains('active')) {
                codeBox.classList.remove('active');
            } else {
                const weight = fontWeightToggle.checked ? 'bold' : 'normal';
                let htmlLink = '';
                if (!font.isCustom) {
                    htmlLink = `\n<link href="https://fonts.googleapis.com/css2?family=${font.id}&display=swap" rel="stylesheet">\n\n`;
                } else {
                    htmlLink = `\n\n`;
                }
                const cssCode = `/* CSS設定 */\n.custom-text {\n  font-family: ${font.css};\n  font-size: ${fontSizeSlider.value}px;\n  line-height: ${lineHeightSlider.value};\n  letter-spacing: ${letterSpacingSlider.value}em;\n  font-weight: ${weight};\n  color: ${textColorPicker.value};\n  background-color: ${bgColorPicker.value};\n}`;
                
                codeContent.textContent = htmlLink + cssCode;
                codeBox.classList.add('active');
            }
        });

        document.getElementById(`copybtn-${index}`).addEventListener('click', function() {
            const textToCopy = document.getElementById(`code-${index}`).textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = this.textContent;
                this.textContent = 'コピー済!';
                this.style.backgroundColor = '#10B981';
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }, 2000);
            });
        });
    }

    // リスト全体を描画する関数
    function renderFontList() {
        container.innerHTML = ''; // 一度リセット
        allFonts.forEach((font, index) => {
            container.appendChild(createFontCard(font, index));
            attachCardEvents(font, index);
        });
        updatePreviews(); // 再描画時に設定を反映
    }

    // ★カスタムフォント追加処理
    document.getElementById('addCustomFontBtn').addEventListener('click', () => {
        const nameInput = document.getElementById('customFontName');
        const cssInput = document.getElementById('customFontCss');
        
        if (!nameInput.value || !cssInput.value) {
            alert('表示名とCSS font-familyの両方を入力してください。');
            return;
        }

        const newFont = {
            name: nameInput.value,
            css: cssInput.value,
            id: 'custom',
            isCustom: true
        };

        // 配列の先頭に追加して保存
        customFonts.unshift(newFont);
        localStorage.setItem('myCustomFonts', JSON.stringify(customFonts));
        allFonts = [...customFonts, ...defaultFonts];
        
        // 入力欄を空にして再描画
        nameInput.value = '';
        cssInput.value = '';
        renderFontList();
    });

    // ★カスタムフォント削除処理 (グローバルに露出させる)
    window.deleteCustomFont = function(index) {
        if(confirm('このカスタムフォントを削除しますか？')) {
            // allFontsのインデックスから、customFonts上の要素を特定して削除
            const fontToDelete = allFonts[index];
            customFonts = customFonts.filter(f => f.name !== fontToDelete.name);
            localStorage.setItem('myCustomFonts', JSON.stringify(customFonts));
            allFonts = [...customFonts, ...defaultFonts];
            renderFontList();
        }
    };

    // 3. スタイル一括更新関数
    function updatePreviews() {
        const text = previewTextarea.value;
        const size = fontSizeSlider.value + 'px';
        const lineH = lineHeightSlider.value;
        const letterS = letterSpacingSlider.value + 'em';
        const weight = fontWeightToggle.checked ? 'bold' : 'normal';
        const bgCol = bgColorPicker.value;
        const textCol = textColorPicker.value;

        document.getElementById('fontSizeVal').textContent = size;
        document.getElementById('lineHeightVal').textContent = lineH;
        document.getElementById('letterSpacingVal').textContent = letterS;

        document.querySelectorAll('.font-preview-text').forEach(el => {
            el.textContent = text;
            el.style.fontSize = size;
            el.style.lineHeight = lineH;
            el.style.letterSpacing = letterS;
            el.style.fontWeight = weight;
        });

        document.querySelectorAll('.font-preview-area').forEach(el => {
            el.style.backgroundColor = bgCol;
            el.style.color = textCol;
        });
    }

    // 4. イベントリスナー
    [previewTextarea, fontSizeSlider, lineHeightSlider, letterSpacingSlider, fontWeightToggle, bgColorPicker, textColorPicker].forEach(el => {
        el.addEventListener('input', updatePreviews);
    });

    // 初期化実行（リストの初回描画）
    renderFontList();
});