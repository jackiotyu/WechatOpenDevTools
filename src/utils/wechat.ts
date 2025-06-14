import { promisify } from 'util';
import { Color } from './colors';
import fs from 'fs';
import path from 'path';
import sysInfo from 'systeminformation';
import regedit from 'regedit';

regedit.setExternalVBSLocation("./vbs");

export class WechatUtils {
    configsPath: string;
    versionList: number[];
    constructor() {
        this.configsPath = this.getConfigsPath();
        this.versionList = this.getVersionList();
    }

    getConfigsPath() {
        return path.resolve(__dirname, '../configs');
    }

    getVersionList() {
        const configsPath = this.configsPath;
        const versionList = fs.readdirSync(configsPath);
        const versionsList = versionList
            .filter((file) => file.startsWith('address_'))
            .map((file) => parseInt(file.split('_')[1]));
        return versionsList;
    }

    isWechatExProcess(cmdline: string) {
        const processName = 'WeChatAppEx';
        return cmdline.includes(processName) || cmdline.includes('--wmpf_extra_config');
    }

    async findInstallationPath(programName: string) {
        try {
            const searchList = promisify(regedit.list);
            const key = `HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall`;
            const res = (await searchList([key])) as { [a: string]: { exist: boolean; keys: string[] } };
            const items = res[key]!.keys;
            for (const item of items) {
                try {
                    const currentKey = `${key}\\${item}`;
                    const list = (await searchList([currentKey])) as {
                        [a: string]: {
                            exist: boolean;
                            keys: string[];
                            values: { [k: string]: { type: string; value: string | number } };
                        };
                    };
                    const current = list[currentKey];
                    if (String(current.values?.['DisplayName']?.['value']).trim() === programName) {
                        const installLocation = current.values['InstallLocation']['value'];
                        const installPath = `${installLocation}\\WeChat.exe`;
                        console.log(`${Color.GREEN}[+] 查找到${programName}的安装路径是：${installPath}${Color.END}`);
                        console.log(`${Color.GREEN}[+] 正在尝试重启微信...${Color.END}`);
                        return installPath;
                    }
                } catch (error) {}
            }
            throw Error('未找到');
        } catch (err) {
            console.log(`${Color.RED}[-] 查找安装路径时出错：${err}${Color.END}`);
        }
    }

    extractVersionNumber(cmdline: string) {
        const str = cmdline;
        const versionMatch = str.match(/\\"version\\":(\d+)/);
        return versionMatch ? parseInt(versionMatch[1]) : null;
    }

    async getWechatPidAndVersion() {
        const process = await sysInfo.processes();
        const wechatExProcesses = process.list.filter((p) => this.isWechatExProcess(p.command));
        for (const process of wechatExProcesses) {
            const pid = process.pid;
            const version = this.extractVersionNumber(process.command);
            if (this.versionList.includes(version)) {
                return { pid, version };
            }
        }
        return { pid: null, version: null };
    }

    printProcessNotFoundMessage() {
        console.log(`${Color.RED}[-] 未找到匹配版本的微信进程或微信未运行${Color.END}`);
    }
}
