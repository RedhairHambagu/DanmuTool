import React from 'react';
import dynamic from 'next/dynamic';

const App = dynamic(() => import('../App'), { ssr: false });

const Home = () => {
    return (
        <div>
            <h1>Danmu Tool</h1>
            <App/>
            <div>
                <span><br/>使用说明：<br/></span>
                <span>  1. accid和pwd 非口袋账号的账户和密码<br/></span>
                <span>  2. token为口袋账户登录的token，获取直播清单使用，打开聊天室弹幕不会用到token<br/></span>
                <span>  3. SNH公演直播roomid为3869841， xyyz直播roomid为3868298<br/></span>
            </div>
        </div>
    );
};

export async function getServerSideProps() {
    const nodeNim = await import('node-nim'); // 仅在服务器端导入
    // 使用 nodeNim 进行操作
    return { props: {} };
}

export default Home;