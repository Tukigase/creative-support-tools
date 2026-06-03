document.addEventListener('DOMContentLoaded', async () => {
    // 要素取得
    const tableNameInput = document.getElementById('tableName');
    const columnsList = document.getElementById('columnsList');
    const addColumnBtn = document.getElementById('addColumnBtn');
    const dataRowsList = document.getElementById('dataRowsList');
    const addDataBtn = document.getElementById('addDataBtn');
    const mdPreviewArea = document.getElementById('mdPreviewArea');
    const fileNameInput = document.getElementById('fileNameInput');
    
    const exportSqlBtn = document.getElementById('exportSqlBtn');
    const exportTestSqlBtn = document.getElementById('exportTestSqlBtn'); // ★新規：実行SQL保存
    const exportMdBtn = document.getElementById('exportMdBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const runSqlBtn = document.getElementById('runSqlBtn');
    
    const sqlInput = document.getElementById('sqlInput');
    const resultArea = document.getElementById('resultArea');
    const dbStatusText = document.getElementById('dbStatusText');

    let currentMarkdown = '';
    let currentSql = '';
    let SQL_WASM = null;

    // 0. Wasm 初期化
    try {
        SQL_WASM = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` });
        dbStatusText.textContent = "✅ DBエンジン待機中"; dbStatusText.style.color = "#34D399";
    } catch (err) {
        dbStatusText.textContent = "❌ DBエンジンロード失敗"; dbStatusText.style.color = "#EF4444";
    }

    // 1. タブ切り替え
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(e.target.dataset.target).classList.add('active');
        });
    });

    // 2. GUI 設計ロジック
    const dataTypes = ['INT', 'VARCHAR(255)', 'TEXT', 'BOOLEAN', 'DATE', 'DATETIME'];

    function addColumnRow(name = '', type = 'VARCHAR(255)', isPk = false) {
        const row = document.createElement('div'); row.className = 'column-row';
        const nameInput = document.createElement('input'); nameInput.type = 'text'; nameInput.className = 'styled-input col-name'; nameInput.value = name; nameInput.addEventListener('input', generatePreview);
        const typeSelect = document.createElement('select'); typeSelect.className = 'styled-input col-type';
        dataTypes.forEach(t => { const opt = document.createElement('option'); opt.value = opt.textContent = t; if (t === type) opt.selected = true; typeSelect.appendChild(opt); });
        typeSelect.addEventListener('change', generatePreview);
        const pkLabel = document.createElement('label'); pkLabel.className = 'col-pk';
        const pkCheck = document.createElement('input'); pkCheck.type = 'checkbox'; pkCheck.checked = isPk; pkCheck.addEventListener('change', generatePreview);
        pkLabel.append(pkCheck, ' PK');
        const removeBtn = document.createElement('button'); removeBtn.className = 'remove-btn'; removeBtn.innerHTML = '×';
        removeBtn.addEventListener('click', () => { row.remove(); generatePreview(); });

        row.append(nameInput, typeSelect, pkLabel, removeBtn);
        columnsList.appendChild(row);
        generatePreview();
    }

    // ★新規：初期データ行の追加
    function addDataRow() {
        const row = document.createElement('div'); row.className = 'data-row';
        const cellsContainer = document.createElement('div'); cellsContainer.className = 'cells-container';
        row.appendChild(cellsContainer);
        const removeBtn = document.createElement('button'); removeBtn.className = 'remove-btn'; removeBtn.innerHTML = '×';
        removeBtn.addEventListener('click', () => { row.remove(); generatePreview(); });
        row.appendChild(removeBtn);
        dataRowsList.appendChild(row);
        generatePreview(); // カラム同期を走らせる
    }

    // ★新規：カラム数の増減に合わせて、初期データの入力セル数を同期する
    function syncDataGrid() {
        const colNames = Array.from(document.querySelectorAll('.col-name')).map(inp => inp.value.trim() || 'unknown');
        document.querySelectorAll('.data-row').forEach(row => {
            const cellsContainer = row.querySelector('.cells-container');
            let cells = Array.from(cellsContainer.querySelectorAll('.data-cell'));
            while (cells.length < colNames.length) { // 足りないセルを追加
                const inp = document.createElement('input'); inp.className = 'styled-input data-cell';
                inp.addEventListener('input', generatePreview);
                cellsContainer.appendChild(inp); cells.push(inp);
            }
            while (cells.length > colNames.length) { // 余分なセルを削除
                cells.pop().remove();
            }
            cells.forEach((cell, i) => { cell.placeholder = colNames[i]; }); // プレースホルダーを更新
        });
    }

    function generatePreview() {
        syncDataGrid(); // 常にカラムと初期データセルを同期

        const tableName = tableNameInput.value.trim() || 'untitled';
        const rows = document.querySelectorAll('.column-row');
        
        let md = `### テーブル定義: \`${tableName}\`\n\n| カラム名 | データ型 | 主キー |\n|---|---|---|\n`;
        let sql = `CREATE TABLE ${tableName} (\n`;
        let sqlLines = [];
        let colNames = [];

        rows.forEach(row => {
            const colName = row.querySelector('.col-name').value.trim() || 'unknown';
            const colType = row.querySelector('.col-type').value;
            const isPk = row.querySelector('.col-pk input').checked;
            colNames.push(colName);
            md += `| ${colName} | ${colType} | ${isPk ? '✅ PK' : ''} |\n`;
            sqlLines.push(`    ${colName} ${colType}${isPk ? ' PRIMARY KEY' : ''}`);
        });
        sql += sqlLines.join(',\n') + `\n);\n`;

        // ★新規：初期データ (INSERT文) の組み立て
        const dataRows = document.querySelectorAll('.data-row');
        if (dataRows.length > 0) {
            sql += `\n-- 初期データ\nINSERT INTO ${tableName} (${colNames.join(', ')}) VALUES \n`;
            md += `\n### 初期データ\n| ${colNames.join(' | ')} |\n| ${colNames.map(()=>'---').join(' | ')} |\n`;
            
            let valuesList = [];
            dataRows.forEach(row => {
                const cells = Array.from(row.querySelectorAll('.data-cell')).map(inp => inp.value);
                
                // MD用の行追加
                md += `| ${cells.map(v => v ? v : '*(NULL)*').join(' | ')} |\n`;

                // SQL用に文字列や数値を判別
                const sqlVals = cells.map(v => {
                    const trimV = v.trim();
                    if (trimV === '') return 'NULL';
                    if (!isNaN(trimV)) return trimV; // 数値ならそのまま
                    if (trimV.toUpperCase() === 'TRUE' || trimV.toUpperCase() === 'FALSE') return trimV.toUpperCase();
                    return `'${v.replace(/'/g, "''")}'`; // 文字列はシングルクォートで囲む（エスケープ対応）
                });
                valuesList.push(`(${sqlVals.join(', ')})`);
            });
            sql += valuesList.join(',\n') + `;\n`;
        }

        currentMarkdown = md; currentSql = sql;
        mdPreviewArea.innerHTML = typeof marked !== 'undefined' ? marked.parse(md) : `<pre>${md}</pre>`;
        mdPreviewArea.innerHTML += `<hr style="border-color:#334155; margin:20px 0;"><h4>自動生成された 設計SQL</h4>`;
        mdPreviewArea.innerHTML += `<pre style="background:#0F172A; padding:15px; border-radius:6px; border:1px solid #334155;"><code>${sql}</code></pre>`;
    }

    tableNameInput.addEventListener('input', generatePreview);
    addColumnBtn.addEventListener('click', () => addColumnRow());
    addDataBtn.addEventListener('click', () => addDataRow());

    // 初期データ
    addColumnRow('id', 'INT', true);
    addColumnRow('name', 'VARCHAR(255)', false);

    // 3. Wasm SQL 実行ロジック
    function executeTestSql() {
        if (!SQL_WASM) return;
        resultArea.innerHTML = '';
        const userQuery = sqlInput.value.trim();
        const db = new SQL_WASM.Database();

        try {
            db.exec(currentSql); // GUIで作ったCREATE & INSERT を先にかける
            if (userQuery) {
                const results = db.exec(userQuery);
                if (results.length === 0) {
                    resultArea.innerHTML = '<div style="color: #34D399;">✅ 実行完了 (結果を返すデータはありません)</div>';
                } else {
                    results.forEach(resultSet => {
                        const table = document.createElement('table'); table.className = 'sql-table';
                        const thead = document.createElement('thead'); const trHead = document.createElement('tr');
                        resultSet.columns.forEach(col => { const th = document.createElement('th'); th.textContent = col; trHead.appendChild(th); });
                        thead.appendChild(trHead); table.appendChild(thead);
                        const tbody = document.createElement('tbody');
                        resultSet.values.forEach(row => {
                            const trBody = document.createElement('tr');
                            row.forEach(val => { const td = document.createElement('td'); td.textContent = val !== null ? val : 'NULL'; trBody.appendChild(td); });
                            tbody.appendChild(trBody);
                        });
                        table.appendChild(tbody); resultArea.appendChild(table);
                    });
                }
            } else {
                resultArea.innerHTML = '<div style="color: #94A3B8;">※SELECT文などを書いてテストしてください。初期データは既にセットされています。</div>';
            }
        } catch (err) {
            resultArea.innerHTML = `<div style="color: #EF4444; font-weight: bold;">❌ エラー: ${err.message}</div>`;
        } finally {
            db.close();
        }
    }

    runSqlBtn.addEventListener('click', executeTestSql);
    sqlInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') executeTestSql();
        if (e.key === 'Tab') {
            e.preventDefault(); const start = sqlInput.selectionStart; const end = sqlInput.selectionEnd;
            sqlInput.value = sqlInput.value.substring(0, start) + "    " + sqlInput.value.substring(end);
            sqlInput.selectionStart = sqlInput.selectionEnd = start + 4;
        }
    });

    // 4. エクスポート処理
    function getFileName() { return (fileNameInput.value.trim() || "schema"); }
    function downloadFile(content, extension) {
        if (!content) return;
        const blob = new Blob([content], { type: 'text/plain' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `${getFileName()}.${extension}`; a.click(); URL.revokeObjectURL(a.href);
    }

    exportSqlBtn.addEventListener('click', () => downloadFile(currentSql, 'sql'));
    exportTestSqlBtn.addEventListener('click', () => downloadFile(sqlInput.value, 'test.sql')); // ★実行SQL保存
    exportMdBtn.addEventListener('click', () => downloadFile(currentMarkdown, 'md'));
    
    exportPdfBtn.addEventListener('click', () => {
        const element = document.getElementById('mdPreviewArea');
        html2pdf().set({
            margin: 15, filename: `${getFileName()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(element).save();
    });
});