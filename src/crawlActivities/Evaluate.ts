import { isFunction } from "lodash";
import { IActivityRunParams } from "../types/activity";
import PageChildActivity from "./PageChildActivity";
import { getFunctionBody } from "../util/funtion";

export default class EvaluateActivity<
    C = any,
    R = any
> extends PageChildActivity<C, R> {
    constructor(ctx: C) {
        super(ctx)
    }

    buildTask(code: string | Function, ...args: any[]) {
        return this.task = async (paramObj: IActivityRunParams) => {
            // 替换code变量
            let rCode = isFunction(code) ? getFunctionBody(code) : `${code}`;
            rCode = this.replaceVariable(rCode, paramObj) as string;
            // 替换参数变量
            const rArgs = args.map(arg => this.replaceVariable(arg, paramObj))
            const res = await this.page!.evaluate((_code, ..._args) => {
                const f = new Function(_code);
                console.log("f:", f.toString());
                const results = f(..._args);
                return results
            }, rCode, ...rArgs)
            return res;
        }
    }
}