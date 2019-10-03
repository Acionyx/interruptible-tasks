[![Build Status](https://img.shields.io/npm/v/interruptible-tasks)](http://npmjs.com/package/interruptible-tasks)
[![Build Status](https://travis-ci.com/Acionyx/interruptible-tasks.svg?token=EeHNf4zTWPNyX4W8qBTN&branch=master)](https://travis-ci.com/Acionyx/interruptible-tasks)
[![Coverage Status](https://coveralls.io/repos/github/Acionyx/interruptible-tasks/badge.svg?branch=master)](https://coveralls.io/github/Acionyx/interruptible-tasks?branch=master)

# Interruptible-tasks

Interruptible Tasks is a JavaScript library for creating manageable,
interruptible and cancelable async functions - **Tasks**.

## The Why

This library was created in order to manage complex async flow without pain.

Sometimes if you have to know execution status of some async function,
you will finish up with adding manual "status" updates inside of function.
If your function could breaks or throw exception during it's execution,
you need to take care about it too.

Once you needed ability to cancel or interrupt function you'll have to add more and more code
into each place and take of error handling too.

Interruptible Tasks library makes you free of that routine and provides some extra features described below.

## Features

- Tasks could be cancelable, interruptible and vice-versa (details below)
- Tasks could be nested
- Tasks status changes (pending/stopped) could be easily connected to any state library (redux/vuex/hyperapp/custom
  /etc)
- ES5/ES3 support - goes bundled as CommonJS, ES6 module and IIFE

Library uses mix of generators and promises under the hood.

## Getting Started

### Installing

```
yarn add interruptible-tasks
// or
npm install interruptible-tasks
```

## Using

## Authors

- **Vladislav Bogomaz** - [Github](https://github.com/Acionyx)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments
