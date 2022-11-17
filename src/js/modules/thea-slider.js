"use strict";

/**
 * Класс-конструктор компонента "слайдер", рассчитан на один текущий активный слайд. Работает вместе с файлом стилей "thea-slider.scss".
 */
export class TheaSlider {
    /**
     * @param {HTMLElement} root Корневой элемент. Обязательный параметр
     * @param {Object} controls Объект с настройками элементов управления. Обязательный параметр
     * @param {Number} startActive Индекс первого активного слайда
     * @param {Number} speed Скорость перелистывания (в обычных секундах)
     * @param {Boolean} infinite Если true, слайдер будет бесконечным
     * @param {Boolean} autoplay Включить по умолчанию
     * @param {Boolean} draggable Если true, слайды можно будет перетаскивать мышкой
     * @param {Boolean} reversed Если true, слайдер будет перелистываться в обратную сторону
     */
    constructor({ root, controls, startActive = 0, speed = 1, infinite = true, autoplay = true, draggable = true, reversed = false }) {
        if (root && root.children.length && controls) {

            this._root = root;
            this._slides = { items: Array.from(this._root.children) };
            this._configure(controls, startActive, speed, infinite, autoplay, draggable, reversed);

            this.init();
        }
    }


    /**
     * Базовые классы, необходимые для работы слайдера (описаны в файле стилей "thea-slider.scss").
     * @private
     */
    _prefixClass = "thea-slider";
    _baseClasses = {
        root: this._prefixClass,
        container: `${this._prefixClass}__container`,
        slide: `${this._prefixClass}__slide`,
        controls: {
            dots: {
                container: `${this._prefixClass}__dots`,
                dot: `${this._prefixClass}__dot`
            }
        }
    };

    /**
     * @param {Object} controls
     * @param {Number} startActive
     * @param {Number} speed
     * @param {Boolean} infinite
     * @param {Boolean} autoplay
     * @param {Boolean} draggable
     * @param {Boolean} reversed
     */
    _configure(controls, startActive, speed, infinite, autoplay, draggable, reversed) {
        this._config = {};

        const baseWidth       = this._root.offsetWidth,
              baseHeight      = this._root.offsetHeight,
              baseLength      = this._slides.items.length,
              transitionSpeed = speed * 1000;

        this._config.slide = {
            width: baseWidth,
            height: baseHeight,
            count: baseLength,
            lastIndex: baseLength - 1,
            activeIndex: startActive
        };

        this._config.offset = {
            left: -baseWidth * (infinite ? (startActive + 1) : startActive),
            width: baseWidth,
            min:  -baseWidth * (infinite ? (startActive + 1) : startActive),
            max:  -baseWidth * baseLength,
            speed: transitionSpeed
        };

        this._config.settings = {
            reversed: reversed,
            state: {
                status: autoplay ? "active" : "paused",
                cooldown: false,
                cooldownDelay: 300
            },
            autoplay: {
                isSet: autoplay,
                timerId: null
            },
            infinite: infinite,
            transition: `left ${speed}s ease 0s`,
            draggable: {
                isSet: draggable,
                currently: false,
                startDragPosition: 0,
                dragRequiredOffset: 5
            }
        };

        this._config.controls = {
            buttons: {
                isSet: ("buttons" in controls),
            },
            dots: {
                isSet: ("dots" in controls),
            }
        };

        if(this._config.controls.buttons.isSet) {
            this._config.controls.buttons.prev = controls.buttons.prev;
            this._config.controls.buttons.next = controls.buttons.next;
            this._config.controls.buttons.toggle = controls.buttons.toggle;
        }

        if(this._config.controls.dots.isSet) {
            this._config.controls.dots.container = controls.dots.container;
            this._config.controls.dots.dotClass = controls.dots.dotClass;
        }
    }


    /**
     * Инициазизация слайдера.
     */
    init() {
        if(this._config.settings.infinite) {
            this._slides.before = this._slides.items[this._slides.items.length - 1].cloneNode(true);
            this._slides.after = this._slides.items[0].cloneNode(true);
        }

        this._container = document.createElement("div");
        this._root.append(this._container);
        (this._config.settings.infinite) ? this._container.append(this._slides.before, ...this._slides.items, this._slides.after) : this._container.append(...this._slides.items);

        this._container.style.left = `${this._config.offset.left}px`;
        this._slides.items[this._config.slide.activeIndex].classList.add("active");

        this._setupBaseStyles();
        this._setupControls();
        this._setupHandlers();

        if(this._config.settings.autoplay) this._autoplay();
    }

