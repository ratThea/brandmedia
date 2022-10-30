"use strict";

import { TheaTabs } from "./modules/thea-tabs.js";
import { TheaSlider } from "./modules/thea-slider.js";
import * as funcs from "./modules/functions.js";

document.addEventListener("DOMContentLoaded", () => {

    // Установка яндекс карты (если она есть):
    if(document.body.hasAttribute("data-map")) {
        ymaps.ready(funcs.init.bind(null, 37.83425076906181, -85.76824150000002, 7));
    }

    document.documentElement.addEventListener("click", ({ target }) => {

        // Обработка popup окна, если клик был по элементу "image-popup":
        if(target.dataset.action === "image-popup") {
            funcs.imagePopup(target);
            return;
        }

        // Скрытие/показ навигации слайдера на главной странице при клике на экран:
        if(target.closest(".slider__screen-wrapper")) {
            funcs.toggleElement( document.getElementById("presentation-slider-nav"), "active" )
        }

        // Обработчик скрытия/показа навигации в шапке (синхрозинировано с медиазапросом "sm"):
        if(document.documentElement.clientWidth <= 770) {
            funcs.toggleNavigation();
        }
    });

    // Все табы на сайте:
    const recentActivityTabs = new TheaTabs({ root: document.getElementById("recent-activity") }),
          portfolioTabs      = new TheaTabs({ root: document.getElementById("portfolio-tabs"), startActive: 3, equalify: false }),
          aboutTabs          = new TheaTabs({ root: document.getElementById("about-tabs") })

    // Слайдер на главной странице (index.html):
    const presentationSlider = new TheaSlider({
        root: document.getElementById("presentation-slider"),
        speed: 1.5,
        autoplay: true,
        draggable: false,
        controls: {
            buttons: {
                prev: document.getElementById("presentation-slider-prev"),
                next: document.getElementById("presentation-slider-next"),
                toggle: document.getElementById("presentation-slider-toggle")
            },
            dots: {
                container: document.getElementById("presentation-slider-dots"),
                dotClass: "slider__dot"
            }
        }
    });

    // Слайдер на странице "Portfolio" (portfolio.html):
    const portfolioSlider = new TheaSlider({
        root: document.getElementById("portfolio-slider"),
        controls: {
            dots: {
                container: document.getElementById("portfolio-slider-dots"),
                dotClass: "slider__dot"
            }
        }
    });

});