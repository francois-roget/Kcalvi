const { configure } = require('@testing-library/react-native');

// React Native Testing Library's async helpers (`waitFor`, `findBy*`) have their OWN timeout,
// `asyncUtilTimeout`, defaulting to 1000 ms. It is entirely independent of Jest's `testTimeout`
// -- raising that one (jest.config.js, to 30s) does nothing for these.
//
// 1000 ms is too tight for the first test of a screen suite on CI, for exactly the reason
// already documented on `testTimeout`: that test pays the one-off boot of the React Native /
// styled-components / i18n module graph on top of its own work, and the 2-vCPU GitHub runner is
// far slower than a dev machine. QuantitySheet's first test failed there while passing locally
// on every run, with the whole suite taking 9s on CI against ~3s locally.
//
// 10s is generous for a wait that will normally resolve in tens of milliseconds, while staying
// well under `testTimeout`: a genuinely stuck wait still fails with RTL's own "unable to find
// element" message rather than Jest's blunt test timeout.
configure({ asyncUtilTimeout: 10000 });
