/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is not neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/***/ ((module) => {

"use strict";
eval("module.exports = require(\"electron\");;\n\n//# sourceURL=webpack://react-room/external_%22electron%22?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
(() => {
/*!***************************!*\
  !*** ./client/preload.js ***!
  \***************************/
eval("\r\nconst { remote } = __webpack_require__(/*! electron */ \"electron\");\r\n\r\nlet currWindow = remote.BrowserWindow.getFocusedWindow();\r\n\r\nwindow.closeCurrentWindow = function () {\r\n  currWindow.close();\r\n}\r\n\r\nwindow.preload = function () {\r\n  return true;\r\n}\r\n\r\nwindow.minMaxWindow = function () {\r\n  if (currWindow.isMaximized()) {\r\n    currWindow.restore();\r\n  } else {\r\n    currWindow.maximize();\r\n  }\r\n}\r\n\r\nwindow.minimize = function () {\r\n  currWindow.minimize();\r\n}\n\n//# sourceURL=webpack://react-room/./client/preload.js?");
})();

/******/ })()
;