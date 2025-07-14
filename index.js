/**
 * FetchInterceptor:
 * 
 * {
 *  isMatch: async function (url, request, response) { ... }, // returns true or false. Only first match is used. Order is undefined.
 *  onMatch: async function (url, request, response) { ... }, // returns Promise<undefined> or a new Promise<Response>, if the response should be modified onMatch
 * }
 */

if (unsafeWindow === undefined) {
    throw new Error(`unsafeWindow === undefined. Expected this package to run in a userscript environment (e.g., greasemonkey, tampermonkey, etc.).`);
}

const { fetch: origFetch } = unsafeWindow;

let fetchInterceptors = new Set();

unsafeWindow.addFetchInterceptor = function (interceptor) {
    if (interceptor === undefined) {
        throw new Error(`addFetchInterceptor: Expected parameter interceptor to exist`);
    }

    fetchInterceptors.set(interceptor);
}

unsafeWindow.removeFetchInterceptor = function (interceptor) {
    if (interceptor === undefined) {
        throw new Error(`removeFetchInterceptor: Expected parameter interceptor to exist`);
    }

    fetchInterceptors.delete(interceptor)
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
