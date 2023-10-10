import Activity from "../activities/Race"
import {  ActivityFactoryFactory, IActivityProps } from "./types";

export interface IRaceActivityProps<C = any> extends IActivityProps<C> {
    children: IActivityProps[];
}

export default (factory: ActivityFactoryFactory) => <C = any, GC = any>(props: IRaceActivityProps<C>, globalContext?: GC) => {
    const children: Activity[] = [] as any;
    const activity = new Activity(props.context, children)
    activity.name = props.name || activity.name;
    activity.globalContext = globalContext;
    activity.children = factory.createChildren(props.children, globalContext)
    activity.build();
    return activity
}