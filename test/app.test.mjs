import request from 'superagent';
import mocker from 'superagent-mocker';
const mock = mocker(request);
import expect from 'expect.js';

describe('Test Node Url Shortener - RESTful API', () => {
  let id;

  beforeEach(() => {
    mock.clearRoutes();
    mock.timeout = 0;
  });

  it('should POST /api/v1/shorten', done => {
    mock.post('/api/v1/shorten', ({body}) => ({
      hash: 'MQ==',
      long_url: body.long_url,
      short_url: 'http://localhost:3000/MQ==',
      start_date: '',
      end_date: '',
      c_new: false,
      status_code: 200,
      status_txt: 'OK'
    }));
    request.post('/api/v1/shorten', {
        long_url: 'https://www.google.com'
      })
      .end((_, data) => {
        expect(data).to.an('object');
        expect(data).not.to.be.empty();
        expect(data).to.have.keys('hash', 'long_url', 'short_url', 'status_code', 'status_txt', 'start_date', 'end_date');
        id = data.hash;
        done();
      });
  });

  it('should POST /api/v1/expand', done => {
    mock.post('/api/v1/expand', ({body}) => ({
      hash: body.short_url,
      long_url: 'https://www.google.com',
      short_url: `http://localhost:3000/${body.short_url}`,
      start_date: body.start_date,
      end_date: body.end_date,
      status_code: 200,
      status_txt: 'OK'
    }));
    request.post('/api/v1/expand', {
        short_url: id
      })
      .end((_, data) => {
        expect(data).to.an('object');
        expect(data).not.to.be.empty();
        expect(data).to.have.keys('hash', 'long_url', 'short_url', 'status_code', 'status_txt', 'start_date', 'end_date');
        done();
      });
  });

  it('should GET /api/v1/expand/hash', done => {
    mock.get(`/api/v1/expand/${id}`, ({body}) => ({
      hash: body.short_url,
      long_url: 'https://www.google.com',
      short_url: `http://localhost:3000/${body.short_url}`,
      start_date: body.start_date,
      end_date: body.end_date,
      status_code: 200,
      status_txt: 'OK'
    }));
    request.get(`/api/v1/expand/${id}`)
      .end((_, data) => {
        expect(data).to.an('object');
        expect(data).not.to.be.empty();
        expect(data).to.have.keys('hash', 'long_url', 'short_url', 'status_code', 'status_txt', 'start_date', 'end_date');
        done();
      });
  });
});