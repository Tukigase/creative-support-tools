document.addEventListener('DOMContentLoaded', async () => {
    // 要素取得
    const tableNameInput = document.getElementById('tableName');
    const columnsList = document.getElementById('columnsList');
    const addColumnBtn = document.getElementById('addColumnBtn');
    const mdPreviewArea = document.getElementById('mdPreviewArea');
    const fileNameInput = document.getElementById('fileNameInput');
    
    // ボタン類
    const exportSqlBtn = document.getElementById('exportSqlBtn');
    const exportMdBtn = document.getElementById('exportMdBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const runSqlBtn = document.getElementById('runSqlBtn');
    
    // SQLテスト用
    const sqlInput = document.getElementById('sqlInput');
    const resultArea = document.getElementById('resultArea');
    const dbStatusText = document.getElementById('dbStatusText');

    let currentMarkdown = '';
    let currentSql = '';
    let SQL_WASM = null; // Wasmモジュールを保持

    // ==========================================
    // 0. Wasm (sql.js) の初期化
    // ==========================================
    try {
        SQL_WASM = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        dbStatusText.textContent = "✅ DBエンジン待機中";
        dbStatusText.style.color = "#34D399";
    } catch (err) {
        dbStatusText.textContent = "❌ DBエンジンロード失敗";
        dbStatusText.style.color = "#EF4444";
        console.error(err);
    }

    // ==========================================
    // 1. タブ切り替えロジック
    // ==========================================
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // タブボタンのアクティブ切り替え
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // コンテンツの切り替え
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(e.target.dataset.target).classList.add('active');
        });
    });

    // ==========================================
    // 2. GUI テーブル設計ロジック
    // ==========================================
    const dataTypes = ['INT', 'VARCHAR(255)', 'TEXT', 'BOOLEAN', 'DATE', 'DATETIME'];

    function addColumnRow(name = '', type = 'VARCHAR(255)', isPk = false) {
        const row = document.createElement('div');
        row.className = 'column-row';

        const nameInput = document.createElement('input');
        nameInput.type = 'text'; nameInput.className = 'styled-input col-name';
        nameInput.placeholder = 'カラム名'; nameInput.value = name;
        nameInput.addEventListener('input', generatePreview);

        const typeSelect = document.createElement('select');
        typeSelect.className = 'styled-input col-type';
        dataTypes.forEach(t => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = t;
            if (t === type) opt.selected = true;
            typeSelect.appendChild(opt);
        });
        typeSelect.addEventListener('change', generatePreview);

        const pkLabel = document.createElement('label'); pkLabel.className = 'col-pk';
        const pkCheck = document.createElement('input'); pkCheck.type = 'checkbox';
        pkCheck.checked = isPk; pkCheck.addEventListener('change', generatePreview);
        pkLabel.appendChild(pkCheck); pkLabel.append(' PK');

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn'; removeBtn.innerHTML = '×';
        removeBtn.addEventListener('click', () => { row.remove(); generatePreview(); });

        row.append(nameInput, typeSelect, pkLabel, removeBtn);
        columnsList.appendChild(row);
        generatePreview();
    }

    function generatePreview() {
        const tableName = tableNameInput.value.trim() || 'untitled';
        const rows = document.querySelectorAll('.column-row');
        
        // MD生成
        let md = `### テーブル定義: \`${tableName}\`\n\n| カラム名 | データ型 | 主キー |\n|---|---|---|\n`;
        // SQL生成
        let sql = `CREATE TABLE ${tableName} (\n`;
        let sqlLines = [];

        rows.forEach(row => {
            const colName = row.querySelector('.col-name').value.trim() || 'unknown';
            const colType = row.querySelector('.col-type').value;
            const isPk = row.querySelector('.col-pk input').checked;

            md += `| ${colName} | ${colType} | ${isPk ? '✅ PK' : ''} |\n`;
            sqlLines.push(`    ${colName} ${colType}${isPk ? ' PRIMARY KEY' : ''}`);
        });

        sql += sqlLines.join(',\n') + `\n);`;
        currentMarkdown = md;
        currentSql = sql;

        mdPreviewArea.innerHTML = typeof marked !== 'undefined' ? marked.parse(md) : `<pre>${md}</pre>`;
        mdPreviewArea.innerHTML += `<hr style="border-color:#334155; margin:20px 0;"><h4>自動生成された CREATE 文</h4>`;
        mdPreviewArea.innerHTML += `<pre style="background:#0F172A; padding:15px; border-radius:6px; border:1px solid #334155;"><code>${sql}</code></pre>`;
    }

    tableNameInput.addEventListener('input', generatePreview);
    addColumnBtn.addEventListener('click', () => addColumnRow());

    // 初期データ
    addColumnRow('id', 'INT', true);
    addColumnRow('name', 'VARCHAR(255)', false);

    // ==========================================
    // 3. Wasm SQL 実行ロジック
    // ==========================================
    function executeTestSql() {
        if (!SQL_WASM) { alert("DBエンジンがロードされていません"); return; }
        
        resultArea.innerHTML = '';
        const userQuery = sqlInput.value.trim();

        // 毎回フレッシュなDBを作る（GUIと常に同期させるため）
        const db = new SQL_WASM.Database();

        try {
            // ① まずGUIで作られたCREATE文を実行してテーブルを作る
            db.exec(currentSql);

            // ② 次にユーザーが書いたテストSQL(INSERT, SELECT等)を実行
            if (userQuery) {
                const results = db.exec(userQuery);

                if (results.length === 0) {
                    resultArea.innerHTML = '<div style="color: #34D399;">✅ 実行完了 (結果を返すデータはありません)</div>';
                } else {
                    // 結果をHTMLテーブルにして描画
                    results.forEach(resultSet => {
                        const table = document.createElement('table');
                        table.className = 'sql-table';
                        const thead = document.createElement('thead');
                        const trHead = document.createElement('tr');
                        resultSet.columns.forEach(col => {
                            const th = document.createElement('th'); th.textContent = col; trHead.appendChild(th);
                        });
                        thead.appendChild(trHead); table.appendChild(thead);

                        const tbody = document.createElement('tbody');
                        resultSet.values.forEach(row => {
                            const trBody = document.createElement('tr');
                            row.forEach(val => {
                                const td = document.createElement('td'); td.textContent = val !== null ? val : 'NULL'; trBody.appendChild(td);
                            });
                            tbody.appendChild(trBody);
                        });
                        table.appendChild(tbody);
                        resultArea.appendChild(table);
                    });
                }
            } else {
                resultArea.innerHTML = '<div style="color: #94A3B8;">※上の入力欄に SELECT 文などを書いて実行してください</div>';
            }
        } catch (err) {
            resultArea.innerHTML = `<div style="color: #EF4444; font-weight: bold;">❌ エラー: ${err.message}</div>`;
        } finally {
            db.close(); // メモリ解放
        }
    }

    runSqlBtn.addEventListener('click', executeTestSql);
    
    // Ctrl+Enter で実行＆Tabインデント
    sqlInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') executeTestSql();
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = sqlInput.selectionStart; const end = sqlInput.selectionEnd;
            sqlInput.value = sqlInput.value.substring(0, start) + "    " + sqlInput.value.substring(end);
            sqlInput.selectionStart = sqlInput.selectionEnd = start + 4;
        }
    });

    // ==========================================
    // 4. エクスポート処理 (MD, SQL, PDF)
    // ==========================================
    function getFileName() { return (fileNameInput.value.trim() || "schema"); }

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

    // PDFエクスポート (MarkdownEditorと同じ html2pdf の仕組み)
    exportPdfBtn.addEventListener('click', () => {
        const element = document.getElementById('mdPreviewArea');
        const opt = {
            margin:       15,
            filename:     `${getFileName()}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        exportPdfBtn.textContent = '生成中...';
        html2pdf().set(opt).from(element).save().finally(() => {
            exportPdfBtn.textContent = '📄 PDF保存';
        });
    });
});