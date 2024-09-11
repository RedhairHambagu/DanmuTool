import appKey from './appKey';
import path from 'path';
import * as NodeNim from 'node-nim';

type OnMessage = (socket: NodeNimChatroomSocket, event: Array<NodeNim.ChatRoomMessage>) => void | Promise<void>;

class NodeNimChatroomSocket {
    public account: string;
    public token: string;
    public roomId: number;
    public appDataDir: string;
    public chatroomRequestLoginResult!: string;
    public onMessage?: OnMessage;
    private websocket: WebSocket | null = null;

    constructor(account: string, token: string, roomId: number, appDataDir: string, onMessage?: OnMessage) {
        this.account = account;
        this.token = token;
        this.roomId = roomId;
        this.appDataDir = path.join(appDataDir, account);
        this.onMessage = onMessage;
    }

    private initWebSocket() {
        const url = `ws://localhost:8080`; // 替换为实际的 WebSocket URL
        this.websocket = new WebSocket(url);

        this.websocket.onopen = () => {
            console.log('WebSocket 连接已建立');
            this.websocket?.send(JSON.stringify({
                action: 'login',
                appKey: appKey,
                account: this.account,
                token: this.token,
                roomId: this.roomId,
                appDataDir: this.appDataDir,
            }));
        };

        this.websocket.onmessage = (event) => {
            console.log('收到来自 WebSocket 的消息:', event.data);  // 检查收到的消息

            try {
                const message = JSON.parse(event.data);

                if (message.action === 'chatroomConnected') {
                    const modifiedMessage = {
                        ...message.message,
                        msg_type_: 0, // 添加msg_type_为0
                    };
                    console.log(modifiedMessage)

                    // if (this.onMessage) {
                    //     this.onMessage(this, [modifiedMessage]);
                    // }
                } else {
                    // 其他action直接传递message.message
                    if (this.onMessage) {
                        this.onMessage(this, [message.message]);
                    }
                }
            } catch (error) {
                console.error('处理消息时发生错误:', error);
            }
        };

        this.websocket.onclose = () => {
            console.log('WebSocket 连接已关闭');
        };

        this.websocket.onerror = (error) => {
            console.error('WebSocket 发生错误:', error);
        };
    }

    async init(): Promise<boolean> {
        try {
            console.log('init nodenimchatroomsocket')
            this.initWebSocket();
            return true;
        } catch (error) {
            console.error('初始化过程中发生错误:', error);
            return false;
        }
    }

    exit(): void {
        if (this.websocket) {
            this.websocket.close();
        }
    }
}

export default NodeNimChatroomSocket;