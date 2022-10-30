"use strict";

import gulp from "gulp";
import { path } from "./gulp/config/path.js";
import { plugins } from "./gulp/config/plugins.js";

import { server } from "./gulp/tasks/server.js";
import { reset } from "./gulp/tasks/reset.js";
import { html } from "./gulp/tasks/html.js";
import { scss } from "./gulp/tasks/scss.js";
import { scripts } from "./gulp/tasks/scripts.js";
import { images } from "./gulp/tasks/images.js";
import { convertOTF, covertTTF, buildFonts } from "./gulp/tasks/fonts.js";

global.app = {
    isBuild: process.argv.includes("--build"),
    isDev: !process.argv.includes("--build"),
    path,
    gulp,
    plugins
};

const { watch, series, parallel, task } = gulp;

const fonts     = series(convertOTF, covertTTF, buildFonts),
      main      = series(fonts, parallel(html, scss, scripts, images)),
      build     = series(reset, main),
      dev       = series(reset, main, parallel(watcher, server))


function watcher() {
    watch(path.watch.html, html);
    watch(path.watch.scss, scss);
    watch(path.watch.js, scripts);
    watch(path.watch.images, images);
}

export { build, dev };

task("fonts", fonts);
task("default", dev);