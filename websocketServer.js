const WebSocket = require('ws');
const fetch = require('node-fetch');  // 需要安装 node-fetch 来进行 HTTP 请求
const NodeNim = require('node-nim');
const {chatroom} = require("node-nim");
const port = process.env.PORT || 9250;

// 检查是否已有 WebSocket 服务器运行，避免重复启动
if (!global.wss) {
  const wss = new WebSocket.Server({ port: 8080 });
  console.log('WebSocket 服务器已启动，监听 ws://localhost:8080');

  wss.on('connection', (ws) => {
    console.log('新客户端连接');

    ws.on('message', async (message) => {
        console.log('处理登录请求');
        const data = JSON.parse(message);
        console.log(data)
        if (data.action === 'login') {
            console.log('进入login')
          try {
            console.log('开始调用nimLogin API');
            const response = await fetch(`http://localhost:${port}/api/nimLogin`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                appKey: data.appKey,
                account: data.account,
                token: data.token,
                roomId: data.roomId,
                appDataDir: data.appDataDir,
              }),
            });
            // console.log(response)
            const loginResult = await response.json();
            console.log('loginResult', loginResult);
            if (!loginResult.success) {
              return ws.send(JSON.stringify({ action: 'loginError', error: loginResult.error }));
            }
      
            const chatroomRequestLoginResult = loginResult.roomEnterResult;
            console.log('chatroomRequestLoginResult', chatroomRequestLoginResult);
            ws.send(JSON.stringify({ action: 'loginSuccess', result: chatroomRequestLoginResult }));
            
            // Chatroom initialization
            const chatroom = new NodeNim.ChatRoom();
            chatroom.init('', '');
            chatroom.initEventHandlers();
      
            chatroom.on('enter', (rid, status, status2, roomInfo, myInfo) => {
              console.log('Chatroom连接状态：', status, status2);
              if (status === 5 && status2 === 200) {
                console.log('Chatroom连接成功', roomInfo);
                ws.send(JSON.stringify({ action: 'chatroomConnected', message:roomInfo }));

              }
            });
      
            chatroom.enter(data.roomId, chatroomRequestLoginResult, {}, '');
            // 监听聊天室中的消息，并通过 WebSocket 将消息发送给客户端
            chatroom.on('receiveMsg', (n, msg) => {
              console.log('收到聊天室消息:', msg);
              try {
                ws.send(JSON.stringify({
                  action: 'receiveMsg',
                  message: msg
                }));
                console.log('消息已通过 WebSocket 发送'); // 确认消息发送成功
              } catch (error) {
                console.error('消息发送失败:', error); // 检查是否有错误
              }
            });
            } catch (error) {
            console.log('error', error);
            ws.send(JSON.stringify({ action: 'loginError', error: error.message }));
          }
        }

      
      console.log('initChatroom 处理聊天室')
      // 处理聊天室初始化请求
      if (data.action === 'initChatroom') {
        console.log(`初始化聊天室: ${data.roomId}`);
        const roomInfo = {
          roomId: data.roomId,
          // 其他聊天室信息
        };
        ws.send(JSON.stringify({
          action: 'chatroomConnected',
          roomInfo: roomInfo,
          message: '聊天室连接成功',
        }));
      }
      
      ws.on('close', () => {
          chatroom.exit(data.roomId,'');
        chatroom.cleanup('');
        console.log('客户端断开连接');
      });
    });
  });
  // 将 wss 存储在 global 对象上，避免重复初始化
  global.wss = wss;
}

module.exports = (req, res) => {
  res.status(200).json({ message: 'WebSocket 服务器正在运行' });
};
