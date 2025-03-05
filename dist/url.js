const apiBase = "https://api.inaturalist.org/v1/observations/species_counts";
function getParams() {
    return new URLSearchParams(window.location.search.substring(1));
}
function getBaseUrl() {
    let urlStr = window.location.href;
    let urlSearchStr = window.location.search;
    let baseURL = urlStr.replace(urlSearchStr, "");
    return baseURL;
}
function getSingleQueryParam(params, param) {
    if (params.has(param)) {
        return params.get(param);
    }
    else {
        return null;
    }
}
function createPageUrl({ urlBase, urlParams, resultsPerPage, pageNumber, options, }) {
    let currentResultsPerPage = getSingleQueryParam(urlParams, "per_page");
    let currentPageNumber = getSingleQueryParam(urlParams, "page");
    currentResultsPerPage === null
        ? urlParams.append("per_page", String(resultsPerPage))
        : urlParams.set("per_page", String(resultsPerPage));
    currentPageNumber === null
        ? urlParams.append("page", String(pageNumber))
        : urlParams.set("page", String(pageNumber));
    if (options && options.length > 0) {
        urlParams.append("options", options.join(","));
    }
    return urlBase + "?" + urlParams;
}
export { apiBase, getParams, getBaseUrl, getSingleQueryParam, createPageUrl };
