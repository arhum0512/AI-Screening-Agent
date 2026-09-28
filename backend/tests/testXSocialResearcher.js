const assert = require("assert");

const {
    researchXSocial,
    buildXResearchPrompt
} = require("../src/research/xSocialResearcher");


async function main() {

    let request;

    const client = {
        responses: {
            create: async (payload) => {

                request = payload;

                return {
                    output_text:
                        "The company announced a new office [citation].",
                    citations: [
                        "https://x.com/example/status/100"
                    ],
                    output: [
                        {
                            type:
                                "x_search_call",
                            action: {
                                sources: [
                                    {
                                        url:
                                            "https://x.com/example/status/101",
                                        title:
                                            "Follow-up post"
                                    }
                                ]
                            }
                        }
                    ]
                };
            }
        }
    };

    const result =
        await researchXSocial(
            {
                company:
                    "Example",
                website:
                    "https://example.com"
            },
            {
                client,
                model:
                    "test-model",
                maxAttempts:
                    1
            }
        );

    assert.strictEqual(
        request.tools[0].type,
        "x_search"
    );

    assert.ok(
        request.input[0].content.includes(
            "https://example.com"
        )
    );

    assert.strictEqual(
        result.sourceCount,
        2
    );

    assert.deepStrictEqual(
        result.sources.map(
            (source) => source.url
        ),
        [
            "https://x.com/example/status/100",
            "https://x.com/example/status/101"
        ]
    );

    assert.ok(
        buildXResearchPrompt({
            website:
                "https://example.com"
        }).includes(
            "exact X post or profile URL"
        )
    );

    console.log(
        "PASS: X research uses x_search and preserves citation URLs."
    );
}


main().catch(
    (error) => {
        console.error(error);
        process.exitCode = 1;
    }
);
