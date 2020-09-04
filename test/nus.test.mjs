import request from 'superagent';
import mocker from 'superagent-mocker';
const mock = mocker(request);
import expect from 'expect.js';
import fakeredis from 'fakeredis';
import RedisModel from '../lib/redis-model.js';
import Nus from '../lib/nus.js';

function addDays(n){
  const t = new Date();
  t.setDate(t.getDate() + n);
  const date = `${t.getFullYear()}/${((t.getMonth() + 1) < 10 ) ? `0${t.getMonth()+1}` : (t.getMonth()+1)}/${(t.getDate() < 10) ?  `0${t.getDate()}` : t.getDate()}`;
  return date;
}

describe('Test Node Url Shortener without start_date and end_date - Nus', () => {
  let long_url;
  let short_url;
  let cNew;
  let nus;
  let fr;

  const dateObject = {};

  beforeEach(() => {
    fr = fakeredis.createClient(0, 'localhost', {fast : true});
    nus = Nus();
    nus.getModel = callback => {
      callback(null, new RedisModel(null, fr));
    };
    long_url = 'http://example.com';
    short_url = 'foo';
    dateObject.start_date = '';
    dateObject.end_date = '';
    cNew = 'false';
  });

  it('should shorten', done => {
    nus.shorten(long_url, dateObject.start_date, dateObject.end_date, cNew,  (err, reply) => {
      expect(err).to.be(null);
      expect(reply).to.not.be.empty();
      expect(reply).to.only.have.keys('hash', 'long_url');
      expect(reply.hash).to.match(/[\w=]+/);
      expect(reply.long_url).to.be(long_url);
      done();
    });
  });

  it('should expand', done => {
    nus.getModel((err, redis) => {
      fr.multi([
        ['set', redis.kUrl(long_url), short_url],
        ['hmset', redis.kHash(short_url),
          'url', long_url,
          'hash', short_url,
          'start_date', dateObject.start_date,
          'end_date', dateObject.end_date,
          'clicks', 1
        ]
      ]).exec((err, replies) => {

        nus.shorten(long_url, dateObject.start_date, dateObject.end_date, cNew, (err, reply) => {
          expect(err).to.be(null);
          expect(reply).to.not.be.empty();
          expect(reply).to.only.have.keys('hash', 'long_url');
          expect(reply.hash).to.match(/[\w=]+/);
          expect(reply.long_url).to.be(long_url);
          done();
        });

      });
    });
  });
});




describe('Test Node Url Shortener with start_date and end_date - Nus', () => {
  let nus;
  let long_url;
  let short_url;
  let cNew;
  let fr;

  const dateObject = {};

  beforeEach(() => {
    fr = fakeredis.createClient(0, 'localhost', {fast : true});
    nus = Nus();
    nus.getModel = callback => {
      callback(null, new RedisModel(null, fr));
    };
    long_url = 'http://example.com';
    short_url = 'foo';
    dateObject.start_date = addDays(0);
    dateObject.end_date = addDays(2);
    cNew = 'true';
  });

  it('should shorten', done => {
    nus.shorten(long_url, dateObject.start_date, dateObject.end_date, cNew,  (err, reply) => {
      expect(err).to.be(null);
      expect(reply).to.not.be.empty();
      expect(reply).to.only.have.keys('hash', 'long_url');
      expect(reply.hash).to.match(/[\w=]+/);
      expect(reply.long_url).to.be(long_url);
      done();
    });
  });

  it('should expand', done => {
    nus.getModel((err, redis) => {
      fr.multi([
        ['set', redis.kUrl(long_url), short_url],
        ['hmset', redis.kHash(short_url),
          'url', long_url,
          'hash', short_url,
          'start_date', dateObject.start_date,
          'end_date', dateObject.end_date,
          'clicks', 1
        ]
      ]).exec((err, replies) => {

        nus.shorten(long_url, dateObject.start_date, dateObject.end_date, cNew, (err, reply) => {
          expect(err).to.be(null);
          expect(reply).to.not.be.empty();
          expect(reply).to.only.have.keys('hash', 'long_url');
          expect(reply.hash).to.match(/[\w=]+/);
          expect(reply.long_url).to.be(long_url);
          done();
        });

      });
    });
  });
})

