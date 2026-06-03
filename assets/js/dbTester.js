document.addEventListener('DOMContentLoaded', async () => {
    const sqlInput = document.getElementById('sqlInput');
    const resultArea = document.getElementById('resultArea');
    const runSqlBtn = document.getElementById('runSqlBtn');
    const resetDbBtn = document.getElementById('resetDbBtn');
    const statusText = document.getElementById('statusText');

    let db; // データベースのインスタンス

    // 1. SQL.js (WebAssembly) の初期化
    try {
        const SQL = await initSqlJs({
            // Wasmファイルの場所を指定（CDN）
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        db = new SQL.Database(); // 空のデータベースを作成
        statusText.textContent = "✅ DBエンジン待機中";
    } catch (err) {
        statusText.textContent = "❌ エンジンロード失敗";
        console.error(err);
    }

    // 2. SQL実行関数
    function executeSql() {
        if (!db) return;
        const query = sqlInput.value.trim();
        if (!query) return;

        resultArea.innerHTML = ''; // 結果エリアをクリア

        try {
            // 💡 複数行のSQLを一気に実行
            const results = db.exec(query);

            if (results.length === 0) {
                resultArea.innerHTML = '<div style="color: #34D399;">✅ 実行完了 (結果を返すデータはありません)</div>';
                return;
            }

            // 結果（SELECT文など）がある場合はテーブルを描画
            results.forEach(resultSet => {
                const table = document.createElement('table');
                table.className = 'sql-table';

                // ヘッダー (カラム名)
                const thead = document.createElement('thead');
                const trHead = document.createElement('tr');
                resultSet.columns.forEach(col => {
                    const th = document.createElement('th');
                    th.textContent = col;
                    trHead.appendChild(th);
                });
                thead.appendChild(trHead);
                table.appendChild(thead);

                // ボディ (データ)
                const tbody = document.createElement('tbody');
                resultSet.values.forEach(row => {
                    const trBody = document.createElement('tr');
                    row.forEach(val => {
                        const td = document.createElement('td');
                        td.textContent = val !== null ? val : 'NULL';
                        trBody.appendChild(td);
                    });
                    tbody.appendChild(trBody);
                });
                table.appendChild(tbody);

                resultArea.appendChild(table);
                // 複数結果がある場合に隙間を空ける
                resultArea.appendChild(document.createElement('br'));
            });

            statusText.textContent = `✅ 実行成功 (${new Date().toLocaleTimeString()})`;
        } catch (err) {
            // エラー時
            resultArea.innerHTML = `<div class="error-msg">❌ エラー: ${err.message}</div>`;
            statusText.textContent = "⚠️ エラー発生";
        }
    }

    // 3. イベントリスナー
    runSqlBtn.addEventListener('click', executeSql);

    // Ctrl + Enter (または Cmd + Enter) で実行するショートカット
    sqlInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            executeSql();
        }
        // Tabインデントもついでに追加
        if (e.key === 'Tab') {
            e.preventDefault();document.addEventListener('DOMContentLoaded', () => {
    const tableNameInput = document.getElementById('tableName');
    const columnsList = document.getElementById('columnsList');
    const addColumnBtn = document.getElementById('addColumnBtn');
    const mdPreviewArea = document.getElementById('mdPreviewArea');
    const exportSqlBtn = document.getElementById('exportSqlBtn');
    const exportMdBtn = document.getElementById('exportMdBtn');
    const fileNameInput = document.getElementById('fileNameInput');

    // データ型の選択肢
    const dataTypes = ['INT', 'VARCHAR(255)', 'TEXT', 'BOOLEAN', 'DATE', 'DATETIME'];

    // 1. カラム入力行を追加する関数
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
        generatePreview(); // 追加時もプレビュー更新
    }

    // 2. GUIの入力内容からMarkdownとCREATE文を生成する関数
    let currentMarkdown = '';
    let currentSql = '';

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

            // MD行追加
            md += `| ${colName} | ${colType} | ${isPk ? '✅' : ''} |\n`;

            // SQL行追加
            sqlLines.push(`    ${colName} ${colType}${isPk ? ' PRIMARY KEY' : ''}`);
        });

        sql += sqlLines.join(',\n');
        sql += `\n);`;

        currentMarkdown = md;
        currentSql = sql;

        // プレビューエリアにMarkdownをHTML化して表示 (marked.jsを使用)
        mdPreviewArea.innerHTML = marked.parse(md);
        
        // （※今回はタブ切替を省略し、MDの下にCREATE文も表示しておきます）
        mdPreviewArea.innerHTML += `<hr style="border-color:#334155; margin:20px 0;">`;
        mdPreviewArea.innerHTML += `<h4>自動生成された CREATE 文</h4>`;
        mdPreviewArea.innerHTML += `<pre style="background:#0F172A; padding:15px; border-radius:6px; border:1px solid #334155;"><code>${sql}</code></pre>`;
    }

    // 3. イベントリスナー群
    tableNameInput.addEventListener('input', generatePreview);
    addColumnBtn.addEventListener('click', () => addColumnRow());

    // 4. ファイル保存処理
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

    // 初期データのセット
    addColumnRow('id', 'INT', true);
    addColumnRow('name', 'VARCHAR(255)', false);
    addColumnRow('created_at', 'DATETIME', false);
});
            const start = sqlInput.selectionStart;
            const end = sqlInput.selectionEnd;
            sqlInput.value = sqlInput.value.substring(0, start) + "    " + sqlInput.value.substring(end);
            sqlInput.selectionStart = sqlInput.selectionEnd = start + 4;
        }
    });

    // DBリセット機能
    resetDbBtn.addEventListener('click', () => {
        if (confirm("現在のテーブルやデータをすべて初期化しますか？")) {
            db.close();
            db = new window.SQL.Database(); // 新しい空のDBを作り直す
            resultArea.innerHTML = '<div class="empty-state">実行結果がここに表示されます</div>';
            statusText.textContent = "✅ DBをリセットしました";
        }
    });
});