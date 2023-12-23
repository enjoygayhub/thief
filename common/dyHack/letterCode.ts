import { Page } from "puppeteer";
import axios from "axios";
import * as api from "../../api/cjy";

async function getLetterInfo(src: string) {
    const res = await axios({
        url: src,
        method: 'GET',
        responseType: 'stream'
    })
    const resLetters = await api.getLetters(res.data);
    return resLetters;
}


function extractLettersInfo(sLetters: api.LetterInfo[], bLetters: api.LetterInfo[]) {
    sLetters = sLetters.sort((a, b) => a.x < b.x ? -1 : 1);
    // const letters = bLetters.filter(l => sLetters.find(s => s.letter === l.letter));
    const letters: api.LetterInfo[] = sLetters.map(sl => {
        return bLetters.find(bl => bl.letter === sl.letter)
    }).filter(Boolean) as api.LetterInfo[]
    return letters;
}

async function getImageInfo(page: Page, selector: string) {
    const imageInfo = await page.evaluate((cssSelector: string) => {
        console.log(`query ${cssSelector}`);
        const el = document.querySelector(cssSelector) as HTMLImageElement;
        const cp = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
            src: el?.src,
            naturalWidth: el?.naturalWidth,
            naturalHeight: el?.naturalHeight,
            with: +cp.width.replace("px", ""),
            height: +cp.height.replace("px", ""),
            top: rect.top,
            left: rect.left
        }
    }, selector)
    return imageInfo;
}

interface ImageNRSize {
    height: number;
    naturalHeight: number;
    naturalWidth: number;
    with: number;
    top: number,
    left: number,
}

function calcPositions(mLetters: api.LetterInfo[], nrSize: ImageNRSize): { x: number, y: number }[] {
    return mLetters.map(l => {
        const x = nrSize.left + l.x * (nrSize.with / nrSize.naturalWidth);
        const y = nrSize.top + l.y * (nrSize.height / nrSize.naturalHeight);
        return {
            x,
            y
        }
    })

}

// 贡,203,54|痉,52,63
// 啸,80,249|贡,211,182|沈,444,71|壶,497,185|痉,409,230

async function innerHack(page: Page): Promise<boolean> {

    try {
        // 等待图片显示
        await page.waitForTimeout(10 * 1000);

        // 获取大图的基本信息
        await page.waitForSelector("#captcha-verify-image", {
            timeout: 10 * 1000
        });
        const bigImageInfo = await getImageInfo(page, "#captcha-verify-image");
        console.log("获取大图");
        // 获取小图的基本信息
        await page.waitForSelector("#verify-bar-code", {
            timeout: 10 * 1000
        });
        const smallImage = await getImageInfo(page, "#verify-bar-code");
        console.log("获取小图");
        // 获取大图和小图的文字和位置信息
        const resBig = await getLetterInfo(bigImageInfo.src);
        const resSmall = await getLetterInfo(smallImage.src);

        // 从大图中匹配满足要求的文字和位置信息
        const mLetters = extractLettersInfo(resSmall.letters, resBig.letters);
        if (resSmall.letters.length !== mLetters.length) {
            // 如果匹配的文字少于小图中的文字，大图大概率是识别错误
            await api.reportError(resBig.pic_id);
            return false;
        }

        // 根据自然尺寸，渲染尺寸，外加偏移量，计算出点击位置
        let pointers = calcPositions(mLetters, bigImageInfo);

        // 一次点击
        for (let i = 0; i < pointers.length; i++) {
            const pointer = pointers[i];
            await page.mouse.click(pointer.x, pointer.y);
            await page.waitForTimeout(500 + Math.random() * (i + 1) * 300);
        }
        await page.waitForTimeout(500);

        console.log("准备点击");
        await page.click(".verify-captcha-submit-button");

        // await page.waitForNavigation({
        //     timeout: 15 * 1000
        // })
        return true

    } catch (err) {
        console.error("letterCode hack error:", err);
        return false
    }

}

export default async function hack(page: Page, tryCount: number = 6): Promise<boolean> {
    let success = false;
    let count = 0;
    while (!success && count < tryCount) {
        console.log(`第${count + 1}次破解开始`);
        success = await innerHack(page);
        console.log(`第${count + 1}次破解结束:`, success ? "成功" : "失败");
        count++;

        if (success) {
            return success;
        }

        if (count == Math.floor(tryCount / 2)) {
            await page.reload({
                waitUntil: "load"
            })
        } else {
            await page.click(".secsdk_captcha_refresh--text");
        }

    }
    return false
}
