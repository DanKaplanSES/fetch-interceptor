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

    fetchInterceptors.add(interceptor);
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

    const interceptor = await findMatchingInterceptor(url, request, response);
    if (interceptor === undefined) {
        return response;
    }

    const interceptorResponse = await interceptor.onMatch(url, request, response.clone());
    if (interceptorResponse === undefined) {
        return response;
    } else {
        return interceptorResponse;
    }
};

async function findMatchingInterceptor(url, request, response) {
    const fetchInterceptorArray = [...fetchInterceptors.values()];
    for (let i = 0; i < fetchInterceptorArray.length; i++) {
        const possibleMatch = fetchInterceptorArray[i];
        if (await possibleMatch.isMatch(url, request, response.clone()) === true) {
            return possibleMatch;
        }
    }
    return undefined;
}