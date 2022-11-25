"use strict";


export class TheaSlider {
    /**
     * @param {HTMLElement} root Корневой элемент (обязательный параметр)
     * @param {Object} controls Объект с элементами управления слайдером. Обязательный параметр
     * @param {Number} activeCount Количество слайдов, которые активны одновременно
     * @param {Number} transitionDuration Скорость, за которую пролистывается слайд (секунды)
     * @param {Number} timeoutSpeed Задержка перелистывания слайдов при автопроигрывании (милисекунды)
     * @param {Boolean} infinite Указатель того, является ли слайдер бесконечным
     * @param {Boolean} autoplay Указатель того, включать ли слайдер по умолчанию
     * @param {Boolean} draggable Указатель того, можно ли перетаскивать слайды мышкой
     * @param {Boolean} reversed Указатель того, прокручивать ли слайдер в обратную сторону (справа налево)
     */
    constructor({ root, controls, activeCount = 1, transitionDuration = 1.5, timeoutSpeed = 3500, infinite = true, autoplay = true, draggable = false, reversed = false }) {

        try {
            TheaSlider.checkConstructorParams({ root, controls, activeCount, transitionDuration, timeoutSpeed, infinite, autoplay, draggable, reversed });
        } catch(error) {
            console.error(`${error.name}: ${error.message}`);
            return;
        }

        this._root = root;
        this._configure(controls, activeCount, transitionDuration, timeoutSpeed, infinite, autoplay, draggable, reversed);
        this._init();

        // Возвращается прокси-объект, защищающий приватные свойства и методы (начинаются с "_") от изменения или удаления или создания новых (чтобы не путаться)
        // При попытке изменить или удалить их выводится сообщение об ошибке, а сама операция отменяется и возвращается false
        return new Proxy(this, {
            set(target, name, value) {
                if(Object.keys(target).includes(name) && name.startsWith("_")) {
                    console.error(`${name} является приватным. Ему нельзя устанавливать новые свойства, его можно только прочесть.`);
                    return false;
                }

                if(name.startsWith("_")) {
                    console.error(`Новые свойства нельзя называть, начиная с символа "_".`);
                    return false;
                }

                target[name] = value;
                return false;
            },
            deleteProperty(target, name) {
                if(name.startsWith("_")) {
                    console.error(`${name} является приватным. Его нельзя удалить, его можно только прочесть.`);
                    return false;
                }

                delete target[name];
                return false;
            }
        });
    }

