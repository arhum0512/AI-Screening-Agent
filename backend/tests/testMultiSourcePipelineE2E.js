const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
    runScreening
} = require("../src/screeningPipeline");


async function main() {

    const testDirectory =
        path.join(
            __dirname,
            "temp-multi-source-e2e"
        );

    const companiesPath =
        path.join(
            testDirectory,
            "companies.csv"
        );

    const outputDirectory =
        path.join(
            testDirectory,
            "output"
        );

    fs.mkdirSync(
        testDirectory,
        {
            recursive:
                true
        }
    );

    fs.writeFileSync(
        companiesPath,
        "id,website\nE2E-1,https://example.com\n",
        "utf8"
    );

    let finalPrompt =
        "";

    try {

        const result =
            await runScreening({
                companiesPath,
                outputDirectory,
                dependencies: {
                    researchWebsite: async (url) => ({
                        source:
                            url,
                        text:
                            "The official careers page lists several open roles.",
                        pages_researched: [
                            {
                                url:
                                    `${url}/careers`,
                                page_type:
                                    "careers"
                            }
                        ]
                    }),
                    researchPublicWeb: async () => ({
                        text:
                            "A news report confirms the expansion.",
                        sources: [
                            {
                                url:
                                    "https://news.example/expansion",
                                title:
                                    "Expansion report"
                            }
                        ],
                        sourceCount:
                            1
                    }),
                    researchXSocial: async () => ({
                        text:
                            "The company announced hiring on X.",
                        sources: [
                            {
                                url:
                                    "https://x.com/example/status/123",
                                title:
                                    "Hiring post"
                            }
                        ],
                        sourceCount:
                            1
                    }),
                    askAI: async (prompt) => {
                        finalPrompt =
                            prompt;

                        return JSON.stringify({
                            website:
                                "https://example.com",
                            company:
                                "Example",
                            business_type:
                                "Software",
                            services: [
                                "Software development"
                            ],
                            team_size:
                                "Unknown",
                            detected_triggers: [
                                {
                                    name:
                                        "Hiring rapidly",
                                    category:
                                        "growth",
                                    score:
                                        1,
                                    evidence: [
                                        {
                                            source:
                                                "https://x.com/example/status/123",
                                            description:
                                                "The company-authored X post announces active hiring."
                                        }
                                    ]
                                }
                            ],
                            additional_triggers:
                                [],
                            evidence: [
                                {
                                    source:
                                        "https://news.example/expansion",
                                    description:
                                        "The public news report confirms company expansion."
                                }
                            ],
                            reason:
                                "Direct hiring and expansion evidence was found.",
                            confidence:
                                "High"
                        });
                    }
                }
            });

        assert.strictEqual(
            result.success,
            true
        );

        assert.strictEqual(
            result.successfulCompanies,
            1
        );

        assert.strictEqual(
            result.results[0].company_score,
            8,
            "Backend must enforce the configured Hiring rapidly score."
        );

        assert.ok(
            finalPrompt.includes(
                "OFFICIAL COMPANY WEBSITE RESEARCH"
            ) &&
            finalPrompt.includes(
                "PUBLIC WEB SEARCH RESEARCH"
            ) &&
            finalPrompt.includes(
                "X / SOCIAL ACTIVITY RESEARCH"
            )
        );

        const evidenceCsv =
            fs.readFileSync(
                result.files.evidence,
                "utf8"
            );

        assert.ok(
            evidenceCsv.includes(
                "https://x.com/example/status/123"
            )
        );

        assert.ok(
            evidenceCsv.includes(
                "The company-authored X post announces active hiring."
            )
        );

        assert.ok(
            evidenceCsv.includes(
                "https://news.example/expansion"
            )
        );

        assert.strictEqual(
            result.counts.evidenceRows,
            2
        );

        console.log(
            "PASS: End-to-end multi-source screening preserved evidence and backend scoring."
        );

    } finally {

        if (fs.existsSync(testDirectory)) {
            fs.rmSync(
                testDirectory,
                {
                    recursive:
                        true,
                    force:
                        true
                }
            );
        }
    }
}


main().catch(
    (error) => {
        console.error(error);
        process.exitCode = 1;
    }
);
