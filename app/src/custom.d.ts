declare module '*.module.scss' {
    const classes: { [key: string]: string };
    export default classes;
  }

  // 新增的 @yxim/nim-web-sdk 声明
declare module '@yxim/nim-web-sdk/dist/SDK/NIM_Web_SDK.js' {
    const NIM_SDK: any;
    export default NIM_SDK;
  }