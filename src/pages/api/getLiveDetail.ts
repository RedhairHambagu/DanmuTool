import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';


const API_URL = 'https://pocketapi.48.cn/live/api/v1/live/getOpenLiveOne'; // 目标 API URL


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { liveId, headers } = req.body;
        const body = {
            "liveId" : liveId
          }
      
        try {
            console.log(req.body)
            const response = await axios.post(API_URL, body, {
                headers: headers,
                timeout: 10000 // 设置10秒超时
            });
            if (response.status === 200 && response.data && response.data.content) {
                console.log("响应数据:", JSON.stringify(response.data.content));
                const liveDetail = response.data.content; // 替换为实际获取的直播列表
                res.status(response.status).json(liveDetail); // 返回目标 API 的响应
              } else {
                throw new Error(`请求失败: ${response.status}`);
              }
        } catch (error) {
            console.error('Error in API request:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
        // 这里可以调用你的直播详情获取逻辑
        const liveDetail = {}; // 替换为实际获取的直播详情
        res.status(200).json(liveDetail);
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}




