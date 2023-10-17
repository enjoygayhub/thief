import PageChildActivity from "./PageChildActivity";

export default class TitleActivity<
C = any,
R = any
> extends PageChildActivity<C, R> {

    buildTask(): Function {
        return (..._args: any[]) => {
            return this.page?.title()
        }
    }
}