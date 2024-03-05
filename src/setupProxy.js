const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/download',  // 指定要代理的请求路径
    createProxyMiddleware({
      target: 'http://testing.heyshare.cn',  // 指定目标服务器的地址
      changeOrigin: true,  // 将请求头中的 host 设置为 target
    //   pathRewrite: {  // 重写请求路径，可选
    //     '^/api': '',  // 将 /api 开头的路径替换为空
    //   },
    })
  );
};