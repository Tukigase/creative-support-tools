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

            mdPreview.innerHTML = marked.parse(rawText);

            const mermaidCodeBlocks = mdPreview.querySelectorAll('code.language-mermaid');
            mermaidCodeBlocks.forEach(codeBlock => {
                const preElement = codeBlock.parentElement;
                const mermaidDiv = document.createElement('div');
                mermaidDiv.className = 'mermaid';
                mermaidDiv.textContent = codeBlock.textContent;
                preElement.replaceWith(mermaidDiv);
            });

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

    // ★追加: Tabキーでインデント（スペース4つ）を挿入する
    mdInput.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') {
            e.preventDefault(); // フォーカス移動をキャンセル

            const start = this.selectionStart;
            const end = this.selectionEnd;
            const value = this.value;

            // スペース4つをカーソル位置に挿入
            this.value = value.substring(0, start) + "    " + value.substring(end);

            // カーソル位置を挿入した分（4文字）後ろにずらす
            this.selectionStart = this.selectionEnd = start + 4;

            // インデント挿入後、プレビューも更新する
            renderMarkdown();
        }
    });

    themeSelect.addEventListener('change', (e) => {
        mdPreview.className = `markdown-body ${e.target.value}`;
    });

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
        let inputName = prompt("保存するファイル名を入力してください（拡張子不要）:", currentFileName.replace('.md', ''));
        if (inputName === null) return; // キャンセル時
        if (inputName.trim() === "") inputName = "document"; // 空欄時

        currentFileName = `${inputName}.md`; // ベースのファイル名を更新
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
        // ★追加: ファイル名を入力させる
        let inputName = prompt("保存する画像ファイル名を入力してください（拡張子不要）:", currentFileName.replace('.md', ''));
        if (inputName === null) return;
        if (inputName.trim() === "") inputName = "document";

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
            a.download = `${inputName}.png`;

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
    exportPdfBtn.addEventListener('click', async () => {
        let inputName = prompt("保存するPDFファイル名を入力してください（拡張子不要）:", currentFileName.replace('.md', ''));
        if (inputName === null) return;
        if (inputName.trim() === "") inputName = "document";

        const element = document.getElementById('mdPreview');
        const originalBtnText = exportPdfBtn.textContent;
        exportPdfBtn.textContent = '生成中...';
        exportPdfBtn.style.backgroundColor = '#6B7280';
        exportPdfBtn.disabled = true;

        const mermaidElements = element.querySelectorAll('.mermaid');
        const originalContents = [];

        for (let i = 0; i < mermaidElements.length; i++) {
            const container = mermaidElements[i];

            originalContents.push({
                container: container,
                html: container.innerHTML
            });

            try {
                const canvas = await html2canvas(container, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff'
                });
                const imgData = canvas.toDataURL('image/png');

                const img = document.createElement('img');
                img.src = imgData;
                // ★ 修正: width:100% の強制拡大をやめ、最大値のみ100%に制限して中央揃え
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.style.display = 'block';
                img.style.margin = '0 auto';

                container.innerHTML = '';
                container.appendChild(img);
            } catch (err) {
                console.error("PDF Mermaid pre-render error:", err);
            }
        }

        // ★ 修正: pagebreak の avoid オプションに .mermaid を指定して途中でのスライスを防止
        const opt = {
            margin: 15,
            filename: `${inputName}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'], avoid: ['.mermaid', 'h1', 'h2', 'img'] }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            originalContents.forEach(item => {
                item.container.innerHTML = item.html;
            });
        }).catch(err => {
            console.error("PDF Export Error:", err);
            alert("PDFの生成に失敗しました。");
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