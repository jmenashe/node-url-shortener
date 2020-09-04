import gulp from 'gulp';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import minify from 'gulp-terser-js';
import { IsProduction, GetEnvironment } from './config/environment.js';

gulp.task('transpile', function() {
    var scripts = browserify('lib/nus.js')
        .transform('babelify', {
            presets: ['@babel/preset-env']
        })
        .bundle()
        .pipe(source('init.js'))
        .pipe(buffer())
  ;
    if(IsProduction())
        scripts = scripts.pipe(minify());

    scripts = scripts.pipe(gulp.dest('./build/' + GetEnvironment() + '/'));
    return scripts;
});

gulp.task('build', gulp.series('transpile'));

gulp.task('watch', function() {
    return gulp
        .watch('lib/*.js', gulp.series('build'))
        .watch('config/*.js', gulp.series('build'))
    ;
});

gulp.task('start', gulp.series('build', 'watch'));
gulp.task('default', gulp.series('build'));

