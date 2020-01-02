const { randomBytes } = require('crypto');

class Store {
  constructor() {
    this.sessions = new Map();
    this.__timer = new Map();
    this.__timeStamp = new Map(); // 到期时间戳,单位秒
  }

  static getID(length) {
    return randomBytes(length).toString('hex');
  }

  get(sid) {
    if (!this.sessions.has(sid)) return undefined;
    // We are decoding data coming from our Store, so, we assume it was sanitized before storing
    return JSON.parse(this.sessions.get(sid));
  }

  ttl(sid) {
    const time = this.__timeStamp.get(sid) - parseInt(Date.now() / 1000, 10);
    return time;
  }

  set(session, { sid = this.getID(32), maxAge } = {}) {
    // Just a demo how to use maxAge and some cleanup
    if (this.sessions.has(sid) && this.__timer.has(sid)) {
      const __timeout = this.__timer.get(sid);
      if (__timeout) clearTimeout(__timeout);
    }

    if (maxAge) {
      this.__timer.set(sid, setTimeout(() => this.destroy(sid), maxAge * 1000));
      this.__timeStamp.set(sid, parseInt(Date.now() / 1000, 10) + maxAge, 10);
    }
    try {
      this.sessions.set(sid, JSON.stringify(session));
    } catch (err) {
      console.log('Set session error:', err);
    }
    return sid;
  }

  destroy(sid) {
    this.sessions.delete(sid);
    this.__timer.delete(sid);
  }
}

module.exports = Store;
