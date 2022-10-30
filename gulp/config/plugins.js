"use strict";

import browserSync from "browser-sync";
import rename      from "gulp-rename";
import newer from "gulp-newer";
import replace from "gulp-replace";
import ifPlugin from "gulp-if";

export const plugins = { browserSync, rename, newer, replace, if: ifPlugin };