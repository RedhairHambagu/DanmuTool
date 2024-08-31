import React, { useState, useEffect,useCallback } from 'react';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import Danmu from '../Danmu/Danmu';



function Chat() {
  interface DanmuParams {
    accid: string;
    pwd: string;
    roomId: string;
    appDataDir: string;
  }
  const [danmuParams, setDanmuParams] = useState<DanmuParams | null>(null);
  const getDanmuParams = useCallback(async (retryCount = 0) => {
    try {
      console.log(`正在调用 get-danmu-params (重试次数: ${retryCount})`);
      const params = await ipcRenderer.invoke('get-danmu-params');
      console.log('get-danmu-params 返回结果:', params);
      
      if (params && typeof params === 'object' && 'accid' in params) {
        console.log('通过 invoke 获取到有效的弹幕参数:', params);
        setDanmuParams(params);
      } else {
        console.log('未能通过 invoke 获取到有效的弹幕参数');
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
  }, []);
  useEffect(() => {
    const handleDanmuParams = (event: Electron.IpcRendererEvent, params: DanmuParams) => {
      console.log('接收到弹幕参数:', params);
      setDanmuParams(params);
      // 处理接收到的参数
    };

    console.log('正在添加 ipcRenderer 监听器')
    ipcRenderer.on('danmu-params', handleDanmuParams);

    // 尝试获取参数
    console.log('正在调用 get-danmu-params');
    ipcRenderer.invoke('get-danmu-params').then((params) => {
      console.log('get-danmu-params 返回结果:', params);
      if (params) {
        console.log('通过 invoke 获取到弹幕参数:', params);
        setDanmuParams(params);
      } else {
        console.log('未能通过 invoke 获取到弹幕参数');
      }
    }).catch(error => {
      console.error('get-danmu-params 调用失败:', error);
    });

    return () => {
      ipcRenderer.removeListener('danmu-params', handleDanmuParams);
    };
  }, []);
    // 添加条件渲染
    if (!danmuParams) {
    return <div>正在加载弹幕参数...</div>;
  }

  return (
    
    <div>
      <h1>Danmu page</h1>
      <>{danmuParams.roomId}</>
      <Danmu accid={danmuParams.accid} pwd={danmuParams.pwd} 
      roomId={parseInt(danmuParams.roomId, 10)} appDataDir={danmuParams.appDataDir} />
    </div>
  );
}

export default Chat;
