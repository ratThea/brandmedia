"use strict";

import fileinclude from "gulp-file-include";
import pug from "gulp-pug";

export const html = () => {
    return app.gulp.src(app.path.src.html)
           //.pipe(fileinclude())
           .pipe(pug({ pretty: true, verbose: true }))
           .pipe(app.plugins.replace(/\.\.\/images\//g, "images/"))
           .pipe(app.gulp.dest(app.path.build.html))
           .pipe(app.plugins.browserSync.stream());
};