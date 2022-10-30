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
   */
  constructor({ root, startActive = 0, equalify = true }) {
    if(root) {
      this._setupBase(root, startActive, equalify);
      this._setupHandler();
    }
  }

  /**
   * Базовые классы, необходимые для работы вкладок (описаны в файле стилей "thea-tabs.scss").
   * @private
   */
  _name = "thea-tabs";
  _baseClasses = {
    root: this._name,
    header: `${ this._name }__header`,
    body: `${ this._name }__body`,
    button: `${ this._name }__button`,
    content: `${ this._name }__content`
  };

  /**
   * Установка базовой html-размеки, добавление необходимых css-классов и стилей.
   * @param {Object} root
   * @param {Number} startActive
   * @param {Boolean} equalify
   * @private
   */
  _setupBase(root, startActive, equalify) {
    this._root = root;
    this._buttons = Array.from(this._root.children[0].children);
    this._contents = Array.from(this._root.children[1].children);

    this._configure(startActive, equalify);

    this._root.classList.add(this._baseClasses.root);
    this._root.children[0].classList.add(this._baseClasses.header);
    this._root.children[1].classList.add(this._baseClasses.body);

    if(this._buttons.length === this._contents.length) {
      this._buttons.forEach((button, index) => {
        button.classList.add(this._baseClasses.button);
        button.dataset.point = `${ index }`;
        this._contents[index].classList.add(this._baseClasses.content);
      });
    }

    this._buttons[this._config.params.activeTab].classList.add("active");
    this._contents[this._config.params.activeTab].classList.add("active");

    if(this._config.params.equalify) this._equalifyHeights();
  }

  /**
   * Создание и (или) настройка элементов управления вкладками.
   * @param {Number} startActive
   * @param {Boolean} equalify
   * @private
   */
  _configure(startActive, equalify) {
    this._config = {};

    if(equalify) {
      this._config.tabContent = {
        maxHeight: Math.max(...this._contents.map(item => item.offsetHeight)),
      };
    }

    this._config.params = {
      equalify: equalify,
      activeTab: startActive
    }
  }

  /**
   * Устанавливает обработчк на табы.
   * @private
   */
  _setupHandler() {
    this._root.addEventListener("click", event => {
      const button = event.target.closest(`[data-point]`);

      if(button) {
        const activateIndex = +button.dataset.point;
        if(activateIndex !== this._config.params.activeTab) {
          this._toggleActive(activateIndex);
        }
      }

    });
  }

  /**
   *
   * @param {Number} index Индекс вкладки, которую надо активировать
   * @private
   */
  _toggleActive(index) {
    this._buttons[this._config.params.activeTab].classList.remove("active");
    this._contents[this._config.params.activeTab].classList.remove("active");

    this._buttons[index].classList.add("active");
    this._contents[index].classList.add("active");

    this._config.params.activeTab = index;
  }

  /**
   * Устанавливает содержимым всех вкладок одинаковую высоту.
   * @private
   */
  _equalifyHeights() {
    this._contents.forEach(tabContent => tabContent.style.height = `${ this._config.tabContent.maxHeight }px`);
  }

}