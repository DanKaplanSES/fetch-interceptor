/**
 * FetchInterceptor:
 * 
 * {
 *  isMatch: function (url, request, response) { ... }
 *  onMatch: function (url, request, response) { ... } // returns undefined or a new response, if the response should be modified onMatch
 * }
 */

if (unsafeWindow === undefined) {
    throw new Error(`unsafeWindow === undefined. Expected this package to run in a userscript environment (e.g., greasemonkey, tampermonkey, etc.).`);
}

const { fetch: origFetch } = unsafeWindow;

let fetchInterceptors = new Map();

unsafeWindow.addFetchInterceptor = function (interceptorName, interceptor) {
    if (interceptorName === undefined) {
        throw new Error(`addFetchInterceptor: Expected string interceptorName to exist`);
    }
    if (interceptorName === undefined) {
        throw new Error(`addFetchInterceptor: Expected object interceptor to exist`);
    }

    fetchInterceptors.set(interceptorName, interceptor);
}

unsafeWindow.removeFetchInterceptor = function (interceptorName) {
    if (interceptorName === undefined) {
        throw new Error(`removeFetchInterceptor: Expected string interceptorName to exist`);
    }

    fetchInterceptors.delete(interceptorName);
}

unsafeWindow.clearFetchInterceptors = function () {
    fetchInterceptors.clear();
}

unsafeWindow.fetch = async (...args) => {
    const url = args[0];
    const request = args[1];

    const response = await origFetch(...args);

    const interceptor = [...fetchInterceptors.values()].find((interceptor) => {
        return interceptor.isMatch(url, request, response.clone());
    })

    if (interceptor === undefined) {
        return response;
    }

    const interceptorResponse = interceptor.onMatch(url, request, response.clone());

    if (interceptorResponse === undefined) {
        return response;
    } else {
        return interceptorResponse;
    }
};
