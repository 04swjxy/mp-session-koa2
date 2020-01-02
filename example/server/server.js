// 启动httpService
const Koa = require('koa');
const { sessionMp } = require('../../index');
const router = require('./router');
const config = require('./config');



const app = new Koa();
// 统一错误错误, 必须放在中间件的第一个位置
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = err.message;
    if (ctx.status >= 500) {
      console.error(err);
    }
  }
});

app.use(sessionMp(config.sessionOption));

app.use(router.routes());
app.use(router.allowedMethods());

// http服务
app.listen(config.port, () => {
  console.log(`appService is listening at ${config.port}`);
});
