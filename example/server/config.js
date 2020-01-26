
const fs = require('fs');
const yaml = require('js-yaml');
const { redisStore: RedisStore } = require('../../index');

let weappConf = {};
try {
  weappConf = yaml.safeLoad(fs.readFileSync('../appconf.yml', 'utf8'));
} catch (e) {
  console.warn('../appconf.yml is not exist');
}

const { app_id: appId, app_secret: appSecret } = weappConf;

const redis = weappConf.redis || {};

const config = {
  port: 8080,
  sessionOption: {
    appId, // 请填写自己的appId
    appSecret, // 请填写自己的appSecret
    loginPath: '/api/login',
    grant_type: 'authorization_code',
    maxAge: 15 * 60, // session 自动过期时间,单位:秒
    coverTime: 5 * 60, // 用户发起任何请求时,session有效时间<=coverTime时, 重新设置maxAge
    loginNext: true,
    store: new RedisStore({
      port: redis.port || 6379, // Redis port
      host: redis.host || '127.0.0.1', // Redis host
      family: redis.password || 4,     // 4 (IPv4) or 6 (IPv6)
      password: redis.password || '',
      db: redis.db || 0
    }),
  },
};

module.exports = config;
