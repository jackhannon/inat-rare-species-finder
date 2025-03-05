import { apiBase, createPageUrl, getBaseUrl, getParams, getSingleQueryParam, } from "./url.js";
let queryResults = [];
function createLink(url, txt = url) {
    return '<a href="' + url + '">' + String(txt) + "</a>";
}
function createAmp(str) {
    return str.replace(/&/g, "&amp;");
}
function comNum(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function addElem({ type, parent, attributes = {}, }) {
    let obj = document.createElement(type);
    for (const [key, value] of Object.entries(attributes)) {
        if (typeof value === "object" && value !== null) {
            for (const [subkey, subvalue] of Object.entries(value)) {
                obj[key][subkey] = subvalue;
            }
        }
        else {
            obj[key] = value;
        }
    }
    if (parent) {
        parent.appendChild(obj);
    }
    return obj;
}
function addElems({ type, parent, attributes = [], }) {
    for (let e of attributes) {
        addElem({ type, parent, attributes: e });
    }
}
function processResult(data) {
    queryResults = data.results;
    if (queryResults) {
        let total_results = data.total_results;
        let per_page = data.per_page;
        let page_curr = data.page;
        let page_max = Math.ceil(total_results / per_page);
        let page_prev = page_curr > 1 ? page_curr - 1 : null;
        let page_next = page_curr < page_max ? page_curr + 1 : null;
        addElem({
            type: "p",
            parent: document.body.querySelector("header"),
            attributes: {
                innerHTML: "total leaf taxa: " +
                    comNum(total_results) +
                    " " +
                    '[<span id="export"><a href="javascript:fexport(' +
                    total_results +
                    ');">export</a></span>]<br />' +
                    "per page: " +
                    comNum(per_page) +
                    "<br />" +
                    "page: " +
                    comNum(page_curr) +
                    " of " +
                    comNum(page_max) +
                    "<br />",
            },
        });
        constructEndemismSlider();
        constructTable(queryResults);
        constructPageNav({
            page_curr,
            page_max,
            page_prev,
            page_next,
        });
    }
    else {
        addElem({
            type: "p",
            parent: document.body,
            attributes: { innerText: "No results returned." },
        });
    }
}
function constructPageNav({ page_curr, page_max, page_prev, page_next, }) {
    // buttons to go to prev or next page
    if (document.querySelector("#nav")) {
        return;
    }
    let nav = addElem({
        type: "div",
        parent: document === null || document === void 0 ? void 0 : document.body,
        attributes: { id: "nav" },
    });
    let urlBase = getBaseUrl();
    let urlParams = getParams();
    page_curr <= 1
        ? addElem({
            type: "span",
            parent: nav,
            attributes: {
                classList: "button_inactive",
                title: "already on first page",
                innerHTML: "&laquo",
            },
        })
        : addElem({
            type: "a",
            parent: nav,
            attributes: {
                classList: "button",
                title: "first page",
                id: "button_first",
                innerHTML: "&laquo",
                href: createPageUrl({ urlBase, urlParams, pageNumber: 1 }),
            },
        });
    page_prev === null
        ? addElem({
            type: "span",
            parent: nav,
            attributes: {
                classList: "button_inactive",
                title: "no previous page",
                innerHTML: "&#8249",
            },
        })
        : addElem({
            type: "a",
            parent: nav,
            attributes: {
                classList: "button",
                title: "previous page",
                id: "button_prev",
                innerHTML: "&#8249",
                href: createPageUrl({ urlBase, urlParams, pageNumber: page_prev }),
            },
        });
    page_next === null
        ? addElem({
            type: "span",
            parent: nav,
            attributes: {
                classList: "button_inactive",
                title: "no next page",
                innerHTML: "&#8250",
            },
        })
        : addElem({
            type: "a",
            parent: nav,
            attributes: {
                classList: "button",
                title: "next page",
                id: "button_next",
                innerHTML: "&#8250",
                href: createPageUrl({ urlBase, urlParams, pageNumber: page_next }),
            },
        });
    page_curr >= page_max
        ? addElem({
            type: "span",
            parent: nav,
            attributes: {
                classList: "button_inactive",
                title: "already on last page",
                innerHTML: "&raquo",
            },
        })
        : addElem({
            type: "a",
            parent: nav,
            attributes: {
                classList: "button",
                title: "last page",
                id: "button_last",
                innerHTML: "&raquo",
                href: createPageUrl({
                    urlBase,
                    urlParams,
                    pageNumber: page_max,
                }),
            },
        });
}
function constructTable(species) {
    const existingTableElement = document.querySelector("table");
    if (existingTableElement) {
        existingTableElement.remove();
    }
    const table = addElem({
        type: "table",
        parent: document.getElementById("tableContainer") || undefined,
        attributes: { id: "main" },
    });
    const thead = addElem({ type: "thead", parent: table });
    const hrow = addElem({ type: "tr", parent: thead });
    const labels = [
        { innerText: "#" },
        { innerText: "ID" },
        { innerText: "Photo" },
        { innerText: "Name" },
        { innerText: "Common Name" },
        { innerText: "Rank" },
        { innerText: "Iconic Taxon" },
        { classList: "tar", innerText: "Taxon Obs Count" },
        { classList: "tar", innerText: "Taxon Ttl Obs Count" },
    ];
    addElems({ type: "th", parent: hrow, attributes: labels });
    let tbody = addElem({ type: "tbody", parent: table });
    appendSpecies(species, tbody);
}
function appendSpecies(species, tbody) {
    for (let i = 0; i < species.length; i++) {
        let brow = addElem({ type: "tr", parent: tbody });
        let rec = species[i];
        // this section sets up parameters for hyperlinks to Explore page
        // won't be able properly to handle situations where user inputs subspecies in URL parameters
        // also, won't always tie exactly because Explore page always filters for spam=false (cannot change this parameter on that page)
        let obsparams = new URLSearchParams(urlParams);
        obsparams.delete("order");
        obsparams.delete("page");
        obsparams.delete("per_page");
        obsparams.delete("taxon_id");
        let url_explore = "https://www.inaturalist.org/observations?taxon_id=" + rec.taxon.id;
        let obsparam_verifiable = obsparams.get("verifiable") === null
            ? "&verifiable=any"
            : "&verifiable=" + obsparams.get("verifiable");
        obsparams.delete("verifiable");
        let values = [
            { innerText: i + 1 },
            {
                innerHTML: createLink("https://www.inaturalist.org/taxa/" + rec.taxon.id, rec.taxon.id),
            },
            {
                innerHTML: '<img class="icon" src="' +
                    (rec.taxon.default_photo ? rec.taxon.default_photo.square_url : "") +
                    '" />',
            },
            { innerText: rec.taxon.name || "" },
            { innerText: rec.taxon.preferred_common_name || "" },
            { innerText: rec.taxon.rank || "" },
            { innerText: rec.taxon.iconic_taxon_name || "" },
            {
                classList: "tar",
                innerHTML: createLink(createAmp(url_explore +
                    obsparam_verifiable +
                    (obsparams.toString() == "" ? "" : "&" + obsparams)), comNum(rec.count)),
            },
            {
                classList: "tar",
                innerHTML: createLink(url_explore + "&verifiable=any", comNum(rec.taxon.observations_count)),
            },
        ];
        addElems({ type: "td", parent: brow, attributes: values });
    }
}
function filterByTotalObservationsDifference(sliderPercentage) {
    let species = queryResults;
    species = species.filter((elem) => {
        let totalObservations = elem.taxon.observations_count;
        let count = elem.count;
        let percentageOfTotalObservations = (count / totalObservations) * 100;
        if (percentageOfTotalObservations > sliderPercentage) {
            return elem;
        }
    });
    constructTable(species);
}
function constructEndemismSlider() {
    let endemismSliderHTML = `
			       <div class='container'>
							<div class='sliderLabel'>
								<span>Endemism Slider: Filters by the observation count to taxon total observation count ratio, effectively this means you are filtering by a species affinity to a specific location, for example when the slider is all the way to the right the table will only show endemic species</span>
							</div>
							<div class='sliderContainer'>
								<div class='sliderTrack'>
								</div>
								<div class='sliderThumb'>
								</div>
								<div class='sliderFill'>
								</div>
							</div>
			       </div>
			     `;
    const container = document.getElementById("endemismControlContainer");
    container.innerHTML = endemismSliderHTML;
    document
        .querySelector(".sliderContainer")
        .addEventListener("mousedown", handleContainerMouseDown);
    window.addEventListener("mouseup", handleContainerMouseUp);
    window.addEventListener("mousemove", handleContainerMouseMove);
}
function handleContainerMouseDown(e) {
    const mouseEvent = e;
    updateSliderFillByEvent("--slider-fill", mouseEvent);
    const fillValue = document.querySelector(".sliderContainer").style.getPropertyValue("--slider-fill");
    const width = Number(fillValue.split("%")[0]);
    onChangeEndemismSlider(width);
    document
        .querySelector(".sliderContainer")
        .setAttribute("data-dragging", "true");
    window.addEventListener("mouseup", handleContainerMouseUp);
    window.addEventListener("mousemove", handleContainerMouseMove);
}
const handleContainerMouseUp = (e) => {
    document.querySelector(".sliderContainer").removeAttribute("data-dragging");
    const fillValue = document.querySelector(".sliderContainer").style.getPropertyValue("--slider-fill");
    const width = Number(fillValue.split("%")[0]);
    onChangeEndemismSlider(width);
    window.removeEventListener("mouseup", handleContainerMouseUp);
    window.removeEventListener("mousemove", handleContainerMouseMove);
};
const handleContainerMouseMove = (e) => {
    var _a;
    if ((_a = document.querySelector(".sliderContainer")) === null || _a === void 0 ? void 0 : _a.getAttribute("data-dragging")) {
        updateSliderFillByEvent("--slider-fill", e);
    }
};
const updateSliderFillByEvent = (variableName, e) => {
    const elem = document.querySelector(".sliderContainer");
    if (elem) {
        const rect = elem.getBoundingClientRect();
        const fillWidth = computeCurrentWidthFromPointerPos(e.pageX, rect.left, rect.width);
        if (fillWidth < 0 || fillWidth > 100) {
            return;
        }
        document.querySelector(".sliderContainer").style.setProperty(variableName, `${fillWidth}%`);
        return fillWidth;
    }
};
function computeCurrentWidthFromPointerPos(xDistance, left, totalWidth) {
    return ((xDistance - left) / totalWidth) * 100;
}
function onChangeEndemismSlider(sliderPercentage) {
    filterByTotalObservationsDifference(sliderPercentage);
}
const urlParams = getParams();
const baseUrl = getBaseUrl();
const currentPage = Number(urlParams.get("page")) || 1;
const resultsPerPage = Number(getSingleQueryParam(urlParams, "per_page")) || 2000;
const maxPagesToFetchAtOnce = 10;
let pagesToFetch = Math.ceil(resultsPerPage / 500);
if (pagesToFetch > maxPagesToFetchAtOnce) {
    pagesToFetch = maxPagesToFetchAtOnce;
}
let urlsToMakeRequestsTo = [];
for (let i = currentPage; i < currentPage + pagesToFetch; i++) {
    const newUrlParams = new URLSearchParams(urlParams);
    newUrlParams.set("page", `${i}`);
    let url = createPageUrl({
        urlBase: apiBase,
        pageNumber: i,
        resultsPerPage: resultsPerPage,
        urlParams: newUrlParams,
    });
    urlsToMakeRequestsTo.push(url);
} //max entries per page is 500 so if you want to fetch 1000 entries you need to fetch 2 pages at once
const apiURL = apiBase + (urlParams.toString() != "" ? "?" + urlParams.toString() : "");
const apiReferenceURL = "http://api.inaturalist.org/v1/docs/#!/Observations/get_observations_species_counts";
const apiReferenceName = "iNaturalist Observation Species Counts";
const apiReference = createLink(apiReferenceURL, apiReferenceName);
addElem({
    type: "h1",
    parent: document.body.querySelector("header"),
    attributes: { innerText: apiReferenceName },
});
if (urlParams.toString() === "") {
    let instructions = [
        {
            innerHTML: "This page displays the response from the " +
                apiReference +
                " API endpoint in a human-readable format. To use this page, add at least one query parameter to the URL. See " +
                createLink(apiReferenceURL) +
                " for available query parameters.",
        },
        {
            innerHTML: "Suppose the address of this page is " +
                apiBase +
                ", <br />and you want to see the results of " +
                createLink(createAmp(apiBase + "?user_id=bob")) +
                " in a friendly format, <br />then you would open " +
                createLink(createAmp(baseUrl + "?user_id=bob")) +
                " in your browser.",
        },
        {
            innerHTML: "You can also invoke a few extra options. Adding &options=ancestry to the URL parameter list will include a column with taxon ancestry in the results. Adding &options=wikipedia_url will display a column with a link to the Wikipedia article for the taxon.  Adding &options=bigger_image will display a larger version of the taxon photo. Adding &options=unlimitedexport will allow you export a lot of records. To invoke multiple options, use a comma-separated value list for the parameter (ex. &options=ancestry,wikipedia_url,bigger_image,unlimitedexport).",
        },
        {
            innerHTML: "Note that the counts returned by this page vs the " +
                createLink("https://www.inaturalist.org/observations", "Explore page") +
                " in iNaturalist may not tie exactly because the Explore page will always filter out spam observations. Also, if you filter for a subspecies taxon on this page, the taxon shown here will be the species level, but the count will reflect the subspecies count, and the link to the Explore page will take you to the species level.",
        },
    ];
    addElems({
        type: "p",
        parent: document.body.querySelector("header"),
        attributes: instructions,
    });
}
else {
    addElem({
        type: "p",
        parent: document.body.querySelector("header"),
        attributes: {
            innerHTML: "This is the base query: " +
                createLink(createAmp(apiURL)) +
                ". (This page will accept most parameters from the " +
                apiReference +
                " API endpoint.)",
        },
    });
    Promise.all(urlsToMakeRequestsTo.map((url) => fetch(url)))
        .then((response) => Promise.all(response.map((r) => r.json())))
        .then((response) => {
        let species = response.reduce((acc, curr) => acc.concat(curr.results), []);
        let page = response.sort((a, b) => a.page - b.page)[0].page;
        processResult({
            page: page,
            per_page: resultsPerPage,
            results: species,
            total_results: response[0].total_results,
        });
    })
        .catch((err) => {
        console.error(err.message);
        addElem({
            type: "p",
            parent: document.body,
            attributes: {
                innerText: "There was a problem retrieving data. Error " + err.message + ".",
            },
        });
    });
}
