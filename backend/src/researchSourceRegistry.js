const fs = require("fs");
const path = require("path");

const VALID_SOURCE_TYPES = new Set([
    "company_website",
    "web",
    "x",
    "general_web"
]);

const DEFAULT_REGISTRY_PATH =
    path.join(
        __dirname,
        "..",
        "config",
        "research-sources.json"
    );

let mutationQueue = Promise.resolve();

function getRegistryPath(options = {}) {
    return (
        options.registryPath ||
        process.env.RESEARCH_SOURCES_PATH ||
        DEFAULT_REGISTRY_PATH
    );
}

function normalizeDomain(value) {
    const raw = String(value || "").trim().toLowerCase();

    if (!raw) {
        return null;
    }

    let parsed;

    try {
        parsed = new URL(
            /^[a-z][a-z\d+.-]*:\/\//i.test(raw)
                ? raw
                : `https://${raw}`
        );
    } catch (error) {
        throw new Error("Domain or URL must be a valid public HTTP(S) address.");
    }

    if (
        !["http:", "https:"].includes(parsed.protocol) ||
        parsed.username ||
        parsed.password ||
        !parsed.hostname.includes(".")
    ) {
        throw new Error("Domain or URL must be a valid public HTTP(S) address.");
    }

    const domain = parsed.hostname.replace(/^www\./, "");

    if (
        domain === "localhost" ||
        /^\d+(?:\.\d+){3}$/.test(domain) ||
        !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(domain)
    ) {
        throw new Error("Domain or URL must be a valid public domain.");
    }

    return domain;
}

function slugify(value) {
    return String(value || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
        "source";
}

function inferSourceType(name, domain) {
    if (["x.com", "twitter.com"].includes(domain)) {
        return "x";
    }

    const normalizedName = String(name || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

    if (["company website", "official company website"].includes(normalizedName)) {
        return "company_website";
    }

    if (["general web", "general web search", "public web search"].includes(normalizedName)) {
        return "general_web";
    }

    return "web";
}

function validateSource(source, context = "Research source") {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
        throw new Error(`${context} must be an object.`);
    }

    const id = String(source.id || "").trim();
    const name = String(source.name || "").trim();
    const type = String(source.type || "web").trim();

    if (!id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
        throw new Error(`${context} has an invalid id.`);
    }

    if (!name || name.length > 80) {
        throw new Error(`${context} name is required and must be 80 characters or fewer.`);
    }

    if (!VALID_SOURCE_TYPES.has(type)) {
        throw new Error(`${context} type must be company_website, web, x, or general_web.`);
    }

    const domain = normalizeDomain(source.domain);

    if ((type === "web" || type === "x") && !domain) {
        throw new Error(`${context} domain or URL is required for ${type} sources.`);
    }

    return {
        id,
        name,
        domain,
        type
    };
}

function validateRegistry(value) {
    if (!Array.isArray(value)) {
        throw new Error("Research source registry must contain a JSON array.");
    }

    const sources = value.map(
        (source, index) =>
            validateSource(source, `Research source at index ${index}`)
    );
    const ids = new Set();
    const names = new Set();
    const domains = new Set();

    for (const source of sources) {
        const nameKey = source.name.toLowerCase();

        if (ids.has(source.id)) {
            throw new Error(`Duplicate research source id: ${source.id}`);
        }

        if (names.has(nameKey)) {
            throw new Error(`Duplicate research source name: ${source.name}`);
        }

        if (source.domain && domains.has(source.domain)) {
            throw new Error(`Duplicate research source domain: ${source.domain}`);
        }

        ids.add(source.id);
        names.add(nameKey);

        if (source.domain) {
            domains.add(source.domain);
        }
    }

    return sources;
}

function readResearchSources(options = {}) {
    const registryPath = getRegistryPath(options);
    let parsed;

    try {
        parsed = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    } catch (error) {
        throw new Error(`Unable to load research source registry: ${error.message}`);
    }

    return validateRegistry(parsed);
}

function writeResearchSources(sources, options = {}) {
    const registryPath = getRegistryPath(options);
    const validated = validateRegistry(sources);
    const tempPath = `${registryPath}.${process.pid}.${Date.now()}.tmp`;

    fs.mkdirSync(path.dirname(registryPath), { recursive: true });
    fs.writeFileSync(tempPath, `${JSON.stringify(validated, null, 2)}\n`, "utf8");

    try {
        fs.renameSync(tempPath, registryPath);
    } catch (error) {
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }

        throw error;
    }

    return validated;
}

function enqueueMutation(mutation) {
    const result = mutationQueue.then(mutation, mutation);
    mutationQueue = result.catch(() => undefined);
    return result;
}

function addResearchSource(input, options = {}) {
    return enqueueMutation(() => {
        const sources = readResearchSources(options);
        const name = String(input?.name || "").trim();
        const domain = normalizeDomain(input?.domain);
        const type = inferSourceType(name, domain);
        const storedDomain =
            ["company_website", "general_web"].includes(type)
                ? null
                : domain;

        if (!name || name.length > 80) {
            throw new Error("Platform name is required and must be 80 characters or fewer.");
        }

        if ((type === "web" || type === "x") && !storedDomain) {
            throw new Error("Domain or URL is required for custom platforms.");
        }

        if (sources.some((source) => source.name.toLowerCase() === name.toLowerCase())) {
            throw new Error("A research source with that name already exists.");
        }

        if (storedDomain && sources.some((source) => source.domain === storedDomain)) {
            throw new Error("A research source with that domain already exists.");
        }

        const baseId = slugify(name);
        let id = baseId;
        let suffix = 2;

        while (sources.some((source) => source.id === id)) {
            id = `${baseId}-${suffix}`;
            suffix++;
        }

        const source = validateSource({ id, name, domain: storedDomain, type });
        writeResearchSources([...sources, source], options);
        return source;
    });
}

function deleteResearchSource(id, options = {}) {
    return enqueueMutation(() => {
        const sources = readResearchSources(options);
        const sourceId = String(id || "").trim();
        const remaining = sources.filter((source) => source.id !== sourceId);

        if (remaining.length === sources.length) {
            const error = new Error("Research source not found.");
            error.status = 404;
            throw error;
        }

        writeResearchSources(remaining, options);
        return sources.find((source) => source.id === sourceId);
    });
}

function resolveResearchSources(ids, options = {}) {
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error("Please select at least one research source.");
    }

    const sources = readResearchSources(options);
    const sourceMap = new Map(sources.map((source) => [source.id, source]));
    const uniqueIds = [...new Set(ids.map((id) => String(id || "").trim()))];
    const missing = uniqueIds.filter((id) => !sourceMap.has(id));

    if (missing.length > 0) {
        throw new Error(`Unknown research source: ${missing.join(", ")}`);
    }

    return uniqueIds.map((id) => sourceMap.get(id));
}

module.exports = {
    VALID_SOURCE_TYPES,
    DEFAULT_REGISTRY_PATH,
    normalizeDomain,
    inferSourceType,
    validateSource,
    validateRegistry,
    readResearchSources,
    writeResearchSources,
    addResearchSource,
    deleteResearchSource,
    resolveResearchSources
};
