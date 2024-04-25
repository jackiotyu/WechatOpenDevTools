import * as argparse from 'argparse';
import { Commons } from './utils/commons';
import { Color } from './utils/colors';

function printColoredMessage(message: string, color: string) {
    console.log(color + message + Color.END);
}

async function main() {
    const HELPALL = `
    请选择要执行的方法：
                        [+] node main.js -h  查看帮助
                        [+] node main.js -x  开启小程序F12
                        [+] node main.js -c  开启内置浏览器F12
                        [+] node main.js -all   开启内置浏览器F12与小程序F12

    `;
    const parser = new argparse.ArgumentParser({ description: HELPALL });
    parser.addArgument('-x', { action: 'storeTrue', help: '开启小程序F12' });
    parser.addArgument('-c', { action: 'storeTrue', help: '开启内置浏览器F12' });
    parser.addArgument('-all', { action: 'storeTrue', help: '开启内置浏览器F12与小程序F12' });
    const args = parser.parseArgs();

    const commons = new Commons();

    if (args.x) {
        await commons.loadWechatExConfigs();
    } else if (args.c) {
        await commons.loadWechatEXEConfigs();
    } else if (args.all) {
        await commons.loadWechatEXEAndWechatEx();
    } else {
        printColoredMessage(HELPALL, Color.RED);
    }
}
console.log('正在启动');
main();
