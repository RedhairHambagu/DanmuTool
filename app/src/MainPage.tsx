import React, { useState , useEffect} from 'react';
import { ipcRenderer } from 'electron';
import { Header } from 'antd/es/layout/layout';


const IMAGE_PREFIX = 'https://source.48.cn'; // 替换为实际的图片前缀


interface LiveItem {
  liveId: string;
  title: string;
  subTitle: string;
  coverPath: string;
  status: number;
  stime: string;
  endTime: string;
  liveType: string;
  isCollection: boolean;
}

interface MemberItem {
  liveMode: number;
  liveType: number;
  coverHeight: number;
  coverWidth: number;
  liveId: string;
  title: string;
  isCollection: number;
  ctime: string;
  pictureOrientation: number;
  announcement: string;
  inMicrophoneConnection: boolean;
  onlineUserNum: number;
  coverPath: string;
  status: number;
  userInfo: UserInfo;
}
interface UserInfo {
  realNickName: string;
  vip: boolean;
  isStar: boolean;
  userRole: number;
  badge: any[];
  teamLogo: string;
  userId: string;
  avatar: string;
  level: number;
  signature: string;
  pfUrl: string;
  friends: string;
  effectUser: boolean;
  bgImg: string;
  nickname: string;
  starName: string;
  followers: string;
}

/* 随机字符串 */
function rStr(len: number): string {
  const str: string = 'QWERTYUIOPASDFGHJKLZXCVBNM1234567890';
  let result: string = '';

  for (let i: number = 0; i < len; i++) {
    const rIndex: number = Math.floor(Math.random() * str.length);

    result += str[rIndex];
  }

  return result;
}

function $token(): string {
  return Reflect.get(globalThis, '__x6c2adf8__').call();
}


/* 创建请求头 */
export function createHeaders(token?: string | undefined): { [key: string]: string } {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json;charset=utf-8',
    'appInfo': JSON.stringify({
      'vendor': 'apple',
      'deviceId': `${ rStr(8) }-${ rStr(4) }-${ rStr(4) }-${ rStr(4) }-${ rStr(12) }`,
      'appVersion': '7.0.4',
      'appBuild': '23011601',
      'osVersion': '16.3.1',
      'osType': 'ios',
      'deviceName': 'iPhone XR',
      'os': 'ios'
    }),
    'User-Agent': "PocketFans201807/7.1.13 (iPhone; iOS 16.6.1; Scale/3.00)",
    'Accept-Language': 'zh-Hans-AW;q=1',
    'Host': 'pocketapi.48.cn'
  };

  if (token) {
    headers.token = token;
  }


  return headers;
}

