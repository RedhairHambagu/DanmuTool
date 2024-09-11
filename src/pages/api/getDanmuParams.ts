import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        // 从查询参数中获取值
        const { accid, pwd, roomId, appDataDir,token } = req.query;

        // 检查必需的参数是否存在
        if (!accid || !pwd || !roomId || !appDataDir || !token) {
            return res.status(400).json({ error: '缺少必要的参数' });
        }

        // 构建弹幕参数对象
        const danmuParams = {
            accid: Array.isArray(accid) ? accid[0] : accid, // 处理可能的数组
            pwd: Array.isArray(pwd) ? pwd[0] : pwd,
            roomId: Array.isArray(roomId) ? roomId[0] : roomId,
            appDataDir: Array.isArray(appDataDir) ? appDataDir[0] : appDataDir,
            token: Array.isArray(token) ? token[0] : token,
        };

        res.status(200).json(danmuParams);
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}