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
- [Installation](#installation)
  * [Prerequisites](#prerequisites)
  * [Development Environment Setup](#development-environment-setup)
    + [Install Node.js](#install-nodejs)
    + [Update npm](#update-npm)
    + [Install Grunt-CLI](#install-grunt-cli)
    + [Repository Setup and Grunt Installation](#repository-setup-and-grunt-installation)
- [Testing](#testing)
    + [Unit Tests](#unit-tests)
    + [Drawing Tests](#drawing-tests)
    + [Integration Tests](#integration-tests)
- [Build](#build)
- [Related Projects](#related-projects)
  * [Website Version of Piskel](#website-version-of-piskel)
  * [Desktop Version of Piskel](#desktop-version-of-piskel)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Installation
### Prerequisites
To build piskel, you need:

1. Node.js - A Javascript runtime environment.
2. Grunt-CLI - The Grunt command line interface.
3. Grunt - A JavaScript task runner.

### Development Environment Setup
#### Install Node.js

Node.js is an open-source, cross-platform JavaScript runtime environment built on Chrome's V8 JavaScript engine. The single-threaded, non-blocking event loop and low-level I/O API make Node.js lightweight and efficient. Node.js is bundled with `npm`, the package manager for JavaScript and the world's largest software registry.

* [Download](https://nodejs.org/en/download/) the Node.js installer or binary file.
* Visit the Node.js community wiki [Installation page](https://github.com/nodejs/node/wiki/Installation) for indepth guides on installing/building Node.js in Windows, Mac OS X, Linux, etc.

#### Update npm

* **Note:** Node.js does not automatically update `npm`. Use command lines to manually update `npm` after installation.
  - Check which version of npm is installed with the `npm -v` command.
  - If the installed version of `npm` is not the latest version, perform a manual update by running `npm update -g npm` or `npm update`. Mac OS X requires the `sudo` prefix.
* Grunt and Grunt-CLI are installed via npm. Update npm **before** beginning the installation process for Grunt and Grunt-CLI.
* More indepth information on npm can be found [here](https://www.npmjs.com/).

#### Install Grunt-CLI

Grunt-CLI is the Grunt command line interface. Installing Grunt-CLI globally enables the `grunt` command to be used anywhere on the user's system irregardless of the Grunt version installed locally to the project.

* Run `npm install -g grunt-cli` to install Grunt-CLI globally.
  - Windows: Run as Administrator
  - Mac OS X: May require the `sudo` prefix
* Instructions on configuring Grunt-CLI can be found on Grunt's [Installing the CLI](https://gruntjs.com/using-the-cli) page.
  
#### Repository Setup and Grunt Installation
* Clone the repository from [piskel's github](https://github.com/piskelapp/piskel) page.
* Enter the directory from the command prompt using `cd piskel` and locally install the project dependencies by running `npm install`.
* Check `npm install` worked correctly by confirming a node_modules directory exists. The new directory should contain the `grunt` package.
  - Run `dir node_modules` to view a list of packages included in the directory.
  - If grunt is not listed in the directory, run `npm install grunt` to install `grunt` locally.
  - Run `dir node_modules` again to verify the `grunt` package was installed.
* If depriciation warnings or other errors appear, run `npm update` in the piskel directory.
* For further troubleshooting and installation tips, see the **Working with an existing Grunt project** section of Grunt's official [Getting started](https://gruntjs.com/getting-started) page. Also see the official npm [Getting Started](https://docs.npmjs.com/getting-started/what-is-npm) section.

## Testing

#### Unit Tests
* Karma / Jasmine unit tests for utilities and services.
* [Unit Tests Wiki Page](https://github.com/piskelapp/piskel/wiki/Test-Guidelines-%3A-Unit-tests) 

#### Drawing Tests
* Custom integration tests for drawing tools using a record/replay utility.
* [Drawing Tests Wiki Page](https://github.com/piskelapp/piskel/wiki/Test-Guidelines-%3A-Drawing-tests) 

#### Integration Tests
* CasperJS integration tests for controllers.
* [Integration Tests Wiki Page](https://github.com/piskelapp/piskel/wiki/Test-Guidelines-%3A-Integration-tests) 


## Build

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

### Website Version of Piskel
  Featured on **[piskelapp.com](http://piskelapp.com)**.
  
  Source code is located on the [Piskel-Website GitHub](https://github.com/piskelapp/piskel-website) page.

  Supports the following browsers: **Chrome, Firefox, Edge and Internet Explorer 11**

### Desktop Version of Piskel
  Offline desktop versions are available for **[download at piskelapp.com](https://www.piskelapp.com/download)**.

  Available for the following operating systems: **Windows, Mac OS X and Linux**
  
  More details can be found on the [dedicated wiki page](https://github.com/piskelapp/piskel/wiki/Desktop-applications).

## Contributing
Contributors are always welcome. To maintain consistency and coherency, please review these guidelines before submitting.
* Discuss any changes you wish to make with juliandescottes via issue, email, or twitter before making a change. Contact information is provided in the following Support section.
* Consistency is maintained through a mandatory [Code Style](https://github.com/piskelapp/piskel/wiki/Code-Style).
* Any new dialog has to be registered in DialogsController.js document.
* New js & css files need to be listed in piskel-script-list.js and piskel-style-list.js documents.
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

