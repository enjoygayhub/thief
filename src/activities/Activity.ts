import { TerminateError } from "../ActivityError";
import { EnumActivityStatus } from "../enum";
import {
    ExtendParams,
    GK_TERMINATED,
    GK_TERMINATED_MESSAGE,
    IActivityExecuteParams,
    IActivityRunParams,
    IActivityTaskFunction
} from "../types/activity";
import ActivityBase from "./ActivityBase";
import { replaceVariable } from "./util/variable";

/**
 * C context
 * R res
 * O options
 * E taskOptions 的宽展
 */
class Activity<C = any, R = any, O = any,
    ER extends ExtendParams = {},
    EE extends ExtendParams = {}
> extends ActivityBase<C, R, O, ER, EE> {
    constructor(ctx: C, public options: O) {
        super(ctx, options);
    }

    protected runBefore(paramObject: IActivityExecuteParams<ER, EE>): unknown {
        if (!this.before || !(this.before instanceof Activity)) {
            return;
        }
        return this.before.run(paramObject);
    }

    protected runAfter(paramObject: IActivityExecuteParams<ER, EE>): unknown {
        if (!this.after || !(this.after instanceof Activity)) {
            return;
        }
        return this.after.run(paramObject);
    }

    protected async runAssert(paramObject: IActivityExecuteParams<ER, EE>) {
        if (!this.assert || !(this.assert instanceof Activity)) {
            return true;
        }
        const res = await this.assert.run(paramObject);
        return !!res;
    }

    /**
     *
     * @param {执行上下文} ctx
     * @param {上一次执行结果} preRes
     * @param {其他参数} otherParams
     */
    async run(
        paramsObject: IActivityRunParams<ER> = this
            .defaultTaskRunParam as IActivityRunParams<ER>
    ) {
        const globalCtx = this.globalCtx;
        // 如果已经终止
        if (globalCtx[GK_TERMINATED]) {
            return;
        }

        if (this.status < EnumActivityStatus.BUILDED) {
            this.buildTask();
        }

        let mContext = this.ctx || {};
        this.status = EnumActivityStatus.EXECUTING;
        const self = this;
        try {
            const gb = this.globalBuiltObject;

            const extraExecuteParams = this.getExtraExecuteParams();
            const argObject: IActivityExecuteParams<ER, EE> = {
                $gCtx: globalCtx,
                $ctx: mContext,
                $c: gb.properties.properties,
                $m: gb.methods.properties,
                $v: this.globalVariables,
                $parent: this.parent,
                $res: undefined,
                $a: gb.activities.properties,
                ...paramsObject,
                ...extraExecuteParams
            };

            const needRun = await this.runAssert(argObject);
            if (!needRun) {
                return paramsObject.$preRes;
            }

            // 执行前
            await this.runBefore.call(self, argObject);

            const res: R = await this.task!.call(self, argObject);
            this.status = EnumActivityStatus.EXECUTED;
            // 执行后
            argObject.$preRes = res;
            const afterRes = await this.runAfter.call(self, argObject);

            if (this.type == "terminate") {
                globalCtx[GK_TERMINATED] = true;
                globalCtx[GK_TERMINATED_MESSAGE] = res as string;
                // 执行后
                throw new TerminateError(res as string, self as any as Activity);
            }
            return res === undefined ? afterRes : res;
        } catch (err) {
            self.status = EnumActivityStatus.EXCEPTION;
            throw err;
        }
    }

    getExtraExecuteParams(): EE {
        return {} as EE;
    }

    buildTask(
        ...args: any[]
    ): IActivityTaskFunction<ER, EE> {
        return () => { };
    }

    build(...args: any[]) {
        this.status = EnumActivityStatus.BUILDING;
        const task = this.buildTask(...args) as unknown as IActivityTaskFunction<ER, EE>;
        if (task) {
            this.task = task;
        }
    }

    protected replaceVariable<C = any>(
        config: C,
        paramObj: IActivityRunParams<ER>
    ) {
        if (config == undefined || Array.isArray(config)) {
            return config as C;
        }
        const gb = this.globalBuiltObject;
        let mContext = this.ctx || {};

        const extraExecuteParams = this.getExtraExecuteParams();

        const paramObject: IActivityExecuteParams<ER, EE> = {
            $gCtx: this.globalCtx,
            $ctx: mContext,
            $c: gb.properties.properties,
            $m: gb.methods.properties,
            $v: this.globalVariables,
            $parent: this.parent,
            $res: undefined,
            $a: gb.activities.properties,
            ...paramObj,
            ...extraExecuteParams
        };

        return replaceVariable(config).call(this, paramObject) as C;
    }

    protected getProperty<P = any>(
        property: PropertyKey,
        recurse: boolean = false
    ): undefined | P {
        const context: any = this;
        if (context == null) {
            return undefined;
        }
        // TODO:: hasOwn ??
        const val = context[property];
        if (!recurse) {
            return val as P;
        }
        if (val !== undefined) {
            return val;
        }
        return this.getProperty.call(this.parent, property, recurse) as P;
    }

    getClosestParent<A = Activity>(targetActivity: Object): A | undefined {
        let act: Activity<any, any, any, any, any> | undefined = this;

        while (act != undefined) {
            if (act instanceof (targetActivity as any as Function)) {
                return act as A;
            }
            act = act.parent;
        }
        return undefined;
    }
}

export default Activity;
