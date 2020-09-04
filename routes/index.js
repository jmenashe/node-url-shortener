import http from 'http';
import api_config from './api.js';

export default (app, nus) => {
  const api = api_config(app, nus);

  // api routes
  app.use('/api/v1', api);

  // index route
  app.route('/').all((req, res) => {
    res.render('index');
  });

  // shorten route
  app.get(/^\/([\w=]+)$/, ({params}, res, next) => {
    nus.expand(params[0], (err, {long_url}) => {
      if (err) {
        next();
      } else {
        res.redirect(301, long_url);
      }
    }, true);
  });

  // catch 404 and forwarding to error handler
  app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // development error handler
  // will print stacktrace
  if (app.get('env') === 'dev') {
    app.use((err, {originalUrl}, res, next) => {
      console.log(`Caught exception: ${err}\n${err.stack}`);
      res.status(err.status || 500);
      if (/^\/api\/v1/.test(originalUrl)) {
        res.json({
          status_code: err.status || 500,
          status_txt: http.STATUS_CODES[err.status] || http.STATUS_CODES[500]
        });
      } else {
        res.render('error', {
          code: err.status || 500,
          message: err.message,
          error: err
        });
      }
    });
  }

  // production error handler
  // no stacktraces leaked to user
  app.use(({status, message}, {originalUrl}, res, next) => {
    res.status(status || 500);
    if (/^\/api\/v1/.test(originalUrl)) {
      res.json({
        status_code: status || 500,
        status_txt: http.STATUS_CODES[status] || ''
      });
    } else {
      res.render('error', {
        code: status || 500,
        message: message,
        error: false
      });
    }
  });
};
