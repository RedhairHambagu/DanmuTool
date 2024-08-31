import { createRequire } from 'node:module';
import * as process from 'node:process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export const isDevEnvironment = process.env.NODE_ENV === 'development';


export const isWindowsArm = process.platform === 'win32' && process.arch === 'arm64';
export const require = createRequire(import.meta.url);

export function getNodeNimPath() {
    if (isDevEnvironment) {
      // 开发环境下，直接返回 null，让 Node.js 的模块系统去查找
      return null;
    }
  console.log('bin')
    const possiblePaths = [
        path.join(app.getAppPath(), '../app.asar.unpacked/node_modules/node-nim/sdk/lib/node-nim.node'),
        path.join(process.resourcesPath, 'app.asar.unpacked/node_modules/node-nim/sdk/lib/node-nim.node'),
        path.join(app.getAppPath(), 'node_modules/node-nim/sdk/lib/node-nim.node'),
        path.join(process.resourcesPath, 'sdk/lib/node-nim.node'),
        path.join(process.resourcesPath, 'node_modules/node-nim/sdk/lib/node-nim.node')
      ];
    
  
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        console.log('找到 node-nim.node 文件:', p);
        return p;
      }
    }
  
    console.error('未找到 node-nim.node 文件，尝试过的路径:', possiblePaths);
    return null;
  }