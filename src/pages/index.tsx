import React from 'react';
import App from '../App'; // 根据需要调整路径

const Home = () => {
    return (
        <div>
            <h1>Welcome to Next.js!</h1>
            <App />
        </div>
    );
};

export async function getServerSideProps() {
    const nodeNim = await import('node-nim'); // 仅在服务器端导入
    // 使用 nodeNim 进行操作
    return { props: {} };
}

export default Home;