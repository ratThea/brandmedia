"use strict";

/**
 * Создает компонент "Табы" (вкладки, переключающие контент). Требует необходимой разметки.
 * Рабоает вместе с файлом стилей "thea.tabs.scss".
 */
export class TheaTabs {
  /**
   * @param {Object} root Корневой html-элемент вкладок
   * @param {Number} startActive Индекс первого активной вкладки
   * @param {Boolean} equalify Если true, установит всем вкладкам одинаковую высоту
   * @param {String} hideType Как скрывать элемент: "display" через display: none/flex, "visually" через visibility и width/height
   */
  constructor({ root, startActive = 0, equalify = true, hideType = "display" }) {
    if(root) {
      this._root = root;
      this._configure(startActive, equalify, hideType);

      this.init();
    }
  }

  /**
   * Базовые классы, необходимые для работы вкладок (описаны в файле стилей "thea-tabs.scss").
   * @private
   */
  _prefixClass = "thea-tabs";
  _baseClasses = {
    root: this._prefixClass,
    header: `${ this._prefixClass }__header`,
    body: `${ this._prefixClass }__body`,
    button: `${ this._prefixClass }__button`,
    content: `${ this._prefixClass }__content`,
    hideType: {
      display: [ "thea-tabs_display-base", "thea-tabs_display-show" ],
      visually: [ "thea-tabs_visually-base", "thea-tabs_visually-show" ]
    }
  };

  /**
   * Инициализация вкладок.
   */
  init() {
    this._setupBase();
    this._setupHandlers();
  }

  /**
   * Создание и (или) настройка элементов управления вкладками. Параметры дублируют конструктор.
   * @param {Number} startActive
   * @param {Boolean} equalify
   * @param {String} hideType
   * @private
   */
  _configure(startActive, equalify, hideType) {
    this._config = {};

    if(equalify) {
      this._config.tabContent = {
        maxHeight: Math.max(...Array.from(this._root.children[1].children).map(item => item.offsetHeight)),
      };
    }

    this._config.params = {
      equalify: equalify,
      activeTabIndex: startActive,
      hideType: {
        hiddenClass: hideType === "display" ? this._baseClasses.hideType.display[0] : this._baseClasses.hideType.visually[0],
        activeClass: hideType === "display" ? this._baseClasses.hideType.display[1] : this._baseClasses.hideType.visually[1]
      }
    }
  }

  /**
   * Устанавливает обработчик клика на табы.
   * @private
   */
  _setupHandlers() {
    this._root.addEventListener("click", event => {
      const button = event.target.closest(`[data-point]`);

      if(button) {
        const activateIndex = +button.dataset.point;
        if(activateIndex !== this._config.params.activeTabIndex) {
          this._toggleActive(activateIndex);
        }
      }

    });
  }

  /**
   * Добавляет css-классы компонента и выполняет первоначальную настройку.
   * @private
   */
  _setupBase() {
    this._buttons = Array.from(this._root.children[0].children);
    this._contents = Array.from(this._root.children[1].children);

    this._root.classList.add(this._baseClasses.root);
    this._root.children[0].classList.add(this._baseClasses.header);
    this._root.children[1].classList.add(this._baseClasses.body);

    if(this._buttons.length === this._contents.length) {
      this._buttons.forEach((button, index) => {
        button.classList.add(this._baseClasses.button);
        button.dataset.point = `${ index }`;

        this._contents[index].classList.add(this._baseClasses.content);
        this._contents[index].classList.add(this._config.params.hideType.hiddenClass);
      });
    }

    this._buttons[this._config.params.activeTabIndex].classList.add("active");
    this._contents[this._config.params.activeTabIndex].classList.add("active");
    this._contents[this._config.params.activeTabIndex].classList.add(this._config.params.hideType.activeClass)

    if(this._config.params.equalify) this._equalifyHeights();
  }

  /**
   * Переключает вкладки: деактивирует текущую, активирует новую.
   * @param {Number} index Индекс вкладки, которую надо активировать
   * @private
   */
  _toggleActive(index) {
    this._buttons[this._config.params.activeTabIndex].classList.remove("active");
    this._contents[this._config.params.activeTabIndex].classList.remove("active");
    this._contents[this._config.params.activeTabIndex].classList.remove(this._config.params.hideType.activeClass);

    this._buttons[index].classList.add("active");
    this._contents[index].classList.add("active");
    this._contents[index].classList.add(this._config.params.hideType.activeClass);

    this._config.params.activeTabIndex = index;
  }

  /**
   * Устанавливает содержимым всех вкладок одинаковую высоту.
   * @private
   */
  _equalifyHeights() {
    this._contents.forEach(tabContent => tabContent.style.height = `${ this._config.tabContent.maxHeight }px`);
  }

}