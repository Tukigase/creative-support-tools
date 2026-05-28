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

    // 2. marked.js の基本設定
    marked.use({
        breaks: true,
        gfm: true
    });

    // 3. プレビューのレンダリング処理
    let timeoutId;
    function renderMarkdown() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
            const rawText = mdInput.value;
            
            // ① まずHTMLに変換してプレビューに流し込む
            mdPreview.innerHTML = marked.parse(rawText);
            
            // ② DOM置換アプローチでコードブロックを Mermaid 用の div に変換
            const mermaidCodeBlocks = mdPreview.querySelectorAll('code.language-mermaid');
            mermaidCodeBlocks.forEach(codeBlock => {
                const preElement = codeBlock.parentElement;
                const mermaidDiv = document.createElement('div');
                mermaidDiv.className = 'mermaid';
                mermaidDiv.textContent = codeBlock.textContent;
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

    // 📄 PDFエクスポート処理（★SVGバグ回避・画像一時置換ロジック）
    exportPdfBtn.addEventListener('click', async () => {
        const element = document.getElementById('mdPreview');
        const originalBtnText = exportPdfBtn.textContent;
        exportPdfBtn.textContent = '生成中...';
        exportPdfBtn.style.backgroundColor = '#6B7280';
        exportPdfBtn.disabled = true;

        // 【対策】PDF化する前に、Mermaid要素を一時的に「画像」へ変換する
        const mermaidElements = element.querySelectorAll('.mermaid');
        const originalContents = []; // 元に戻すためのキャッシュ用配列

        for (let i = 0; i < mermaidElements.length; i++) {
            const container = mermaidElements[i];
            
            // 元のHTML（きれいなSVG状態）を記憶しておく
            originalContents.push({
                container: container,
                html: container.innerHTML
            });

            try {
                // 成功しているhtml2canvasのロジックで、図表単体をピンポイント画像化
                const canvas = await html2canvas(container, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff'
                });
                const imgData = canvas.toDataURL('image/png');
                
                // SVGをimgタグにすり替える（レイアウト崩れ防止で横幅いっぱいに設定）
                const img = document.createElement('img');
                img.src = imgData;
                img.style.width = '100%';
                img.style.height = 'auto';
                img.style.display = 'block';
                
                container.innerHTML = '';
                container.appendChild(img);
            } catch (err) {
                console.error("PDF Mermaid pre-render error:", err);
            }
        }

        // 【PDF生成】画像に置き換わった安全なHTMLをPDF化する
        const opt = {
            margin:       15,
            filename:     currentFileName.replace('.md', '.pdf'),
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: ['css', 'legacy'] }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            // PDF化が完了したら、即座に元のきれいなSVG表示に戻す
            originalContents.forEach(item => {
                item.container.innerHTML = item.html;
            });
        }).catch(err => {
            console.error("PDF Export Error:", err);
            alert("PDFの生成に失敗しました。");
            // エラー時も元の状態に戻す
            originalContents.forEach(item => {
                item.container.innerHTML = item.html;
            });
        }).finally(() => {
            exportPdfBtn.textContent = originalBtnText;
            exportPdfBtn.style.backgroundColor = '';
            exportPdfBtn.disabled = false;
        });
    });

    // 初期化実行
    renderMarkdown();
});