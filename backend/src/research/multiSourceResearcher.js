const { researchWebsite } = require("./webResearcher");
const {
    researchPublicWeb,
    urlMatchesDomain
} = require("./publicWebResearcher");
const { researchXSocial } = require("./xSocialResearcher");

const LEGACY_SOURCES = [
    { id: "company-website", name: "Official Company Website", domain: null, type: "company_website", evidenceType: "official_website" },
    { id: "general-web-search", name: "Public Web Search", domain: null, type: "general_web", evidenceType: "public_web" },
    { id: "x-twitter", name: "X / Social Activity", domain: "x.com", type: "x", evidenceType: "x_social" }
];

function normalizeSource(source, sourceType, researchSource = null) {
    if (!source || typeof source.url !== "string" || !source.url.trim()) {
        return null;
    }

    return {
        url: source.url.trim(),
        title: typeof source.title === "string" ? source.title.trim() : "",
        sourceType,
        researchSourceId: researchSource?.id || null,
        researchSourceName: researchSource?.name || null
    };
}

function hostnameFor(value) {
    try {
        return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
    } catch (error) {
        return null;
    }
}

function sourceUrlIsAllowed(url, source, company) {
    if (source.type === "general_web") {
        try {
            return ["http:", "https:"].includes(new URL(url).protocol);
        } catch (error) {
            return false;
        }
    }

    if (source.type === "company_website") {
        const companyDomain = hostnameFor(company.website);
        return Boolean(companyDomain) && urlMatchesDomain(url, companyDomain);
    }

    return urlMatchesDomain(url, source.domain);
}

function sourcesFromResult(result, source, company) {
    const rawSources = [];

    if (source.type === "company_website") {
        for (const page of result?.pages_researched || []) {
            rawSources.push({ url: page.url, title: page.page_type || source.name });
        }

        if (result?.source && !rawSources.some((item) => item.url === result.source)) {
            rawSources.unshift({ url: result.source, title: source.name });
        }
    } else {
        rawSources.push(...(result?.sources || []));
    }

    return rawSources
        .filter((item) => sourceUrlIsAllowed(item?.url, source, company))
        .map((item) => normalizeSource(item, source.evidenceType || source.type, source))
        .filter(Boolean);
}

function deduplicateSources(sources) {
    const seen = new Set();

    return sources.filter((source) => {
        if (!source || seen.has(source.url)) {
            return false;
        }

        seen.add(source.url);
        return true;
    });
}

function collectResearchSources(websiteResearch, publicWebResearch, xSocialResearch) {
    const legacyResults = [
        {
            source: LEGACY_SOURCES[0],
            result: websiteResearch,
            company: { website: websiteResearch?.source }
        },
        { source: LEGACY_SOURCES[1], result: publicWebResearch, company: {} },
        { source: LEGACY_SOURCES[2], result: xSocialResearch, company: {} }
    ];

    return deduplicateSources(
        legacyResults.flatMap(({ result, source, company }) =>
            sourcesFromResult(result, source, company)
        )
    );
}

function formatSourceInventory(sources) {
    if (sources.length === 0) {
        return "No source URLs were returned.";
    }

    return sources
        .map((source, index) => `
${index + 1}. RESEARCH SOURCE: ${source.researchSourceName || source.sourceType}
SOURCE TYPE: ${source.sourceType}
SOURCE URL: ${source.url}
SOURCE TITLE: ${source.title || "Untitled source"}
`.trim())
        .join("\n\n");
}

function createFailedSupplementalResearch(label, error) {
    return {
        text:
            `${label} could not be completed. ` +
            `Reason: ${error?.message || "Unknown research error."} ` +
            "Do not interpret missing research as proof that no signal exists.",
        sources: [],
        sourceCount: 0,
        error: error?.message || "Unknown research error."
    };
}

function headingForSource(source) {
    if (source.type === "company_website") return "OFFICIAL COMPANY WEBSITE RESEARCH";
    if (source.type === "general_web") return "PUBLIC WEB SEARCH RESEARCH";
    if (source.type === "x") return "X / SOCIAL ACTIVITY RESEARCH";
    return `${source.name.toUpperCase()} RESEARCH`;
}

function failureLabelForSource(source) {
    if (source.type === "general_web") return "Public web research";
    if (source.type === "x") return "X/social research";
    return source.name;
}

function combineSelectedResearch(results) {
    const sources = deduplicateSources(
        results.flatMap(({ result, source, company }) =>
            sourcesFromResult(result, source, company)
        )
    );
    const sections = results.map(({ source, result }) => `
==================================================
${headingForSource(source)}
==================================================

${result?.text || `No ${source.name} research was available.`}
`.trim());

    return {
        text: `
${sections.join("\n\n")}

==================================================
VERIFIED RESEARCH SOURCE URL INVENTORY
==================================================

${formatSourceInventory(sources)}

==================================================
RESEARCH USAGE INSTRUCTIONS
==================================================

Use only the selected research sections above when evaluating the company. Every evidence object must contain exactly one URL from the verified inventory and a separate factual description. Never invent a URL or rely on a platform that was not selected.
`.trim(),
        sources
    };
}

function combineResearchResults({ websiteResearch, publicWebResearch, xSocialResearch }) {
    return combineSelectedResearch([
        {
            source: LEGACY_SOURCES[0],
            result: websiteResearch,
            company: { website: websiteResearch?.source }
        },
        { source: LEGACY_SOURCES[1], result: publicWebResearch, company: {} },
        { source: LEGACY_SOURCES[2], result: xSocialResearch, company: {} }
    ]);
}

async function runSelectedSource(company, source, dependencies) {
    if (source.type === "company_website") {
        return (dependencies.researchWebsite || researchWebsite)(company.website);
    }

    if (source.type === "x") {
        return (dependencies.researchXSocial || researchXSocial)(company, { source });
    }

    return (dependencies.researchPublicWeb || researchPublicWeb)(company, { source });
}

async function researchAllSources(
    company,
    selectedSourcesOrDependencies = LEGACY_SOURCES,
    providedDependencies = {}
) {
    const selectedSources = Array.isArray(selectedSourcesOrDependencies)
        ? selectedSourcesOrDependencies
        : LEGACY_SOURCES;
    const dependencies = Array.isArray(selectedSourcesOrDependencies)
        ? providedDependencies
        : selectedSourcesOrDependencies;

    if (selectedSources.length === 0) {
        throw new Error("Please select at least one research source.");
    }

    const settled = await Promise.allSettled(
        selectedSources.map((source) => runSelectedSource(company, source, dependencies))
    );
    const results = settled.map((item, index) => ({
        source: selectedSources[index],
        company,
        result:
            item.status === "fulfilled"
                ? item.value
                : createFailedSupplementalResearch(
                    failureLabelForSource(selectedSources[index]),
                    item.reason
                )
    }));
    const combined = combineSelectedResearch(results);

    return {
        ...combined,
        selectedSources,
        sourceResults: results,
        websiteResearch:
            results.find((item) => item.source.type === "company_website")?.result || null,
        publicWebResearch:
            results.find((item) => ["web", "general_web"].includes(item.source.type))?.result || null,
        xSocialResearch:
            results.find((item) => item.source.type === "x")?.result || null
    };
}

module.exports = {
    researchAllSources,
    combineResearchResults,
    combineSelectedResearch,
    collectResearchSources,
    formatSourceInventory,
    createFailedSupplementalResearch,
    sourceUrlIsAllowed,
    LEGACY_SOURCES
};
