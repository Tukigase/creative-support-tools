document.addEventListener('DOMContentLoaded', () => {
    const mdInput = document.getElementById('mdInput');
    const mdPreview = document.getElementById('mdPreview');
    const themeSelect = document.getElementById('themeSelect');
    const importFile = document.getElementById('importFile');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const exportMdBtn = document.getElementById('exportMdBtn');
    const exportImgBtn = document.getElementById('exportImgBtn');

    let currentFileName = 'document.md';

    // 1. Mermaidの初期化設定
    mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });

    // 2. marked.js の設定（★最新API対応版）
    marked.use({
        breaks: true,
        gfm: true,
        renderer: {
            // 最新版(オブジェクト引数)と旧版(文字列引数)の両方に対応する安全な書き方
            code(arg1, arg2) {
                const lang = typeof arg1 === 'object' ? (arg1.lang || '') : (arg2 || '');
                const text = typeof arg1 === 'object' ? arg1.text : arg1;

                if (lang === 'mermaid') {
                    // mermaidの場合は図表描画用のdivタグに変換
                    return `<div class="mermaid">${text}</div>`;
                }
                // それ以外の言語は false を返すことで、デフォルトのコードブロック処理に任せる
                return false;
            }
        }
    });

    // 3. プレビューのレンダリング処理
    let timeoutId;
    function renderMarkdown() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
            const rawText = mdInput.value;
            
            // MarkdownをHTMLに変換して流し込む
            mdPreview.innerHTML = marked.parse(rawText);
            
            try {
                // プレビューエリア内のmermaid要素だけを取得
                const mermaidNodes = mdPreview.querySelectorAll('.mermaid');
                if (mermaidNodes.length > 0) {
                    // 取得したノードに対してのみMermaidの描画を実行
                    await mermaid.run({ nodes: mermaidNodes });
                }
            } catch (error) {
                console.error("Mermaid parsing error:", error);
                // 文法エラーで描画に失敗しても、エディター自体は落ちないようにする
            }
        }, 300); // タイピング中の負荷軽減（0.3秒後に描画）
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

        currentFileName = file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
            mdInput.value = e.target.result;
            renderMarkdown();
        };
        reader.readAsText(file);
        importFile.value = '';
    });

    // 💾 .mdファイルとして保存
    exportMdBtn.addEventListener('click', () => {
        try {
            const text = mdInput.value;
            const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = currentFileName;
            
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (e) {
            console.error("MD Export Error:", e);
            alert("保存処理でエラーが発生しました。");
        }
    });

    // 🖼️ 画像(PNG)エクスポート処理
    exportImgBtn.addEventListener('click', () => {
        const element = document.getElementById('mdPreview');
        const originalBtnText = exportImgBtn.textContent;
        exportImgBtn.textContent = '生成中...';
        exportImgBtn.style.backgroundColor = '#6B7280';
        exportImgBtn.disabled = true;

        html2canvas(element, { 
            scale: 2, 
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = currentFileName.replace('.md', '.png');
            
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
            }, 100);
        }).catch(err => {
            console.error("Image Export Error:", err);
            alert("画像の生成に失敗しました。図表が複雑すぎる可能性があります。");
        }).finally(() => {
            exportImgBtn.textContent = originalBtnText;
            exportImgBtn.style.backgroundColor = '';
            exportImgBtn.disabled = false;
        });
    });

    // 📄 PDFエクスポート処理
    exportPdfBtn.addEventListener('click', () => {
        const element = document.getElementById('mdPreview');
        const originalBtnText = exportPdfBtn.textContent;
        exportPdfBtn.textContent = '生成中...';
        exportPdfBtn.style.backgroundColor = '#6B7280';
        exportPdfBtn.disabled = true;

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
            exportPdfBtn.disabled = false;
        });
    });

    // 初期化実行
    renderMarkdown();
});