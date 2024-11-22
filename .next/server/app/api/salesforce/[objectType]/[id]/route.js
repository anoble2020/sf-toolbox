/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/salesforce/[objectType]/[id]/route";
exports.ids = ["app/api/salesforce/[objectType]/[id]/route"];
exports.modules = {

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fsalesforce%2F%5BobjectType%5D%2F%5Bid%5D%2Froute&page=%2Fapi%2Fsalesforce%2F%5BobjectType%5D%2F%5Bid%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fsalesforce%2F%5BobjectType%5D%2F%5Bid%5D%2Froute.ts&appDir=%2FUsers%2Falexander.noble%2Fapex-toolbox%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Falexander.noble%2Fapex-toolbox&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fsalesforce%2F%5BobjectType%5D%2F%5Bid%5D%2Froute&page=%2Fapi%2Fsalesforce%2F%5BobjectType%5D%2F%5Bid%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fsalesforce%2F%5BobjectType%5D%2F%5Bid%5D%2Froute.ts&appDir=%2FUsers%2Falexander.noble%2Fapex-toolbox%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Falexander.noble%2Fapex-toolbox&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_alexander_noble_apex_toolbox_src_app_api_salesforce_objectType_id_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/salesforce/[objectType]/[id]/route.ts */ \"(rsc)/./src/app/api/salesforce/[objectType]/[id]/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/salesforce/[objectType]/[id]/route\",\n        pathname: \"/api/salesforce/[objectType]/[id]\",\n        filename: \"route\",\n        bundlePath: \"app/api/salesforce/[objectType]/[id]/route\"\n    },\n    resolvedPagePath: \"/Users/alexander.noble/apex-toolbox/src/app/api/salesforce/[objectType]/[id]/route.ts\",\n    nextConfigOutput,\n    userland: _Users_alexander_noble_apex_toolbox_src_app_api_salesforce_objectType_id_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZzYWxlc2ZvcmNlJTJGJTVCb2JqZWN0VHlwZSU1RCUyRiU1QmlkJTVEJTJGcm91dGUmcGFnZT0lMkZhcGklMkZzYWxlc2ZvcmNlJTJGJTVCb2JqZWN0VHlwZSU1RCUyRiU1QmlkJTVEJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGc2FsZXNmb3JjZSUyRiU1Qm9iamVjdFR5cGUlNUQlMkYlNUJpZCU1RCUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRmFsZXhhbmRlci5ub2JsZSUyRmFwZXgtdG9vbGJveCUyRnNyYyUyRmFwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9JTJGVXNlcnMlMkZhbGV4YW5kZXIubm9ibGUlMkZhcGV4LXRvb2xib3gmaXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQStGO0FBQ3ZDO0FBQ3FCO0FBQ3FDO0FBQ2xIO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsc0RBQXNEO0FBQzlEO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzBGOztBQUUxRiIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCIvVXNlcnMvYWxleGFuZGVyLm5vYmxlL2FwZXgtdG9vbGJveC9zcmMvYXBwL2FwaS9zYWxlc2ZvcmNlL1tvYmplY3RUeXBlXS9baWRdL3JvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcIlwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9zYWxlc2ZvcmNlL1tvYmplY3RUeXBlXS9baWRdL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvc2FsZXNmb3JjZS9bb2JqZWN0VHlwZV0vW2lkXVwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvc2FsZXNmb3JjZS9bb2JqZWN0VHlwZV0vW2lkXS9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIi9Vc2Vycy9hbGV4YW5kZXIubm9ibGUvYXBleC10b29sYm94L3NyYy9hcHAvYXBpL3NhbGVzZm9yY2UvW29iamVjdFR5cGVdL1tpZF0vcm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICB3b3JrQXN5bmNTdG9yYWdlLFxuICAgICAgICB3b3JrVW5pdEFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fsalesforce%2F%5BobjectType%5D%2F%5Bid%5D%2Froute&page=%2Fapi%2Fsalesforce%2F%5BobjectType%5D%2F%5Bid%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fsalesforce%2F%5BobjectType%5D%2F%5Bid%5D%2Froute.ts&appDir=%2FUsers%2Falexander.noble%2Fapex-toolbox%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Falexander.noble%2Fapex-toolbox&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(rsc)/./src/app/api/salesforce/[objectType]/[id]/route.ts":
/*!***********************************************************!*\
  !*** ./src/app/api/salesforce/[objectType]/[id]/route.ts ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n\nasync function GET(request, { params }) {\n    try {\n        const { searchParams } = new URL(request.url);\n        const instance_url = searchParams.get('instance_url');\n        const authorization = request.headers.get('authorization');\n        if (!instance_url || !authorization) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'Missing required parameters'\n            }, {\n                status: 400\n            });\n        }\n        const { objectType, id } = params;\n        let endpoint;\n        switch(objectType){\n            case 'apexclass':\n                endpoint = `/services/data/v59.0/tooling/sobjects/ApexClass/${id}`;\n                break;\n            case 'apextrigger':\n                endpoint = `/services/data/v59.0/tooling/sobjects/ApexTrigger/${id}`;\n                break;\n            case 'lwcresource':\n                endpoint = `/services/data/v59.0/tooling/sobjects/LightningComponentResource/${id}`;\n                break;\n            case 'auradefinition':\n                endpoint = `/services/data/v59.0/tooling/sobjects/AuraDefinition/${id}`;\n                break;\n            default:\n                return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                    error: 'Invalid object type'\n                }, {\n                    status: 400\n                });\n        }\n        const response = await fetch(`${instance_url}${endpoint}`, {\n            headers: {\n                Authorization: authorization\n            }\n        });\n        if (!response.ok) {\n            throw new Error('Failed to fetch file');\n        }\n        const data = await response.json();\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(data);\n    } catch (error) {\n        console.error('Error:', error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: error instanceof Error ? error.message : 'Internal server error'\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9zYWxlc2ZvcmNlL1tvYmplY3RUeXBlXS9baWRdL3JvdXRlLnRzIiwibWFwcGluZ3MiOiI7Ozs7O0FBQTBDO0FBRW5DLGVBQWVDLElBQ3BCQyxPQUFnQixFQUNoQixFQUFFQyxNQUFNLEVBQWtEO0lBRTFELElBQUk7UUFDRixNQUFNLEVBQUVDLFlBQVksRUFBRSxHQUFHLElBQUlDLElBQUlILFFBQVFJLEdBQUc7UUFDNUMsTUFBTUMsZUFBZUgsYUFBYUksR0FBRyxDQUFDO1FBQ3RDLE1BQU1DLGdCQUFnQlAsUUFBUVEsT0FBTyxDQUFDRixHQUFHLENBQUM7UUFFMUMsSUFBSSxDQUFDRCxnQkFBZ0IsQ0FBQ0UsZUFBZTtZQUNuQyxPQUFPVCxxREFBWUEsQ0FBQ1csSUFBSSxDQUN0QjtnQkFBRUMsT0FBTztZQUE4QixHQUN2QztnQkFBRUMsUUFBUTtZQUFJO1FBRWxCO1FBRUEsTUFBTSxFQUFFQyxVQUFVLEVBQUVDLEVBQUUsRUFBRSxHQUFHWjtRQUMzQixJQUFJYTtRQUVKLE9BQVFGO1lBQ04sS0FBSztnQkFDSEUsV0FBVyxDQUFDLGdEQUFnRCxFQUFFRCxJQUFJO2dCQUNsRTtZQUNGLEtBQUs7Z0JBQ0hDLFdBQVcsQ0FBQyxrREFBa0QsRUFBRUQsSUFBSTtnQkFDcEU7WUFDRixLQUFLO2dCQUNIQyxXQUFXLENBQUMsaUVBQWlFLEVBQUVELElBQUk7Z0JBQ25GO1lBQ0YsS0FBSztnQkFDSEMsV0FBVyxDQUFDLHFEQUFxRCxFQUFFRCxJQUFJO2dCQUN2RTtZQUNGO2dCQUNFLE9BQU9mLHFEQUFZQSxDQUFDVyxJQUFJLENBQUM7b0JBQUVDLE9BQU87Z0JBQXNCLEdBQUc7b0JBQUVDLFFBQVE7Z0JBQUk7UUFDN0U7UUFFQSxNQUFNSSxXQUFXLE1BQU1DLE1BQU0sR0FBR1gsZUFBZVMsVUFBVSxFQUFFO1lBQ3pETixTQUFTO2dCQUNQUyxlQUFlVjtZQUNqQjtRQUNGO1FBRUEsSUFBSSxDQUFDUSxTQUFTRyxFQUFFLEVBQUU7WUFDaEIsTUFBTSxJQUFJQyxNQUFNO1FBQ2xCO1FBRUEsTUFBTUMsT0FBTyxNQUFNTCxTQUFTTixJQUFJO1FBQ2hDLE9BQU9YLHFEQUFZQSxDQUFDVyxJQUFJLENBQUNXO0lBQzNCLEVBQUUsT0FBT1YsT0FBTztRQUNkVyxRQUFRWCxLQUFLLENBQUMsVUFBVUE7UUFDeEIsT0FBT1oscURBQVlBLENBQUNXLElBQUksQ0FDdEI7WUFBRUMsT0FBT0EsaUJBQWlCUyxRQUFRVCxNQUFNWSxPQUFPLEdBQUc7UUFBd0IsR0FDMUU7WUFBRVgsUUFBUTtRQUFJO0lBRWxCO0FBQ0YiLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbGV4YW5kZXIubm9ibGUvYXBleC10b29sYm94L3NyYy9hcHAvYXBpL3NhbGVzZm9yY2UvW29iamVjdFR5cGVdL1tpZF0vcm91dGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dFJlc3BvbnNlIH0gZnJvbSAnbmV4dC9zZXJ2ZXInXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQoXG4gIHJlcXVlc3Q6IFJlcXVlc3QsXG4gIHsgcGFyYW1zIH06IHsgcGFyYW1zOiB7IG9iamVjdFR5cGU6IHN0cmluZzsgaWQ6IHN0cmluZyB9IH1cbikge1xuICB0cnkge1xuICAgIGNvbnN0IHsgc2VhcmNoUGFyYW1zIH0gPSBuZXcgVVJMKHJlcXVlc3QudXJsKVxuICAgIGNvbnN0IGluc3RhbmNlX3VybCA9IHNlYXJjaFBhcmFtcy5nZXQoJ2luc3RhbmNlX3VybCcpXG4gICAgY29uc3QgYXV0aG9yaXphdGlvbiA9IHJlcXVlc3QuaGVhZGVycy5nZXQoJ2F1dGhvcml6YXRpb24nKVxuXG4gICAgaWYgKCFpbnN0YW5jZV91cmwgfHwgIWF1dGhvcml6YXRpb24pIHtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihcbiAgICAgICAgeyBlcnJvcjogJ01pc3NpbmcgcmVxdWlyZWQgcGFyYW1ldGVycycgfSxcbiAgICAgICAgeyBzdGF0dXM6IDQwMCB9XG4gICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgeyBvYmplY3RUeXBlLCBpZCB9ID0gcGFyYW1zXG4gICAgbGV0IGVuZHBvaW50OiBzdHJpbmdcblxuICAgIHN3aXRjaCAob2JqZWN0VHlwZSkge1xuICAgICAgY2FzZSAnYXBleGNsYXNzJzpcbiAgICAgICAgZW5kcG9pbnQgPSBgL3NlcnZpY2VzL2RhdGEvdjU5LjAvdG9vbGluZy9zb2JqZWN0cy9BcGV4Q2xhc3MvJHtpZH1gXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdhcGV4dHJpZ2dlcic6XG4gICAgICAgIGVuZHBvaW50ID0gYC9zZXJ2aWNlcy9kYXRhL3Y1OS4wL3Rvb2xpbmcvc29iamVjdHMvQXBleFRyaWdnZXIvJHtpZH1gXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdsd2NyZXNvdXJjZSc6XG4gICAgICAgIGVuZHBvaW50ID0gYC9zZXJ2aWNlcy9kYXRhL3Y1OS4wL3Rvb2xpbmcvc29iamVjdHMvTGlnaHRuaW5nQ29tcG9uZW50UmVzb3VyY2UvJHtpZH1gXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdhdXJhZGVmaW5pdGlvbic6XG4gICAgICAgIGVuZHBvaW50ID0gYC9zZXJ2aWNlcy9kYXRhL3Y1OS4wL3Rvb2xpbmcvc29iamVjdHMvQXVyYURlZmluaXRpb24vJHtpZH1gXG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ0ludmFsaWQgb2JqZWN0IHR5cGUnIH0sIHsgc3RhdHVzOiA0MDAgfSlcbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke2luc3RhbmNlX3VybH0ke2VuZHBvaW50fWAsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogYXV0aG9yaXphdGlvbixcbiAgICAgIH0sXG4gICAgfSlcblxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGZldGNoIGZpbGUnKVxuICAgIH1cblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKClcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oZGF0YSlcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvcjonLCBlcnJvcilcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oXG4gICAgICB7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIH0sXG4gICAgICB7IHN0YXR1czogNTAwIH1cbiAgICApXG4gIH1cbn0gIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsIkdFVCIsInJlcXVlc3QiLCJwYXJhbXMiLCJzZWFyY2hQYXJhbXMiLCJVUkwiLCJ1cmwiLCJpbnN0YW5jZV91cmwiLCJnZXQiLCJhdXRob3JpemF0aW9uIiwiaGVhZGVycyIsImpzb24iLCJlcnJvciIsInN0YXR1cyIsIm9iamVjdFR5cGUiLCJpZCIsImVuZHBvaW50IiwicmVzcG9uc2UiLCJmZXRjaCIsIkF1dGhvcml6YXRpb24iLCJvayIsIkVycm9yIiwiZGF0YSIsImNvbnNvbGUiLCJtZXNzYWdlIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/salesforce/[objectType]/[id]/route.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fsalesforce%2F%5BobjectType%5D%2F%5Bid%5D%2Froute&page=%2Fapi%2Fsalesforce%2F%5BobjectType%5D%2F%5Bid%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fsalesforce%2F%5BobjectType%5D%2F%5Bid%5D%2Froute.ts&appDir=%2FUsers%2Falexander.noble%2Fapex-toolbox%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Falexander.noble%2Fapex-toolbox&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();