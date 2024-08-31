import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import { ipcMain } from 'electron';
import { require, isWindowsArm, getNodeNimPath,isDevEnvironment } from '../utils.mjs';

const nimLoginAccountSet = new Set(); // 记录当前已登录的账号
let nodeNimInitiated = false; // 记录NodeNim是否已初始化
let node_nim;


/* 窗口关闭后需要清除和重置状态 */
export function nodeNimCleanup() {
    if (!isWindowsArm) {
        const node_nim = requireNodeMim();
        node_nim.nim.client.cleanup('');
        nodeNimInitiated = false;
        nimLoginAccountSet.clear();
    }
}
/* 清除app data目录 */
async function deleteAppDataDir(appDataDir) {
    if (fs.existsSync(appDataDir)) {
        try {
            await fsPromises.rm(appDataDir, { recursive: true });
        }
        catch { /* noop */ }
    }
}
/* NodeNim相关 */
export function nodeNimHandleLogin() {
    console.log('nodeNimHandleLogin 函数被调用');
    // NIM登录
    ipcMain.handle("node-nim-login" /* NodeNimLoginHandleChannel.NodeNimLogin */, async function (event, options) {
        try{
            console.log('node-nim-login 处理程序被调用');
            console.log('当前环境:', isDevEnvironment ? '开发环境' : '生产环境');
            console.log('process.env.NODE_ENV:', process.env.NODE_ENV);
            
            if (isWindowsArm) {
                console.log('Windows ARM 平台不支持');
                return { success: false, error: 'Windows ARM 平台不支持' };
            }
            console.log('nodeNimHandleLogin：node_nim 准备加载');

            // 延迟加载 node-nim
            if (!node_nim) {
                const nodeNimModule = require('node-nim');
                node_nim = 'default' in nodeNimModule ? nodeNimModule.default : nodeNimModule;
            }
                // let nodeNimModule;
                // if (isDevEnvironment) {
                //     console.log('开发环境，直接加载 node-nim');
                //     nodeNimModule = require('node-nim');
                // } else {
                //     console.log('生产环境，使用 getNodeNimPath 函数');
                //     const nodeNimPath = getNodeNimPath();
                //     if (!nodeNimPath) {
                //         throw new Error('无法找到  文件');
                //     }
                //     console.log('尝试加载 node-nim:', nodeNimPath);
                    // nodeNimModule = require(nodeNimPath);
                // }
            //     node_nim = 'default' in nodeNimModule ? nodeNimModule.default : nodeNimModule;
            // }
            
            console.log('node_nim 加载成功');
            
            if (!nodeNimInitiated) {
                // 清除app data目录
                await deleteAppDataDir(options.appDataDir);
                const clientInitResult = node_nim.nim.client.init(atob(options.appKey), '', '', {});
                if (!clientInitResult) {
                    console.error('NodeNim 初始化失败');
                    return { success: false, error: 'NodeNim 初始化失败' };
                }
                // try {
                //     console.log('准备调用 initEventHandlers');
                //     process.nextTick(() => {
                //         node_nim.nim.initEventHandlers();
                //         console.log('initEventHandlers 调用成功');
                //         nodeNimInitiated = true;
                //         console.log('NodeNim 初始化成功');
                //     });
                //     console.log('initEventHandlers 调用成功');
                // } catch (error) {
                //     console.error('initEventHandlers 调用失败:', error);
                //     return { success: false, error: 'initEventHandlers 调用失败', details: error.message };
                // }
                nodeNimInitiated = true;
                console.log('NodeNim 初始化成功');
            }
            console.log('nodeNimHandleLogin: 准备登录')
                 // 登录
             // 登录
        if (!nimLoginAccountSet.has(options.account)) {
            const [loginRes] = await node_nim.nim.client.login(atob(options.appKey), options.account, options.token, null, '');
            if (loginRes.res_code_ !== node_nim.NIMResCode.kNIMResSuccess)
                return null;
            nimLoginAccountSet.add(options.account);
        }
        const [resEnterCode, roomEnterResult] = await node_nim.nim.plugin.chatRoomRequestEnterAsync(options.roomId, null, '');
        if (resEnterCode !== node_nim.NIMResCode.kNIMResSuccess)
            return null;
        return roomEnterResult;
          
     } catch (error) {
            console.error('NodeNim 登录过程中发生错误:', error);
            return { success: false, error: '发生未知错误', details: error.message };
        }
   
    });
    // 清理NodeNim
    ipcMain.handle("node-nim-clean" /* NodeNimLoginHandleChannel.NodeNimClean */, async function (event, options) {
        nodeNimCleanup();
        await deleteAppDataDir(options.appDataDir);
    });
}
