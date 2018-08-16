const url = require('url');
const axios = require('axios');
const constants = require('./constants');

class LoginError extends Error {
  constructor(message, detail) {
    super(`登录小程序会话失败：${message}，请检查服务器及小程序的 AppId 和 AppSecret 是否正确配置`);
    this.type = constants.ERR_LOGIN_FAILED;
    this.detail = detail;
  }
}

function buildExchangeUrl(appid, secret, jsCode) {
  return url.format({
    protocol: 'https:',
    host: 'api.weixin.qq.com',
    pathname: '/sns/jscode2session',
    query: {
      appid,
      secret,
      js_code: jsCode,
      grant_type: 'authorization_code',
    },
  });
}

module.exports = async function login({ appId, appSecret, code }) {
  const exchangeUrl = buildExchangeUrl(appId, appSecret, code);
  const res = await axios.get(exchangeUrl, {
    responseType: 'json',
  }).catch((e) => {
    throw e;
  });
  if (res.data.errcode) {
    throw new LoginError('使用 jscode 从微信服务器换取 session_key 失败', res.data);
  }

  return {
    sessionKey: res.data.session_key,
    openId: res.data.openid,
  };
};

module.exports.LoginError = LoginError;
