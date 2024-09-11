import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            // 确保 config.yaml 文件存在
            const filePath = path.join(process.cwd(), 'config.yaml');
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: '配置文件未找到' });
            }

            // 读取 config.yaml 文件
            const fileContents = fs.readFileSync(filePath, 'utf8');
            const config = yaml.load(fileContents) as {
                accid: string;
                pwd: string;
                roomId: string;
                appDataDir: string;
                token: string;
            };

            // 返回配置数据
            res.status(200).json(config);
        } catch (error) {
            console.error('读取配置文件时出错:', error);
            res.status(500).json({ error: '无法加载配置', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}