
const { RedisStore } = require('../../index');

const config = {
  port: 8080,
  sessionOption: {
    appId: '',  //请填写自己的appId
    appSecret: '',  //请填写自己的appSecret
    loginPath: '/api/login',
    grant_type: 'authorization_code',
    maxAge: 3600,  //session 自动过期时间,单位:秒
    // store: new RedisStore({
    //   password: '000000',
    // }),
  },
};

module.exports = config;
