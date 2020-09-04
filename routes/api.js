import http from 'http';
import express from 'express';

export default (app, nus) => {
  const opts = app.get('opts');
  const router = express.Router();

  router.route('/random')
    .get((req, res) => {
      nus.random((err, reply) => {
        if (err) {
          jsonResponse(res, err);
        } else if (reply) {
          jsonResponse(res, 200, reply);
        }
      });
    })
  ;

  router.route('/shorten')
    .post(({body}, res) => {
      nus.shorten(body['long_url'], body['start_date'], body['end_date'], body['c_new'], (err, reply) => {
        if (err) {
          jsonResponse(res, err);
        } else if (reply) {
          reply.short_url = `${opts.url.replace(/\/$/, '')}/${reply.hash}`;
          jsonResponse(res, 200, reply);
        } else {
          jsonResponse(res, 500);
        }
      });
    });

  router.route('/expand')
    .post(({body}, res) => {
      nus.expand(body['short_url'], (err, reply) => {
        if (err) {
          jsonResponse(res, err);
        } else if (reply) {
          jsonResponse(res, 200, reply);
        } else {
          jsonResponse(res, 500);
        }
      });
    });

  router.route('/expand/:short_url')
    .get(({params}, res) => {
      nus.expand(params.short_url, (err, reply) => {
        if (err) {
          jsonResponse(res, err);
        } else if (reply) {
          startDate = reply.start_date || 0;
          endDate = reply.end_date || 0;
          toDay = new Date();
          if((+startDate - +toDay) > 0 || (+endDate - +toDay) < 0 ){
            err = {"error" : "sorry this url has expired"};
            jsonResponse(res, 200, err);
          }else{
            jsonResponse(res, 200, reply);
          }

        } else {
          jsonResponse(res, 500);
        }
      });
    });

  function jsonResponse(res, code, data = {}) {
    data.status_code = (http.STATUS_CODES[code]) ? code : 503,
    data.status_txt = http.STATUS_CODES[code] || http.STATUS_CODES[503]

    res.status(data.status_code).json(data)
  }

  return router;
};
