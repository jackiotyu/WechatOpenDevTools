import * as frida from 'frida';
import * as colors from './colors';
import { WechatUtils } from './wechat';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

export class Commons {
    private utilInstance: WechatUtils;
    private device: frida.Device;

    constructor() {
        this.utilInstance = new WechatUtils();
        frida.getLocalDevice().then((device) => {
            this.device = device;
        });
    }

    async onMessage(message: frida.Message, data: any) {
        if (message.type === 'send') {
            console.log(colors.Color.GREEN + message.payload + colors.Color.END);
        } else if (message.type === 'error') {
            console.error(colors.Color.RED + message.stack + colors.Color.END);
        }
    }

    async injectWechatEx(pid: number, code: string) {
        const session = await frida.attach(pid);
        const script = await session.createScript(code);
        script.message.connect(this.onMessage);
        await script.load();
        await new Promise<void>((resolve) => process.stdin.once('data', resolve));
    }

    async injectWechatDLL(path: string, code: string) {
        const pid = await this.device.spawn(path);
        const session = await frida.attach(pid);
        const script = await session.createScript(code);
        script.message.connect(this.onMessage);
        await script.load();
        await util.promisify(setTimeout)(10000);
        await this.device.resume(pid);
        await util.promisify(setTimeout)(1000);
        await session.detach();
    }

    async loadWechatExConfigs() {
        const configPath = this.utilInstance.getConfigsPath();
        const { pid, version } = await this.utilInstance.getWechatPidAndVersion();
        if (pid || version !== null) {
            const hookCode = fs.readFileSync(path.join(__dirname, '../scripts/hook.js'), 'utf-8');
            const appAddresses = fs.readFileSync(
                path.resolve(configPath, `../configs/address_${version}_x64.json`),
                'utf-8',
            );
            const wechatExHookCode = `var address=${appAddresses}${hookCode}`;
            await this.injectWechatEx(pid, wechatExHookCode);
        } else {
            this.utilInstance.printProcessNotFoundMessage();
        }
    }

    async loadWechatEXEConfigs() {
        try {
            const { pid, version } = await this.utilInstance.getWechatPidAndVersion();
            if (pid || version !== null) {
                console.log(`${colors.Color.RED}[-] 请退出微信后在执行该命令 ${colors.Color.END}`);
                return 0;
            }

            const wechatEXEpath = await this.utilInstance.findInstallationPath('微信');
            const configPath = this.utilInstance.getConfigsPath();
            const wechatEXEHookcode = fs.readFileSync(path.resolve(configPath, `../scripts/WechatWin.dll/hook.js`), 'utf-8');
            await this.injectWechatDLL(wechatEXEpath, wechatEXEHookcode);
        } catch (err) {
            console.error('发生错误', err);
        }
    }

    async loadWechatEXEAndWechatEx() {
        const { pid, version } = await this.utilInstance.getWechatPidAndVersion();
        if (pid || version !== null) {
            console.log(`${colors.Color.RED}[-] 请关闭微信后在执行该命令 ${colors.Color.END}`);
            return 0;
        }
        await this.loadWechatEXEConfigs();
        await this.loadWechatExConfigs();
    }
}
