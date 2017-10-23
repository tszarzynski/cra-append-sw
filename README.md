# cra-append-sw

  Utility tool to append custom code to ServiceWorker created by [Create React App](https://github.com/facebookincubator/create-react-app).

## Installation

    $ npm install commander --save

## Usage

    $ cra-append-sw [options] <file>


### Options:

    -s, --skip-compile  Skip compilation
    -h, --help          output usage information

## Usage with Create React App

  In `package.json` modify build script to:

    "build": "react-scripts build && cra-append-sw ./custom-sw.js",
