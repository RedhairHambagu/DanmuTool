const nextConfig = {
    webpack: (config) => {
        // 添加对 .node 文件的处理
        config.module.rules.push({
            test: /\.node$/,
            use: 'node-loader',
        });

        // 设置模块解析的回退
        config.resolve.fallback = {
            fs: false, // 禁用 fs 模块
            // 其他需要的模块可以在这里添加
        };

        return config;
    },
};

module.exports = nextConfig;