# mp-session-koa2
微信小程序服务器端 处理来自微信小程序的登录请求并建立和维护会话,适用于koa2框架.

## 说明
该模块是根据微信小程序官方服务器端session模块[wafer-node-session](https://github.com/tencentyun/wafer-node-session)并结[koa-session2](https://github.com/Secbone/koa-session2)模块合修改而来.
由于官方wafer-node-session只支持express框架.通过修改后,本模块支持koa2框架.


## 获取和安装
```
npm install mp-session-koa2
```

## Usage
用法与官方wafer-node-session模块基本一致.
```javaScript
const Koa = require('koa');
const { sessionMp } = require('mp-session-koa2');

const option = {
  appId: '...', // 小程序 appId
  appSecret: '...', // 小程序 appSecret
  grant_type: 'authorization_code',
  loginPath: '/api/login', // 登录地址
  maxAge: 1 * 3600,  //自动过期时间
};

const session = sessionMp(option);

const app = new Koa();
app.use(session);
app.use('/me', function(ctx){
  if(ctx.session){
    // do somethings
    ctx.body = ctx.session.userInfo;
  } else {
    ctx.throw(401,'未登录');
  }
})



app.listen(3000);

```

### 持久化
```javaScript
const { redisStore } = require('mp-session-koa2');

const option = {
  appId: '...', // 小程序 appId
  appSecret: '...', // 小程序 appSecret
  grant_type: 'authorization_code',
  loginPath: '/api/login', // 登录地址
  maxAge: 1 * 3600,  //自动过期时间
  store: new redisStore(),
};
```
以上代码中的redisStore模块是redis数据库持久化模块,源代码来自[koa-session2](https://github.com/Secbone/koa-session2)模块.
同时也支持其他兼容koa-session2模块的store.例如[koa-session2-mongodb](https://github.com/lihaizhong/koa-session2-mongodb).


## 客户端配合
与官方模块一样,客户端也需要[wafer-client-sdk](https://github.com/tencentyun/wafer-client-sdk)发起请求才能正常建立会话.具体用法请参考官方文档.
