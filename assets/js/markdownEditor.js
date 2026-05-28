document.addEventListener('DOMContentLoaded', () => {
    const mdInput = document.getElementById('mdInput');
    const mdPreview = document.getElementById('mdPreview');
    const themeSelect = document.getElementById('themeSelect');
    const importFile = document.getElementById('importFile');
    const exportPdfBtn = document.getElementById('exportPdfBtn');

    // 1. Mermaidの初期化設定
    mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose'
    });

    // 2. marked.js のカスタムレンダラー設定
    // Markdown内の ```mermaid ... ``` を検知し、Mermaid用のdivに変換する
    const renderer = new marked.Renderer();
    const originalCodeRenderer = renderer.code.bind(renderer);

    renderer.code = function(code, language) {
        if (language === 'mermaid') {
            return `<div class="mermaid">${code}</div>`;
        }
        return originalCodeRenderer(code, language);
    };

    marked.setOptions({
        renderer: renderer,
        breaks: true,       // 改行を<br>に変換
        gfm: true           // GitHub Flavored Markdownを有効化
    });

    // 3. プレビューのレンダリング処理（タイピング中の負荷軽減のため少し遅延させる）
    let timeoutId;
    function renderMarkdown() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
            const rawText = mdInput.value;
            // MarkdownをHTMLに変換して流し込む
            mdPreview.innerHTML = marked.parse(rawText);
            
            // Mermaidクラスがついた要素があれば、SVGにレンダリング
            try {
                await mermaid.run({
                    querySelector: '.mermaid'
                });
            } catch (error) {
                console.error("Mermaid parsing error:", error);
                // 文法エラー時はプレビューが崩れないようにする
            }
        }, 300); // 300msのデバウンス
    }

    // 4. イベントリスナー群

    // テキスト入力時
    mdInput.addEventListener('input', renderMarkdown);

    // テーマ切り替え時
    themeSelect.addEventListener('change', (e) => {
        mdPreview.className = `markdown-body ${e.target.value}`;
    });

    // .mdファイルの読み込み
    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            mdInput.value = e.target.result;
            renderMarkdown();
        };
        reader.readAsText(file);
        
        // 同じファイルを再度読めるようにリセット
        importFile.value = '';
    });

    // PDFエクスポート処理
    exportPdfBtn.addEventListener('click', () => {
        const element = document.getElementById('mdPreview');
        const originalBtnText = exportPdfBtn.textContent;
        exportPdfBtn.textContent = '生成中...';
        exportPdfBtn.style.backgroundColor = '#6B7280';

        const opt = {
            margin:       15,
            filename:     'document.pdf',
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