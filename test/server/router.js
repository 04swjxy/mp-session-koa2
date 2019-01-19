const Router = require('koa-router');
const router = new Router();

router.use((ctx, next) => {
  // console.log(ctx.session);
  if(ctx.session.userInfo){
    next();
  } else {
    // console.log('ctx.session is', ctx.session);
    ctx.throw(401,'未登录');
  }
})

router.get('/api/testData', (ctx, next) => {
    // 在session中添加 自定义参数
    // ctx.session.userInfo.userId = 'userIdTest123';
    ctx.body = { testData: '这是从服务器获取的测试数据 '};
});


module.exports = router;
