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

    // 2. marked.js の基本設定（カスタムレンダラーは使わない）
    // 最新版の marked は setOptions ではなく use を推奨
    marked.use({
        breaks: true, // 改行を<br>に変換
        gfm: true     // GitHub Flavored Markdown
    });

    // 3. プレビューのレンダリング処理
    let timeoutId;
    function renderMarkdown() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
            const rawText = mdInput.value;
            
            // ① まず普通にHTMLに変換してプレビューに流し込む
            mdPreview.innerHTML = marked.parse(rawText);
            
            // ② marked.jsのAPIに依存しないDOM置換アプローチ
            // 出力されたHTMLの中から `language-mermaid` のクラスを持つ code 要素を探す
            const mermaidCodeBlocks = mdPreview.querySelectorAll('code.language-mermaid');
            
            mermaidCodeBlocks.forEach(codeBlock => {
                // 親の <pre> 要素を取得
                const preElement = codeBlock.parentElement;
                
                // 新しい <div class="mermaid"> を作成
                const mermaidDiv = document.createElement('div');
                mermaidDiv.className = 'mermaid';
                mermaidDiv.textContent = codeBlock.textContent; // 中身のテキストをそのまま移動
                
                // <pre> を <div> にそっくり置き換える
                preElement.replaceWith(mermaidDiv);
            });

            // ③ 置換が終わった後にMermaidを描画
            try {
                const mermaidNodes = mdPreview.querySelectorAll('.mermaid');
                if (mermaidNodes.length > 0) {
                    await mermaid.run({ nodes: mermaidNodes });
                }
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
            alert("画像の生成に失敗しました。");
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