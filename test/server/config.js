
const { RedisStore } = require('../../index');

const config = {
  port: 8080,
  sessionOption: {
    appId: 'wxf1dc939a9ea2b673',
    appSecret: '8f4d7702d2c32e727aa17330222a77c5',
    loginPath: '/api/login',
    grant_type: 'authorization_code',
    maxAge: 3600,  //session 自动过期时间,单位:秒
    // store: new RedisStore({
    //   password: '000000',
    // }),
  },
};

module.exports = config;