    /**
     * @private
     * Создает объект с настройками слайдера. Все параметры (кроме root) дублируют конструктор
     * @param {Object} controls
     * @param {Number} activeCount
     * @param {Number} transitionDuration
     * @param {Number} timeoutSpeed
     * @param {Boolean} infinite
     * @param {Boolean} autoplay
     * @param {Boolean} draggable
     * @param {Boolean} reversed
     */
    _configure(controls, activeCount, transitionDuration, timeoutSpeed, infinite, autoplay, draggable, reversed) {

        const slideWidth  = (activeCount === 1) ? this._root.offsetWidth : Math.round(this._root.offsetWidth / activeCount),
            baseLength = this._root.children.length;

        this._config = {
            controls: {
                buttons: {
                    isSet: "buttons" in controls
                },
                dots: {
                    isSet: "dots" in controls
                }
            },
            settings: {
                autoplay,
                reversed,
                infinite,
                timeoutSpeed,
                resetSpeed: 300,
                dragParams: {
                    isSet: draggable
                },
                transition: {
                    enabled: false,
                    transitionDuration,
                },
            },
            state: {
                status: autoplay ? "active" : "paused",
                timeoutId: null,
                isDragging: false,
                cooldown: false,
                actionType: null,
                activeIndex: {
                    slide: [0],
                    dot: {
                        prev: 0,
                        next: 0
                    }
                }
            },
            slide: {
                count: baseLength,
                lastSlideIndex: baseLength - 1,
                width: slideWidth,
                activeCount,
                collection: {
                    before: [],
                    after:  [],
                    base: Array.from(this._root.children)
                }
            },
            offset: {
                width: this._root.offsetWidth,
                min: infinite ? this._root.offsetWidth : 0,
                max: slideWidth * (infinite ? baseLength : baseLength - activeCount - 1),
                position: infinite ? -this._root.offsetWidth : 0,
                absolute: infinite ? Math.abs(-this._root.offsetWidth) : 0
            }
        };

        if(this._config.settings.infinite) {
            this._config.slide.collection.before.push(...this._config.slide.collection.base.slice(this._config.slide.count - activeCount).map(clone => clone.cloneNode(true)));
            this._config.slide.collection.after.push(...this._config.slide.collection.base.slice(0, activeCount).map(clone => clone.cloneNode(true)));
        }

        if(this._config.slide.activeCount > 1) {
            let current   = this._config.state.activeIndex.slide[0],
                tempCount = activeCount;
            while(tempCount !== 1) {
                current += 1;
                this._config.state.activeIndex.slide.push(current);
                tempCount -= 1;
            }
        }

        if(this._config.controls.buttons.isSet) {
            this._config.controls.buttons.next = controls.buttons.next;
            this._config.controls.buttons.prev = controls.buttons.prev;

            if("toggle" in controls.buttons) {
                this._config.controls.buttons.toggle = controls.buttons.toggle;
            }
        }

        if(this._config.controls.dots.isSet) {
            this._config.controls.dots.container = controls.dots.container;
            this._config.controls.dots.count = this._config.slide.count / activeCount;
            this._config.controls.dots.dotClass = controls.dots.dotClass;

            this._config.state.activeIndex.dot = {
                prev: 0,
                next: 0,
            }
        }

        if(this._config.settings.dragParams.isSet) {
            this._config.settings.dragParams.startPosition = 0;
            this._config.settings.dragParams.differenceForDrag = 15;
        }
    }

    /**
     * @private
     * Инициализирует слайдер (html/css/обработчики событий) и запускает его, если autoplay = true
     */
    _init() {
        this._addBaseHTML();
        this._addBaseCSS();
        this._addHandlers();

        if(this._config.settings.autoplay) {
            this._autoplay();
        }
    }

    /**
     * @private
     * Создает базовую HTML разметку: теги и атрибуты (кроме "class")
     */
    _addBaseHTML() {
        this._root.setAttribute("data-thea-slider-status", this._config.state.status);
        this._container = document.createElement("div");
        this._container.append(...this._config.slide.collection.before, ...this._config.slide.collection.base, ...this._config.slide.collection.after);
        this._root.append(this._container);

        if(this._config.controls.dots.isSet) {

            for(let index = 0; index < this._config.controls.dots.count; index++) {
                const dotElement = document.createElement("div");
                dotElement.setAttribute("data-thea-slider-point", index);
                dotElement.setAttribute("data-thea-slider-action", "scroll");
                this._config.controls.dots.container.append(dotElement);
            }

            this._config.controls.dots.collection = Array.from(this._config.controls.dots.container.children);
        }

        if(this._config.controls.buttons.isSet) {

            this._config.controls.buttons.next.setAttribute("data-thea-slider-action", "next");
            this._config.controls.buttons.prev.setAttribute("data-thea-slider-action", "prev");

            if("toggle" in this._config.controls.buttons) {
                this._config.controls.buttons.toggle.setAttribute("data-thea-slider-status", this._config.state.status);
                this._config.controls.buttons.toggle.setAttribute("data-thea-slider-action", "toggle");
            }
        }
    }

