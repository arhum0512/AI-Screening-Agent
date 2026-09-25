const https = require("https");
const http = require("http");


/*
 * Website Researcher
 *
 * This module retrieves and prepares public website
 * information for the AI screening process.
 *
 * Responsibilities:
 *
 * - Fetch HTTP and HTTPS websites
 * - Follow redirects
 * - Use a browser-like User-Agent
 * - Apply configurable timeout
 * - Limit response size
 * - Prevent redirect loops
 * - Extract useful page content
 * - Discover useful internal company pages
 * - Prioritize internal pages using configuration
 * - Identify the type of each researched page
 * - Research multiple pages
 * - Limit research text sent to AI
 */


/*
 * Default research configuration.
 *
 * The actual configuration is loaded from:
 *
 * config/research.json
 */
let researchConfig = {

    request_timeout_ms: 60000,

    max_response_size_mb: 2,

    max_redirects: 5,

    max_research_text_length: 30000,

    max_additional_pages: 5,

    page_priorities: {}

};


/*
 * Configure the research module.
 */
function configureResearch(config) {

    if (!config) {
        return;
    }


    researchConfig = {

        ...researchConfig,

        ...config

    };

}


/*
 * Fetch the HTML content of a website.
 *
 * Supports:
 *
 * - HTTP
 * - HTTPS
 * - Redirects
 * - Timeout protection
 * - Response-size protection
 */
function fetchWebsite(
    url,
    redirectCount = 0
) {

    return new Promise(
        (resolve, reject) => {

            let parsedUrl;


            /*
             * Validate URL.
             */
            try {

                parsedUrl =
                    new URL(url);

            } catch (error) {

                reject(
                    new Error(
                        `Invalid website URL: ${url}`
                    )
                );

                return;

            }


            /*
             * Only HTTP and HTTPS are allowed.
             */
            if (
                parsedUrl.protocol !== "https:" &&
                parsedUrl.protocol !== "http:"
            ) {

                reject(
                    new Error(
                        `Unsupported URL protocol: ${parsedUrl.protocol}`
                    )
                );

                return;

            }


            /*
             * Prevent redirect loops.
             */
            if (
                redirectCount >=
                researchConfig.max_redirects
            ) {

                reject(
                    new Error(
                        `Too many redirects while accessing ${url}`
                    )
                );

                return;

            }


            /*
             * Select HTTP or HTTPS client.
             */
            const client =
                parsedUrl.protocol === "https:"
                    ? https
                    : http;


            /*
             * Convert MB to bytes.
             */
            const maxResponseSize =
                researchConfig.max_response_size_mb *
                1024 *
                1024;


            /*
             * Create HTTP request.
             */
            const request =
                client.get(
                    url,
                    {

                        headers: {

                            "User-Agent":
                                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 AI-Website-Screening-Agent/1.0",

                            "Accept":
                                "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

                            "Accept-Language":
                                "en-US,en;q=0.9"

                        }

                    },

                    (response) => {


                        /*
                         * Handle redirects.
                         */
                        if (
                            response.statusCode >= 300 &&
                            response.statusCode < 400 &&
                            response.headers.location
                        ) {

                            const redirectUrl =
                                new URL(
                                    response.headers.location,
                                    url
                                ).toString();


                            response.resume();


                            fetchWebsite(
                                redirectUrl,
                                redirectCount + 1
                            )
                                .then(resolve)
                                .catch(reject);


                            return;

                        }


                        /*
                         * Reject unsuccessful responses.
                         */
                        if (
                            response.statusCode < 200 ||
                            response.statusCode >= 300
                        ) {

                            response.resume();


                            reject(
                                new Error(
                                    `Website returned HTTP ${response.statusCode}`
                                )
                            );


                            return;

                        }


                        let data = "";

                        let totalSize = 0;


                        response.setEncoding(
                            "utf8"
                        );


                        /*
                         * Receive response data.
                         */
                        response.on(
                            "data",
                            (chunk) => {

                                totalSize +=
                                    Buffer.byteLength(
                                        chunk,
                                        "utf8"
                                    );


                                /*
                                 * Stop if response is too large.
                                 */
                                if (
                                    totalSize >
                                    maxResponseSize
                                ) {

                                    response.destroy();


                                    reject(
                                        new Error(
                                            "Website response is too large to process."
                                        )
                                    );


                                    return;

                                }


                                data += chunk;

                            }
                        );


                        /*
                         * Response completed.
                         */
                        response.on(
                            "end",
                            () => {

                                resolve(
                                    data
                                );

                            }
                        );


                        /*
                         * Response error.
                         */
                        response.on(
                            "error",
                            (error) => {

                                reject(
                                    error
                                );

                            }
                        );

                    }
                );


            /*
             * Connection error.
             */
            request.on(
                "error",
                (error) => {

                    reject(
                        new Error(
                            `Unable to access website: ${error.message}`
                        )
                    );

                }
            );


            /*
             * Configured timeout.
             */
            request.setTimeout(
                researchConfig.request_timeout_ms,

                () => {

                    request.destroy();


                    reject(
                        new Error(
                            `Website request timed out after ${researchConfig.request_timeout_ms / 1000} seconds.`
                        )
                    );

                }
            );

        }
    );

}


