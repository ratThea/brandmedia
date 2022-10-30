"use strict";

/**
 * Скрывает/показывает модальное pop-up окно с картинкой, у которой есть потомок с data-action="image-popup".
 * @param {HTMLElement} trigger Кнопка, которая активирует pop-up.
 */
function imagePopup(trigger) {

    const image     = trigger.parentElement.querySelector("img"),
          imageData = {
            src: image.src,
            description: image.dataset.description || "Описание картинки (надо заполнить)"
          };

    const scrollBarWidth     = window.innerWidth - document.documentElement.clientWidth;
    const overlay            = createDOMElement({ classes: "popup-overlay", css: { "padding-top": 1, "width":  `${ document.documentElement.clientWidth + scrollBarWidth }px`, top: `${ document.documentElement.scrollTop }px` } }),
          overlayContent     = createDOMElement({ tagName: "div", classes: "popup-overlay__content", content: { data: `<img class="popup-overlay__image" src="${imageData.src}"><div class="popup-overlay__text">${ imageData.description }</div>` } }),
          overlayCloseButton = createDOMElement({ tagName: "span", classes: "popup-overlay__close-button" });

    overlay.append(overlayContent);
    overlayContent.append(overlayCloseButton);

    document.body.prepend(overlay);
    // Запрет прокрутки:
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${ scrollBarWidth }px`;

    overlayCloseButton.addEventListener("click", removeOverlay);

    /**
     * Удаляет overlay, вместе со всем его содержимым и обработчиком события.
     */
    function removeOverlay() {
        overlayCloseButton.removeEventListener("click", removeOverlay);
        overlay.remove();
        // Возврат прокрутки:
        document.body.style.overflow = "";
        document.body.style.paddingRight = `0`;
    }
}

/**
 * Создает DOM-элемент с указанными классами, стилями и содержимым. На страницу не добавляет, только возвращает его.
 * @param {String} tagName Имя тега
 * @param {String|Array} classes Классы: строка или массив строк
 * @param {Object} css Объект со свойствами вида { name: value }. Все свойства с "-" будут преобразованы в camelCase
 * @param {Object} content Объект вида { position, data }. data может быть строкой с html кодом или другим DOM-элементом
 * @returns {HTMLElement}
 */
function createDOMElement({ tagName = "div", classes = "", css = null, content = null }) {

    const element = document.createElement(tagName);

    if(classes.length) {
        element.className = Array.isArray(classes) ? classes.filter(item => typeof item === "string").join(" ") : classes;
    }

    if(css) {
        for(const [ name, value ] of Object.entries(css)) {
            let propName = name;

            if(name.includes("-")) {
                propName = name.split("-")
                               .map((item, index) => index === 0 ? item.toLocaleLowerCase() : item[0].toUpperCase() + item.slice(1))
                               .join("");
            }

            element.style[propName] = value;
        }
    }

    if(content) {
        const { position = "afterbegin", data } = content,
              method = (typeof data === "string") ? "insertAdjacentHTML" : "insertAdjacentElement";
        element[method](position, data);
    }

    return element;
}

/**
 * Переключает атрибут у элемента. Это может быть либо класс или классы, либо атрибут.
 * @param {HTMLElement} target Элемент, у которого надо переключать атрибут
 * @param {String|Object} param Атрибут, который надо переключить. Если это класс, писать "class" или "class1 class2". Если атрибут - { name, on, of }
 */
function toggleElement(target, param) {

    if(!param) {
        target.hidden = !target.hidden;
        return;
    }

    if(typeof param === "string") {
        const data = param.trim();

        if(data.includes(" ")) {
            const classes = data.split(" ") ;
            for(const className of classes) {
                target.classList.contains(className) ?  target.classList.remove(className) : target.classList.add(className);
            }
            return;
        }

        target.classList.contains(data) ?  target.classList.remove(data) : target.classList.add(data);
    }

    if(typeof param === "object") {
        const { name, on, off } = param;
        if(target.hasAttribute(name)) {
            target.getAttribute(name) === on ? target.setAttribute(name, off) : target.setAttribute(name, on);
        }
    }
}

/**
 * Скрывает/показывает меню и подменю в шапке. Назначается слушателем по клику на документ, так как работает только
 * на маленьких экрана и надо обрабатывать клик в "пустоту", чтобы скрыть все активные меню.
 * Только для этого проекта (brandmedia).
 */
function toggleNavigation() {
    const toggler                = window.event.target.closest("[data-action]"),
          mainMenu               = document.getElementById("header-menu"),
          submenuContainers      = Array.from(mainMenu.children[0].children),
          activeSubmenuIndex     = submenuContainers.findIndex(container => container.classList.contains("active"));

    // Если клик был по элементу с data-action
    if(toggler) {

        const action = toggler.dataset.action;

        // Скрывает/показывает главное меню, и прячет подменю, если оно открыто.
        if(action === "main") {
            toggleElement(mainMenu, "active");
            if(activeSubmenuIndex !== -1) {
                submenuContainers[activeSubmenuIndex].classList.remove("active");
            }
            return;
        }

        // Скрывает/показывает подменю текущего пунтка. Если уже есть другое открытое меню, скрывает его
        // и предотвращает переход по ссылке.
        if(action === "submenu") {

            window.event.preventDefault();
            const clickedIndex = submenuContainers.findIndex(container => container === toggler.parentElement.parentElement);

            if(activeSubmenuIndex !== -1) {
                submenuContainers[activeSubmenuIndex].classList.remove("active");
            }
            if(clickedIndex !== activeSubmenuIndex) {
                toggleElement(submenuContainers[clickedIndex], "active");
            }
            return;
        }
    }

    // Если клика был в "пустоту", скрыть все: и главное меню и подменю.
    mainMenu.classList.remove("active");
    if(activeSubmenuIndex !== -1) submenuContainers[activeSubmenuIndex].classList.remove("active");
}

/**
 * Вызывает интекартивную Яндекс.Карту с указанным адресом (по умолчанию штат Кентуки, США - взят из макета).
 * @param {Number} latitude Широта
 * @param {Number} longitude Долгота
 * @param {Number} zoom Масштаб
 */
function init(latitude, longitude, zoom) {
    const map =  new ymaps.Map("brandmedia-contact-map", { center: [ latitude, longitude ], zoom: zoom });

    map.controls.remove("geolocationControl");
    map.controls.remove("searchControl");
    map.controls.remove("trafficControl");
    map.controls.remove("typeSelector");
    map.controls.remove("fullscreenControl");
    map.controls.remove("zoomControl");
    map.controls.remove("rulerControl");
    map.behaviors.disable(["scrollZoom"]);
}

export {
    imagePopup,
    createDOMElement,
    toggleElement,
    toggleNavigation,
    init,
}