# mp-session-koa2
微信小程序服务器端 处理来自微信小程序的登录请求并建立和维护会话,适用于koa2框架. 并支持向session中添加自定义字段.

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
  appId: '', // 小程序 appId, 必填
  appSecret: '', // 小程序 appSecret, 必填
  grant_type: 'authorization_code',
  loginPath: '/api/login', // 登录地址, 可以自定义自己的登录路径
  maxAge: 1 * 3600,  //自动过期时间, 单位秒
  store: null, //选填, 如果为空值, 默认储存在内存中, 数据过多有内存不足的风险.
};

const app = new Koa();

app.use(sessionMp(option));

app.use((ctx, next) => {
  if(ctx.session.userInfo){
    if (!ctx.session.userInfo.userId) {
      // 可以添加添加自定义数据 到session中
      // 该用户下一次访问时, session中将带有自定义的数据
      ctx.session.userInfo.userId = 'testId12345'
    }
    next();
  } else {
    ctx.throw(401,'未登录');
  }
})
// 测试是否能正常获取数据
app.use(async (ctx, next) => {
  const {pathname} = url.parse(ctx.request.url);
  if (pathname === '/api/test') {
    const { userInfo } = ctx.session;
    console.log(userInfo);
    ctx.body = { userInfo };
    return;
  }
})

// http服务
app.listen(8080, () => {
  console.log(`appService is listening at 8080`);
});

```

### 使用redis持久化
```javaScript
const { redisStore } = require('mp-session-koa2');


const option = {
  appId: '', // 小程序 appId, 必填
  appSecret: '', // 小程序 appSecret, 必填
  grant_type: 'authorization_code',
  loginPath: '/api/login', // 登录地址, 可以自定义自己的登录路径
  maxAge: 1 * 3600,  //自动过期时间, 单位秒
  store: new redisStore({
    port: 6379,          // Redis port
    host: '127.0.0.1',   // Redis host
    family: 4,           // 4 (IPv4) or 6 (IPv6)
    password: 'auth',
    db: 0
  }),
};
```
以上代码中的redisStore模块是redis数据库持久化模块,需要先安装redis数据.更详细的redisStore参数设置可以参考[ioredis](https://github.com/luin/ioredis).

store同时也支持其他兼容koa-session2模块的store.例如[koa-session2-mongodb](https://github.com/lihaizhong/koa-session2-mongodb).


## 客户端配合
与官方模块一样,客户端也需要[wafer-client-sdk](https://github.com/tencentyun/wafer-client-sdk)发起请求才能正常建立会话.具体用法请参考官方文档.


## 测试模型
test目录中有一个简易的测试模型.

客户端: 用小程序开发工具打开test/client目录.在工具中将appId修改为自己的值.

服务器端: 进入到test/server 目录后, npm install 安装依赖模块后, npm run dev, 启动服务器.
test/server/config 是服务器的配置参数. 其中appId和appSecret必须填写自己的值.