/*
 * Decode common HTML entities.
 */
function decodeHtmlEntities(text) {

    return text

        .replace(
            /&nbsp;/gi,
            " "
        )

        .replace(
            /&amp;/gi,
            "&"
        )

        .replace(
            /&quot;/gi,
            '"'
        )

        .replace(
            /&#39;/gi,
            "'"
        )

        .replace(
            /&lt;/gi,
            "<"
        )

        .replace(
            /&gt;/gi,
            ">"
        );

}


/*
 * Clean extracted text.
 */
function cleanText(text) {

    return decodeHtmlEntities(
        text
    )

        .replace(
            /\s+/g,
            " "
        )

        .trim();

}


/*
 * Extract page title.
 */
function extractTitle(html) {

    const match =
        html.match(
            /<title[^>]*>([\s\S]*?)<\/title>/i
        );


    if (!match) {

        return "";

    }


    return cleanText(
        match[1]
    );

}


/*
 * Extract meta description.
 */
function extractMetaDescription(html) {

    const match =
        html.match(
            /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i
        );


    if (!match) {

        const reverseMatch =
            html.match(
                /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i
            );


        if (!reverseMatch) {

            return "";

        }


        return cleanText(
            reverseMatch[1]
        );

    }


    return cleanText(
        match[1]
    );

}


/*
 * Extract H1, H2 and H3 headings.
 */
function extractHeadings(html) {

    const headings = [];

    const headingRegex =
        /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;


    let match;


    while (
        (match =
            headingRegex.exec(html)) !== null
    ) {

        const heading =
            cleanText(
                match[1]
                    .replace(
                        /<[^>]+>/g,
                        " "
                    )
            );


        if (heading) {

            headings.push(
                heading
            );

        }

    }


    /*
     * Remove duplicates.
     */
    return [
        ...new Set(
            headings
        )
    ];

}


/*
 * Extract meaningful paragraph text.
 */
function extractParagraphs(html) {

    const paragraphs = [];

    const paragraphRegex =
        /<p[^>]*>([\s\S]*?)<\/p>/gi;


    let match;


    while (
        (match =
            paragraphRegex.exec(html)) !== null
    ) {

        const paragraph =
            cleanText(
                match[1]
                    .replace(
                        /<[^>]+>/g,
                        " "
                    )
            );


        /*
         * Ignore very short fragments.
         */
        if (
            paragraph.length >= 30
        ) {

            paragraphs.push(
                paragraph
            );

        }

    }


    return [
        ...new Set(
            paragraphs
        )
    ];

}


/*
 * Remove unnecessary sections.
 */
function removeUnnecessarySections(html) {

    return html

        .replace(
            /<script[\s\S]*?<\/script>/gi,
            ""
        )

        .replace(
            /<style[\s\S]*?<\/style>/gi,
            ""
        )

        .replace(
            /<!--[\s\S]*?-->/g,
            ""
        )

        .replace(
            /<svg[\s\S]*?<\/svg>/gi,
            ""
        )

        .replace(
            /<nav[\s\S]*?<\/nav>/gi,
            ""
        )

        .replace(
            /<footer[\s\S]*?<\/footer>/gi,
            ""
        )

        .replace(
            /<noscript[\s\S]*?<\/noscript>/gi,
            ""
        );

}


/*
 * Extract useful content from one HTML page.
 */
function extractUsefulContent(html) {

    const cleanedHtml =
        removeUnnecessarySections(
            html
        );


    const title =
        extractTitle(
            cleanedHtml
        );


    const description =
        extractMetaDescription(
            cleanedHtml
        );


    const headings =
        extractHeadings(
            cleanedHtml
        );


    const paragraphs =
        extractParagraphs(
            cleanedHtml
        );


    const researchSections = [];


    if (title) {

        researchSections.push(
            `PAGE TITLE:\n${title}`
        );

    }


    if (description) {

        researchSections.push(
            `META DESCRIPTION:\n${description}`
        );

    }


    if (headings.length > 0) {

        researchSections.push(
            `HEADINGS:\n${headings.join("\n")}`
        );

    }


    if (paragraphs.length > 0) {

        researchSections.push(
            `PAGE CONTENT:\n${paragraphs.join("\n\n")}`
        );

    }


    /*
     * Fallback when structured content
     * cannot be extracted.
     */
    if (
        researchSections.length === 0
    ) {

        const fallbackText =
            cleanedHtml
                .replace(
                    /<[^>]+>/g,
                    " "
                );


        const cleanedFallback =
            cleanText(
                fallbackText
            );


        if (cleanedFallback) {

            researchSections.push(
                `PAGE CONTENT:\n${cleanedFallback}`
            );

        }

    }


    return researchSections.join(
        "\n\n"
    );

}


