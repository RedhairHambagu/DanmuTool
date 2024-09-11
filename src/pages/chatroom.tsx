import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router'; // 导入 useRouter

const Danmu = dynamic(() => import('./Danmu/Danmu'), { ssr: false });

interface DanmuParams {
    accid: string;
    pwd: string;
    roomId: string;
    appDataDir: string;
}

const Chatroom: React.FC = () => {
    const router = useRouter(); // 使用 useRouter 获取路由信息
    const [danmuParams, setDanmuParams] = useState<DanmuParams | null>(null);
    const [isParamsFetched, setIsParamsFetched] = useState(false); // 新增状态

    useEffect(() => {
        if (router.isReady) {
            const { accid, pwd, roomId, appDataDir, token } = router.query; // 从查询字符串中获取参数
            console.log('query:', router.query);

            // 确保所有参数都存在
            if (accid && pwd && roomId && appDataDir && token) {
                const params = {
                    accid: Array.isArray(accid) ? accid[0] : accid,
                    pwd: Array.isArray(pwd) ? pwd[0] : pwd,
                    roomId: Array.isArray(roomId) ? roomId[0] : roomId,
                    appDataDir: Array.isArray(appDataDir) ? appDataDir[0] : appDataDir,
                };
                setDanmuParams(params);
            }
        }
    }, [router.isReady, router.query]);

    const getDanmuParams = useCallback(async (retryCount = 0) => {
        if (!danmuParams) return; // 确保在参数准备好后再调用

        try {
            console.log(`正在调用 get-danmu-params (重试次数: ${retryCount})`);
            const response = await fetch(`/api/getDanmuParams?accid=${danmuParams.accid}&pwd=${danmuParams.pwd}&roomId=${danmuParams.roomId}&appDataDir=${danmuParams.appDataDir}&token=${router.query.token}`); // 调用 API 路由并传递参数
            const params = await response.json();
            console.log('get-danmu-params 返回结果:', params);

            if (params && typeof params === 'object' && 'accid' in params) {
                console.log('获取到有效的弹幕参数:', params);
                setDanmuParams(params);
                setIsParamsFetched(true); // 设置为已获取参数
            } else {
                console.log('未能获取到有效的弹幕参数');
                if (retryCount < 5) {
                    console.log(`将在 1 秒后进行第 ${retryCount + 1} 次重试`);
                    setTimeout(() => getDanmuParams(retryCount + 1), 1000);
                } else {
                    console.error('达到最大重试次数，无法获取弹幕参数');
                }
            }
        } catch (error) {
            console.error('get-danmu-params 调用失败:', error);
            if (retryCount < 5) {
                console.log(`将在 1 秒后进行第 ${retryCount + 1} 次重试`);
                setTimeout(() => getDanmuParams(retryCount + 1), 1000);
            } else {
                console.error('达到最大重试次数，无法获取弹幕参数');
            }
        }
    }, [danmuParams, router.query.token]); // 添加依赖项

    useEffect(() => {
        // 尝试获取参数
        if (danmuParams && !isParamsFetched) { // 仅在未获取参数时调用
            console.log('正在调用 get-danmu-params');
            getDanmuParams(); // 调用获取弹幕参数的函数
        }
    }, [danmuParams, getDanmuParams, isParamsFetched]); // 依赖于 danmuParams 和 isParamsFetched

    // 添加条件渲染
    if (!danmuParams) {
        return <div>正在加载弹幕参数...</div>;
    }

    return (
        <div>
            <h1>Danmu page</h1>
            <p>房间ID: {danmuParams.roomId}</p>
            <Danmu 
                accid={danmuParams.accid} 
                pwd={danmuParams.pwd} 
                roomId={parseInt(danmuParams.roomId, 10)} 
                appDataDir={danmuParams.appDataDir} 
            />
        </div>
    );
}

export default Chatroom;