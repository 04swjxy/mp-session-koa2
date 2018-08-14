const Redis = require("ioredis");
const { Store } = require("koa-session2");

class RedisStore extends Store {
  constructor(key = 'SESSION') {
    super();
    this.redis = new Redis();
    this.key = key;
  }

  async get(sid, ctx) {
    let data = await this.redis.get(`${this.key}:${sid}`);
    return JSON.parse(data);
  }

  async set(session, { sid = this.getID(24), maxAge = 2 * 3600 } = {}, ctx) {
    try {
      // Use redis set EX to automatically drop expired sessions
      await this.redis.set(`${this.key}:${sid}`, JSON.stringify(session), 'EX', maxAge);
    } catch (e) {
      throw e;
    }
    return sid;
  }

  async destroy(sid, ctx) {
    return await this.redis.del(`${this.key}:${sid}`);
  }
}

module.exports = RedisStore;