const MainPage: React.FC = () => {
    const [accid, setAccid] = useState('');
    const [pwd, setPwd] = useState('');
    const [roomId, setRoomid] = useState('');
    const [appDataDir, setAppdir] = useState('');
    const [token, setToken] = useState('');
    const [liveList, setLiveList] = useState<LiveItem[]>([]);
    const [MemberList, setMemberList] = useState<MemberItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isMemberLoading, setIsMemberLoading] = useState(false);
    
    useEffect(() => {

        // 加载配置
        const loadConfig = async () => {
         try {
                const config = await ipcRenderer.invoke('load-config');
                // console.log('加载的配置:', config);
                // 使用加载的配置更新您的状态
    
                setAccid(config.accid || '');
                setPwd(config.pwd || '');
                setRoomid(config.roomId || '');
                setAppdir(config.appDataDir || '');
                setToken(config.token || '');
            } catch (error) {
                console.error('加载配置时出错:', error);
              }
            };

    
        loadConfig();
      }, []);
    
      const saveConfig = () => {
        const newConfig = { accid, pwd, roomId, appDataDir,token };
        ipcRenderer.send('save-config', newConfig);
        console.log('已发送保存配置请求');
      };

      const openDanmuWindow = () => {
        if (accid && pwd && roomId && appDataDir) {
            saveConfig(); // 保存配置
            ipcRenderer.send('open-danmu-window', { accid, pwd, roomId, appDataDir });
        } else {
            alert('请填写所有必要的信息。');
        }
    };

    const getLiveList = async() => {
        setIsLoading(true);
        try {
          const Headers = createHeaders(token);
            const RawliveList = await ipcRenderer.invoke('get-live-list',Headers);
            console.log('获取到的直播列表raw:', RawliveList);
            console.log('获取到的直播列表:', RawliveList.liveList);
            const liveList = RawliveList.liveList;
            
            setLiveList(liveList);
            setIsLoading(false);
        } catch (error) {
            console.error('获取直播列表时出错:', error);
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    }
    const getLiveDetail = async(liveId: string) => {
        try {
            const Headers = createHeaders(token);
            console.log(Headers)
            const RawliveDetail = await ipcRenderer.invoke('get-live-detail', liveId,{Headers} );
            console.log('获取到的直播raw:', RawliveDetail);
            const liveDetail = RawliveDetail;
            setRoomid(liveDetail.roomId);

        } catch (error) {
            console.error('获取直播列表时出错:', error);
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    }
    const getMemberLiveList = async() => {
      setIsMemberLoading(true);
      try {
        const Headers = createHeaders(token);
          const RawliveList = await ipcRenderer.invoke('get-memberlive-list',Headers);
          console.log('获取到的直播列表raw:', RawliveList);
          console.log('获取到的直播列表:', RawliveList.liveList);
          const liveList = RawliveList.liveList;
          
          setMemberList(liveList);
          setIsMemberLoading(false);
      } catch (error) {
          console.error('获取直播列表时出错:', error);
          setIsMemberLoading(false);
      } finally {
          setIsMemberLoading(false);
      }
  }
  const getMemberLiveDetail = async(liveId: string) => {
      try {
          const Headers = createHeaders(token);
          console.log(Headers)
          const RawliveDetail = await ipcRenderer.invoke('get-memberlive-detail', liveId,{Headers} );
          console.log('获取到的直播raw:', RawliveDetail);
          const liveDetail = RawliveDetail;
          setRoomid(liveDetail.roomId);

      } catch (error) {
          console.error('获取直播列表时出错:', error);
          setIsMemberLoading(false);
      } finally {
          setIsMemberLoading(false);
      }
  }
  return (
<div>
      {/* 输入框 */}
      <div>accid: 
      <input
        type="text"
        placeholder="输入 accid"
        value={accid}
        onChange={(e) => setAccid(e.target.value)}
      />
      pwd: 
      <input
        type="password"
        placeholder="输入 pwd"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
      />
      roomid: 
      <input
        type="text"
        placeholder="输入 roomId"
        value={roomId}
        onChange={(e) => setRoomid(e.target.value)}
      />
            token: 
      <input
        type="text"
        placeholder="输入 token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      </div>
      <button onClick={saveConfig}>保存配置</button>

      {/* 按钮 */}
      <button onClick={openDanmuWindow}>确认并打开弹幕</button>

      <button onClick={getLiveList} disabled={isLoading} >{isLoading ? '加载中...' : '获取当前直播清单'}</button>
      {liveList.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>直播ID</th>
              <th style={tableHeaderStyle}>标题</th>
              <th style={tableHeaderStyle}>副标题</th>
              <th style={tableHeaderStyle}>封面</th>
              <th style={tableHeaderStyle}>状态</th>
              <th style={tableHeaderStyle}>开始时间</th>
              <th style={tableHeaderStyle}>结束时间</th>
              <th style={tableHeaderStyle}>直播类型</th>
              <th style={tableHeaderStyle}>是否合集</th>
            </tr>
          </thead>
          <tbody>
            {liveList.map((item, index) => (
              <tr key={index}>
                <td style={tableCellStyle}>{item.liveId}</td>
                <td style={tableCellStyle}>{item.title}</td>
                <td style={tableCellStyle}>{item.subTitle}</td>
                <td style={tableCellStyle}>
                  <img src={`${IMAGE_PREFIX}${item.coverPath}`} alt="封面" style={{width: '50px'}} />
                </td>
                <td style={tableCellStyle}>
                {item.status === 1 ? '未开始' : item.status === 2 ? '已开始' : '未知状态'}
                </td>
                <td style={tableCellStyle}>{new Date(Number(item.stime)).toLocaleString()}</td>
                <td style={tableCellStyle}>{new Date(Number(item.endTime)).toLocaleString()}</td>
                <td style={tableCellStyle}>{item.liveType}</td>
                <td style={tableCellStyle}>{item.isCollection ? '是' : '否'}</td>
                <td style={tableCellStyle}>
                <button onClick={() => getLiveDetail(item.liveId)}>获取直播明细</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button onClick={getMemberLiveList} disabled={isMemberLoading} >{isMemberLoading ? '加载中...' : '获取当前成员直播清单'}</button>
      {MemberList.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>直播ID</th>
              <th style={tableHeaderStyle}>标题</th>
              <th style={tableHeaderStyle}>成员</th>
              <th style={tableHeaderStyle}>公告</th>
              <th style={tableHeaderStyle}>封面</th>
              <th style={tableHeaderStyle}>直播类型</th>
              <th style={tableHeaderStyle}>开始时间</th>
              <th style={tableHeaderStyle}>在线人数</th>
              <th style={tableHeaderStyle}>是否连麦</th>
            </tr>
          </thead>
          <tbody>
            {MemberList.map((item, index) => (
              <tr key={index}>
                <td style={tableCellStyle}>{item.liveId}</td>
                <td style={tableCellStyle}>{item.title}</td>
                <td style={tableCellStyle}>{item.userInfo.starName}</td>
                <td style={tableCellStyle}>{item.announcement}</td>
                <td style={tableCellStyle}>
                  <img src={`${IMAGE_PREFIX}${item.coverPath}`} alt="封面" style={{width: '50px'}} />
                </td>
                <td style={tableCellStyle}>
                {item.liveType === 1 ? '视频' : item.liveType === 2 ? '电台' : '未知状态'}
                </td>
                <td style={tableCellStyle}>{new Date(Number(item.ctime)).toLocaleString()}</td>
                <td style={tableCellStyle}>{item.onlineUserNum}</td>
                <td style={tableCellStyle}>{item.inMicrophoneConnection}</td>
                <td style={tableCellStyle}>
                <button onClick={() => getMemberLiveDetail(item.liveId)}>获取直播明细</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MainPage;

const tableHeaderStyle = {
    backgroundColor: '#f2f2f2',
    padding: '10px',
    borderBottom: '1px solid #ddd',
    textAlign: 'left' as const
  };
  
  const tableCellStyle = {
    padding: '10px',
    borderBottom: '1px solid #ddd'
  };