    /**
     * Устанавливает базовые css-классы и стили.
     * @private
     */
    _setupBaseStyles() {
        this._root.classList.add(this._baseClasses.root);
        this._container.classList.add(this._baseClasses.container);
        this._container.style.transition = this._config.settings.transition;

        this._slides.items.forEach(slideItem => {
            slideItem.classList.add(this._baseClasses.slide);
            slideItem.style.width = `${this._config.slide.width}px`;
            slideItem.style.height = `${this._config.slide.height}px`;
        });

        if(this._config.settings.infinite) {

            const mainSlideClass = this._slides.items[0].className;

            this._slides.before.className = `${this._baseClasses.slide} ${mainSlideClass} clone-last`;
            this._slides.after.className  = `${this._baseClasses.slide} ${mainSlideClass} clone-first`;

            this._slides.before.style.width = `${this._config.slide.width}px`;
            this._slides.after.style.width  = `${this._config.slide.width}px`;

            this._slides.before.style.height = `${this._config.slide.height}px`;
            this._slides.after.style.height  = `${this._config.slide.height}px`;
        }
    }

    /**
     * Усталавливает элементы управления (или точки, или кнопки, или и то и другое).
     * @private
     */
    _setupControls() {
        if(this._config.controls.buttons.isSet && this._config.controls.buttons.toggle) {
            const { toggle } = this._config.controls.buttons;
            toggle.dataset.status = this._config.settings.state.status;
        }


        if(this._config.controls.dots.isSet) {
            const { container, dotClass } = this._config.controls.dots;
            const dotElements = [];

            container.classList.add(this._baseClasses.controls.dots.container);

            for(let point = 0; point < this._config.slide.count; point++) {
                const dotElement = document.createElement("span");
                dotElement.className = `${this._baseClasses.controls.dots.dot} ${dotClass}`;
                dotElement.dataset.point  = `${point}`;
                dotElements.push(dotElement);
            }

            dotElements[this._config.slide.activeIndex].classList.add("active");
            this._dots = dotElements;
            container.append(...dotElements);
        }
    }

    /**
     * Устанавливает обработчики события клика по элементам управления, какие были установлены или возможность перетаскивать слайды.
     * @private
     */
    _setupHandlers() {
        if(this._config.controls.buttons.isSet) {
            const { prev, next, toggle } = this._config.controls.buttons;
            prev.addEventListener("click",  this.prev.bind(this));
            next.addEventListener("click",  this.next.bind(this));
            if(toggle) {
                toggle.addEventListener("click",  this.toggle.bind(this));
            }
        }

        if(this._config.controls.dots.isSet) {
            this._config.controls.dots.container.addEventListener("click", event => {
                event.stopPropagation();
                const dotElement = event.target.closest("[data-point]");
                if(dotElement) {
                    const data = {
                        type: dotElement.dataset.action = "scroll",
                        index: +dotElement.dataset.point
                    };

                    this._slide.call(this, data);
                }
            });
        }

        if(this._config.settings.draggable.isSet) {
            this._container.addEventListener("mousedown", this._handleMouseDown.bind(this));
            this._container.addEventListener("mousemove", this._handleMouseDrag.bind(this));
            this._container.addEventListener("mouseup", this._stopDrag.bind(this));
            this._container.addEventListener("mouseleave", this._stopDrag.bind(this));
        }
    }

    /**
     * Перетаскивает слайд на один впреред или назад, в зависимости от координат курсора, относительно координат в момент клика.
     * @param {Number} pageX Координаы курсора во время перетаскивания (берется из event). Вызывается толко в обработчике "mousemove".
     * @private
     */
    _handleMouseDrag({ pageX }) {
        if(this._config.settings.draggable.currently) {
            const difference = pageX - this._config.settings.draggable.startDragPosition;
            if(Math.abs(difference) >= this._config.settings.draggable.dragRequiredOffset) {
                this._slide.call(this, { type: difference < 0 ? "prev" : "next" });
            }
        }
    }

    /**
     * Обрабатывает события mousedown.
     * @param {Object} event
     * @private
     */
    _handleMouseDown(event) {
        event.stopPropagation();
        event.preventDefault();
        this._container.classList.add("being-dragged");
        this._config.settings.draggable.startDragPosition = event.pageX;
        this._config.settings.draggable.currently = true;
    }

    /**
     * Прекращает перетаскивание слайдов (при событии "mouseup" или "mouseleave").
     * @param {Object} event
     * @private
     */
    _stopDrag(event) {
        this._container.classList.remove("being-dragged");
        this._container.removeEventListener("mousemove", this._stopDrag);

        this._config.settings.draggable.currently = false;
        this._config.settings.draggable.startDragPosition = 0;
        return false;
    }

