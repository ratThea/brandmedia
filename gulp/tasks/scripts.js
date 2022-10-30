"use strict";

import stream from "webpack-stream";
import babel from "gulp-babel";

export const scripts = () => {
    return app.gulp.src(app.path.src.js, { sourcemaps: app.isDev })
           .pipe(babel({ presets: [ "@babel/preset-env" ] }))
           .pipe(stream({
                mode: app.isBuild ? "production" : "development",
                output: {
                    filename: "main.min.js"
                }
            }))
           .pipe(app.gulp.dest(app.path.build.js))
           .pipe(app.plugins.browserSync.stream());
};