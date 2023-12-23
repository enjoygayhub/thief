import PageChildActivity from "../../thief/src/crawlActivities/PageChildActivity";
import { IActivityExecuteParams } from "../../thief/src/types/activity";
import { VideoItem } from "../case/douyinVideo/types";
import hack from "../common/dyHack/letterCode";


interface ER {
    $item: VideoItem,
    $index: number
}

export default class DYLetterHackActivity<C = any, R = any> extends PageChildActivity<
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

            await page.waitForTimeout(3000);
            const errorMessages = await page.$$eval("[data-e2e='error-page']", col => {
                return col.map(c => c.textContent?.trim())
            });
            if (errorMessages.some(m => m?.includes("不是有效视频"))) {
                if (paramObj?.$item) {
                    paramObj.$item.isValid = false;
                }
                throw new Error("不是有效的视频")
            }

            await page.waitForTimeout(5000);
            const curUrl = page.url();

            if (!curUrl.toLowerCase().startsWith(item.url.toLowerCase())) {
                if (paramObj?.$item) {
                    paramObj.$item.isValid = false;
                }
                throw new Error(`当前地址${curUrl}与目标地址${item.url}不一致`)
            }

            const captchaContainer = await page.$("#captcha_container");
            if (captchaContainer) {
                // @ts-ignore
                const display = await page.$eval("#captcha_container", (el: HTMLDivElement) => el.style.display);
                if (display !== 'none') {
                    await hack(page as any);
                    // 留时间给可能的页面刷新
                    await page.waitForTimeout(8 * 1000);
                }
            }
            const url = page.url();
            if (!url.toLowerCase().startsWith(item.url.toLowerCase())) {
                if (paramObj?.$item) {
                    paramObj.$item.isValid = false;
                }
                throw new Error(`当前地址${curUrl}与目标地址${item.url}不一致`)
            } else if (url !== curUrl) {
                page.goto(curUrl);
            } else {
                page.reload();
            }
            return true;

        });
    }
}
