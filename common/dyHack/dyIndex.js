
globalThis.__sliderHacker__ = (function () {
    const _utils_ = {
        toCanvasFromUrl: async function toCanvasFromUrl(url, size) {
            return new Promise(async (resolve, reject) => {
                const blob = await fetch(url).then(res => res.blob());
                const canvas = document.createElement("canvas");
                canvas.id = `#_temp_`;
                canvas.height = size.height;
                canvas.width = size.width;
                document.body.append(canvas);

                const blobUrl = URL.createObjectURL(blob);

                const img = document.createElement("img");
                img.src = blobUrl;
                img.style.cssText = `height:${size.height}px;width:${size.width}px; display:none`;
                document.body.append(img);

                img.onload = function () {
                    const context = canvas.getContext("2d", { willReadFrequently: true });
                    context.drawImage(img, 0, 0, size.width, size.height);
                    resolve(context)
                }
            })
        }
    }


    function getElementInfo(el) {
        const bd = el.getBoundingClientRect();
        const parent = el.parentElement;
        const sdb = parent.getBoundingClientRect();

        const data = {
            height: bd.height,
            width: bd.width,
            top: bd.top - sdb.top,
            left: bd.left - sdb.left
        }
        console.log('getElementInfo:', data);
        return data
    }

    const allowDeviation = (num1, num2, offset = 25) => {
        return -offset <= num1 - num2 && num1 - num2 <= offset
    }

    function compareWhiteBorder(context, x, y) {
        const imgData = context.getImageData(1 * x, 1 * y, 1, 1).data;
        const r = imgData[0];
        const g = imgData[1];
        const b = imgData[2];
        if (allowDeviation(r, 230) && allowDeviation(g, 230) && allowDeviation(b, 230)) {
            return true;
        }
        return false;
    }

    function getContext(img, append = false, parent = document.body) {
        const { naturalWidth, naturalHeight } = img;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });
        canvas.height = naturalHeight;
        canvas.width = naturalWidth;
        if (append && parent) {
            parent.appendChild(canvas);
        }
        context.drawImage(img, 0, 0, naturalWidth, naturalHeight);

        return context;
    }

    /**
     * 计算滑动小块 四条变现的
     * @param {*} sBtn 
     * @returns 
     */
    async function getBaseLineAxises(sBtn) {
        const cps = window.getComputedStyle(sBtn);

        const renderHeight = Math.ceil(+cps.height.replace("px", ""));
        const renderWidth = Math.ceil(+cps.width.replace("px", ""));

        const ctx = await _utils_.toCanvasFromUrl(sBtn.src, {
            height: renderHeight,
            width: renderWidth
        })

        const nWidth = Math.floor(renderWidth * 0.3);
        const nHeight = Math.floor(renderHeight * 0.3);
        console.log("遍历的宽高:", nWidth, nHeight);
        // bottom
        let bottomYAxis = [];
        let topYAxis = [];
        let leftXAxis = [];
        let rightXAxis = [];
        for (let y = renderHeight - nHeight; y < renderHeight; y++) {
            let times = 0;
            for (let x = 0; x < renderWidth; x++) {
                if (compareWhiteBorder(ctx, x, y)) {
                    times++
                }
            }
            if (times > 25) {
                bottomYAxis.push({
                    value: y,
                    times
                });
            }
        }
        // left
        for (let x = 0; x < nWidth; x++) {
            let times = 0;
            for (let y = 0; y < renderHeight; y++) {
                if (compareWhiteBorder(ctx, x, y)) {
                    times++
                }
            }
            if (times > 25) {
                leftXAxis.push({
                    value: x,
                    times
                });
            }
        }
        // 如果相同，取左边
        leftXAxis.sort((a, b) => a.times >= b.times /*&& a.value < b.value */ ? -1 : 1);
        // top
        for (let y = 0; y < nHeight; y++) {
            let times = 0;
            for (let x = 0; x < renderWidth; x++) {
                if (compareWhiteBorder(ctx, x, y,)) {
                    times++
                }
            }
            if (times > 25) {
                topYAxis.push({
                    value: y,
                    times
                });
            }
        }
        // right
        for (let x = renderWidth - nWidth; x < renderWidth; x++) {
            let times = 0;
            for (let y = 0; y < renderHeight; y++) {
                if (compareWhiteBorder(ctx, x, y,)) {
                    times++
                }
            }
            if (times > 25) {
                rightXAxis.push({
                    value: x,
                    times
                });
            }
        }
        const baseData = {
            left: leftXAxis,
            bottom: bottomYAxis,
            top: topYAxis,
            right: rightXAxis,
        };
        return baseData;
    }

    /*
    *  mode = 1 仅仅比较数值
    *  mode = 2 仅仅比较次数
    *  mode = 3 次数 + 数值
    */
    function guessBaseLineAxises(baseLineAxis, mode = 1) {
        const res = Object.create(null);
        switch (mode) {
            case 1:
                res.top = baseLineAxis.top.sort((a, b) => a.value < b.value ? -1 : 1);
                res.bottom = baseLineAxis.bottom.sort((a, b) => a.value > b.value ? -1 : 1);
                res.left = baseLineAxis.left.sort((a, b) => a.value < b.value ? -1 : 1);
                res.right = baseLineAxis.right.sort((a, b) => a.value > b.value ? -1 : 1);
                break;
            case 2:
                for (p in baseLineAxis) {
                    res[p] = baseLineAxis[p].sort((a, b) => a.times >= b.times ? -1 : 1);
                }
                break;
            case 3:
                res.top = baseLineAxis.top.sort((a, b) => a.times >= b.times && a.value < b.value ? -1 : 1);
                res.bottom = baseLineAxis.bottom.sort((a, b) => a.times >= b.times && a.value > b.value ? -1 : 1);
                res.left = baseLineAxis.left.sort((a, b) => a.times >= b.times && a.value < b.value ? -1 : 1);
                res.right = baseLineAxis.right.sort((a, b) => a.times >= b.times && a.value > b.value ? -1 : 1);
                break;

            default:
                return baseLineAxis;
        }
        res.right = baseLineAxis.right.sort((a, b) => a.value > b.value ? -1 : 1);

        return res;
    }

    function computeDistance(ctxBg, bgCanvas, sBtn, sBtnLineAxises) {
        const cps = window.getComputedStyle(sBtn);
        const renderHeight = +cps.height.replace("px", "");
        const renderWidth = +cps.width.replace("px", "");

        const cpsBg = window.getComputedStyle(bgCanvas);
        const bgRenderHeight = +cpsBg.height.replace("px", "");
        const bgRenderWidth = +cpsBg.width.replace("px", "");
        const bgCanvasWidth = bgCanvas.width || bgRenderWidth;


        const eInfo = getElementInfo(sBtn);
        console.log('eInfo:', eInfo);

        const sizeRate = bgCanvasWidth / bgRenderWidth;
        const top = Math.floor(eInfo.top * sizeRate);
        console.log("sizeRate:", sizeRate, " bottom:", top);

        const yLower = Math.floor((top - 15) * sizeRate);
        const yUpper = Math.floor((top + 15) * sizeRate);

        const maxX = Math.floor((bgRenderWidth - renderWidth - 10) * sizeRate);
        const xGap = Math.floor((sBtnLineAxises.right - sBtnLineAxises.left) * sizeRate);

        const matchArr = [];
        for (let x = 20; x <= maxX; x++) {
            // for (let x = 120; x <= maxX; x++) {
            let times = 0;
            for (let y = yLower; y <= yUpper; y++) {
                for (let i = 0; i < 20; i++) {
                    if (
                        compareWhiteBorder(ctxBg, x, y - i)    // 左边
                        // && compareBlackBg(ctxBg, x + 6, y - i) // 左边 + 6
                        && compareWhiteBorder(ctxBg, x + xGap, y - i)

                        // && compareGrayContent(ctxBg, x +  30, y)
                        // && compareBlackBg(ctxBg, x + lineGap - 6, y - i)  //  右边 - 6
                    ) {
                        // console.log('compare:', x, y);
                        times++
                    }
                }
            }
            if (times > 25) {
                matchArr.push({
                    times: times,
                    value: x
                });
            }
        }

        console.log('matchArr:', matchArr);
        if (matchArr.length > 0) {
            matchArr.sort((a, b) => a.times > b.times ? -1 : 1);
            const x = matchArr[0].value;
            const realX = Math.floor((x - sBtnLineAxises.left) / sizeRate);
            return {
                x: realX,
                distance: realX - eInfo.left
            };
        }

        return null;
    }

    // 图像白边界
    async function getDistance(slideBtn, bgCanvas) {

        // 获取小滑块边线的值
        const baseLineAxis = await getBaseLineAxises(slideBtn);

        const ctxBg = bgCanvas.getContext("2d", { willReadFrequently: true })

        for (let mode = 1; mode <= 3; mode++) {
            try {
                console.log("getDistance:mode", mode);
                const sBtnLineAxises = guessBaseLineAxises(baseLineAxis, mode);
                const btnLines = {
                    left: sBtnLineAxises.left[0].value,
                    right: sBtnLineAxises.right[0].value,
                    top: sBtnLineAxises.top[0].value,
                    bottom: sBtnLineAxises.bottom[0].value,
                }
                console.log("getDistance: lines", sBtnLineAxises, btnLines);
                const result = computeDistance(ctxBg, bgCanvas, slideBtn, btnLines);
                if (result == null) {
                    continue;
                }
                return result;
            } catch (err) {
                console.log("computeDistance error:", err);
                return null;
            }
        }
    }

    return {
        getDistance,
        getBaseLineAxises
    }
})();

// const bgCanvas = document.querySelector("#captcha-verify-image");
// const btnSlide = document.querySelector(".captcha_verify_img_slide");

// const results = getDistance(btnSlide, bgCanvas).then(results => {
//     console.log("results:", results);
// });