    /**
     * @private
     * Задает всем элементам css-свойства и css-классы
     */
    _addBaseCSS() {
        this._root.classList.add(TheaSlider.baseClasses.root);
        this._container.className = TheaSlider.baseClasses.container.base;

        for(const [ type, array ] of Object.entries(this._config.slide.collection)) {
            array.forEach(slideElement => {
                if(type !== "base") {
                    slideElement.classList.add(TheaSlider.baseClasses.slide.base);
                }
                slideElement.classList.add(TheaSlider.baseClasses.slide[type]);
                slideElement.style.width = `${this._config.slide.width}px`;
            });
        }

        for(const index of this._config.state.activeIndex.slide) {
            this._config.slide.collection.base[index].classList.add("active");
        }

        if(this._config.controls.dots.isSet) {
            for(const dot of this._config.controls.dots.collection) {
                dot.className = TheaSlider.baseClasses.control.dot;
                if(this._config.controls.dots.dotClass) {
                    if(typeof this._config.controls.dots.dotClass === "string") {
                        dot.classList.add(this._config.controls.dots.dotClass);
                    }

                    if(Array.isArray(this._config.controls.dots.dotClass)) {
                        for(const className of this._config.controls.dots.dotClass) {
                            dot.classList.add(className);
                        }
                    }
                }
            }

            this._config.controls.dots.container.classList.add(TheaSlider.baseClasses.control.dots);
            this._config.controls.dots.collection[0].classList.add("active");
        }

        this._container.style.left = `${this._config.offset.position}px`;
        this._toggleTransition();
    }

    /**
     * @private
     * Добавляет обработчики событий на указанные элементы управления (кнопки/точки/контейнер/все вместе)
     */
    _addHandlers() {

        this._container.addEventListener("transitionend", this._handleTransitionend.bind(this));

        document.addEventListener("click", event => {
            const controlElement = event.target.closest("[data-thea-slider-action]");
            if(controlElement) {
                event.stopPropagation();
                const type = controlElement.getAttribute("data-thea-slider-action");
                if(type === "scroll") {
                    const index = +controlElement.getAttribute("data-thea-slider-point");
                    this._slide.call(this, { type, index })
                } else if (type === "toggle") {
                    this._toggleSliderState.call(this);
                } else {
                    this._slide.call(this, { type });
                }
            }
        });

        if(this._config.settings.dragParams.isSet) {
            this._container.addEventListener("mousedown", this._dragStart.bind(this));
            this._container.addEventListener("mousemove", this._dragProcess.bind(this));
            this._container.addEventListener("mouseleave", this._dragStop.bind(this));
            this._container.addEventListener("mouseup", this._dragStop.bind(this));
        }
    }

    /**
     * @private
     * Запускает слайдер сразу после иннициализации, если autopaly = true, или если слайдеру убрать состояние паузы
     */
    _autoplay() {
        if(this._config.state.status !== "paused") {
            const $ = this;
            const type = $._config.settings.reversed ? "prev" : "next";
            $._config.state.timeoutId = setTimeout(function autoplayTimeout() {
                $._slide({ type });
                $._config.state.timeoutId = setTimeout(autoplayTimeout, $._config.settings.timeoutSpeed);
            }, 1000);
        }
    }

    /**
     * @private
     * Проверяет, возможна ли операция перелистывания слайда/слайдов
     * @param {String} type Тип перелистывания: "next", "prev" или "scroll"
     * @param {Number} index Позиция слайда, который надо сделать актинвым (если их несколько, то первого активного). Указывается только при type = "scroll"
     */
    _able({ type, index }) {
        if(!this._config.state.cooldown) {
            if(type === "prev") {
                return this._config.settings.infinite || this._config.offset.absolute > this._config.offset.min;
            }

            if(type === "next") {
                return this._config.settings.infinite || this._config.offset.absolute < this._config.offset.max;
            }

            if(type === "scroll") {
                return index !== null && ((index * this._config.slide.activeCount) !== this._config.state.activeIndex.slide[0]);
            }
        }
        return false;
    }

