document.addEventListener('DOMContentLoaded', () => {
    // 要素の取得
    const inputW = document.getElementById('inputWidth');
    const inputH = document.getElementById('inputHeight');
    const ratioW = document.getElementById('ratioW');
    const ratioH = document.getElementById('ratioH');
    const lockBtn = document.getElementById('lockButton');
    const iconLock = document.getElementById('icon-lock');
    const iconUnlock = document.getElementById('icon-unlock');
    
    const visualShape = document.getElementById('visualShape');
    const visualText = document.getElementById('visualText');
    const cssOutput = document.getElementById('cssOutput');
    const cssHackOutput = document.getElementById('cssHackOutput');

    let isLocked = true; // 初期状態は比率固定

    // 最大公約数(GCD)を求める関数 (比率の簡単化用)
    function getGCD(a, b) {
        return b === 0 ? a : getGCD(b, a % b);
    }

    // 数値を綺麗に丸める関数 (小数点第3位まで)
    function roundNum(num) {
        return Math.round(num * 1000) / 1000;
    }

    // UI (図形とCSS) の更新
    function updateVisuals() {
        const w = parseFloat(ratioW.value) || 16;
        const h = parseFloat(ratioH.value) || 9;

        // 図形の変形 (縦長か横長かで基準を変える)
        if (w >= h) {
            visualShape.style.width = '100%';
            visualShape.style.height = 'auto';
        } else {
            visualShape.style.width = 'auto';
            visualShape.style.height = '100%';
        }
        visualShape.style.aspectRatio = `${w} / ${h}`;
        visualText.textContent = `${w} : ${h}`;

        // CSSコードの生成
        cssOutput.textContent = `aspect-ratio: ${w} / ${h};`;
        const percentage = roundNum((h / w) * 100);
        cssHackOutput.textContent = `padding-top: ${percentage}%; /* 古いブラウザ用 */`;
    }

    // 横幅(Width)が変更された時
    inputW.addEventListener('input', () => {
        const w = parseFloat(inputW.value);
        if (!w) return;

        if (isLocked) {
            // ロック中: 比率に合わせて高さを自動計算
            const rw = parseFloat(ratioW.value);
            const rh = parseFloat(ratioH.value);
            inputH.value = Math.round(w * (rh / rw));
        } else {
            // アンロック中: 新しい横幅と高さから比率を再計算
            const h = parseFloat(inputH.value) || 1;
            const gcd = getGCD(w, h);
            ratioW.value = roundNum(w / gcd);
            ratioH.value = roundNum(h / gcd);
        }
        updateVisuals();
    });

    // 縦幅(Height)が変更された時
    inputH.addEventListener('input', () => {
        const h = parseFloat(inputH.value);
        if (!h) return;

        if (isLocked) {
            // ロック中: 比率に合わせて横幅を自動計算
            const rw = parseFloat(ratioW.value);
            const rh = parseFloat(ratioH.value);
            inputW.value = Math.round(h * (rw / rh));
        } else {
            // アンロック中: 比率を再計算
            const w = parseFloat(inputW.value) || 1;
            const gcd = getGCD(w, h);
            ratioW.value = roundNum(w / gcd);
            ratioH.value = roundNum(h / gcd);
        }
        updateVisuals();
    });

    // 比率(Ratio W/H)が直接変更された時
    const updateFromRatio = () => {
        const rw = parseFloat(ratioW.value);
        const rh = parseFloat(ratioH.value);
        if (!rw || !rh) return;

        // 横幅を基準にして高さを合わせる (一般的な挙動)
        const w = parseFloat(inputW.value) || 1920;
        inputH.value = Math.round(w * (rh / rw));
        updateVisuals();
    };

    ratioW.addEventListener('input', updateFromRatio);
    ratioH.addEventListener('input', updateFromRatio);

    // ロックボタンの切り替え
    lockBtn.addEventListener('click', () => {
        isLocked = !isLocked;
        lockBtn.classList.toggle('locked', isLocked);
        iconLock.style.display = isLocked ? 'block' : 'none';
        iconUnlock.style.display = isLocked ? 'none' : 'block';
    });

    // プリセットボタンの処理
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const presetW = parseFloat(btn.dataset.w);
            const presetH = parseFloat(btn.dataset.h);
            
            ratioW.value = presetW;
            ratioH.value = presetH;
            
            // 特別対応: OGP(1200x630)など、比率ではなく直接サイズを入れたいプリセットの場合
            if (presetW > 100) {
                inputW.value = presetW;
                inputH.value = presetH;
                const gcd = getGCD(presetW, presetH);
                ratioW.value = presetW / gcd;
                ratioH.value = presetH / gcd;
            } else {
                updateFromRatio(); // 通常の比率プリセット
            }
        });
    });

    // コピーボタン処理 (colorPickerと同じ流用)
    document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.dataset.copyTarget;
            const textToCopy = document.getElementById(targetId).textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = this.textContent;
                this.textContent = 'コピー済!';
                this.style.backgroundColor = '#10B981';
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.backgroundColor = '';
                }, 2000);
            });
        });
    });

    // 初期化
    updateVisuals();
});