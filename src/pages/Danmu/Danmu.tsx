import NodeNimChatroomSocket  from '../chatroom/sdk/NodeNimChatroomSocket';
import type {
    LiveRoomMessage,
    LiveRoomTextMessage,
    LiveRoomGiftInfoCustom,
    LiveRoomTextCustom,
    CppLiveRoomBasicEvent
  } from './messageType';
import type { ChatRoomMessage } from 'node-nim';
import React, {
  useEffect,
    useState,
    useRef,
    useCallback,
    type Dispatch as D,
    type SetStateAction as S,
    type MutableRefObject,
  } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { message, Switch, Button } from 'antd';
import classNames from 'classnames';
import styles from './Danmu.module.scss';
import DanmuGift from './DanmuGift';
import { CopyOutlined } from '@ant-design/icons';



function isLiveRoomTextCustom(item: CppLiveRoomBasicEvent, custom: LiveRoomTextCustom | LiveRoomGiftInfoCustom): custom is LiveRoomTextCustom {
  return item.msg_type_ === 0 || custom.messageType === 'BARRAGE_MEMBER' || custom.messageType === 'BARRAGE_NORMAL';
}

interface DanmuItemProps {
message: CppLiveRoomBasicEvent;
index: number;
formatGift: boolean;
}

const DanmuItem: React.FC<DanmuItemProps> = (props: DanmuItemProps) => {
  const { message, index, formatGift }: DanmuItemProps = props;
  const [height, setHeight]: [number, D<S<number>>] = useState(15);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(Math.max(20, contentHeight));
    }
  }, [message]);

  try {
    const custom: LiveRoomTextCustom | LiveRoomGiftInfoCustom = JSON.parse(message.msg_setting_!.ext_!);
    const isBarrage: boolean = custom.messageType === 'BARRAGE_NORMAL' || custom.messageType === 'BARRAGE_MEMBER';
    const isMember: boolean = custom.messageType === 'BARRAGE_MEMBER';
    // console.log(message)
    const currentTime = new Date();
    const customFormat = `${currentTime.getFullYear()}-${currentTime.getMonth() + 1}-${currentTime.getDate()} ${currentTime.getHours()}:${currentTime.getMinutes()}:${currentTime.getSeconds()}`; // 自定义格式
    // console.log(`当前时间: ${customFormat}`);
    if (isLiveRoomTextCustom(message, custom)) {
      return (
        <div 
        className={classNames(styles.danmuItem, { [styles.memberMessage]: isMember })}
        data-index={index}
        >
          <div ref={contentRef} className={styles.content}>
            <span className={styles.index}>【{index}】---</span>
            <span className={styles.nickname}>{custom.user.nickName}：</span>
            <span className={styles.message}>
            <span className={styles.message}>
            {(isMember || isBarrage) ? custom.text : (message as unknown as LiveRoomTextMessage).text ?? ''}
          </span>
            </span>
          </div>
        </div>
      );
    } else {
      const tpNum: number = Number(custom.giftInfo.tpNum);
      const isFloatDanmu: boolean = custom.giftInfo.giftId === 266592609913094144; // giftName: 直播弹幕
      
      if (isFloatDanmu){
        return (
          <div 
          className={classNames(styles.danmuItem, { [styles.memberMessage]: isMember })}
            data-index={ index }
          >
            <div ref={contentRef} className={classNames(styles.danmuItem, { [styles.memberMessage]: isMember })}>
            <span className={styles.index}>【{index}】-【飘屏】</span>
              <span className={styles.nickname}>{custom.user.nickName}：</span>
              <span className={styles.message}>
              : { custom.giftInfo.attachData.text }
              </span>
            </div>
          </div>
        );
      } else {
        return (
          <div ref={contentRef}
          className={classNames(styles.danmuItem, { [styles.memberMessage]: isMember })}
            data-index={ index }
          >
            <div>
            <span className={styles.index}>【{index}】---</span>
              <span className={styles.nickname}>{custom.user.nickName}：【🎁】</span>
              <span className={styles.message}>
              &nbsp;送给&nbsp;
              { custom.giftInfo.acceptUser.userName }&nbsp;
              { custom.giftInfo.giftNum }个
              { custom.giftInfo.giftName }{ tpNum > 0 ? `(${ tpNum })` : null }。
              </span>
            </div>
          </div>
        );
      }


    }
  } catch (err) {
    console.error(err, message);

    return null;
  }

}
 ;
  
  interface DanmuProps {
    accid: string;
    pwd: string;
    roomId: number;
    appDataDir: string;
  }



