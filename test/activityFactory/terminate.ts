import { IActivityProps } from './../../src/types/activity';
import createActivity from "../../src/factory/activity"

const activityProps: IActivityProps = {
    type: 'sequence',
    name: 'break测试',
    children: [{
        type: 'code',
        name: '输出当前日期',
        code: 'console.log(new Date().toLocaleString())'
    }, {
        type: 'delay',
        name: '延时2秒',
        timeout: 2000
    }, {
        type: 'code',
        name: '输出当前日期',
        code: 'console.log(new Date().toLocaleString())'
    }, {
        type: 'sequence',
        name: 'break测试',
        children: [{
            type: 'code',
            name: '输出11111',
            code: 'console.log(11111)'
        }, {
            type: 'delay',
            name: '延时4秒',
            time: 4000
        }, {
            type: 'terminate',
            name: '跳出break测试',
            message: '终止啦阿拉啦啦'
        }, {
            type: 'code',
            name: '输出22222',
            code: 'console.log(22222)'
        }]
    }, {
        type: 'code',
        name: '输出33333',
        code: 'console.log(33333)'
    }, {
        type: 'delay',
        name: '延时5秒',
        timeout: 5000
    }]
}

const activity = createActivity(activityProps);

activity.run();