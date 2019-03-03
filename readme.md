<p align="center">
    <a href="https://github.com/modularbp/modular-boilerplate">
        <img src="https://user-images.githubusercontent.com/4596862/37635200-aa3271b2-2bd0-11e8-8a65-9cafa0addd67.png" height="140">
    </a>
</p>
<h1 align="center">modularLoad</h1>
<p align="center">Dead simple page transitions and lazy loading.</p>

## Installation
```sh
npm install modularload
```

## Why
- Simple
- Lightweight
- Minimal configuration
- No dependencies

## Usage
```js
import modularLoad from 'modularload';

this.load = new modularLoad({
    enterDelay: 300
});
```
```html
<div data-load-container>
    <h1>Hello</h1>
    <a href="/blog">Read more</a>
</div>
```

#### With transitions
```js
import modularLoad from 'modularload';

this.load = new modularLoad({
    enterDelay: 300,
    transitions: {
        article: {
            enterDelay: 450
        },
        contact: {
            enterDelay: 600
        }
    }
});
```
```html
<html data-page="home">
   <body> 
        <nav>
            <a href="/contact" data-load="contact">Contact</a>
        </nav>
        <div data-load-container>
            <h1>Hello</h1>
            <a href="/blog" data-load="article">Read more</a>
        </div>
   </body>
</html> 
```

#### With lazy images
```js
import modularLoad from 'modularload';

this.load = new modularLoad();
```
```html
<div data-load-container>
    <header data-load-style="background-image: url('images/header.jpg');">
        <h1>Hello</h1>
    </header>
    <main>
        <img data-load-src="images/img.jpg">
        <a href="/blog">Read more</a>
    </main>
</div> 
```

#### With events
```js
import modularLoad from 'modularload';

this.load = new modularLoad();

this.load.on('loaded', (transition, oldContainer, newContainer) => {
    console.log('👌');

    if (transition == 'contact') {
        console.log('🤙');
    }
});
```

## Options
| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `name` | `string` | `'load'` | Data attributes name |
| `page` | `string` | `'page'` | Page data attribute name |
| `loadingClass` | `string` | `'is-loading'` | Class when a link is clicked |
| `loadedClass` | `string` | `'is-loaded'` | Class when the new container enters |
| `readyClass` | `string` | `'is-ready'` | Class when the old container exits |
| `transitionsPrefix` | `string` | `'is-'` | Custom transitions class prefix |
| `enterDelay` | `number` | `0` | Minimum delay before the new container enters |
| `exitDelay` | `number` | `0` | Delay before the old container exists after the new enters |
| `transitions` | `object` | `{}` | Custom transitions options |

## Attributes
| Attribute | Values | Description |
| --------- | ------ | ----------- |
| `data-load-container` |  | Container you want to load |
| `data-load` | `string`, `false` | Transition name or disable transition |
| `data-load-src` | `string` | Lazy load src attribute |
| `data-load-srcset` | `string` | Lazy load srcset attribute |
| `data-load-style` | `string` | Lazy load style attribute |
| `data-load-href` | `string` | Lazy load href attribute |
| `data-page` | `string` | Page name on html element |

## Events
| Event | Arguments | Description |
| ----- | --------- | ----------- |
| `loading` | `transition`, `oldContainer` | On link click |
| `loaded` | `transition`, `oldContainer`, `newContainer` | On new container enter |
| `ready` | `transition`, `newContainer` | On old container exit |
| `images` | | On all images load |
