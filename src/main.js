export default class {
    constructor(options) {
        this.defaults = {
            name: 'load',
            loadingClass: 'is-loading',
            loadedClass: 'is-loaded',
            readyClass: 'is-ready',
            transitionsPrefix: 'is-',
            enterDelay: 0,
            exitDelay: 0
        }

        Object.assign(this, this.defaults, options);

        this.namespace = 'modular';
        this.html = document.documentElement;
        this.container = '[data-' + this.name + '-container]';
        this.loadAttributes = ['src', 'srcset', 'style', 'href'];

        this.isLoaded = false;
        this.isEntered = false;

        this.isChrome = (navigator.userAgent.indexOf("Chrome") != -1) ? true : false;

        this.init();
    }

    init() {
        window.addEventListener('click', (e) => this.checkClick(e), false);
        window.addEventListener('popstate', (e) => this.checkState(e), false);

        this.loadEls(document);
    }

    checkClick(e) {
        e.preventDefault();

        let target = e.target;

        while (target && target !== document) {
            if (target.matches('a')) {
                this.reset();
                this.getClickOptions(target);
                break;
            }

            target = target.parentNode;
        };
    }

    checkState() {
        this.reset();
        this.getStateOptions();
    }

    reset() {
        this.html.classList.remove(this.loadedClass, this.readyClass);
        this.isEntered = false;
        this.isLoaded = false;

        if (this.transition) {
            this.html.classList.remove(this.transitionsPrefix + this.transition);
        }
    }

    getClickOptions(link) {
        this.transition = link.getAttribute('data-' + this.name);
        const href = link.getAttribute('href');
        const target = link.getAttribute('target');

        if (target == '_blank') {
            window.open(href, '_blank');
            return;
        }

        if (this.transition == 'false' || href.startsWith('#')) {
            window.location = href;
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
        let enterDelay = this.enterDelay;
        let exitDelay = this.exitDelay;

        if (this.transition && this.transition != 'true') {
            enterDelay = this.transitions[this.transition].enterDelay || this.enterDelay;
            exitDelay = this.transitions[this.transition].exitDelay || this.exitDelay;
        }

        this.oldContainer = document.querySelector(this.container);
        this.oldContainer.classList.add('is-old');

        this.setLoading();
        this.startEnterDelay(enterDelay, exitDelay);
        this.goTo(href, exitDelay, push);
    }

    setLoading() {
        this.html.classList.add(this.loadingClass);

        if (this.transition) {
            this.html.classList.add(this.transitionsPrefix + this.transition);
        }

        const loadingEvent = new Event(this.namespace + 'loading');
        window.dispatchEvent(loadingEvent);
    }

    startEnterDelay(enterDelay, exitDelay) {
        setTimeout(() => {
            this.isEntered = true;

            if (this.isLoaded) {
                this.transitionContainers(exitDelay);
            }
        }, enterDelay);
    }

    goTo(href, exitDelay, push) {
        fetch(href)
            .then(response => response.text())
            .then(data => {
                this.isLoaded = true;
                this.parentContainer = this.oldContainer.parentNode;

                const parser = new DOMParser();
                data = parser.parseFromString(data, 'text/html');

                this.newContainer = data.querySelector(this.container);
                this.newContainer.classList.add('is-new');

                this.hideContainer();

                this.parentContainer.insertBefore(this.newContainer, this.oldContainer);

                this.setSvgs();
                this.setAttributes(data);

                if (this.isEntered) {
                    this.transitionContainers(exitDelay);
                }

                this.loadEls(this.newContainer);
            })

        if (push) {
            history.pushState(this.transition, null, href);
        }
    }

    transitionContainers(exitDelay) {
        this.showContainer();
        this.setLoaded();

        setTimeout(() => {
            this.removeContainer();
            this.setReady();
        }, exitDelay);
    }

    setSvgs() {
        if (this.isChrome) {
            const svgs = this.newContainer.querySelectorAll('use');

            if (svgs.length) {
                svgs.forEach((svg) => {
                    const xhref = svg.getAttribute('xlink:href');
                    if (xhref) {
                        svg.setAttribute('xlink:href', xhref);
                    } else {
                        const href = svg.getAttribute('href');
                        if (href) svg.setAttribute('href', href);
                    }
                });
            }
        }
    }

    setAttributes(data) {
        const title = data.getElementsByTagName('title')[0];
        const description = data.head.querySelector('meta[name="description"]');
        const datas = Object.assign({}, data.querySelector('html').dataset);

        if (title) document.title = title.innerHTML;
        if (description) document.head.querySelector('meta[name="description"]').setAttribute('content', description.getAttribute('content'));
        if (datas) {
            Object.entries(datas).forEach(([key, val]) => {
                document.querySelector('html').setAttribute('data-' + key, val);
            });
        }
    }

    hideContainer() {
        this.newContainer.style.visibility = 'hidden';
        this.newContainer.style.height = 0;
        this.newContainer.style.overflow = 'hidden';
    }

    showContainer() {
        this.newContainer.style.visibility = 'visible';
        this.newContainer.style.height = 'auto';
        this.newContainer.style.overflow = 'auto';
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
        this.html.classList.add(this.loadedClass);
        this.html.classList.remove(this.loadingClass);

        const loadedEvent = new Event(this.namespace + 'loaded');
        window.dispatchEvent(loadedEvent);
    }

    removeContainer() {
        this.parentContainer.removeChild(this.oldContainer);
        this.newContainer.classList.remove('is-new');
    }

    setReady() {
        this.html.classList.add(this.readyClass);

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
