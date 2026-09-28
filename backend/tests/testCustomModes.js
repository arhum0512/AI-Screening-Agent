const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
    runScreening
} = require("../src/screeningPipeline");

const {
    validateCustomQueryResult,
    validateCustomScore
} = require("../src/validation/customResultValidator");


const sourceUrls = {
    official:
        "https://example.com/services",
    public:
        "https://news.example/company",
    social:
        "https://x.com/example/status/123"
};


function createResearchDependencies(askAI) {

    return {
        researchWebsite: async (url) => ({
            source:
                url,
            text:
                "The services page lists web, mobile, and Android application development.",
            pages_researched: [
                {
                    url:
                        sourceUrls.official,
                    page_type:
                        "services"
                }
            ]
        }),
        researchPublicWeb: async () => ({
            text:
                "A public profile describes the company as a software provider.",
            sources: [
                {
                    url:
                        sourceUrls.public,
                    title:
                        "Company profile"
                }
            ],
            sourceCount:
                1
        }),
        researchXSocial: async () => ({
            text:
                "A company post links to its mobile development services.",
            sources: [
                {
                    url:
                        sourceUrls.social,
                    title:
                        "Company post"
                }
            ],
            sourceCount:
                1
        }),
        askAI
    };
}


function createStandardAiResult() {

    return {
        website:
            "https://example.com",
        company:
            "Example Company",
        business_type:
            "Software company",
        services: [
            "Android application development"
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
                            sourceUrls.official,
                        description:
                            "The company lists several open roles."
                    }
                ]
            }
        ],
        additional_triggers:
            [],
        evidence: [
            {
                source:
                    sourceUrls.official,
                description:
                    "The official services page lists Android development."
            }
        ],
        reason:
            "The supplied research supports one configured trigger.",
        confidence:
            "High"
    };
}


