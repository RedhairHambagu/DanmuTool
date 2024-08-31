import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import yaml from 'js-yaml';
import fetch from 'node-fetch';
import { nodeNimHandleLogin, nodeNimCleanup } from './ipcHandle/nodeNimHandleLogin.mjs';
import axios  from 'axios';
import { isDevEnvironment } from './utils.mjs';


console.log('应用启动，当前环境:', isDevEnvironment ? '开发环境' : '生产环境');



// 在创建窗口之前
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 获取应用数据目录
const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, '/config.yaml');
const preloadPath = path.join(__dirname, 'preload.js');
console.log('Preload path:', preloadPath); // 添加这行来打印路径


let mainWindow;
let danmuWindow;
let danmuParamsHandler;

if (process.platform === 'win32') {
  process.env.ELECTRON_FORCE_CONSOLE_ENCODING = 'utf-8';
}

function ensureConfigFile() {
  console.log('确保配置文件存在');
  if (!fs.existsSync(configPath)) {
    const devConfigPath = path.join(__dirname, 'config.yaml');
    console.log('开发环境配置文件路径:', devConfigPath);
    if (fs.existsSync(devConfigPath)) {
      console.log('未找到配置文件，正在复制');
      // 复制开发环境的配置文件
      fs.copyFileSync(devConfigPath, configPath);
    } else {
      // 创建默认配置
      const defaultConfig = {
        // 设置默认配置
        version: '1.0',
        settings: {}
      };
      console.log('未找到配置文件，正在创建默认配置');
      fs.writeFileSync(configPath, yaml.dump(defaultConfig), 'utf8');
    }
  } else {
    console.log('配置文件已存在');
  }
}

// 读取配置
function loadConfig() {
  ensureConfigFile();
  console.log('read config: ', configPath)
  const fileContents = fs.readFileSync(configPath, 'utf8');
  return yaml.load(fileContents);
}

// 保存配置
function saveConfig(config) {
  const yamlStr = yaml.dump(config);
  fs.writeFileSync(configPath, yamlStr, 'utf8');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('加载开发环境 URL');
    mainWindow.loadURL('http://localhost:3000');
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('加载生产环境文件:', indexPath);
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('加载 index.html 失败:', err);
    });
  }
  mainWindow.webContents.openDevTools();


  mainWindow.webContents.on('did-finish-load', () => {
    console.log('页面加载完成，URL:', mainWindow.webContents.getURL());
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('页面加载失败:', errorCode, errorDescription);
  });

    // 添加窗口关闭事件监听器
    mainWindow.on('closed', () => {
      mainWindow = null;
      app.quit()
    });
}


app.whenReady().then(() => {
    ensureConfigFile();
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
    }
  });
    // 注册 get-danmu-params 处理程序
    if (!danmuParamsHandler) {
      danmuParamsHandler = (event) => {
        console.log('收到 get-danmu-params 请求');
        return danmuWindow?.webContents.danmuParams || null;
      };
      ipcMain.handle('get-danmu-params', danmuParamsHandler);
    }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.on('render-process-gone', (event, webContents, details) => {
  console.error('渲染进程崩溃:', details);
});

app.on('child-process-gone', (event, details) => {
  console.error('子进程崩溃:', details);
});


ipcMain.handle('get-base-path', () => {
  return basePath;
});

ipcMain.handle('load-config', () => {
  try {
    return loadConfig();
  } catch (error) {
    console.error('加载配置时出错:', error);
    return {};
  }
});

ipcMain.on('save-config', (event, newConfig) => {
  try {
    saveConfig(newConfig);
    console.log('保存的配置:', newConfig);
  } catch (error) {
    console.error('保存配置时出错:', error);
  }
});

