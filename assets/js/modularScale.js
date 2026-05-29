document.addEventListener('DOMContentLoaded', () => {
    const baseSizeInput = document.getElementById('baseSizeInput');
    const ratioSelect = document.getElementById('ratioSelect');
    const previewTextInput = document.getElementById('previewTextInput');
    const container = document.getElementById('scaleListContainer');
    const generateBtn = document.getElementById('generateBtn');
    const codeExportBox = document.getElementById('codeExportBox');
    const cssOutputCode = document.getElementById('cssOutputCode');
    const copyBtn = document.getElementById('copyBtn');

    // 生成するスケールの段階（-1: 注釈用小文字, 0: 本文, 1〜6: 見出し）
    const scaleSteps = [
        { step: 6, name: 'text-5xl', role: 'Hero / Title' },
        { step: 5, name: 'text-4xl', role: 'h1' },
        { step: 4, name: 'text-3xl', role: 'h2' },
        { step: 3, name: 'text-2xl', role: 'h3' },
        { step: 2, name: 'text-xl', role: 'h4' },
        { step: 1, name: 'text-lg', role: 'h5 / h6' },
        { step: 0, name: 'text-base', role: 'p (本文)' },
        { step: -1, name: 'text-sm', role: '注釈 / キャプション' }
    ];

    // 計算と画面描画
    function renderScale() {
        const basePx = parseFloat(baseSizeInput.value) || 16;
        const ratio = parseFloat(ratioSelect.value) || 1.25;
        const text = previewTextInput.value || '美しい文字組みを探求する';

        container.innerHTML = ''; // リセット

        scaleSteps.forEach(item => {
            // 計算処理（remは3桁丸め、pxは1桁丸め）
            const remValue = Math.pow(ratio, item.step);
            const pxValue = basePx * remValue;
            
            const displayRem = remValue.toFixed(3) + 'rem';
            const displayPx = pxValue.toFixed(1) + 'px';

            // 行のHTML生成
            const row = document.createElement('div');
            row.className = 'scale-row';
            
            // ベースサイズ(0)の場合はハイライトする
            if(item.step === 0) row.style.backgroundColor = 'rgba(255,255,255,0.02)';

            row.innerHTML = `
                <div class="scale-preview-wrap">
                    <div class="scale-level">${item.name} <span style="color:var(--sub-text); font-weight:normal;">(${item.role})</span></div>
                    <div class="scale-text" style="font-size: ${displayPx};">${text}</div>
                </div>
                <div class="scale-specs">
                    <div class="spec-badge rem">${displayRem}</div>
                    <div class="spec-badge">${displayPx}</div>
                </div>
            `;
            container.appendChild(row);
        });

        // スライダー等を動かしたらコード枠はいったん閉じる
        codeExportBox.classList.remove('active');
    }

    // CSSコードの生成
    generateBtn.addEventListener('click', () => {
        const basePx = parseFloat(baseSizeInput.value) || 16;
        const ratio = parseFloat(ratioSelect.value) || 1.25;

        let cssString = `:root {\n`;
        
        // 逆順（小さいものから）出力するほうが見栄えが良い
        const reversedSteps = [...scaleSteps].reverse();
        
        reversedSteps.forEach(item => {
            const remValue = Math.pow(ratio, item.step);
            const pxValue = basePx * remValue;
            cssString += `  --${item.name}: ${remValue.toFixed(3)}rem; /* ${pxValue.toFixed(1)}px */\n`;
        });
        
        cssString += `}`;
        
        cssOutputCode.textContent = cssString;
        codeExportBox.classList.add('active');
    });

    // コピーボタン処理
    copyBtn.addEventListener('click', function() {
        const textToCopy = cssOutputCode.textContent;
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

    // 入力変更時に即座に再計算
    [baseSizeInput, ratioSelect, previewTextInput].forEach(el => {
        el.addEventListener('input', renderScale);
    });

    // 初期化
    renderScale();
});