    /**
     * @private
     * Перелистывает слайд/слайды в завимимости от типа направления или позиции
     * @param {String} type Тип перелистывания: "next", "prev" или "scroll"
     * @param {Number} index Позиция слайда, который надо сделать актинвым (если их несколько, то первого активного). Указывается только при type = "scroll"
     */
    _slide({ type, index = null }) {
        if(this._able({ type, index })) {

            this._config.state.cooldown = true;
            this._config.state.actionType = type;

            if(type === "prev") {
                this._config.offset.position += this._config.offset.width;
            }

            if(type === "next") {
                this._config.offset.position -= this._config.offset.width;
            }

            if(type === "scroll") {
                this._config.offset.position = -this._config.offset.min + -this._config.offset.width * index;
                this._config.state.activeIndex.dot = {
                    prev: this._config.state.activeIndex.dot.next,
                    next: index
                };
            }

            this._config.offset.absolute = Math.abs(this._config.offset.position);
            this._container.style.left = `${this._config.offset.position}px`;
        }
    }

    /**
     * @private
     * Выполняет подготовку для перетаскиваия слайда/слайдов. Вызывается при событии "mousedown" на this._container
     * @param {Object} event Объект события
     */
    _dragStart(event) {
        event.stopPropagation();
        event.preventDefault();
        this._container.classList.add(TheaSlider.baseClasses.container.dragged);
        this._config.settings.dragParams.startPosition = event.pageX;
        this._config.state.isDragging = true;
    }

    /**
     * @private
     * Выполняет перетаскиваие слайда/слайдов. Вызывается при событии "mousemove" на this._container
     * @param {Number} pageX Координаты курсора мыши по оси X во время перетаскивания
     */
    _dragProcess({ pageX }) {
        if(this._config.state.isDragging) {
            const difference = pageX - this._config.settings.dragParams.startPosition,
                type = difference < 0 ? "prev" : "next";
            if(Math.abs(difference) >= this._config.settings.dragParams.differenceForDrag) {
                this._slide.call(this, { type });
            }
        }
    }

    /**
     * @private
     * Завершает перетаскивания слайда/слайдов. Вызывается при событии "mouseup" и "mouseleave" на this._container
     */
    _dragStop() {
        this._container.classList.remove(TheaSlider.baseClasses.container.dragged);
        this._config.state.isDragging = false;
        this._config.settings.dragParams.startPosition = 0;
        return false;
    }

    /**
     * @private
     * Обрабатывает завершение перелистывания слайда/слайдов. Вызывает метод переключения активного слайда и создает иллюзию бесконечности слайдера, если infinite = true.
     * Вызывается при событии "transitionend" на this._container
     */
    _handleTransitionend() {
        if(this._config.settings.infinite) {
            if(this._config.offset.absolute > this._config.offset.max) {
                this._config.offset.position = -this._config.offset.min;
                this._config.state.actionType = "reset-start";
            }

            if(this._config.offset.absolute < this._config.offset.min) {
                this._config.offset.position = -this._config.offset.max;
                this._config.state.actionType = "reset-end";
            }

            this._container.style.left = `${this._config.offset.position}px`;

            if(this._config.state.actionType === "reset-start" || this._config.state.actionType === "reset-end") {
                this._toggleTransition();
            }
        }

        this._toggleActive();
        setTimeout(() => {
            if(this._config.settings.infinite && (this._config.state.actionType === "reset-start" || this._config.state.actionType === "reset-end")) {
                this._toggleTransition();
            }
            this._config.state.cooldown = false;
        }, this._config.settings.resetSpeed);
    }

    /**
     * @private
     * Переключает состояние слайдера и кнопки переключателя (если она есть) с паузы на активное
     */
    _toggleSliderState() {
        this._config.state.status = this._config.state.status === "paused" ? "active" : "paused";
        this._root.setAttribute("data-thea-slider-status", this._config.state.status);

        if(this._config.controls.buttons.toggle) {
            this._config.controls.buttons.toggle.setAttribute("data-thea-slider-status", this._config.state.status);
        }

        (this._config.state.status === "paused") ? clearTimeout(this._config.state.timeoutId) : this._autoplay();
    }

