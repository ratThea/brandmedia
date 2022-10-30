"use strict";

import dartSass     from "sass";
import gulpSass     from "gulp-sass";
import autoprefixer from "gulp-autoprefixer";
import clean        from "gulp-clean-css";

const sass = gulpSass(dartSass);

export const scss = () => {
    return app.gulp.src(app.path.src.scss, { sourcemaps: true })
           .pipe(app.plugins.replace(/\.\.\/images\//g, "../images/"))
           .pipe(sass({ outputStyle: app.isBuild ? "compressed" : "expanded" }))
           .pipe(autoprefixer({ grid: true, overrideBrowserList: [ "last 3 versions" ], cascade: true }))
           //.pipe(clean())
           .pipe(app.plugins.rename({ extname: ".min.css" }))
           .pipe(app.gulp.dest(app.path.build.css))
           .pipe(app.plugins.browserSync.stream());
};