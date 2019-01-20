const Router = require('koa-router');
const router = new Router();

router.use((ctx, next) => {
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

router.get('/api/testData', (ctx, next) => {
  console.log(ctx.session.userInfo);
  ctx.body = { testData: '这是从服务器获取的测试数据 '};
});


module.exports = router;
