const url = require('url');
const crypto = require('crypto');
const _ = require('lodash');
const MemoryStore = require('./lib/memoryStore');
const redisStore = require('./lib/redisStore');
const login = require('./lib/login');
const constants = require('./lib/constants');
const WXBizDataCrypt = require('./lib/WXBizDataCrypt');


function sha1(message) {
  return crypto.createHash('sha1').update(message, 'utf8').digest('hex');
}

/**
 * 创建小程序会话中间件
 * @param {Object} [options]
 * @param {string} [options.appId] 小程序 appId
 * @param {string} [options.appSecret] 小程序 appSecret
 * @param {string} [options.loginPath] 小程序会话登录路径
 * @param {number} [options.maxAge] 会话有效期
 * @param {number} [options.coverTime] 延长回话有效期的时间
 * @param {Object} [options.store=MemoryStore] 会话使用的 Store
 */

function sessionMp(options = {}) {
  const requireOption = (key) => {
    if (!options[key]) {
      throw new Error(`mp-session 初始化失败：${key} 没有配置`);
    }
    return options[key];
  };
  const appId = requireOption('appId');
  const appSecret = requireOption('appSecret');
  const loginPath = requireOption('loginPath');

  const debug = !!options.debug;
  const store = options.store || new MemoryStore();
  if (typeof store.set !== 'function' || typeof store.get !== 'function') {
    throw new Error('session-mp-koa2 初始化失败：不是合法的 store');
  }
  const maxAge = options.maxAge || 3600;
  // sice v0.2.0
  // 用户连续操作室,是否自动延长 session 有效时间
  const coverTime = options.coverTime || 0;
  // since v0.3.0
  // 是否允许登录成功后, 传递给下一步.默认为否
  // 一般用于用户信息初始化,和向ctx.session中添加信息
  // 下一步处理函数中不可以使用ctx.body发送数据, 否则导致报错, 登录不成功
  const loginNext = !!options.loginNext;
  if (debug) {
    console.log('options of sessionMp:', {
      debug,
      appId,
      appSecret,
      loginPath,
      store,
      maxAge,
      coverTime,
      loginNext,
    });
  }


  return async function handle(ctx, next) {
    const getParam = (() => {
      const headers = {};
      const queries = {};
      for (const key of Object.keys(ctx.request.header)) {
        headers[key.toUpperCase()] = ctx.request.header[key];
      }
      const query = url.parse(ctx.request.url).query || '';
      for (const pair of query.split('&')) {
        const [key, value] = pair.split('=');
        if (key) {
          queries[key.toUpperCase()] = decodeURIComponent(value);
        }
      }
      return key => headers[key.toUpperCase()] || queries[key.toUpperCase()];
    })();

    const isLoginPath = url.parse(ctx.request.url).pathname === loginPath;
    const generateSkey = sessionKey => sha1(appId + appSecret + sessionKey);

    // session check
    const id = getParam(constants.WX_HEADER_ID);
    const skey = getParam(constants.WX_HEADER_SKEY);

    ctx.session = {};
    if (id && skey) {
      try {
        const sessionPms = store.get(id);
        const remainTimePms = store.ttl(id);
        const [session, remainTime] = await Promise.all([sessionPms, remainTimePms]);
        if (!session) {
          throw new Error('会话过期');
        }

        if (skey !== generateSkey(session.sessionKey)) {
          throw new Error('skey 不正确');
        }
        ctx.session = session;
        ctx.session.id = id;
        ctx.sessionRemainTime = remainTime;

        if (isLoginPath) {
          ctx.body = { code: 0, message: '小程序会话已登录' };
          return;
        }
      } catch (err) {
        const errObj = {
          [constants.WX_SESSION_MAGIC_ID]: 1,
          error: constants.ERR_INVALID_SESSION,
          message: `会话已失效，请重新登录：${err ? err.message : '未知错误'}`,
        };
        ctx.body = errObj;
        return;
      }
      // 保存原始的session数据
      const oldSession = _.cloneDeep(ctx.session);
      await next();

      const newSession = ctx.session;
      // 更新session
      if (!newSession || _.isEmpty(newSession)) {
        // 删除session
        await store.destroy(id).catch((e) => {
          throw e;
        });
        ctx.cookies.set(constants.WX_HEADER_ID, null);
        return;
      }
      // 有效时间小于coverTime, 重新设置maxAge
      if (coverTime > 0 && ctx.sessionRemainTime <= coverTime) {
        await store.set(newSession, { sid: id, maxAge });
      }
      // 不相等,覆盖
      if (!_.isEqual(oldSession, newSession)) {
        await store.set(newSession, { sid: id, maxAge });
      }

      return;
    }


    if (isLoginPath) {
      const requireHeader = (key) => {
        const header = getParam(key);
        if (!header) {
          throw new login.LoginError(`请求头里没有找到 ${key}，小程序客户端请配合 wafer-node-sdk 使用，请参考：https://github.com/tencentyun/wafer-node-sdk`);
        }
        return header;
      };

      let code = '';
      let encryptData = '';
      let iv = '';
      try {
        code = requireHeader(constants.WX_HEADER_CODE);
        encryptData = requireHeader(constants.WX_HEADER_ENCRYPTED_DATA);
        iv = requireHeader(constants.WX_HEADER_IV);
      } catch (error) {
        ctx.body = error;
        return;
      }

      try {
        const { sessionKey } = await login({ appId, appSecret, code });
        const wxBiz = new WXBizDataCrypt(appId, sessionKey);
        const userInfo = wxBiz.decryptData(encryptData, iv);

        ctx.session.id = crypto.randomBytes(32).toString('hex');
        ctx.session.skey = generateSkey(sessionKey);
        ctx.session.sessionKey = sessionKey;
        ctx.session.userInfo = userInfo;

        if (loginNext) {
          await next();
          await store.set(ctx.session, { sid: ctx.session.id, maxAge });
        } else {
          await store.set(ctx.session, { sid: ctx.session.id, maxAge });
        }
      } catch (e) {
        ctx.throw(500, e);
      }

      ctx.body = {
        [constants.WX_SESSION_MAGIC_ID]: 1,
        session: {
          id: ctx.session.id,
          skey: ctx.session.skey,
        },
      };
      return;
    }

    await next();
  };
}


module.exports = { sessionMp, redisStore };
