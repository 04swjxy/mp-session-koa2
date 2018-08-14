const url = require('url');
const crypto = require('crypto');
// const pify = require('pify');
const MemoryStore = require('koa-session2').Store;
const _ = require('lodash');
const login = require('./lib/login');
const constants = require('./lib/constants');
const WXBizDataCrypt = require('./lib/WXBizDataCrypt');
const redisStore = require('./lib/redisStore');


function sha1(message) {
  return crypto.createHash('sha1').update(message, 'utf8').digest('hex');
}

/**
 * 创建小程序会话中间件
 * @param {Object} [options]
 * @param {string} [options.appId] 小程序 appId
 * @param {string} [options.appSecret] 小程序 appSecret
 * @param {string} [options.loginPath] 小程序会话登录路径
 * @param {string} [options.maxAge] 会话有效期
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

  const store = options.store || new MemoryStore();
  if (store) {
    if (typeof store.set !== 'function' || typeof store.get !== 'function') {
      throw new Error('wafer-node-session 初始化失败：不是合法的 store');
    }
  }


  return async function handle(ctx, next) {
    // console.log('sessionHandle ctx.url', ctx.url);
    // console.log('ctx.request', ctx.request);
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
        // const session = await pify(store.get.bind(store))(id, ctx);
        const session = await Promise.resolve(store.get(id, ctx)).catch((e) => {
          throw e;
        });
        if (!session) {
          throw new Error('会话过期');
        }

        if (skey !== generateSkey(session.sessionKey)) {
          throw new Error('skey 不正确');
        }
        ctx.session = session;
        ctx.session.id = id;

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
      }

      const oldSession = _.cloneDeep(ctx.session);
      await next();

      const newSession = ctx.session;
      if (_.isEqual(oldSession, newSession)) return;

      if (!newSession || _.isEmpty(newSession)) {
        await Promise.resolve(store.destroy(id, ctx)).catch((e) => {
          throw e;
        });
        ctx.cookies.set(constants.WX_HEADER_ID, null);
        return;
      }
      // set/update session
      const ops = Object.assign({}, options, { sid: id });
      const sid = await Promise.resolve(store.set(ctx.session, ops, ctx));
      ctx.cookies.set(constants.WX_HEADER_ID, sid, options);
      return;
    }


    if (isLoginPath) {
      // console.log('isLoginPath:', isLoginPath);
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

      // const session = {};
      try {
        const { sessionKey, openId } = await login({ appId, appSecret, code });

        const wxBiz = new WXBizDataCrypt(appId, sessionKey);
        const userInfo = wxBiz.decryptData(encryptData, iv);

        ctx.session.id = crypto.randomBytes(32).toString('hex');
        ctx.session.skey = generateSkey(sessionKey);
        ctx.session.sessionKey = sessionKey;
        ctx.session.openId = openId;
        ctx.session.userInfo = userInfo;
        // ctx.session = session;
        // session.cookie = new Cookie({ maxAge }); // fake cookie to support express-session Stores
      } catch (e) {
        ctx.throw(500, e);
      }
      // save the session
      const maxAge = options.maxAge || 5 * 3600;
      // await pify(store.set.bind(store))(session, { sid: ctx.session.id, maxAge })
      await Promise.resolve(store.set(ctx.session, { sid: ctx.session.id, maxAge }))
        .catch((e) => {
          ctx.throw(500, e);
        });

      // console.log('ctx.session', ctx.session);
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


module.exports = {sessionMp , redisStore};
