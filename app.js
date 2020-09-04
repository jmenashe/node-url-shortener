import express from 'express';
import path from 'path';
import opts from './config/opts.js';
import nus_config from './lib/nus.js';
import route_config from './routes/index.js';
import favicon from 'serve-favicon';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import methodOverride from 'method-override';
import { SetCommandArgs } from './config/environment.js';

process.env.SERVER_ROOT = path.resolve('.');
process.env.STATIC_ROOT = path.join(process.env.SERVER_ROOT, 'public');
process.env.VIEW_ROOT = path.join(process.env.SERVER_ROOT, 'views');
console.log('Set server root:', process.env.SERVER_ROOT);

(function(){
    'use strict';
    var app = express();
    SetCommandArgs(app);
    
    process.env.SERVER_ROOT = path.resolve('.');
    process.env.STATIC_ROOT = path.join(process.env.SERVER_ROOT, 'public');
    process.env.VIEW_ROOT = path.join(process.env.SERVER_ROOT, 'views');

    app.set('views', process.env.VIEW_ROOT);
    app.set('view engine', 'pug');

    app.use(logger('dev')); 
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(process.env.STATIC_ROOT));
    app.use(favicon(path.join(process.env.STATIC_ROOT, '/favicon.ico')));
    app.use(methodOverride());
    app.set('opts', opts);
    app.set('x-powered-by', false);

    const nus = nus_config(opts);
    route_config(app, nus);

    process.addListener('uncaughtException', (err, stack) => {
      console.log(`Caught exception: ${err}\n${err.stack}`);
      console.log('\u0007'); // Terminal bell
    });   
    
    // development error handler
    // will print stacktrace
    if (app.get('env') === 'dev') {
        app.use(function (err, req, res) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use(function (err, req, res,) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });

    app.listen(opts.port, () => {
      console.log('Express server listening on port %d in %s mode',
        opts.port, app.settings.env
      );
      console.log('Running on %s (Press CTRL+C to quit)', opts.url);
    });
})();