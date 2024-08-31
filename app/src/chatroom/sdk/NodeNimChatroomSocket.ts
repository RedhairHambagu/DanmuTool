import { ipcRenderer } from 'electron';
import { NodeNimLoginHandleChannel } from '../channelEnum';
import appKey from './appKey';
import { isWindowsArm } from '../../function/helper';
const path = require('path');




console.log('import node')

import type { NIMChatRoomEnterStep, ChatRoomInfo, ChatRoomMemberInfo, ChatRoomMessage } from 'node-nim';
import * as NodeNim from 'node-nim';


type OnMessage = (t: NodeNimChatroomSocket, event: Array<ChatRoomMessage>) => void | Promise<void>;

/* 网易云信C++ sdk的socket连接 */
class NodeNimChatroomSocket {
  #nodeNim: typeof NodeNim | undefined = undefined;
  public account: string;
  public token: string;
  public roomId: number;
  public appDataDir: string;
  public chatroomRequestLoginResult!: string;
  public chatroom: NodeNim.ChatRoom | undefined;
  public onMessage?: OnMessage;

  constructor(account: string, token: string, roomId: number, appDataDir: string, onMessage?: OnMessage) {
    if (!isWindowsArm) {
      try{
        const nodeNim: { default: typeof NodeNim } | typeof NodeNim = globalThis.require('node-nim');

        this.#nodeNim = 'default' in nodeNim ? nodeNim.default : nodeNim;
            console.log('nodeNichatroomsocket: NodeNim 模块加载成功');
      } catch (error){
        console.error('nodeNichatroomsocket: NodeNim 模块加载失败:', error);
      }
     
    }

    this.account = account; // 账号
    this.token = token;     // token
    this.roomId = roomId;   // 房间id
    this.appDataDir = path.join(appDataDir, account); // app数据目录
    this.onMessage = onMessage;
  }

  // chatroom初始化
  chatroomInit(): Promise<void> {
    return new Promise((resolve: Function, reject: Function): void => {
      this.chatroom = new this.#nodeNim!.ChatRoom();
      this.chatroom.init('', '');
      this.chatroom.initEventHandlers();

      this.chatroom.on('enter', (
        rid: number,
        status: NIMChatRoomEnterStep,
        status2: number,
        roomInfo: ChatRoomInfo,
        myInfo: ChatRoomMemberInfo
      ): void => {
        console.log('Chatroom连接状态：', status, status2);

        if (status === 5 && status2 === 200) {
          console.log('Chatroom连接成功', roomInfo);

          if (this.onMessage) {
            this.chatroom!.on('receiveMsg', (n: number, msg: ChatRoomMessage): void => {
              this.onMessage!(this, [msg]);
            });
          }

          resolve();
        }
      });

      this.chatroom.enter(this.roomId, this.chatroomRequestLoginResult, {}, '');
    });
  }

  async init(): Promise<boolean> {
    try {
      if (!this.#nodeNim) {
        console.error('NodeNim 未加载');
        return false;
      }

      console.log('正在调用 NodeNimLogin...');
      let chatroomRequestLoginResult: string | null;
      try {
        chatroomRequestLoginResult = await ipcRenderer.invoke(NodeNimLoginHandleChannel.NodeNimLogin, {
          appKey,
          account: this.account,
          token: this.token,
          appDataDir: this.appDataDir,
          roomId: this.roomId
        });
      } catch (error) {
        console.error('NodeNimLogin 调用失败:', error);
        return false;
      }

    console.log('获取Chatroom登录结果: ', chatroomRequestLoginResult);

    if (!chatroomRequestLoginResult) {
      console.error('未能获取Chatroom登录结果');
      return false;
    }

    this.chatroomRequestLoginResult = chatroomRequestLoginResult;
    console.log('正在初始化聊天室...');
    await this.chatroomInit();
    console.log('聊天室初始化完成');
    return true;
    return true;
  } catch (error) {
    console.error('初始化过程中发生错误:', error);
    return false;
  }
}

  exit(): void {
    if (this.chatroom) {
      this.chatroom.exit(this.roomId, '');
      this.chatroom.cleanup('');
    }
  }

  async clean(): Promise<void> {
    await ipcRenderer.invoke(NodeNimLoginHandleChannel.NodeNimClean, {
      appDataDir: this.appDataDir
    });
  }

  async getHistoryMessage(timeTag?: number): Promise<Array<ChatRoomMessage> | undefined> {
    if (!this.chatroom || isWindowsArm) return;

    const result: [number, number, Array<ChatRoomMessage>] = await this.chatroom.getMessageHistoryOnlineAsync(
      this.roomId, {
        start_timetag_: timeTag,
        limit_: 20
      }, null, '');

    return result[2];
  }
}

export default NodeNimChatroomSocket;