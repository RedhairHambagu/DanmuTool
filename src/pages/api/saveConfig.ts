import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const { accid, pwd, roomId, appDataDir, token } = req.body;

            // 确保字段不为空
            if (!accid || !pwd || !roomId || !appDataDir || !token) {
                return res.status(400).json({ error: '所有字段都是必填的' });
            }

            // 生成 YAML 数据
            const config = {
                accid,
                pwd,
                roomId,
                appDataDir,
                token,
            };

            // 定义 config.yaml 文件的路径
            const filePath = path.join(process.cwd(), 'config.yaml');

            // 将数据转换为 YAML 格式
            const yamlData = yaml.dump(config);

            // 将 YAML 数据写入 config.yaml 文件
            fs.writeFileSync(filePath, yamlData, 'utf8');

            // 成功响应
            res.status(200).json({ success: true, message: '配置保存成功' });
        } catch (error) {
            console.error('保存配置时出错:', error);
            res.status(500).json({ error: '无法保存配置', details: error });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
