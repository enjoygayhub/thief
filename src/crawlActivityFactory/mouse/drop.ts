import { Point, Protocol } from "puppeteer";
import Activity from "../../crawlActivities/mouse/Drop";
import { EnumActivityStatus } from "../../enum";
import { ActivityFactoryFactory, IActivityProps } from "../../types/activity";

export interface IMouseDropActivityProps<C = any> extends IActivityProps<C> {
    target: Point, data: Protocol.Input.DragData
}

export default (_factory: ActivityFactoryFactory) =>
    <C = any, GC = any>(props: IMouseDropActivityProps<C>, globalContext: GC) => {
        const activity = new Activity(props.context);
        activity.name = props.name || activity.name;
        activity.globalCtx = globalContext || {};
        activity.status = EnumActivityStatus.BUILDING;
        activity.buildTask(props.target, props.data);
        activity.status = EnumActivityStatus.BUILDED
        return activity;
    };