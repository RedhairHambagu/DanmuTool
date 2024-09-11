import type { NextApiRequest, NextApiResponse } from 'next';
import * as NIM from 'node-nim';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';

const nimLoginAccountSet = new Set(); // 记录当前已登录的账号
let nodeNimInitiated = false; // 记录NodeNim是否已初始化
let node_nim;

async function deleteAppDataDir(appDataDir: string) {
    if (fs.existsSync(appDataDir)) {
        try {
            await fsPromises.rm(appDataDir, { recursive: true });
        } catch { /* noop */ }
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { appKey, account, token, roomId, appDataDir } = req.body;
        console.log(appKey, account, token, roomId, appDataDir)
        try {
            // 延迟加载 node-nim
            if (!node_nim) {
                console.log('system platform: ',process.platform)
                const nodeNimModule = require('node-nim');
                node_nim = 'default' in nodeNimModule ? nodeNimModule.default : nodeNimModule;
            }
            console.log('检查nodeNimInitiated')
            console.log(appKey);
            if (!nodeNimInitiated) {
                // 清除app data目录
                await deleteAppDataDir(appDataDir);
                const clientInitResult = node_nim.nim.client.init(atob(appKey), '', '', {});
                if (!clientInitResult) {
                    console.error('NodeNim 初始化失败');
                    return res.status(500).json({ success: false, error: 'NodeNim 初始化失败' });
                }
                nodeNimInitiated = true;
                console.log('NodeNim 初始化成功');
            }
            console.log('准备登录')
            // 登录
            console.log(nimLoginAccountSet)
            if (!nimLoginAccountSet.has(account)) {
                const [loginRes] = await node_nim.nim.client.login(atob(appKey), account, token, null, '');
                console.log('登录结果：',loginRes)
                console.log('登录状态码:',node_nim.NIMResCode.kNIMResSuccess)
                if (loginRes.res_code_ !== node_nim.NIMResCode.kNIMResSuccess) {
                    return res.status(401).json({ success: false, error: '登录失败' , content:loginRes});
                }
                nimLoginAccountSet.add(account);
            }
            console.log('准备进入聊天室')
            const [resEnterCode, roomEnterResult] = await node_nim.nim.plugin.chatRoomRequestEnterAsync(roomId, null, '');
            console.log(roomEnterResult)
            if (resEnterCode !== node_nim.NIMResCode.kNIMResSuccess) {
                return res.status(401).json({ success: false, error: '进入聊天室失败' });
            }
            console.log('准备初始化聊天室...');
            return res.status(200).json({ success: true, roomEnterResult });
        } catch (error) {
            console.error('NodeNim 登录过程中发生错误:', error);
            return res.status(500).json({ success: false, error: '发生未知错误', details: error });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}