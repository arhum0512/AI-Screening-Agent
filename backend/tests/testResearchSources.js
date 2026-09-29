const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
    researchAllSources
} = require("../src/research/multiSourceResearcher");
const {
    researchPublicWeb
} = require("../src/research/publicWebResearcher");
const {
    runScreening
} = require("../src/screeningPipeline");

async function request(baseUrl, pathname, options = {}) {
    const response = await fetch(`${baseUrl}${pathname}`, options);
    const body = await response.json();
    return { response, body };
}

async function main() {
    const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "research-sources-"));
    const registryPath = path.join(tempDirectory, "research-sources.json");
    fs.copyFileSync(
        path.join(__dirname, "..", "config", "research-sources.json"),
        registryPath
    );
    process.env.RESEARCH_SOURCES_PATH = registryPath;

    const { app } = require("../server");
    const server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    try {
        let result = await request(baseUrl, "/api/research-sources");
        assert.strictEqual(result.response.status, 200);
        assert.ok(result.body.sources.some((source) => source.id === "linkedin"));

        result = await request(baseUrl, "/api/research-sources", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Product Hunt",
                domain: "https://www.producthunt.com/discover"
            })
        });
        assert.strictEqual(result.response.status, 201);
        assert.strictEqual(result.body.source.domain, "producthunt.com");
        assert.strictEqual(result.body.source.type, "web");
        const productHuntId = result.body.source.id;

        result = await request(baseUrl, "/api/research-sources");
        assert.ok(result.body.sources.some((source) => source.id === productHuntId));

        for (const duplicate of [
            { name: "Product Hunt", domain: "another.example" },
            { name: "Different", domain: "www.producthunt.com" }
        ]) {
            result = await request(baseUrl, "/api/research-sources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(duplicate)
            });
            assert.strictEqual(result.response.status, 400);
        }

        result = await request(baseUrl, "/api/research-sources", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Invalid", domain: "not a domain" })
        });
        assert.strictEqual(result.response.status, 400);

        result = await request(baseUrl, `/api/research-sources/${productHuntId}`, {
            method: "DELETE"
        });
        assert.strictEqual(result.response.status, 200);

        result = await request(baseUrl, "/api/research-sources/linkedin", { method: "DELETE" });
        assert.strictEqual(result.response.status, 200);

        result = await request(baseUrl, "/api/research-sources", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "LinkedIn", domain: "www.linkedin.com" })
        });
        assert.strictEqual(result.response.status, 201);
        assert.strictEqual(result.body.source.id, "linkedin");
        assert.strictEqual(result.body.source.domain, "linkedin.com");
        assert.strictEqual(result.body.source.type, "web");

        result = await request(baseUrl, "/api/research-sources/x-twitter", { method: "DELETE" });
        assert.strictEqual(result.response.status, 200);

        result = await request(baseUrl, "/api/research-sources", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "X", domain: "https://www.x.com/" })
        });
        assert.strictEqual(result.response.status, 201);
        assert.strictEqual(result.body.source.type, "x");
        await request(baseUrl, `/api/research-sources/${result.body.source.id}`, { method: "DELETE" });

        result = await request(baseUrl, "/api/research-sources", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Twitter", domain: "twitter.com" })
        });
        assert.strictEqual(result.response.status, 201);
        assert.strictEqual(result.body.source.type, "x");

        result = await request(baseUrl, "/api/research-sources/company-website", { method: "DELETE" });
        assert.strictEqual(result.response.status, 200);
        result = await request(baseUrl, "/api/research-sources", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Company Website", domain: "" })
        });
        assert.strictEqual(result.response.status, 201);
        assert.strictEqual(result.body.source.type, "company_website");
        assert.strictEqual(result.body.source.domain, null);

        result = await request(baseUrl, "/api/upload", { method: "POST", body: new FormData() });
        assert.strictEqual(result.response.status, 400);
        assert.strictEqual(result.body.message, "Please select at least one research source.");

        await assert.rejects(
            () => runScreening({ selectedSources: [] }),
            /Please select at least one research source/
        );

        const calls = [];
        const dependencies = {
            researchWebsite: async () => {
                calls.push("website");
                return { source: "https://company.test", text: "website", pages_researched: [] };
            },
            researchPublicWeb: async (company, options) => {
                calls.push(`web:${options.source.id}`);
                return {
                    text: options.source.name,
                    sources: [
                        { url: `https://${options.source.domain || "news.test"}/evidence` },
                        { url: "https://unselected.test/evidence" }
                    ]
                };
            },
            researchXSocial: async () => {
                calls.push("x");
                return { text: "x", sources: [{ url: "https://x.com/company/status/1" }] };
            }
        };
        const linkedin = { id: "linkedin", name: "LinkedIn", domain: "linkedin.com", type: "web" };
        const crunchbase = { id: "crunchbase", name: "Crunchbase", domain: "crunchbase.com", type: "web" };

        let research = await researchAllSources(
            { website: "https://company.test" },
            [linkedin],
            dependencies
        );
        assert.deepStrictEqual(calls, ["web:linkedin"]);
        assert.deepStrictEqual(research.sources.map((source) => source.url), ["https://linkedin.com/evidence"]);

        calls.length = 0;
        await researchAllSources(
            { website: "https://company.test" },
            [linkedin, crunchbase],
            dependencies
        );
        assert.deepStrictEqual(calls.sort(), ["web:crunchbase", "web:linkedin"]);

        calls.length = 0;
        await researchAllSources(
            { website: "https://company.test" },
            [{ id: "x", name: "X", domain: "x.com", type: "x" }],
            dependencies
        );
        assert.deepStrictEqual(calls, ["x"]);

        calls.length = 0;
        await researchAllSources(
            { website: "https://company.test" },
            [{ id: "site", name: "Company Website", domain: null, type: "company_website" }],
            dependencies
        );
        assert.deepStrictEqual(calls, ["website"]);

        calls.length = 0;
        await researchAllSources(
            { website: "https://company.test" },
            [{ id: "general", name: "General", domain: null, type: "general_web" }],
            dependencies
        );
        assert.deepStrictEqual(calls, ["web:general"]);

        let requestPayload;
        const targeted = await researchPublicWeb(
            { website: "https://company.test" },
            {
                source: { id: "product-hunt", name: "Product Hunt", domain: "producthunt.com", type: "web" },
                maxAttempts: 1,
                client: {
                    responses: {
                        create: async (payload) => {
                            requestPayload = payload;
                            return {
                                output_text: "Targeted research",
                                citations: [
                                    "https://www.producthunt.com/posts/example",
                                    "https://unselected.test/example"
                                ]
                            };
                        }
                    }
                }
            }
        );
        assert.deepStrictEqual(
            requestPayload.tools[0].filters.allowed_domains,
            ["producthunt.com"]
        );
        assert.deepStrictEqual(
            targeted.sources.map((source) => source.url),
            ["https://www.producthunt.com/posts/example"]
        );

        console.log("PASS: Dynamic registry APIs, source selection, targeted search, and source isolation work.");
    } finally {
        await new Promise((resolve) => server.close(resolve));
        fs.rmSync(tempDirectory, { recursive: true, force: true });
        delete process.env.RESEARCH_SOURCES_PATH;
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
