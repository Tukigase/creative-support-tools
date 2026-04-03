document.addEventListener('DOMContentLoaded', () => {
    // ユーザー提案の7項目の定義
    const paletteSettings = [
        { id: 'bg-base', varName: '--bg-base', label: 'ベース（背景）', defaultHex: '#1E293B', desc: 'サイト全体のメイン背景色' },
        { id: 'bg-header', varName: '--bg-header', label: 'ヘッダー', defaultHex: '#1E293B', desc: '画面上部のナビゲーション領域' },
        { id: 'bg-footer', varName: '--bg-footer', label: 'フッター', defaultHex: '#0F172A', desc: '画面下部の領域' },
        { id: 'main-btn', varName: '--main-btn', label: 'メイン（ボタン）', defaultHex: '#38BDF8', desc: '主要なアクションボタン、強調リンク' },
        { id: 'main-text', varName: '--main-text', label: 'メインテキスト', defaultHex: '#F8FAFC', desc: '通常の文章、見出し文字' },
        { id: 'sub-text', varName: '--sub-text', label: 'サブテキスト', defaultHex: '#94A3B8', desc: '補足情報、ラベル、境界線' },
        { id: 'accent', varName: '--accent', label: 'アクセント', defaultHex: '#FACC15', desc: 'ホバー時のハイライト、注意喚起' }
    ];

    const inputsArea = document.getElementById('colorInputsArea');
    const mockupWindow = document.getElementById('mockupWindow');
    const cssOutputCode = document.getElementById('cssOutputCode');
    const mdOutputCode = document.getElementById('mdOutputCode');

    // 1. 入力UIの動的生成
    paletteSettings.forEach(setting => {
        const row = document.createElement('div');
        row.className = 'color-row';
        row.innerHTML = `
            <label for="${setting.id}">${setting.label}</label>
            <input type="color" id="${setting.id}" value="${setting.defaultHex}">
            <span class="hex-val" id="${setting.id}-hex">${setting.defaultHex}</span>
            <span class="role-desc">${setting.desc}</span>
        `;
        inputsArea.appendChild(row);

        // イベントリスナーの追加
        const inputEl = document.getElementById(setting.id);
        const hexSpan = document.getElementById(`${setting.id}-hex`);

        inputEl.addEventListener('input', (e) => {
            const newHex = e.target.value.toUpperCase();
            hexSpan.textContent = newHex;
            updatePalette();
        });
    });

    // 2. プレビューとコード出力の更新関数
    function updatePalette() {
        let cssString = `:root {\n`;

        // Markdownテーブルのヘッダー
        let mdString = `| 役割 | プレビュー | カラーコード | 用途・備考 |\n`;
        mdString += `| :--- | :---: | :--- | :--- |\n`;

        paletteSettings.forEach(setting => {
            const inputEl = document.getElementById(setting.id);
            const currentHex = inputEl.value.toUpperCase();

            // モックアップへのCSS変数リアルタイム適用
            mockupWindow.style.setProperty(setting.varName, currentHex);

            // CSS文字列の構築
            cssString += `    ${setting.varName}: ${currentHex};\n`;

            // Markdown文字列の構築 (QiitaやGitHubで色がプレビューされるバッジ記法を活用)
            mdString += `| ${setting.label} | ![${currentHex}](https://placehold.co/15x15/${currentHex.replace('#', '')}/${currentHex.replace('#', '')}.png) | \`${currentHex}\` | ${setting.desc} |\n`;
        });

        cssString += `}`;

        cssOutputCode.textContent = cssString;
        mdOutputCode.textContent = mdString;
    }

    // タブ切り替え処理
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.export-content').forEach(c => c.classList.remove('active'));

            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.add('active');
        });
    });

    // コピーボタン処理
    document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', function () {
            const targetId = this.dataset.copyTarget;
            const textToCopy = document.getElementById(targetId).textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = this.textContent;
                this.textContent = 'コピー済!';
                this.style.backgroundColor = '#10B981';
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.backgroundColor = 'rgba(255,255,255,0.1)';
                }, 2000);
            });
        });
    });
    
    // インポート処理
    const importBtn = document.getElementById('importBtn');
    const importCssText = document.getElementById('importCssText');

    importBtn.addEventListener('click', () => {
        const cssText = importCssText.value;
        if (!cssText) return;

        let updatedCount = 0;

        paletteSettings.forEach(setting => {
            // 正規表現で、各CSS変数名とその後ろのHEXコードを探し出す
            // 例: /--bg-base\s*:\s*(#[0-9A-Fa-f]{6})/i
            const regex = new RegExp(`${setting.varName}\\s*:\\s*(#[0-9A-Fa-f]{6})`, 'i');
            const match = cssText.match(regex);

            if (match && match[1]) {
                const newHex = match[1].toUpperCase();

                // input[type="color"] と表示用のテキストを更新
                document.getElementById(setting.id).value = newHex;
                document.getElementById(`${setting.id}-hex`).textContent = newHex;
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            // 色が1つでも更新されたらプレビューを再描画
            updatePalette();

            // 成功のフィードバックをボタンのアニメーションで表現
            const originalText = importBtn.textContent;
            importBtn.textContent = `${updatedCount}色をインポートしました！`;
            importBtn.style.backgroundColor = '#10B981';
            importBtn.style.color = '#FFFFFF';
            setTimeout(() => {
                importBtn.textContent = originalText;
                importBtn.style.backgroundColor = '';
                importBtn.style.color = '';
            }, 2500);

            // 読み込み後はテキストエリアを空にする（任意）
            importCssText.value = '';
        } else {
            alert('有効なCSS変数が見つかりませんでした。出力された :root { ... } の形式を貼り付けてください。');
        }
    });

    // 初期化実行
    updatePalette();
});