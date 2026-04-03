document.addEventListener('DOMContentLoaded', () => {
    // 1. 7つの色設定を定義
    const paletteSettings = [
        { id: 'bg-base', varName: '--bg-base', label: 'ベース（背景）', defaultHex: '#1E293B', desc: 'サイト全体のメイン背景色' },
        { id: 'bg-header', varName: '--bg-header', label: 'ヘッダー', defaultHex: '#1E293B', desc: '画面上部のナビゲーション領域' },
        { id: 'bg-footer', varName: '--bg-footer', label: 'フッター', defaultHex: '#0F172A', desc: '画面下部の領域' },
        { id: 'main-btn', varName: '--main-btn', label: 'メイン（ボタン）', defaultHex: '#38BDF8', desc: '主要なアクションボタン' },
        { id: 'main-text', varName: '--main-text', label: 'メインテキスト', defaultHex: '#F8FAFC', desc: '通常の文章、見出し文字' },
        { id: 'sub-text', varName: '--sub-text', label: 'サブテキスト', defaultHex: '#94A3B8', desc: '補足情報、ラベル、境界線' },
        { id: 'accent', varName: '--accent', label: 'アクセント', defaultHex: '#FACC15', desc: 'ホバー時のハイライト等' }
    ];

    const inputsArea = document.getElementById('colorInputsArea');
    const mockupWindow = document.getElementById('mockupWindow');
    const cssOutputCode = document.getElementById('cssOutputCode');
    const mdOutputCode = document.getElementById('mdOutputCode');

    // 2. 左パネル：入力UIの動的生成
    paletteSettings.forEach(setting => {
        const row = document.createElement('div');
        row.className = 'color-row';
        row.innerHTML = `
            <input type="color" id="${setting.id}" value="${setting.defaultHex}">
            <label for="${setting.id}">${setting.label}</label>
            <span class="hex-val" id="${setting.id}-hex">${setting.defaultHex}</span>
        `;
        inputsArea.appendChild(row);

        // 色が変更されたときのイベントリスナー
        const inputEl = document.getElementById(setting.id);
        inputEl.addEventListener('input', (e) => {
            const newHex = e.target.value.toUpperCase();
            document.getElementById(`${setting.id}-hex`).textContent = newHex;
            updatePalette();
        });
    });

    // 3. 全体更新関数（モックアップ反映・コード出力）
    function updatePalette() {
        let cssString = `:root {\n`;
        let mdString = `| 役割 | プレビュー | カラーコード | 用途・備考 |\n| :--- | :---: | :--- | :--- |\n`;

        paletteSettings.forEach(setting => {
            const hex = document.getElementById(setting.id).value.toUpperCase();

            // モックアップへのCSS変数リアルタイム適用
            mockupWindow.style.setProperty(setting.varName, hex);

            // 出力用コードの構築
            cssString += `    ${setting.varName}: ${hex};\n`;
            mdString += `| ${setting.label} | ![${hex}](https://placehold.co/15x15/${hex.replace('#', '')}/${hex.replace('#', '')}.png) | \`${hex}\` | ${setting.desc} |\n`;
        });

        cssString += `}`;
        cssOutputCode.textContent = cssString;
        mdOutputCode.textContent = mdString;
    }

    // 4. 右パネル：タブ切り替え処理
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.export-content').forEach(c => c.classList.remove('active'));

            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.add('active');
        });
    });

    // 5. 右パネル：コピーボタン処理
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

    // 6. 右パネル：インポート処理
    const importBtn = document.getElementById('importBtn');
    const importCssText = document.getElementById('importCssText');

    importBtn.addEventListener('click', () => {
        const cssText = importCssText.value;
        if (!cssText) return;

        let updatedCount = 0;
        paletteSettings.forEach(setting => {
            const regex = new RegExp(`${setting.varName}\\s*:\\s*(#[0-9A-Fa-f]{6})`, 'i');
            const match = cssText.match(regex);

            if (match && match[1]) {
                const newHex = match[1].toUpperCase();
                document.getElementById(setting.id).value = newHex;
                document.getElementById(`${setting.id}-hex`).textContent = newHex;
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            updatePalette();
            const originalText = importBtn.textContent;
            importBtn.textContent = `${updatedCount}色をインポートしました！`;
            importBtn.style.backgroundColor = '#10B981';
            importBtn.style.color = '#FFFFFF';
            setTimeout(() => {
                importBtn.textContent = originalText;
                importBtn.style.backgroundColor = '';
                importBtn.style.color = '';
            }, 2500);
            importCssText.value = '';
        } else {
            alert('有効なCSS変数が見つかりませんでした。出力された :root { ... } の形式を貼り付けてください。');
        }
    });

    // アプリ起動時の初回実行
    updatePalette();
});