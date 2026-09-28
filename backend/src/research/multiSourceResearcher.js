const {
    researchWebsite
} = require("./webResearcher");

const {
    researchPublicWeb
} = require("./publicWebResearcher");

const {
    researchXSocial
} = require("./xSocialResearcher");


function normalizeSource(source, sourceType) {

    if (
        !source ||
        typeof source.url !== "string" ||
        !source.url.trim()
    ) {

        return null;
    }

    return {
        url:
            source.url.trim(),
        title:
            typeof source.title === "string"
                ? source.title.trim()
                : "",
        sourceType
    };
}


function collectResearchSources(
    websiteResearch,
    publicWebResearch,
    xSocialResearch
) {

    const sources = [];
    const seen = new Set();

    function add(source) {

        if (
            !source ||
            seen.has(
                source.url
            )
        ) {

            return;
        }

        seen.add(
            source.url
        );

        sources.push(
            source
        );
    }

    if (
        websiteResearch?.source &&
        !(
            websiteResearch?.pages_researched ||
            []
        ).some(
            (page) =>
                page?.url === websiteResearch.source
        )
    ) {

        add(
            normalizeSource(
                {
                    url:
                        websiteResearch.source,
                    title:
                        "Official website"
                },
                "official_website"
            )
        );
    }

    for (
        const page
        of websiteResearch?.pages_researched || []
    ) {

        add(
            normalizeSource(
                {
                    url:
                        page.url,
                    title:
                        page.page_type ||
                        "Official website"
                },
                "official_website"
            )
        );
    }

    for (
        const source
        of publicWebResearch?.sources || []
    ) {

        add(
            normalizeSource(
                source,
                "public_web"
            )
        );
    }

    for (
        const source
        of xSocialResearch?.sources || []
    ) {

        add(
            normalizeSource(
                source,
                "x_social"
            )
        );
    }

    return sources;
}


function formatSourceInventory(sources) {

    if (sources.length === 0) {

        return "No source URLs were returned.";
    }

    return sources
        .map(
            (source, index) => `
${index + 1}. SOURCE TYPE: ${source.sourceType}
SOURCE URL: ${source.url}
SOURCE TITLE: ${source.title || "Untitled source"}
`.trim()
        )
        .join(
            "\n\n"
        );
}


function createFailedSupplementalResearch(
    label,
    error
) {

    return {
        text:
            `${label} could not be completed. ` +
            `Reason: ${error?.message || "Unknown research error."} ` +
            "Do not interpret missing research as proof that no signal exists.",
        sources:
            [],
        sourceCount:
            0,
        error:
            error?.message ||
            "Unknown research error."
    };
}


function combineResearchResults({
    websiteResearch,
    publicWebResearch,
    xSocialResearch
}) {

    const sources =
        collectResearchSources(
            websiteResearch,
            publicWebResearch,
            xSocialResearch
        );

    return {
        text: `
==================================================
OFFICIAL COMPANY WEBSITE RESEARCH
==================================================

${websiteResearch?.text || "No official website research was available."}

==================================================
PUBLIC WEB SEARCH RESEARCH
==================================================

${publicWebResearch?.text || "No public web research was available."}

==================================================
X / SOCIAL ACTIVITY RESEARCH
==================================================

${xSocialResearch?.text || "No X/social research was available."}

==================================================
VERIFIED RESEARCH SOURCE URL INVENTORY
==================================================

${formatSourceInventory(sources)}

==================================================
RESEARCH USAGE INSTRUCTIONS
==================================================

Use all three research layers when evaluating the company. Every evidence object must contain exactly one source URL from the supplied research and a separate factual description. Never put a description in the source field, never use a source name in place of a URL, and never invent a URL. Treat duplicate references as one source and distinguish direct evidence from weak or indirect signals.
`,
        sources
    };
}


async function researchAllSources(
    company,
    dependencies = {}
) {

    const websiteResearchFunction =
        dependencies.researchWebsite ||
        researchWebsite;

    const publicWebResearchFunction =
        dependencies.researchPublicWeb ||
        researchPublicWeb;

    const xSocialResearchFunction =
        dependencies.researchXSocial ||
        researchXSocial;

    const websiteResearch =
        await websiteResearchFunction(
            company.website
        );

    const supplementalResults =
        await Promise.allSettled([
            publicWebResearchFunction(
                company
            ),
            xSocialResearchFunction(
                company
            )
        ]);

    const publicWebResearch =
        supplementalResults[0].status === "fulfilled"
            ? supplementalResults[0].value
            : createFailedSupplementalResearch(
                "Public web research",
                supplementalResults[0].reason
            );

    const xSocialResearch =
        supplementalResults[1].status === "fulfilled"
            ? supplementalResults[1].value
            : createFailedSupplementalResearch(
                "X/social research",
                supplementalResults[1].reason
            );

    const combined =
        combineResearchResults({
            websiteResearch,
            publicWebResearch,
            xSocialResearch
        });

    return {
        ...combined,
        websiteResearch,
        publicWebResearch,
        xSocialResearch
    };
}


module.exports = {
    researchAllSources,
    combineResearchResults,
    collectResearchSources,
    formatSourceInventory,
    createFailedSupplementalResearch
};
