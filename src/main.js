export default class {
    constructor(options) {
        this.defaults = {
            name: 'load',
            loadingClass: 'is-loading',
            loadedClass: 'is-loaded',
            readyClass: 'is-ready',
            transitionsPrefix: 'is-',
            enterDelay: 0,
            exitDelay: 0,
            isLoaded: false,
            isEntered: false,
            isUrl: false,
            transitionContainer: null
        }

        Object.assign(this, this.defaults, options);

        this.options = options;
        this.namespace = 'modular';
        this.html = document.documentElement;
        this.href = window.location.href;
        this.container = 'data-' + this.name + '-container';
        this.subContainer = false;
        this.prevTransition = null;
        this.loadAttributes = ['src', 'srcset', 'style', 'href'];
        this.isInserted = false;
        this.isLoading = false;
        this.enterTimeout = false;
        this.controller = new AbortController();

        this.classContainer = this.html;

        this.isChrome = (navigator.userAgent.indexOf("Chrome") != -1) ? true : false;

        this.init();
    }

    init() {
        window.addEventListener('popstate', (e) => this.checkState(e), false);
        this.html.addEventListener('click', (e) => this.checkClick(e), false);

        this.loadEls(document);
    }

    checkClick(e) {
        if (!e.ctrlKey && !e.metaKey) {
            let target = e.target;

            while (target && target !== document) {
                if (target.matches('a')) {
                    e.preventDefault();

                    this.reset();
                    this.getClickOptions(target);
                    break;
                }

                target = target.parentNode;
            };
        }
    }

    checkState() {
        this.reset();
        this.getStateOptions();
    }

    reset() {
        if (this.isLoading) {
            this.controller.abort();
            this.isLoading = false;
            this.controller = new AbortController();
        }

        window.clearTimeout(this.enterTimeout);

        if (this.isInserted) {
            this.removeContainer();
        }

        this.classContainer = this.html;
        Object.assign(this, this.defaults, this.options);
    }

    getClickOptions(link) {
        this.transition = link.getAttribute('data-' + this.name);
        this.isUrl = link.getAttribute('data-' + this.name + '-url');
        const href = link.getAttribute('href');
        const target = link.getAttribute('target');

        if (target == '_blank') {
            window.open(href, '_blank');
            return;
        }

        if (this.transition == 'false') {
            window.location = href;
            return;
        }

        if (href.startsWith('#')) {
            return;
        }

        this.setOptions(href, true);
    }

    getStateOptions() {
        this.transition = history.state;

        const href = window.location.href;
        this.setOptions(href);
    }

    setOptions(href, push) {
        let container = '[' + this.container + ']';
        let oldContainer;

        if (this.transition && this.transition != 'true') {
            this.transitionContainer = '[' + this.container + '="' + this.transition + '"]';
            this.loadingClass = this.transitions[this.transition].loadingClass || this.loadingClass;
            this.loadedClass = this.transitions[this.transition].loadedClass || this.loadedClass;
            this.readyClass = this.transitions[this.transition].readyClass || this.readyClass;
            this.transitionsPrefix = this.transitions[this.transition].transitionsPrefix || this.transitionsPrefix;
            this.enterDelay = this.transitions[this.transition].enterDelay || this.enterDelay;
            this.exitDelay = this.transitions[this.transition].exitDelay || this.exitDelay;

            oldContainer = document.querySelector(this.transitionContainer);
        }

        if (oldContainer) {
            container = this.transitionContainer;
            this.oldContainer = oldContainer;
            this.classContainer = this.oldContainer.parentNode;

            if (!this.subContainer) {
                history.replaceState(this.transition, null, this.href);
            }

            this.subContainer = true;
        } else {
            this.oldContainer = document.querySelector(container);

            if (this.subContainer) {
                history.replaceState(this.prevTransition, null, this.href);
            }

            this.subContainer = false;
        }

        this.href = href;
        this.parentContainer = this.oldContainer.parentNode;

        if (this.isUrl === '' || this.isUrl != null && this.isUrl != 'false' && this.isUrl != false) {
            history.pushState(this.transition, null, href);
        } else {
            this.oldContainer.classList.add('is-old');

            this.setLoading();
            this.startEnterDelay();
            this.goTo(href, container, push);
        }
    }

    setLoading() {
        this.classContainer.classList.remove(this.loadedClass, this.readyClass);
        this.classContainer.classList.add(this.loadingClass);

        this.classContainer.classList.remove(this.transitionsPrefix + this.prevTransition);
        if (this.transition) {
            this.classContainer.classList.add(this.transitionsPrefix + this.transition);
        }

        if (!this.subContainer) {
            this.prevTransition = this.transition;
        }

        const loadingEvent = new Event(this.namespace + 'loading');
        window.dispatchEvent(loadingEvent);
    }

    startEnterDelay() {
        this.enterTimeout = window.setTimeout(() => {
            this.isEntered = true;

            if (this.isLoaded) {
                this.transitionContainers();
            }
        }, this.enterDelay);
    }

    goTo(href, container, push) {
        this.isLoading = true;
        const signal = this.controller.signal;

        fetch(href, {signal})
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                this.data = parser.parseFromString(data, 'text/html');

                this.newContainer = this.data.querySelector(container);
                this.newContainer.classList.add('is-new');
                this.parentNewContainer = this.newContainer.parentNode;

                this.hideContainer();

                this.parentContainer.insertBefore(this.newContainer, this.oldContainer);
                this.isInserted = true;

                this.setSvgs();

                this.isLoaded = true;

                if (this.isEntered) {
                    this.transitionContainers();
                }

                this.loadEls(this.newContainer);
                this.isLoading = false;
            })
            .catch(err => {

            })

        if (push) {
            history.pushState(this.transition, null, href);
        }
    }

    transitionContainers() {
        this.setAttributes();
        this.showContainer();
        this.setLoaded();

        setTimeout(() => {
            this.removeContainer();
            this.setReady();
        }, this.exitDelay);
    }

    setSvgs() {
        if (this.isChrome) {
            const svgs = this.newContainer.querySelectorAll('use');

            if (svgs.length) {
                svgs.forEach((svg) => {
                    const xhref = svg.getAttribute('xlink:href');
                    if (xhref) {
                        svg.parentNode.innerHTML = '<use xlink:href="' + xhref + '"></use>';
                    } else {
                        const href = svg.getAttribute('href');
                        if (href) svg.parentNode.innerHTML = '<use href="' + href + '"></use>';
                    }
                });
            }
        }
    }

    setAttributes() {
        const title = this.data.getElementsByTagName('title')[0];
        const description = this.data.head.querySelector('meta[name="description"]');
        let container;
        let newContainer;

        if (this.subContainer) {
            newContainer = this.parentNewContainer;
            container = document.querySelector(this.transitionContainer).parentNode;
        } else {
            newContainer = this.data.querySelector('html');
            container = document.querySelector('html');
        }

        const datas = Object.assign({}, newContainer.dataset);

        if (title) document.title = title.innerHTML;
        if (description) document.head.querySelector('meta[name="description"]').setAttribute('content', description.getAttribute('content'));
        if (datas) {
            Object.entries(datas).forEach(([key, val]) => {
                container.setAttribute('data-' + this.toDash(key), val);
            });
        }
    }

    toDash(str) {
        return str.split(/(?=[A-Z])/).join('-').toLowerCase();
    }

    hideContainer() {
        this.newContainer.style.visibility = 'hidden';
        this.newContainer.style.height = 0;
        this.newContainer.style.overflow = 'hidden';
    }

    showContainer() {
        this.newContainer.style.visibility = '';
        this.newContainer.style.height = '';
        this.newContainer.style.overflow = '';
    }

    loadEls(container) {
        let promises = [];

        this.loadAttributes.forEach((attr) => {
            const data = 'data-' + this.name + '-' + attr;
            const els = container.querySelectorAll('[' + data + ']');

            if (els.length) {
                els.forEach((el) => {
                    const elData = el.getAttribute(data);
                    el.setAttribute(attr, elData);

                    if (attr == 'src' || attr == 'srcset') {
                        const promise = new Promise(resolve => {
                            el.onload = () => resolve(el);
                        })
                        promises.push(promise);
                    }
                });
            }
        });

        Promise.all(promises).then(val => {
            const imagesEvent = new Event(this.namespace + 'images');
            window.dispatchEvent(imagesEvent);
        });
    }

    setLoaded() {
        this.classContainer.classList.remove(this.loadingClass);
        this.classContainer.classList.add(this.loadedClass);

        const loadedEvent = new Event(this.namespace + 'loaded');
        window.dispatchEvent(loadedEvent);
    }

    removeContainer() {
        this.parentContainer.removeChild(this.oldContainer);
        this.newContainer.classList.remove('is-new');
        this.isInserted = false;
    }

    setReady() {
        this.classContainer.classList.add(this.readyClass);

        const readyEvent = new Event(this.namespace + 'ready');
        window.dispatchEvent(readyEvent);
    }

    on(event, func) {
        window.addEventListener(this.namespace + event, () => {
            switch (event) {
                case 'loading':
                    return func(this.transition, this.oldContainer);
                case 'loaded':
                    return func(this.transition, this.oldContainer, this.newContainer);
                case 'ready':
                    return func(this.transition, this.newContainer);
                default:
                    return func();
            }
        }, false);
    }
}
