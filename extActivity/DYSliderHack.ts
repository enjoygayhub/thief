import path from "path";
import PageChildActivity from "../../thief/src/crawlActivities/PageChildActivity";
import { IActivityExecuteParams } from "../../thief/src/types/activity";
import { VideoItem } from "../case/douyinVideo/types";
import fs from "fs";
import { Page } from "puppeteer";


interface ER {
    $item: VideoItem,
    $index: number
}


async function slider(page: Page) {
    try {
        // 获取canvas的左上角X坐标作为滑动的基坐标
        await page.waitForSelector('#captcha-verify-image');
        let canvasCoordinate = await page.$('#captcha-verify-image');
        let canvasBox = await canvasCoordinate!.boundingBox();
        let canvasX = canvasBox!.x;
        // 等待滑动按钮出现获取Y坐标
        await page.waitForSelector('.captcha_verify_img_slide');
        let button = await page.$('.captcha_verify_img_slide');
        let box = await button!.boundingBox();
        let mouseY = Math.floor(box!.y + box!.height / 2);

        console.log("mouseY:", mouseY, ", canvasX", canvasX);
        console.log("button.x", box!.x);

        // 计算位移
        let moveDistance = 1000; // (await calculateDistance(page)).distance + 32;
        console.log("mouseY:", mouseY, ", canvasX", canvasX, ",moveDistance", moveDistance);

        // 滑动验证
        console.log('模拟滑动：开始');
        // await page.hover('.secsdk-captcha-drag-icon');
        let ticket = setTimeout(() =>{
            new Error('模拟滑动：超时');
        }, 6000);

        await page.hover('.captcha_verify_img_slide');
        await page.mouse.down();
        await page.mouse.move(Math.floor(canvasX + moveDistance / 3), mouseY, { steps: 15 });
        await page.waitForTimeout(1 * 30);
        await page.mouse.move(Math.floor(canvasX + moveDistance / 2), mouseY, { steps: 20 });
        await page.waitForTimeout(2 * 50);
        await page.mouse.move(Math.floor(canvasX + moveDistance + 10), mouseY, { steps: 18 });
        await page.waitForTimeout(3 * 80);
        await page.mouse.move(Math.floor(canvasX + moveDistance / 1), mouseY, { steps: 100 });
        await page.waitForTimeout(4 * 30);
        await page.mouse.up();
        clearTimeout(ticket);
        console.log('模拟滑动：结束');
    } catch (err: any) {
        console.error('slider error: ', err);
        throw err;
    }
}


export default class DYSliderHackActivity<C = any, R = any> extends PageChildActivity<
    C,
    R,
    any,
    ER,
    any
> {
    buildTask() {
        return (this.task = async (paramObj: IActivityExecuteParams<ER>) => {

            const item = paramObj.$item;
            const page = this.page!;

            await page.waitForTimeout(4000);
            const errorMessages = await page.$$eval("[data-e2e='error-page']", col => {
                return col.map(c => c.textContent?.trim())
            });
            if (errorMessages.some(m => m?.includes("不是有效视频"))) {
                if (paramObj?.$item) {
                    paramObj.$item.isValid = false;
                }
                throw new Error("不是有效的视频")
            }
            const curUrl = page.url();

            if (!curUrl.toLowerCase().startsWith(item.url.toLowerCase())) {
                if (paramObj?.$item) {
                    paramObj.$item.isValid = false;
                }
                throw new Error(`当前地址${curUrl}与目标地址${item.url}不一致`)
            }

            const scriptContent = fs.readFileSync(path.join(__dirname, "../common/dyHack/dyIndex.js"), "utf-8")
            await page.addScriptTag({
                content: scriptContent
            });


            const url = page.url();
            if (url !== curUrl) {
                page.goto(curUrl);
            } else {
                page.reload();
            }
            return true;

        });
    }
}