async function main() {

    const testDirectory =
        path.join(
            __dirname,
            "temp-custom-modes"
        );

    const companiesPath =
        path.join(
            testDirectory,
            "companies.csv"
        );

    const promptPath =
        path.join(
            testDirectory,
            "query.txt"
        );

    const servicesPromptPath =
        path.join(
            testDirectory,
            "services-query.txt"
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
        "website\nhttps://example.com\n",
        "utf8"
    );

    fs.writeFileSync(
        promptPath,
        "What services do they provide?\nDo they provide Android application development services?",
        "utf8"
    );

    fs.writeFileSync(
        servicesPromptPath,
        "What services do they provide?",
        "utf8"
    );

    try {

        let customPromptSeen =
            "";

        const customResult =
            await runScreening({
                companiesPath,
                promptPath,
                scoringInstructions:
                    "If they provide Android application development services, score 10. Otherwise score 0.",
                outputDirectory:
                    path.join(
                        testDirectory,
                        "custom-output"
                    ),
                dependencies:
                    createResearchDependencies(
                        async (prompt) => {
                            customPromptSeen =
                                prompt;

                            return JSON.stringify({
                                company:
                                    "Example Company",
                                website:
                                    "https://example.com",
                                answers: [
                                    {
                                        question:
                                            "What services do they provide?",
                                        answer:
                                            "Web development, mobile development, and Android application development.",
                                        evidence: [
                                            {
                                                source:
                                                    sourceUrls.official,
                                                description:
                                                    "The official services page lists these services."
                                            }
                                        ]
                                    },
                                    {
                                        question:
                                            "Do they provide Android application development services?",
                                        answer:
                                            "Yes",
                                        evidence: [
                                            {
                                                source:
                                                    sourceUrls.official,
                                                description:
                                                    "Android application development is explicitly listed."
                                            }
                                        ]
                                    }
                                ],
                                score: {
                                    value:
                                        10,
                                    max:
                                        10,
                                    reason:
                                        "Android development is explicitly supported.",
                                    evidence: [
                                        {
                                            source:
                                                sourceUrls.official,
                                            description:
                                                "The services page supports the positive branch of the rule."
                                        }
                                    ]
                                }
                            });
                        }
                    )
            });

        assert.strictEqual(
            customResult.mode,
            "custom_query"
        );

        assert.strictEqual(
            customResult.results[0].answers.length,
            2
        );

        assert.strictEqual(
            customResult.results[0].score.value,
            10
        );

        assert.strictEqual(
            Object.prototype.hasOwnProperty.call(
                customResult.results[0],
                "team_size"
            ),
            false
        );

        assert.strictEqual(
            Object.prototype.hasOwnProperty.call(
                customResult.results[0],
                "detected_triggers"
            ),
            false
        );

        assert.ok(
            customPromptSeen.includes(
                "If they provide Android application development services, score 10. Otherwise score 0."
            )
        );

        assert.ok(
            fs.existsSync(
                customResult.files.custom
            )
        );

        const customCsv =
            fs.readFileSync(
                customResult.files.custom,
                "utf8"
            );

        assert.ok(
            customCsv.includes(
                sourceUrls.official
            ) &&
            customCsv.includes(
                "10/10"
            )
        );

        const servicesOnlyResult =
            await runScreening({
                companiesPath,
                promptPath:
                    servicesPromptPath,
                outputDirectory:
                    path.join(
                        testDirectory,
                        "services-only-output"
                    ),
                dependencies:
                    createResearchDependencies(
                        async () =>
                            JSON.stringify({
                                company:
                                    "Example Company",
                                website:
                                    "https://example.com",
                                answers: [
                                    {
                                        question:
                                            "What services do they provide?",
                                        answer:
                                            "Web, mobile, and Android application development.",
                                        evidence: [
                                            {
                                                source:
                                                    sourceUrls.official,
                                                description:
                                                    "The services page lists these offerings."
                                            }
                                        ]
                                    }
                                ],
                                score:
                                    null
                            })
                    )
            });

        assert.strictEqual(
            servicesOnlyResult.results[0].answers.length,
            1
        );

        assert.strictEqual(
            servicesOnlyResult.results[0].score,
            null
        );

        assert.strictEqual(
            Object.keys(
                servicesOnlyResult.results[0]
            ).sort().join(","),
            "answers,company,score,website"
        );

        let standardCallCount =
            0;

        const manualScoringResult =
            await runScreening({
                companiesPath,
                scoringInstructions:
                    "If Android development exists, score 10, otherwise 0.",
                outputDirectory:
                    path.join(
                        testDirectory,
                        "standard-manual-output"
                    ),
                dependencies:
                    createResearchDependencies(
                        async (prompt) => {
                            standardCallCount++;

                            if (
                                prompt.includes(
                                    "Evaluate a user-defined company scoring rule"
                                )
                            ) {
                                return JSON.stringify({
                                    value:
                                        10,
                                    max:
                                        10,
                                    reason:
                                        "Android development exists.",
                                    evidence: [
                                        {
                                            source:
                                                sourceUrls.official,
                                            description:
                                                "The services page lists Android development."
                                        }
                                    ]
                                });
                            }

                            return JSON.stringify(
                                createStandardAiResult()
                            );
                        }
                    )
            });

        assert.strictEqual(
            manualScoringResult.mode,
            "standard"
        );

        assert.strictEqual(
            standardCallCount,
            2
        );

        assert.strictEqual(
            manualScoringResult.results[0].company_score,
            10
        );

        assert.ok(
            manualScoringResult.results[0].detected_triggers.includes(
                "Hiring rapidly"
            )
        );

        const defaultResult =
            await runScreening({
                companiesPath,
                outputDirectory:
                    path.join(
                        testDirectory,
                        "standard-default-output"
                    ),
                dependencies:
                    createResearchDependencies(
                        async () =>
                            JSON.stringify(
                                createStandardAiResult()
                            )
                    )
            });

        assert.strictEqual(
            defaultResult.results[0].company_score,
            8,
            "Default backend trigger scoring must remain unchanged."
        );

        const invalidHighScore =
            validateCustomScore(
                {
                    value:
                        11,
                    max:
                        10,
                    reason:
                        "Invalid high score.",
                    evidence:
                        []
                }
            );

        const invalidLowScore =
            validateCustomScore(
                {
                    value:
                        -1,
                    max:
                        10,
                    reason:
                        "Invalid low score.",
                    evidence:
                        []
                }
            );

        assert.strictEqual(
            invalidHighScore.valid,
            false
        );

        assert.strictEqual(
            invalidLowScore.valid,
            false
        );

        const malformedEvidence =
            validateCustomQueryResult(
                {
                    company:
                        "Example",
                    website:
                        "https://example.com",
                    answers: [
                        {
                            question:
                                "Question",
                            answer:
                                "Answer",
                            evidence: [
                                {
                                    source:
                                        "not-a-url",
                                    description:
                                        "Malformed evidence."
                                }
                            ]
                        }
                    ],
                    score:
                        null
                },
                {
                    allowedSourceUrls: [
                        sourceUrls.official
                    ],
                    requireScore:
                        false
                }
            );

        assert.strictEqual(
            malformedEvidence.valid,
            false
        );

        console.log(
            "PASS: Custom queries stay focused, natural-language scoring is bounded, and default scoring is unchanged."
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
