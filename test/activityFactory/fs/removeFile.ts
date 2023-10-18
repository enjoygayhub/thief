import { IActivityProps } from '../../../src/types/activity';
import createActivity from "../../../src/factory/activity"

const activityProps: IActivityProps = {
    type: 'sequence',
    name: 'sequence',
    children: [ {
        type: 'fs.removeFile',
        name: '读取文件',
        url: "https://www.baidu.com/img/PCtm_d9c8750bed0b3c7d089fa7d55720d6cf.png",
        dist: `D:\\data\\tmp2\\cc\\dd\\bd.png`
    }, {
        type: 'code',
        name: '输出内容',
        code: 'console.log(res)'
    }]
}




const activity = createActivity(activityProps);
activity.run();