    /**
     * @private
     * Переключает активный слайд/слайды и точку (если точки есть)
     */
    _toggleActive() {
        this._toggleActiveSlide();
        if(this._config.controls.dots.isSet) {
            this._toggleActiveDot();
        }
    }

    /**
     * @private
     * Переключает только активный слайд/слайды
     */
    _toggleActiveSlide() {
        const current = [ ...this._config.state.activeIndex.slide ],
            next = [];

        if(this._config.state.actionType  === "next") {
            for(const activeIndex of Object.values(this._config.state.activeIndex.slide)) {
                next.push(activeIndex + this._config.slide.activeCount);
            }
        }

        if(this._config.state.actionType  === "prev") {
            for(const activeIndex of Object.values(this._config.state.activeIndex.slide)) {
                next.push(activeIndex - this._config.slide.activeCount);
            }
        }

        if(this._config.state.actionType  === "scroll") {
            while(next.length < this._config.slide.activeCount) {
                next.push(this._config.state.activeIndex.dot.next * this._config.slide.activeCount);
                if(this._config.state.activeIndex.dot.next > this._config.state.activeIndex.dot.prev || this._config.state.activeIndex.dot.next === 0) {
                    next.push( next[next.length - 1] + 1 );
                }

                if(this._config.state.activeIndex.dot.next < this._config.state.activeIndex.dot.prev) {
                    next.push((this._config.state.activeIndex.dot.next * this._config.slide.activeCount) + 1);
                    next.push( next[next.length - 1] - 1 );
                }
            }
        }

        if(this._config.state.actionType === "reset-start") {
            next.push(0);
            while(next.length < this._config.slide.activeCount) {
                next.push( next[next.length - 1] + 1 );
            }
        }

        if(this._config.state.actionType === "reset-end") {
            next.push(this._config.slide.lastSlideIndex);
            while(next.length < this._config.slide.activeCount) {
                next.push( next[next.length - 1] - 1 );
            }
        }

        next.length = this._config.slide.activeCount;
        this._config.state.activeIndex.slide = [ ...next ];

        for(const [ index, activate ] of Object.entries(this._config.state.activeIndex.slide)) {
            this._config.slide.collection.base[ current[index] ].classList.remove("active");
            this._config.slide.collection.base[ activate ].classList.add("active");
        }
    }

    /**
     * @private
     * Переключает только активную точку
     */
    _toggleActiveDot() {
        if(this._config.state.actionType  === "next") {
            this._config.state.activeIndex.dot = {
                prev: this._config.state.activeIndex.dot.next,
                next: this._config.state.activeIndex.dot.next + 1
            };
        }

        if(this._config.state.actionType  === "prev") {
            this._config.state.activeIndex.dot = {
                prev: this._config.state.activeIndex.dot.next,
                next: this._config.state.activeIndex.dot.next - 1
            };
        }

        if(this._config.state.actionType  === "reset-start") {
            this._config.state.activeIndex.dot = {
                prev: this._config.controls.dots.count - 1,
                next: 0
            };
        }

        if(this._config.state.actionType  === "reset-end") {
            this._config.state.activeIndex.dot = {
                prev: 0,
                next: this._config.controls.dots.count - 1
            };
        }

        this._config.controls.dots.collection[this._config.state.activeIndex.dot.prev].classList.remove("active");
        this._config.controls.dots.collection[this._config.state.activeIndex.dot.next].classList.add("active");
    }

    /**
     * @private
     * Включает/выключает css-свойство "transition" на this._container
     */
    _toggleTransition() {
        this._container.style.transition = this._config.settings.transition.enabled ? null : `left ${ this._config.settings.transition.transitionDuration }s ease 0s`;
        this._config.settings.transition.enabled = !this._config.settings.transition.enabled;
    }