/*
 * Extract links from a webpage.
 *
 * Only internal links belonging to the same
 * company domain are returned.
 */
function extractInternalLinks(
    html,
    baseUrl
) {

    const links = [];

    const linkRegex =
        /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;


    let match;


    let baseHost;


    try {

        baseHost =
            new URL(
                baseUrl
            )
                .hostname
                .replace(
                    /^www\./,
                    ""
                )
                .toLowerCase();

    } catch (error) {

        return [];

    }


    while (
        (match =
            linkRegex.exec(html)) !== null
    ) {

        const rawHref =
            match[1].trim();


        /*
         * Ignore empty links.
         */
        if (!rawHref) {

            continue;

        }


        /*
         * Ignore special links.
         */
        if (
            rawHref.startsWith("#") ||
            rawHref.startsWith("mailto:") ||
            rawHref.startsWith("tel:") ||
            rawHref.startsWith("javascript:")
        ) {

            continue;

        }


        let absoluteUrl;


        try {

            absoluteUrl =
                new URL(
                    rawHref,
                    baseUrl
                );

        } catch (error) {

            continue;

        }


        /*
         * Only HTTP and HTTPS.
         */
        if (
            absoluteUrl.protocol !== "http:" &&
            absoluteUrl.protocol !== "https:"
        ) {

            continue;

        }


        const linkHost =
            absoluteUrl.hostname
                .replace(
                    /^www\./,
                    ""
                )
                .toLowerCase();


        /*
         * Only same-domain pages.
         */
        if (
            baseHost !== linkHost
        ) {

            continue;

        }


        /*
         * Remove URL fragments.
         */
        absoluteUrl.hash = "";


        links.push(
            absoluteUrl.toString()
        );

    }


    return [
        ...new Set(
            links
        )
    ];

}


/*
 * Identify the type of an internal page.
 *
 * This uses the same configurable keywords
 * defined in research.json.
 *
 * Example:
 *
 * /careers
 *
 * becomes:
 *
 * careers
 */
function identifyPageType(url) {

    let parsedUrl;


    try {

        parsedUrl =
            new URL(
                url
            );

    } catch (error) {

        return "unknown";

    }


    const path =
        parsedUrl.pathname
            .toLowerCase();


    const priorities =
        researchConfig.page_priorities ||
        {};


    let selectedType =
        "unknown";

    let highestScore =
        0;


    for (
        const keyword
        of Object.keys(priorities)
    ) {

        const score =
            Number(
                priorities[keyword]
            );


        if (
            !Number.isFinite(score)
        ) {

            continue;

        }


        if (
            path.includes(
                keyword.toLowerCase()
            )
        ) {

            /*
             * Use the highest-priority
             * matching page category.
             */
            if (
                score >
                highestScore
            ) {

                highestScore =
                    score;

                selectedType =
                    keyword;

            }

        }

    }


    return selectedType;

}


/*
 * Calculate the usefulness of an internal page.
 */
function scoreInternalLink(url) {

    let parsedUrl;


    try {

        parsedUrl =
            new URL(
                url
            );

    } catch (error) {

        return 0;

    }


    const path =
        parsedUrl.pathname
            .toLowerCase();


    const priorities =
        researchConfig.page_priorities ||
        {};


    let highestScore =
        0;


    for (
        const keyword
        of Object.keys(priorities)
    ) {

        const score =
            Number(
                priorities[keyword]
            );


        if (
            !Number.isFinite(score)
        ) {

            continue;

        }


        if (
            path.includes(
                keyword.toLowerCase()
            )
        ) {

            highestScore =
                Math.max(
                    highestScore,
                    score
                );

        }

    }


    return highestScore;

}


/*
 * Select the most useful internal pages.
 */
