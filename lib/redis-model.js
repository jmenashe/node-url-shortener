import redis from 'redis';
import base58 from 'base58';
import crypto from 'crypto';

const RedisModel = function (config, client) {
  if (config === null && client) {
    this.db = client;
  } else {
    const options = {
      host: config.host,
      port: config.port,
      db: config.db
    };

    this.db = redis.createClient(options);

    if (config.pass) {
      this.db.auth(config.pass);
    }
  }
};
    export default RedisModel;

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min)) + min;

// General prefix
RedisModel._prefix_ = 'nus:';

// Keys

// nus:counter
RedisModel.prototype.kCounter = () => `${RedisModel._prefix_}counter`;

// nus:url:<long_url> <short_url>
RedisModel.prototype.kUrl = function (url) {
  return `${RedisModel._prefix_}url:${this.md5(url)}`;
};

// nus:hash:<id> url <long_url>
// nus:hash:<id> hash <short_url>
// nus:hash:<id> clicks <clicks>
RedisModel.prototype.kHash = hash => `${RedisModel._prefix_}hash:${hash}`;

// Helpers
RedisModel.prototype.md5 = url => crypto.createHash('md5').update(url).digest('hex');

// Main methods
RedisModel.prototype.uniqId = function (callback) {
  this.db.incr(this.kCounter(), (err, reply) => {
    const hash = base58.encode(getRandomInt(9999, 999999) + reply.toString());
    if (typeof callback === 'function') {
      callback(err, hash);
    }
  });
};

RedisModel.prototype.findUrl = function (long_url, callback) {
  this.db.get(this.kUrl(long_url), (err, reply) => {
    if (typeof callback === 'function') {
      callback(err, reply);
    }
  });
};

RedisModel.prototype.findHash = function (short_url, callback) {
  this.db.hgetall(this.kHash(short_url), (err, reply) => {
    if (typeof callback === 'function') {
      callback(err, reply);
    }
  });
};

RedisModel.prototype.clickLink = function (short_url, callback) {
  this.db.hincrby(this.kHash(short_url), 'clicks', 1, (err, reply) => {
    if (typeof callback === 'function') {
      callback(err, reply);
    }
  });
};

String.prototype.boolean = str => "true" == str;

// Set record
RedisModel.prototype.set = function(long_url, {start_date, end_date}, cNew, callback) {
  const self = this;
  this.findUrl(long_url, (err, reply) => {
    if (err) {
      callback(500);
      self.db.quit();
    } else if (reply && cNew == 'false') {
      callback(null, {
        'hash' : reply,
        'long_url' : long_url
      });
      self.db.quit();
    } else {
      self.uniqId((err, hash) => {
        if (err) {
          callback(500);
          self.db.quit();
        } else {
          const response = {
                'hash'     : hash,
                'long_url' : long_url
              };

          self.db.multi([
            ['set', self.kUrl(long_url), response.hash],
            ['hmset', self.kHash(response.hash),
              'url', long_url,
              'hash', response.hash,
              'start_date', start_date || 0,
              'end_date', end_date || 0,
              'clicks', 0
            ]
          ]).exec((err, replies) => {
            if (err) {
              callback(503);
            } else {
              callback(null, response);
            }
            self.db.quit();
          });
        }
      });
    }
  });
};

// Get record
RedisModel.prototype.get = function (short_url, callback, click) {
  const self = this;

  this.findHash(short_url, (err, reply) => {
    if (err) {
      callback(500);
    } else if (reply && 'url' in reply) {
      if (click) {
        self.clickLink(reply.hash);
      }
      callback(null, {
        'start_date' : reply.start_date || 0,
        'end_date' : reply.end_date || 0,
        'hash' : reply.hash,
        'long_url' : reply.url,
        'clicks' : reply.clicks || 0
      });
    } else {
      callback(404);
    }
    self.db.quit();
  });
};

RedisModel.prototype.getRandom = function(callback) {
  const self = this;
  const pattern = self.kHash("*");
  self.scanAll(pattern, hashKeys => {
    const randomKey = hashKeys[Math.floor(Math.random() * hashKeys.length)];
    const short_url = randomKey.split(':').pop();
    self.get(short_url, callback);
  });
};

RedisModel.prototype.scanAll = function (pattern, callback) {
  if(callback == null && typeof(pattern) === "function") {
    callback = pattern;
    pattern = "*";
  }
  const self = this;
  const cursor = "0";
  const returnSet = new Set();
  this._scanAll(pattern, cursor, returnSet, callback);
}

RedisModel.prototype._scanAll = function (pattern, cursor, returnSet, callback) {
  const self = this;
  self.db.scan(
    cursor, 
    "MATCH", pattern, 
    "COUNT", "100", 
    (err, data) => {
      const reply = data;
      const cursor = reply[0];
      const keys = reply[1];
      keys.forEach((key, i) => {
        returnSet.add(key);
      });
      if(cursor === '0') {
        if(callback) {
          const returnArray = Array.from(returnSet);
          callback(returnArray);
        }
      } else {
        self._scanAll(pattern, cursor, returnSet, callback)
      }
    }
  );
};