const Danmu: React.FC<DanmuProps> = ({ accid, pwd, roomId, appDataDir }) => {
    const [danmuData, setDanmuData] = useState<CppLiveRoomBasicEvent[]>([]);
    const nimRef: MutableRefObject<NodeNimChatroomSocket | null> = useRef(null);
    const messageCountRef = useRef(0);
    // ... 其他状态和引用保持不变
    const [isDanmuOn, setIsDanmuOn] = useState(false);
    const [isLiveFormat, setLiveFormat] = useState(false);


    useEffect(() => {
        if (isDanmuOn) {
            danmuOpen();
        }
        return () => {
            danmuClose();
        };
    }, []);
  
      // 获取到新信息
  function handleNewMessage(t: NodeNimChatroomSocket, event: Array<ChatRoomMessage>): void {
    const filterMessage: Array<CppLiveRoomBasicEvent> = [];
    console.log('handleNewMessage 被调用:', event);  // 确保此处输出正确
    for (const item of event) {
      console.log('正在处理消息:', item);  // 查看消息的结构
      if (item.msg_type_ !== undefined){
      if (item.msg_type_ === 0) {
        filterMessage.unshift({ ...item, vid: uuidv4(), index: messageCountRef.current++ });
      } else if (item.msg_type_ === 100 && item.msg_setting_?.ext_) {
        const custom: LiveRoomTextCustom | LiveRoomGiftInfoCustom = JSON.parse(item.msg_setting_.ext_);
        console.log('test danmu handleNewMessage');
        if (custom.messageType === 'BARRAGE_MEMBER' || custom.messageType === 'BARRAGE_NORMAL' || 'giftInfo' in custom) {
          filterMessage.unshift({ ...item, vid: uuidv4(), index: messageCountRef.current++ });
        }
      }
    }
    }
    console.log('过滤后的消息:', filterMessage);  // 确认消息过滤逻辑是否正常
    setDanmuData((prevState: CppLiveRoomBasicEvent[]): CppLiveRoomBasicEvent[] => filterMessage.concat(prevState));
  }


// 开启弹幕功能
function danmuOpen(): void {
  if (!nimRef.current) {
    try {
      console.log('正在初始化 NodeNimChatroomSocket...');
      nimRef.current = new NodeNimChatroomSocket(
        accid,
        pwd,
        roomId,
        appDataDir,
        handleNewMessage
      );
      // const apiUrl = `${window.location.origin}/api/nimSocket`; // 构建 API URL
      console.log('NodeNimChatroomSocket 初始化成功，正在调用 init()...');
      nimRef.current.init().then(success => {
        if (success) {
          console.log('init() 调用成功');
        } else {
          console.error('init() 调用失败');
        }
      });
    } catch (error) {
      console.error('danmuOpen 函数出错:', error);
    }
  }
}

// 关闭弹幕功能
function danmuClose(): void {
  if (nimRef.current) {
    nimRef.current.exit();
    nimRef.current = null;
  }
}

    // 开启或者关闭弹幕
function handleSwitchChange(checked: boolean): void {
  setIsDanmuOn(checked);
  if (checked) {
    danmuOpen();
  } else {
    danmuClose();
  }
}

    // 开启或者关闭格式
    function GiftSwitchChange(isLiveFormat: boolean): void {
      setLiveFormat(isLiveFormat);
      if (isLiveFormat) {
        true;
      } else {
        false;
      }
    }
    const [giftIndices, setGiftIndices] = useState<number[]>([]);
  const giftContainerRef = useRef<HTMLDivElement>(null);

  const handleGiftRender = useCallback((element: HTMLElement | null, index: number) => {
    setGiftIndices(prev => {
      if (element) {
        return [...new Set([...prev, index])].sort((a, b) => a - b);
      } else {
        return prev.filter(i => i !== index);
      }
    });
  }, []);

  const copyAllGifts = useCallback(() => {
    if (giftContainerRef.current) {
      const giftElements = giftContainerRef.current.querySelectorAll('[data-gift-index]');
      if (giftElements.length === 0) {
        message.warning('没有找到礼物信息');
        return;
      }
  
      const allGiftText = Array.from(giftElements)
        .map(element => {
          // 保留原始格式，包括制表符和换行符
          return (element as HTMLElement).innerText.replace(/\n+/g, '\n').trim();
        })
        .filter(Boolean)
        .join('\n'); // 使用两个换行符分隔不同的礼物信息
  
      if (allGiftText.length === 0) {
        message.warning('礼物信息为空');
        return;
      }
  
      const textArea = document.createElement('textarea');
      textArea.value = allGiftText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
  
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          message.success('已复制所有礼物信息到剪贴板');
        } else {
          message.error('复制失败');
        }
      } catch (err) {
        console.error('复制失败:', err);
        message.error('复制失败，请检查浏览器权限');
      }
  
      document.body.removeChild(textArea);
    } else {
      message.error('礼物容器不存在');
    }
  }, []);
  
    return (
      <div className={styles.danmuContainer}>

      <h1>弹幕窗口</h1>

    
      <div className={styles.chatRoom}>  
      <span>房间ID: {roomId}</span>
      <Switch
        size="default"
        className={styles.customSwitch} // 使用自定义样式
        defaultChecked={isDanmuOn}
        checkedChildren="弹幕开启"
        unCheckedChildren="弹幕关闭"
        onChange={handleSwitchChange}
        />
          <div className={styles.buttonContent}> <Button
            icon={<CopyOutlined />}
            onClick={copyAllGifts}
            size="small"
          >
            复制所有礼物信息
          </Button>
          </div>
      <div className={styles.buttonContent}></div>
                <Switch
                className={styles.customSwitch} // 使用自定义样式
        size="default"
        defaultChecked={isLiveFormat}
        checkedChildren="公演ON"
        unCheckedChildren="普通OFF"
        onChange={GiftSwitchChange}
        />
        </div>

       
      <div className={styles.danmuContent}>
      <div className={styles.danmuColumn}>
          <h2>弹幕内容</h2>
          <div className={styles.scrollableContent}>
            {danmuData.map((item) => (
              <DanmuItem key={item.vid} message={item} index={item.index}  formatGift= {false} />
            ))}
          </div>
        </div>

        <div className={styles.giftColumn}>
          <h2>礼物内容</h2>
          
          <div className={styles.scrollableContent} ref={giftContainerRef}>
          {danmuData.map((item) => (
            <DanmuGift 
              key={item.vid} 
              item={item} 
              index={item.index}
              formatGift={isLiveFormat}     
              onRender={handleGiftRender}
            />
          ))}
          </div>
        </div>


      </div>
    </div>
    );
  };
  
  export default Danmu;