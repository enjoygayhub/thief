import { GoToOptions } from "puppeteer";
import PageChildActivity from "./PageChildActivity";

export default class GotoActivity<
    C = any,
    R = any
> extends PageChildActivity<C, R> {
    constructor(ctx: C, protected url: string, protected options: GoToOptions | undefined) {
        super(ctx)
    }

    buildTask(url: string, options: GoToOptions | undefined = undefined): Function {
        this.url = url || this.url;
        this.options = options || this.options;
        return (..._args: any[]) => {
            return this.action("goto", this.url, this.options)
        }
    }
}