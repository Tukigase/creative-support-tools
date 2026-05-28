document.addEventListener('DOMContentLoaded', () => {
    const mdInput = document.getElementById('mdInput');
    const mdPreview = document.getElementById('mdPreview');
    const themeSelect = document.getElementById('themeSelect');
    const importFile = document.getElementById('importFile');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    
    // ★追加したボタン
    const exportMdBtn = document.getElementById('exportMdBtn');
    const exportImgBtn = document.getElementById('exportImgBtn');

    // 現在開いているファイル名（デフォルト値）
    let currentFileName = 'document.md';

    // 1. Mermaidの初期化設定
    mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });

    // 2. marked.js のカスタムレンダラー設定
    const renderer = new marked.Renderer();
    const originalCodeRenderer = renderer.code.bind(renderer);
    renderer.code = function(code, language) {
        if (language === 'mermaid') {
            return `<div class="mermaid">${code}</div>`;
        }
        return originalCodeRenderer(code, language);
    };

    marked.setOptions({ renderer: renderer, breaks: true, gfm: true });

    // 3. プレビューのレンダリング処理
    let timeoutId;
    function renderMarkdown() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
            const rawText = mdInput.value;
            mdPreview.innerHTML = marked.parse(rawText);
            try {
                await mermaid.run({ querySelector: '.mermaid' });
            } catch (error) {
                console.error("Mermaid parsing error:", error);
            }
        }, 300);
    }

    // 4. イベントリスナー群
    mdInput.addEventListener('input', renderMarkdown);

    themeSelect.addEventListener('change', (e) => {
        mdPreview.className = `markdown-body ${e.target.value}`;
    });

    // 📁 .mdファイルの読み込み
    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // ★読み込んだファイル名を記憶する
        currentFileName = file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
            mdInput.value = e.target.result;
            renderMarkdown();
        };
        reader.readAsText(file);
        importFile.value = '';
    });

    // 💾 .mdファイルとして保存（ダウンロード）
    exportMdBtn.addEventListener('click', () => {
        const text = mdInput.value;
        const blob = new Blob([text], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = currentFileName; // 読み込み時と同じ名前、または document.md
        a.click();
        
        URL.revokeObjectURL(url);
    });

    // 🖼️ 画像(PNG)エクスポート処理
    exportImgBtn.addEventListener('click', () => {
        const element = document.getElementById('mdPreview');
        const originalBtnText = exportImgBtn.textContent;
        exportImgBtn.textContent = '生成中...';
        exportImgBtn.style.backgroundColor = '#6B7280';

        // html2canvas でプレビューエリアを画像化
        html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFileName.replace('.md', '.png');
            a.click();

            exportImgBtn.textContent = originalBtnText;
            exportImgBtn.style.backgroundColor = '';
        });
    });

    // 📄 PDFエクスポート処理
    exportPdfBtn.addEventListener('click', () => {
        const element = document.getElementById('mdPreview');
        const originalBtnText = exportPdfBtn.textContent;
        exportPdfBtn.textContent = '生成中...';
        exportPdfBtn.style.backgroundColor = '#6B7280';

        const opt = {
            margin:       15,
            filename:     currentFileName.replace('.md', '.pdf'),
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            exportPdfBtn.textContent = originalBtnText;
            exportPdfBtn.style.backgroundColor = '';
        });
    });

    // 初期化実行
    renderMarkdown();
});