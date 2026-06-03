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
            e.preventDefault();
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