    /**
     * Проверяет на ошибки все параметры, которые были переданы в конструктор. При возникновении ошибок пробрасывает исключение с сообщением об ошибке
     * @param  {...any} params Парамерты конструктора: root, controls, activeCount, transitionDuration, timeoutSpeed, infinite, autoplay, draggable, reversed
     */
    static checkConstructorParams(...params) {
        const { root, controls, activeCount, transitionDuration, timeoutSpeed, infinite, autoplay, draggable, reversed } = params[0];

        if(root) {
            if(!(root instanceof HTMLElement)) {
                throw new TypeError("root должен быть html элементом.");
            }
            if(!root.children.length) {
                throw new Error("root не содержит потомков (слайдов).")
            }
        } else {
            throw new Error("root (корневой элемент) не определен.");
        }

        if(controls) {
            if(typeof controls === "object") {
                const buttons = controls.buttons;
                const dots = controls.dots;

                if(!buttons && !dots) {
                    throw new Error("controls должен содержать хотя бы одно из свойств: buttons или dots.");
                }

                if(dots) {
                    if(typeof dots !== "object") {
                        throw new TypeError("controls.dots должен быть объектом.");
                    }

                    if(!Object.keys(dots).includes("container")) {
                        throw new Error("controls.dots должен содержать container.");
                    }

                    if(!(dots.container instanceof HTMLElement)) {
                        throw new TypeError(`dots.container должен быть html элементом.`);
                    }

                    if(dots.dotClass) {
                        if(typeof dots.dotClass !== "string" && !Array.isArray(dots.dotClass)) {
                            throw new TypeError(`dots.dotClass должен быть строкой или массивом.`);
                        }

                        if(dots.dotClass.includes(" ")) {
                            throw new Error("dots.dotClass не должен содержать пробелы.");
                        }
                    }
                }

                if(buttons) {
                    if(typeof buttons !== "object") {
                        throw new TypeError("controls.buttons должен быть объектом.");
                    }
                    if(!Object.keys(buttons).includes("next") || !Object.keys(buttons).includes("prev")) {
                        throw new Error("controls.buttons должен содержать оба свойства: next и prev.");
                    }
                    for(const [ name, element ] of Object.entries(buttons)) {
                        if(!(element instanceof HTMLElement)) {
                            throw new TypeError(`${name} должен быть html элементом.`);
                        }
                    }
                }

            } else {
                throw new TypeError("controls должен быть объектом.");
            }
        } else {
            throw new Error("controls (элементы управления) не определен.");
        }

        if(!isNaN(activeCount) && typeof activeCount !== "string" && isFinite(activeCount)) {
            if(root.children.length % activeCount !== 0) {
                throw Error("Общее количество слайдов должно быть кратно activeCount (делиться на него без остатка).");
            }
            if(activeCount <= 0) {
                throw Error("activeCount не может быть меньше или равным 0.");
            }
        } else {
            throw TypeError("activeCount должен быть числом.");
        }

        if(isNaN(transitionDuration) || typeof transitionDuration === "string" || !isFinite(transitionDuration)) {
            throw TypeError("transitionDuration должен быть числом.");
        }

        if(isNaN(timeoutSpeed) || typeof timeoutSpeed === "string" || !isFinite(timeoutSpeed)) {
            throw TypeError("timeoutSpeed должен быть числом.");
        }

        if(typeof infinite !== "boolean") {
            throw TypeError("infinite должен быть булевым значением.");
        }

        if(typeof autoplay !== "boolean") {
            throw TypeError("autoplay должен быть булевым значением.");
        }

        if(typeof draggable !== "boolean") {
            throw TypeError("draggable должен быть булевым значением.");
        }

        if(typeof reversed !== "boolean") {
            throw TypeError("reversed должен быть булевым значением.");
        }

    }

    // Набор классов, описанных в файле "thea-slider.scss"
    static baseClasses = {
        root: "thea-slider",
        container: {
            base: "thea-slider__container",
            dragged: "being-dragged"
        },
        slide: {
            before: "thea-slider__before-clone",
            after:  "thea-slider__after-clone",
            base: "thea-slider__slide",
        },
        control: {
            dots: "thea-slider__dots-container",
            dot: "thea-slider__dot"
        }
    }
}