    /**
     * Переключает актинвый слайд (деактивирует последний актинвый и включает новый, который был активирован)
     * @param activate
     * @private
     */
    _toggleActiveSlide(activate = true) {
        const action = activate ? "add" : "remove";
        this._slides.items[this._config.slide.activeIndex].classList[action]("active");
        if(this._config.controls.dots.isSet) {
            this._dots[this._config.slide.activeIndex].classList[action]("active");
        }
    }

    /**
     * Запускает слайдер, как только объект будет создан и настроен.
     * @private
     */
    _autoplay() {
        const $ = this;
        $._config.settings.autoplay.timerId = setTimeout(function autoplayTimeout() {
            if($._config.settings.state.status !== "paused") {
                $._slide.call($, {type: $._config.settings.reversed ? "prev" : "next"});
            }
            $._config.settings.autoplay.timerId = setTimeout(autoplayTimeout, $._config.offset.speed);
        }, 0);
    }

    /**
     * Ставит на паузу или возобновляет работу слайдера. Меняет флаг "this._config.settings.state.status" с "active" на "paused" и наоборот.
     * @private
     */
    _togglePause() {
        const status = this._config.settings.state.status === "active" ? "paused" : "active";
        this._config.settings.state.status = status;

        if(this._config.controls.buttons.toggle) {
            this._config.controls.buttons.toggle.dataset.status = status;
        }

        clearTimeout(this._config.autoplay.timerId);
    }

    /**
     * Проверяет, можно ли выполнить действие - сдвинуть слайды каким либо образом.
     * @param {String} type Тип действия (prev/next/scroll)
     * @param {Number} index Индекс слайда, который надо сделать актинвым (указывается только при type = "scroll")
     * @private
     */
    _able({ type, index = -1 }) {
        if(!this._config.settings.state.cooldown) {

            if(type === "prev") {
                return this._config.slide.activeIndex - 1 > 0 || this._config.settings.infinite;
            }

            if(type === "next") {
                return this._config.slide.activeIndex + 1 < this._config.slide.lastIndex || this._config.settings.infinite;
            }

            if(type === "scroll") {
                return index !== this._config.slide.activeIndex;
            }
        }

        return false;
    }

    /**
     * Выполняет сдвиг слайдера, в зависимости от переданного действия.
     * @param {String} type Тип действия (prev/next/scroll)
     * @param {Number} index Индекс слайда, который надо сделать актинвым (указывается только при type = "scroll")
     * @private
     */
    _slide({ type, index = -1 }) {
        if(this._able({ type, index })) {

            this._config.settings.state.cooldown = true;
            this._toggleActiveSlide(false);

            if(type === "next") {
                this._config.offset.left -= this._config.offset.width;
                this._config.slide.activeIndex++;
            }

            if(type === "prev") {
                this._config.offset.left += this._config.offset.width;
                this._config.slide.activeIndex--;
            }

            if(type === "scroll") {
                this._config.offset.left = -this._config.offset.width * ((this._config.settings.infinite) ? index + 1 : index);
                this._config.slide.activeIndex = index;
            }

            this._container.style.left = `${this._config.offset.left}px`;

            this._container.ontransitionend =  () => {
                this._container.style.transition = "left 0s ease 0s";
                this._config.slideByDot = false;

                if(this._config.slide.activeIndex === -1 || this._config.slide.activeIndex === this._config.slide.count) {
                    this._config.offset.left = this._config.slide.activeIndex === -1 ? this._config.offset.max : this._config.offset.min;
                    this._config.slide.activeIndex = this._config.slide.activeIndex === -1 ? this._config.slide.lastIndex : 0;
                    this._container.style.left = `${this._config.offset.left}px`;

                }

                this._toggleActiveSlide();
                setTimeout(() => {
                    this._container.style.transition = this._config.settings.transition;
                    this._config.settings.state.cooldown = false;
                    this._container.ontransitionend = null;
                }, this._config.settings.state.cooldownDelay);
            };
        }
    }

    /**
     * Переход к предыдущему слайду.
     */
    prev(event) {
        event.stopPropagation();
        this._slide({ type: "prev" });
    }

    /**
     * Переход к следующему слайду.
     */
    next(event) {
        event.stopPropagation();
        this._slide({ type: "next" });
    }

    /**
     * Ставит на паузу или возобновляет работу слайдера.
     */
    toggle(event) {
        event.stopPropagation();
        this._togglePause();
        this._autoplay();
    }
}