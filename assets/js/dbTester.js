// dbTester.js 完全版 (GUI設計 + Wasm SQL実行 統合版)

document.addEventListener('DOMContentLoaded', async () => {
    // --- 要素の取得 (GUI設計用) ---
    const tableNameInput = document.getElementById('tableName');
    const columnsList = document.getElementById('columnsList');
    const addColumnBtn = document.getElementById('addColumnBtn');
    const mdPreviewArea = document.getElementById('mdPreviewArea');
    const exportSqlBtn = document.getElementById('exportSqlBtn');
    const exportMdBtn = document.getElementById('exportMdBtn');
    const fileNameInput = document.getElementById('fileNameInput');

    // データ型の選択肢
    const dataTypes = ['INT', 'VARCHAR(255)', 'TEXT', 'BOOLEAN', 'DATE', 'DATETIME'];
    let currentMarkdown = '';
    let currentSql = '';

    // ==========================================
    // 1. GUI テーブル設計ロジック
    // ==========================================

    // カラム入力行を追加する関数
    function addColumnRow(name = '', type = 'VARCHAR(255)', isPk = false) {
        const row = document.createElement('div');
        row.className = 'column-row';

        // カラム名入力
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'styled-input col-name';
        nameInput.placeholder = 'カラム名 (例: id)';
        nameInput.value = name;
        nameInput.addEventListener('input', generatePreview);

        // データ型選択
        const typeSelect = document.createElement('select');
        typeSelect.className = 'styled-input col-type';
        dataTypes.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = t;
            if (t === type) opt.selected = true;
            typeSelect.appendChild(opt);
        });
        typeSelect.addEventListener('change', generatePreview);

        // PK（主キー）チェックボックス
        const pkLabel = document.createElement('label');
        pkLabel.className = 'col-pk';
        const pkCheck = document.createElement('input');
        pkCheck.type = 'checkbox';
        pkCheck.checked = isPk;
        pkCheck.addEventListener('change', generatePreview);
        pkLabel.appendChild(pkCheck);
        pkLabel.append(' PK');

        // 削除ボタン
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.addEventListener('click', () => {
            row.remove();
            generatePreview();
        });

        row.appendChild(nameInput);
        row.appendChild(typeSelect);
        row.appendChild(pkLabel);
        row.appendChild(removeBtn);

        columnsList.appendChild(row);
        generatePreview();
    }

    // プレビューとCREATE文を生成する関数
    function generatePreview() {
        const tableName = tableNameInput.value.trim() || 'untitled_table';
        const rows = document.querySelectorAll('.column-row');
        
        // --- Markdownの組み立て ---
        let md = `### テーブル定義: \`${tableName}\`\n\n`;
        md += `| カラム名 | データ型 | 主キー |\n`;
        md += `|---|---|---|\n`;

        // --- SQLの組み立て ---
        let sql = `CREATE TABLE ${tableName} (\n`;
        let sqlLines = [];

        rows.forEach(row => {
            const colName = row.querySelector('.col-name').value.trim() || 'unknown';
            const colType = row.querySelector('.col-type').value;
            const isPk = row.querySelector('.col-pk input').checked;

            md += `| ${colName} | ${colType} | ${isPk ? '✅' : ''} |\n`;
            sqlLines.push(`    ${colName} ${colType}${isPk ? ' PRIMARY KEY' : ''}`);
        });

        sql += sqlLines.join(',\n');
        sql += `\n);`;

        currentMarkdown = md;
        currentSql = sql;

        // marked.js を使って Markdown を HTML 化
        if (typeof marked !== 'undefined') {
            mdPreviewArea.innerHTML = marked.parse(md);
        } else {
            mdPreviewArea.innerHTML = `<pre>${md}</pre>`;
        }
        
        mdPreviewArea.innerHTML += `<hr style="border-color:#334155; margin:20px 0;">`;
        mdPreviewArea.innerHTML += `<h4>自動生成された CREATE 文</h4>`;
        mdPreviewArea.innerHTML += `<pre style="background:#0F172A; padding:15px; border-radius:6px; border:1px solid #334155;"><code>${sql}</code></pre>`;
    }

    // GUI操作のイベントリスナー
    tableNameInput.addEventListener('input', generatePreview);
    addColumnBtn.addEventListener('click', () => addColumnRow());

    // 初期カラムのセット
    addColumnRow('id', 'INT', true);
    addColumnRow('name', 'VARCHAR(255)', false);
    addColumnRow('created_at', 'DATETIME', false);


    // ==========================================
    // 2. ファイル保存 (エクスポート) ロジック
    // ==========================================
    function getFileName() {
        return (fileNameInput.value.trim() || "schema");
    }

    function downloadFile(content, extension, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${getFileName()}.${extension}`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    exportSqlBtn.addEventListener('click', () => downloadFile(currentSql, 'sql', 'text/plain'));
    exportMdBtn.addEventListener('click', () => downloadFile(currentMarkdown, 'md', 'text/markdown'));
});