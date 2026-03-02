document.addEventListener('DOMContentLoaded', () => {
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

    let isLocked = true;

    // ★修正1：小数が来ても無限ループでクラッシュしない安全な最大公約数計算
    function getGCD(a, b) {
        a = Math.round(Math.abs(a));
        b = Math.round(Math.abs(b));
        if (b === 0) return a || 1;
        return getGCD(b, a % b);
    }

    function roundNum(num) {
        return Math.round(num * 1000) / 1000;
    }

    // ★修正2：UIの更新（文字も動かして「生きてる感」を出す）
    function updateVisuals() {
        const rw = parseFloat(ratioW.value) || 16;
        const rh = parseFloat(ratioH.value) || 9;
        const w = parseFloat(inputW.value) || 1920;
        const h = parseFloat(inputH.value) || 1080;

        // JSでの面倒な幅計算を削除し、CSSの max-height と aspect-ratio に任せる
        visualShape.style.aspectRatio = `${rw} / ${rh}`;
        
        // 図形の中に「実際のサイズ」と「比率」を両方表示
        visualText.innerHTML = `
            <span class="visual-size-text">${w} × ${h}</span><br>
            <span class="visual-ratio-text">(${rw} : ${rh})</span>
        `;

        cssOutput.textContent = `aspect-ratio: ${rw} / ${rh};`;
        const percentage = roundNum((rh / rw) * 100);
        cssHackOutput.textContent = `padding-top: ${percentage}%; /* 古いブラウザ用 */`;
    }

    // 横幅(Width)が変更された時
    inputW.addEventListener('input', () => {
        const w = parseFloat(inputW.value);
        if (!w) return;

        if (isLocked) {
            const rw = parseFloat(ratioW.value) || 16;
            const rh = parseFloat(ratioH.value) || 9;
            inputH.value = Math.round(w * (rh / rw));
        } else {
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
            const rw = parseFloat(ratioW.value) || 16;
            const rh = parseFloat(ratioH.value) || 9;
            inputW.value = Math.round(h * (rw / rh));
        } else {
            const w = parseFloat(inputW.value) || 1;
            const gcd = getGCD(w, h);
            ratioW.value = roundNum(w / gcd);
            ratioH.value = roundNum(h / gcd);
        }
        updateVisuals();
    });

    // 比率(Ratio)が変更された時
    const updateFromRatio = () => {
        const rw = parseFloat(ratioW.value);
        const rh = parseFloat(ratioH.value);
        if (!rw || !rh) return;

        const w = parseFloat(inputW.value) || 1920;
        inputH.value = Math.round(w * (rh / rw));
        updateVisuals();
    };

    ratioW.addEventListener('input', updateFromRatio);
    ratioH.addEventListener('input', updateFromRatio);

    // ロックボタン切替
    lockBtn.addEventListener('click', () => {
        isLocked = !isLocked;
        lockBtn.classList.toggle('locked', isLocked);
        iconLock.style.display = isLocked ? 'block' : 'none';
        iconUnlock.style.display = isLocked ? 'none' : 'block';
    });

    // プリセットボタン
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const presetW = parseFloat(btn.dataset.w);
            const presetH = parseFloat(btn.dataset.h);
            
            ratioW.value = presetW;
            ratioH.value = presetH;
            
            if (presetW > 100) {
                inputW.value = presetW;
                inputH.value = presetH;
                const gcd = getGCD(presetW, presetH);
                ratioW.value = presetW / gcd;
                ratioH.value = presetH / gcd;
            } else {
                updateFromRatio();
            }
        });
    });

    // コピーボタン
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

    updateVisuals();
});