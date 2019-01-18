// 启动httpService
const Koa = require('koa');
const Router = require('koa-router');
// const axios = require('axios');
const _ = require('lodash');
const config = require('./config');

const { sessionMp } = require('../../index');

const router = new Router();
router.get('/api/userInfo', (ctx, next) => {
  if(ctx.session){
    // do somethings
    ctx.body = ctx.session.userInfo;
    return;
  } else {
    ctx.throw(401,'未登录');
  }
});

const option = Object.assign({
  grant_type: 'authorization_code',
}, config.sessionOption);


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

app.use(sessionMp(option));

app.use(router.routes())
app.use(router.allowedMethods());

//http服务
app.listen(config.port, () => {
  console.log(`appService is listening at ${config.port}`);
});