function selectUsefulPages(
    links,
    baseUrl
) {

    const scoredLinks =
        links.map(
            (url) => ({

                url,

                score:
                    scoreInternalLink(
                        url
                    )

            })
        );


    /*
     * Keep only pages matching
     * configured research priorities.
     */
    const usefulLinks =
        scoredLinks
            .filter(
                (item) =>
                    item.score > 0
            );


    /*
     * Sort highest priority first.
     */
    usefulLinks.sort(
        (a, b) => {

            if (
                b.score !== a.score
            ) {

                return (
                    b.score -
                    a.score
                );

            }


            /*
             * Deterministic tie-breaker.
             */
            return a.url.localeCompare(
                b.url
            );

        }
    );


    /*
     * Select configured number of pages.
     */
    const selectedUrls = [];


    for (
        const item
        of usefulLinks
    ) {

        if (
            !selectedUrls.includes(
                item.url
            )
        ) {

            selectedUrls.push(
                item.url
            );

        }


        if (
            selectedUrls.length >=
            researchConfig.max_additional_pages
        ) {

            break;

        }

    }


    return selectedUrls;

}


/*
 * Research one page.
 *
 * Returns:
 *
 * - source
 * - page_type
 * - text
 * - html
 */
async function researchPage(url) {

    const html =
        await fetchWebsite(
            url
        );


    const text =
        extractUsefulContent(
            html
        );


    const pageType =
        identifyPageType(
            url
        );


    return {

        source:
            url,

        page_type:
            pageType,

        text:
            text,

        html:
            html

    };

}


/*
 * Limit research text.
 */
function limitResearchText(text) {

    const maxLength =
        researchConfig.max_research_text_length;


    if (
        text.length <= maxLength
    ) {

        return text;

    }


    return (
        text.substring(
            0,
            maxLength
        ) +
        "\n\n[Research text truncated because it exceeded the configured limit.]"
    );

}


/*
 * Research the company website.
 */
async function researchWebsite(url) {

    /*
     * --------------------------------------------------
     * Step 1: Research homepage
     * --------------------------------------------------
     */

    console.log(
        "Researching homepage..."
    );


    const homepage =
        await researchPage(
            url
        );


    /*
     * The homepage is always classified as homepage.
     */
    homepage.page_type =
        "homepage";


    /*
     * --------------------------------------------------
     * Step 2: Discover internal links
     * --------------------------------------------------
     */

    console.log(
        "Discovering useful internal pages..."
    );


    const internalLinks =
        extractInternalLinks(
            homepage.html,
            url
        );


    console.log(
        `Internal links discovered: ${internalLinks.length}`
    );


    /*
     * --------------------------------------------------
     * Step 3: Select useful pages
     * --------------------------------------------------
     */

    const usefulPages =
        selectUsefulPages(
            internalLinks,
            url
        );


    console.log(
        `Useful internal pages selected: ${usefulPages.length}`
    );


    /*
     * --------------------------------------------------
     * Step 4: Research selected pages
     * --------------------------------------------------
     */

    const pageResults = [];


    for (
        const pageUrl
        of usefulPages
    ) {

        try {

            console.log(
                `Researching internal page: ${pageUrl}`
            );


            const page =
                await researchPage(
                    pageUrl
                );


            pageResults.push(
                page
            );


            console.log(
                `Internal page research completed: ${pageUrl}`
            );

        } catch (error) {

            /*
             * One failed page should not
             * stop company research.
             */
            console.error(
                `Unable to research internal page: ${pageUrl}`
            );

            console.error(
                error.message
            );

        }

    }


    /*
     * --------------------------------------------------
     * Step 5: Combine research
     * --------------------------------------------------
     */

    const researchSections = [];


    /*
     * Homepage research.
     */
    researchSections.push(
        `========================================
SOURCE TYPE: ${homepage.page_type}
SOURCE URL: ${homepage.source}
========================================

${homepage.text}`
    );


    /*
     * Internal-page research.
     */
    for (
        const page
        of pageResults
    ) {

        researchSections.push(
            `========================================
SOURCE TYPE: ${page.page_type}
SOURCE URL: ${page.source}
========================================

${page.text}`
        );

    }


    const combinedResearch =
        researchSections.join(
            "\n\n"
        );


    /*
     * Apply final research-size limit.
     */
    const limitedResearch =
        limitResearchText(
            combinedResearch
        );


    /*
     * Return cleaned research and
     * source metadata.
     */
    return {

        source:
            url,

        text:
            limitedResearch,

        pages_researched:
            [
                {
                    url:
                        homepage.source,

                    page_type:
                        homepage.page_type
                },

                ...pageResults.map(
                    (page) => ({

                        url:
                            page.source,

                        page_type:
                            page.page_type

                    })
                )
            ]

    };

}


/*
 * Export functions.
 */
module.exports = {

    configureResearch,

    fetchWebsite,

    extractTitle,

    extractMetaDescription,

    extractHeadings,

    extractParagraphs,

    removeUnnecessarySections,

    extractUsefulContent,

    extractInternalLinks,

    identifyPageType,

    scoreInternalLink,

    selectUsefulPages,

    researchPage,

    limitResearchText,

    researchWebsite

};