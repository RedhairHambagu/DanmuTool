import React, {
  useEffect,
    useState,
    useRef,
    useLayoutEffect,
    type Dispatch as D,
    type SetStateAction as S,
    type MutableRefObject,
  } from 'react';
import { GiftTwoTone as IconGiftTwoTone } from '@ant-design/icons';
import classNames from 'classnames';
import type {
  LiveRoomMessage,
  LiveRoomTextMessage,
  LiveRoomGiftInfoCustom,
  LiveRoomTextCustom,
  CppLiveRoomBasicEvent
} from './messageType';
import styles from './DanmuGift.module.scss';
import { Table } from 'antd';


function isLiveRoomTextCustom(item: CppLiveRoomBasicEvent, custom: LiveRoomTextCustom | LiveRoomGiftInfoCustom): custom is LiveRoomTextCustom {
  return item.msg_type_ === 0 || custom.messageType === 'BARRAGE_MEMBER' || custom.messageType === 'BARRAGE_NORMAL';
}


interface DanmuGiftProps {
  item: CppLiveRoomBasicEvent;
  index: number;
  formatGift: boolean;
  onRender: (element: HTMLElement | null, index: number) => void;
}

const DanmuGift: React.FC<DanmuGiftProps> = (props: DanmuGiftProps) => {
  const { item, index, formatGift, onRender}: DanmuGiftProps = props;
  const [height, setHeight]: [number, D<S<number>>] = useState(26);
  const custom: LiveRoomTextCustom | LiveRoomGiftInfoCustom = JSON.parse(item.msg_setting_!.ext_!);
  // console.log(formatGift)
  const containerRef = useRef<HTMLDivElement>(null);
  const renderRef = useRef(onRender);

  useLayoutEffect(() => {
    renderRef.current = onRender;
  }, [onRender]);

  useLayoutEffect(() => {
    if (!isLiveRoomTextCustom(item, custom) && formatGift && containerRef.current) {
      const isFloatDanmu: boolean = custom.giftInfo.giftId === 266592609913094144;
      if (!isFloatDanmu) {
        renderRef.current(containerRef.current, index);
      } else {
        renderRef.current(null, index);
      }
    }
  }, [item, custom, formatGift, index]);

  if (isLiveRoomTextCustom(item, custom)) {
    return null;
  }

  const tpNum: number = Number(custom.giftInfo.tpNum);
  const isFloatDanmu: boolean = custom.giftInfo.giftId === 266592609913094144;

  if (isFloatDanmu) {
    return null;
  }

  if (formatGift) {
    return (
      <div
        ref={containerRef}
        className={styles.giftMessageContainer}
        data-gift-index={index}
      >
        <Table
          size="small"
          pagination={false}
          showHeader={false}
          className={styles.giftTable}
          columns={[
            { dataIndex: 'nickName', key: 'nickName' },
            { dataIndex: 'idol', key: 'idol' },
            { dataIndex: 'giftName', key: 'giftName' },
            { dataIndex: 'giftNum', key: 'giftNum' },
            { dataIndex: 'tp', key: 'tp' },
          ]}
          dataSource={[{
            key: index,
            nickName: custom.user.nickName,
            idol: custom.giftInfo.acceptUser.userName,
            giftName: custom.giftInfo.giftName,
            giftNum: custom.giftInfo.giftNum,
            tp: tpNum > 0 ? `(${tpNum})` : null,
          }]}
        />
      </div>
    );
  } else {
    return (
      <div
        className={styles.giftMessageContainer}
        style={{ height }}
        data-index={index}
      >
        <div className={styles.giftMessageContent}>
          <IconGiftTwoTone className="mr-[3px] text-[22px] align-[-5px]" />
          {custom.user.nickName}
          &nbsp;送给&nbsp;
          {custom.giftInfo.acceptUser.userName}&nbsp;
          {custom.giftInfo.giftNum}个
          {custom.giftInfo.giftName}
          {tpNum > 0 ? `(${tpNum})` : null}。
        </div>
      </div>
    );
  }
};

export default React.memo(DanmuGift);