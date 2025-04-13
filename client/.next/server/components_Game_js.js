"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "components_Game_js";
exports.ids = ["components_Game_js"];
exports.modules = {

/***/ "./components/Game.js":
/*!****************************!*\
  !*** ./components/Game.js ***!
  \****************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ Game)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var socket_io_client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! socket.io-client */ \"socket.io-client\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([socket_io_client__WEBPACK_IMPORTED_MODULE_2__]);\nsocket_io_client__WEBPACK_IMPORTED_MODULE_2__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\n\n\nconst socket = (0,socket_io_client__WEBPACK_IMPORTED_MODULE_2__[\"default\"])(\"http://localhost:3001\");\nfunction Game() {\n    const canvasRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);\n    const [players, setPlayers] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({});\n    const [myId, setMyId] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        socket.on(\"init\", (serverPlayers)=>{\n            setPlayers(serverPlayers);\n            setMyId(socket.id);\n        });\n        socket.on(\"player-joined\", ({ id, pos })=>{\n            setPlayers((prev)=>({\n                    ...prev,\n                    [id]: pos\n                }));\n        });\n        socket.on(\"player-moved\", ({ id, pos })=>{\n            setPlayers((prev)=>({\n                    ...prev,\n                    [id]: pos\n                }));\n        });\n        socket.on(\"player-left\", (id)=>{\n            setPlayers((prev)=>{\n                const cp = {\n                    ...prev\n                };\n                delete cp[id];\n                return cp;\n            });\n        });\n        return ()=>socket.disconnect();\n    }, []);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        function handleKey(e) {\n            if (!myId) return;\n            setPlayers((prev)=>{\n                const pos = {\n                    ...prev[myId] || {\n                        x: 250,\n                        y: 250\n                    }\n                };\n                const step = 5;\n                if (e.key === \"ArrowUp\") pos.y -= step;\n                if (e.key === \"ArrowDown\") pos.y += step;\n                if (e.key === \"ArrowLeft\") pos.x -= step;\n                if (e.key === \"ArrowRight\") pos.x += step;\n                socket.emit(\"move\", pos);\n                return {\n                    ...prev,\n                    [myId]: pos\n                };\n            });\n        }\n        window.addEventListener(\"keydown\", handleKey);\n        return ()=>window.removeEventListener(\"keydown\", handleKey);\n    }, [\n        myId\n    ]);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        const ctx = canvasRef.current.getContext(\"2d\");\n        function draw() {\n            ctx.fillStyle = \"white\";\n            ctx.fillRect(0, 0, 500, 500);\n            Object.entries(players).forEach(([id, pos])=>{\n                ctx.fillStyle = id === myId ? \"blue\" : \"red\";\n                ctx.fillRect(pos.x, pos.y, 20, 20);\n            });\n            requestAnimationFrame(draw);\n        }\n        draw();\n    }, [\n        players,\n        myId\n    ]);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"canvas\", {\n        ref: canvasRef,\n        width: 500,\n        height: 500,\n        style: {\n            border: \"1px solid #000\"\n        }\n    }, void 0, false, {\n        fileName: \"C:\\\\Users\\\\Matthias\\\\Documents\\\\augment-projects\\\\PokeTogetherBrowser\\\\client\\\\components\\\\Game.js\",\n        lineNumber: 64,\n        columnNumber: 10\n    }, this);\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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V2tDLE9BQU87UUFBS0MsUUFBUTtRQUFLQyxPQUFPO1lBQUVDLFFBQVE7UUFBaUI7Ozs7OztBQUM1RiIsInNvdXJjZXMiOlsid2VicGFjazovL211bHRpcGxheWVyLWNsaWVudC8uL2NvbXBvbmVudHMvR2FtZS5qcz9jOGI1Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZUVmZmVjdCwgdXNlUmVmLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCBpbyBmcm9tICdzb2NrZXQuaW8tY2xpZW50JztcblxuY29uc3Qgc29ja2V0ID0gaW8oJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMScpO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBHYW1lKCkge1xuICBjb25zdCBjYW52YXNSZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IFtwbGF5ZXJzLCBzZXRQbGF5ZXJzXSA9IHVzZVN0YXRlKHt9KTtcbiAgY29uc3QgW215SWQsIHNldE15SWRdID0gdXNlU3RhdGUobnVsbCk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBzb2NrZXQub24oJ2luaXQnLCAoc2VydmVyUGxheWVycykgPT4ge1xuICAgICAgc2V0UGxheWVycyhzZXJ2ZXJQbGF5ZXJzKTtcbiAgICAgIHNldE15SWQoc29ja2V0LmlkKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ3BsYXllci1qb2luZWQnLCAoeyBpZCwgcG9zIH0pID0+IHtcbiAgICAgIHNldFBsYXllcnMocHJldiA9PiAoeyAuLi5wcmV2LCBbaWRdOiBwb3MgfSkpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbigncGxheWVyLW1vdmVkJywgKHsgaWQsIHBvcyB9KSA9PiB7XG4gICAgICBzZXRQbGF5ZXJzKHByZXYgPT4gKHsgLi4ucHJldiwgW2lkXTogcG9zIH0pKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ3BsYXllci1sZWZ0JywgKGlkKSA9PiB7XG4gICAgICBzZXRQbGF5ZXJzKHByZXYgPT4ge1xuICAgICAgICBjb25zdCBjcCA9IHsgLi4ucHJldiB9O1xuICAgICAgICBkZWxldGUgY3BbaWRdO1xuICAgICAgICByZXR1cm4gY3A7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gKCkgPT4gc29ja2V0LmRpc2Nvbm5lY3QoKTtcbiAgfSwgW10pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgZnVuY3Rpb24gaGFuZGxlS2V5KGUpIHtcbiAgICAgIGlmICghbXlJZCkgcmV0dXJuO1xuICAgICAgc2V0UGxheWVycyhwcmV2ID0+IHtcbiAgICAgICAgY29uc3QgcG9zID0geyAuLi4ocHJldltteUlkXSB8fCB7IHg6IDI1MCwgeTogMjUwIH0pIH07XG4gICAgICAgIGNvbnN0IHN0ZXAgPSA1O1xuICAgICAgICBpZiAoZS5rZXkgPT09ICdBcnJvd1VwJykgcG9zLnkgLT0gc3RlcDtcbiAgICAgICAgaWYgKGUua2V5ID09PSAnQXJyb3dEb3duJykgcG9zLnkgKz0gc3RlcDtcbiAgICAgICAgaWYgKGUua2V5ID09PSAnQXJyb3dMZWZ0JykgcG9zLnggLT0gc3RlcDtcbiAgICAgICAgaWYgKGUua2V5ID09PSAnQXJyb3dSaWdodCcpIHBvcy54ICs9IHN0ZXA7XG4gICAgICAgIHNvY2tldC5lbWl0KCdtb3ZlJywgcG9zKTtcbiAgICAgICAgcmV0dXJuIHsgLi4ucHJldiwgW215SWRdOiBwb3MgfTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZUtleSk7XG4gICAgcmV0dXJuICgpID0+IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlS2V5KTtcbiAgfSwgW215SWRdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGN0eCA9IGNhbnZhc1JlZi5jdXJyZW50LmdldENvbnRleHQoJzJkJyk7XG4gICAgZnVuY3Rpb24gZHJhdygpIHtcbiAgICAgIGN0eC5maWxsU3R5bGUgPSAnd2hpdGUnO1xuICAgICAgY3R4LmZpbGxSZWN0KDAsIDAsIDUwMCwgNTAwKTtcbiAgICAgIE9iamVjdC5lbnRyaWVzKHBsYXllcnMpLmZvckVhY2goKFtpZCwgcG9zXSkgPT4ge1xuICAgICAgICBjdHguZmlsbFN0eWxlID0gaWQgPT09IG15SWQgPyAnYmx1ZScgOiAncmVkJztcbiAgICAgICAgY3R4LmZpbGxSZWN0KHBvcy54LCBwb3MueSwgMjAsIDIwKTtcbiAgICAgIH0pO1xuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGRyYXcpO1xuICAgIH1cbiAgICBkcmF3KCk7XG4gIH0sIFtwbGF5ZXJzLCBteUlkXSk7XG5cbiAgcmV0dXJuIDxjYW52YXMgcmVmPXtjYW52YXNSZWZ9IHdpZHRoPXs1MDB9IGhlaWdodD17NTAwfSBzdHlsZT17eyBib3JkZXI6ICcxcHggc29saWQgIzAwMCcgfX0gLz47XG59Il0sIm5hbWVzIjpbInVzZUVmZmVjdCIsInVzZVJlZiIsInVzZVN0YXRlIiwiaW8iLCJzb2NrZXQiLCJHYW1lIiwiY2FudmFzUmVmIiwicGxheWVycyIsInNldFBsYXllcnMiLCJteUlkIiwic2V0TXlJZCIsIm9uIiwic2VydmVyUGxheWVycyIsImlkIiwicG9zIiwicHJldiIsImNwIiwiZGlzY29ubmVjdCIsImhhbmRsZUtleSIsImUiLCJ4IiwieSIsInN0ZXAiLCJrZXkiLCJlbWl0Iiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJjdHgiLCJjdXJyZW50IiwiZ2V0Q29udGV4dCIsImRyYXciLCJmaWxsU3R5bGUiLCJmaWxsUmVjdCIsIk9iamVjdCIsImVudHJpZXMiLCJmb3JFYWNoIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwiY2FudmFzIiwicmVmIiwid2lkdGgiLCJoZWlnaHQiLCJzdHlsZSIsImJvcmRlciJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./components/Game.js\n");

/***/ })

};
;