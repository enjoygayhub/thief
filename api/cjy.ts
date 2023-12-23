
import axios from "axios";
import FormData = require("form-data");
import { Stream } from "stream";

const ins = axios.create();

const config = {
    user: "chaojiying2023",
    pass: "chaojiying2023",
    softid: "949251"
}

export interface LetterInfo {
    letter: string;
    x: number;
    y: number;
}

export interface CJYBaseRes {
    err_no: number;
    err_str: string;
};

export interface CJYRes extends CJYBaseRes{
    pic_id: string;
    pic_str: string;
    md5: string;
    letters: LetterInfo[]
}

function strToLetters(str: string): LetterInfo[] {
    const arr = str.split("|");

    return arr.map(v => {
        const iArr = v.split(",");
        return {
            letter: iArr[0],
            x: +iArr[1],
            y: +iArr[2]
        }
    })

}

// res: {err_no: 0, err_str: 'OK', pic_id: '2229016311106990046', pic_str: '厩,514,284|却,219,160|脸,373,140|沛,98,209|硫,329,259', md5: '1273e294b082d1fbeeb90f03237b670a'}

function processing({ type, stream }: {
    type: string;
    stream: Stream
}) {
    var fd = new FormData();
    fd.append('user', config.user);
    fd.append('pass', config.pass);
    fd.append('softid', config.softid);

    fd.append("codetype", type)
    fd.append('userfile', stream);

    return ins<CJYRes>({
        url: 'http://upload.chaojiying.net/Upload/Processing.php',
        method: 'POST',
        data: fd,
        headers: {
            "Content-Type": "multipart/form-data"
        }
    }).then(res => {
        res.data.letters = strToLetters(res.data.pic_str);
        return res.data;
    }).catch(err => {
        console.error("err:", err);
        return {
            err_no: 9999,
            err_str: err && err.message || '未知异常'
        } as CJYRes
    })
}


export function getLetters(stream: Stream) {
    return processing({
        type: "9501",
        stream
    })
}


export function reportError(id: string){
    var fd = new FormData();
    fd.append('user', config.user);
    fd.append('pass', config.pass);
    fd.append('softid', config.softid);

    fd.append("id", id);

    return ins<CJYBaseRes>({
        url: 'http://upload.chaojiying.net/Upload/ReportError.php',
        method: 'POST',
        data: fd,
        headers: {
            "Content-Type": "multipart/form-data"
        }
    }).then(res => {
        console.log("reportError res:", res.data);
        return res.data;
    }).catch(err => {
        console.error("err:", err);
        return {
            err_no: 9999,
            err_str: err && err.message || '未知异常'
        } as CJYBaseRes
    })
}
