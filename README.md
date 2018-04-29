Piskel
======

[![Travis Status](https://api.travis-ci.org/piskelapp/piskel.png?branch=master)](https://travis-ci.org/piskelapp/piskel) [![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

<img
  src="https://screenletstore.appspot.com/img/95aaa0f0-37a4-11e7-a652-7b8128ce3e3b.png"
  title="Piskel editor screenshot"
  width="500">

## About Piskel
Piskel is an open-source, easy-to-use sprite editor for creating game sprites, animations and pixel-art. Free web-based and offline versions are also available at **[piskelapp.com](http://piskelapp.com)**.


## Table of Contents

## Installation
### Development Environment Setup
#### Install [Node.js](https://nodejs.org/en/)

Node.js is an open-source, cross-platform JavaScript runtime environment built on Chrome's V8 JavaScript engine. The single-threaded, non-blocking event loop and low-level I/O API make Node.js lightweight and efficient. Node.js is bundled with `npm`,  npm is the package manager for JavaScript and the world's largest software registry.

* [Download](https://nodejs.org/en/download/) the Node.js installer or binary file.
* Visit the Node.js community wiki [Installation page](https://github.com/nodejs/node/wiki/Installation) for indepth guides on installing/building Node.js in Windows, Mac OS X, Linux, etc.
* **Note:** Node.js does not automatically update `npm`. Use command lines to manually update `npm` after installation is complete.
  - Check which version of npm is installed with the command `npm -v`
  - If the installed version is not the latest version, a manual update using command lines may be necessary
  - For Windows: `npm install npm --global // Update the `npm` CLI client`
  - For Mac OS X: `sudo npm install npm --global // Update the `npm` CLI client`
  - For most other platforms: `npm install npm@latest -g` or `npm install npm@next`

## Testing
#### [Unit Tests](https://github.com/piskelapp/piskel/wiki/Test-Guidelines-%3A-Unit-tests)
#### [Drawing Tests](https://github.com/piskelapp/piskel/wiki/Test-Guidelines-%3A-Drawing-tests)
#### [Integration Tests](https://github.com/piskelapp/piskel/wiki/Test-Guidelines-%3A-Integration-tests)

### Build

The Piskel editor is purely built in **JavaScript, HTML and CSS**.

The following **libraries** are also used :
* [spectrum](https://github.com/bgrins/spectrum) : standalone colorpicker
* [gifjs](http://jnordberg.github.io/gif.js/) : generate animated GIFs in javascript, using webworkers
* [supergif](https://github.com/buzzfeed/libgif-js) : modified version of SuperGif to parse and import GIFs
* [jszip](https://github.com/Stuk/jszip) : create, read and edit .zip files with Javascript
* [canvas-toBlob](https://github.com/eligrey/canvas-toBlob.js/) : shim for canvas toBlob
* [jquery](http://jquery.com/) : used sporadically in the application
* [bootstrap-tooltip](http://getbootstrap.com/javascript/#tooltips) : tooltips

As well as some **icons** from the [Noun Project](http://thenounproject.com/) :
* Folder by Simple Icons from The Noun Project

## Related Projects

### **[Web-based Version](https://github.com/piskelapp/piskel-website)** of Piskel

  Featured on **[piskelapp.com](http://piskelapp.com)**. 

  Supports the following browsers: **Chrome, Firefox, Edge and Internet Explorer 11**

### Desktop Versions of Piskel
  Offline desktop versions are available for **[download at piskelapp.com](https://www.piskelapp.com/download)**.

  Available for the following operating systems: **Windows, Mac OS X and Linux**
  
  More details can be found on the [dedicated wiki page](https://github.com/piskelapp/piskel/wiki/Desktop-applications).

## Contributing
Contributors are always welcome. To maintain consistency and coherency, please review these guidelines before submitting.
* Discuss any changes you wish to make with juliandescottes via issue, email, or twitter before making a change. Contact information is provided in the following Support section.
* Consistency is maintained through a mandatory [Code Style](https://github.com/piskelapp/piskel/wiki/Code-Style).
* Update the README.md with details of changes to the interface, additional environment variables, new testing protocols, links to useful documentation as added, etc.

## Support

For general questions, website account information or a support request:
   * Twitter: send a direct message to **[@piskelapp](https://twitter.com/piskelapp)**
   * Email: send an email to julian@piskelapp.com

For bug reports, feature proposals and contribution requests:
* **[Piskel issues](https://github.com/piskelapp/piskel/issues)** for the editor
* **[Piskel-website issues](https://github.com/piskelapp/piskel-website/issues)** for anything else (user pages, piskel pages etc...)


## License

Copyright 2017 Julian Descottes

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

