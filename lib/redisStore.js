const Redis = require('ioredis');

class RedisStore {
  constructor() {
    this.redis = new Redis(arguments[0], arguments[1], arguments[2]);
    this.key = 'session';
  }

  async setKey(key) {
    if (typeof (key) === 'string') {
      this.key = key;
    } else {
      throw new TypeError('key muse be string');
    }
  }

  async get(sid) {
    const data = await this.redis.get(`${this.key}:${sid}`);
    return JSON.parse(data);
  }

  async set(session, { sid = this.getID(24), maxAge = 2 * 3600 } = {}) {
    try {
      // Use redis set EX to automatically drop expired sessions
      await this.redis.set(`${this.key}:${sid}`, JSON.stringify(session), 'EX', maxAge);
    } catch (e) {
      throw e;
    }
    return sid;
  }

  async destroy(sid) {
    await this.redis.del(`${this.key}:${sid}`);
  }
}

module.exports = RedisStore;