ipcMain.on('open-danmu-window', (event, { accid, pwd, roomId, appDataDir }) => {
  danmuWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  let url;
  if (process.env.NODE_ENV === 'development') {
    url = 'http://localhost:3000/#/danmu';
  } else {
    url = `file://${path.join(__dirname, '../dist/index.html')}#/danmu`;
  }
  
  if (!isDevEnvironment) {
    process.env.NODE_NIM_PATH = path.join(process.resourcesPath, 'sdk/lib');
  }
  danmuWindow.loadURL(url);
  danmuWindow.webContents.openDevTools();

  // 使用 IPC 发送参数
  danmuWindow.webContents.on('did-finish-load', () => {
    danmuWindow.webContents.danmuParams = { accid, pwd, roomId, appDataDir };
    danmuWindow.webContents.send('danmu-params', { accid, pwd, roomId, appDataDir });
  
  });

  try {
    console.log('尝试执行 nodeNimHandleLogin');
    nodeNimHandleLogin();
    console.log('nodeNimHandleLogin 执行成功');
  } catch (error) {
    console.error('nodeNimHandleLogin 错误:', error);
  }

//     // 添加新的 IPC 处理程序
// ipcMain.handle('get-danmu-params', (event) => {
//   // 返回存储的参数
//     console.log('收到 get-danmu-params 请求');
//     return danmuWindow?.webContents.danmuParams || null;
// });

  // 添加窗口关闭事件监听器
  danmuWindow.on('closed', () => {
    danmuWindow = null;
  });
});

ipcMain.handle('get-live-list', async (event, headers) => {
  try {
    const body = {
      "groupId" : 0,
      "debug" : false,
      "next" : 0,
      "record" : false
    }

    const response = await axios.post('https://pocketapi.48.cn/live/api/v1/live/getOpenLiveList', JSON.stringify(body), {
      headers: headers,
      timeout: 10000 // 设置10秒超时
    });
    if (response.status === 200 && response.data && response.data.content) {
      console.log("响应数据:", JSON.stringify(response.data.content));
      return response.data.content;
    } else {
      throw new Error(`请求失败: ${response.status}`);
    }

  } catch (error) {
    console.error('获取直播列表时出错:', error);
    return [];
  }
});

ipcMain.handle('get-live-detail', async (event, liveId,headers) => {
  try {
    const body = {
      "liveId" : liveId
    }

    const response = await axios.post('https://pocketapi.48.cn/live/api/v1/live/getOpenLiveOne', body, {
      headers: headers,
      timeout: 10000 // 设置10秒超时
    });
    if (response.status === 200 && response.data && response.data.content) {
      console.log("响应数据:", JSON.stringify(response.data.content));
      return response.data.content;
    } else {
      throw new Error(`请求失败: ${response.status}`);
    }
  } catch (error) {
    console.error('获取直播列表时出错:', error);
    return [];
  }
});



ipcMain.handle('get-memberlive-list', async (event, headers) => {
  try {
    const body = {
      "groupId": 0,
      "debug": true,
      "next": 0,
      "record": false
    };

    const response = await axios.post('https://pocketapi.48.cn/live/api/v1/live/getLiveList', body, {
      headers: headers,
      timeout: 10000 // 设置10秒超时
    });

    if (response.status === 200 && response.data && response.data.content) {
      console.log("响应数据:", JSON.stringify(response.data.content));
      return response.data.content;
    } else {
      throw new Error(`请求失败: ${response.status}`);
    }

  } catch (error) {
    console.error('获取直播列表时出错:', error);
    return [];
  }
});

ipcMain.handle('get-memberlive-detail', async (event, liveId, headers) => {
  try {
    const body = {
      "liveId": liveId
    };
    console.log("headers:", headers);

    const response = await axios.post('https://pocketapi.48.cn/live/api/v1/live/getLiveOne', body, {
      headers: headers,
      timeout: 10000 // 设置10秒超时
    });

    if (response.status === 200 && response.data && response.data.content) {
      console.log("响应数据:", JSON.stringify(response.data.content));
      return response.data.content;
    } else {
      throw new Error(`请求失败: ${response.status}`);
    }

  } catch (error) {
    console.error('获取直播明细时出错:', error);
    return [];
  }
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  // 可以在这里添加错误报告逻辑
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
  // 可以在这里添加错误报告逻辑
});

ipcMain.on('get-app-path', (event) => {
  event.returnValue = app.getAppPath();
});

ipcMain.on('get-resources-path', (event) => {
  event.returnValue = process.resourcesPath;
});