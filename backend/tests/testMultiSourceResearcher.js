const assert = require("assert");

const {
    researchAllSources
} = require("../src/research/multiSourceResearcher");


async function main() {

    const calls = [];

    const result =
        await researchAllSources(
            {
                website:
                    "https://example.com"
            },
            {
                researchWebsite: async (url) => {
                    calls.push(
                        `website:${url}`
                    );

                    return {
                        source:
                            url,
                        text:
                            "Official research text.",
                        pages_researched: [
                            {
                                url,
                                page_type:
                                    "homepage"
                            }
                        ]
                    };
                },
                researchPublicWeb: async () => {
                    calls.push(
                        "public"
                    );

                    return {
                        text:
                            "Public web research text.",
                        sources: [
                            {
                                url:
                                    "https://news.example/article",
                                title:
                                    "News"
                            }
                        ],
                        sourceCount:
                            1
                    };
                },
                researchXSocial: async () => {
                    calls.push(
                        "x"
                    );

                    return {
                        text:
                            "X activity research text.",
                        sources: [
                            {
                                url:
                                    "https://x.com/example/status/1",
                                title:
                                    "Company post"
                            }
                        ],
                        sourceCount:
                            1
                    };
                }
            }
        );

    assert.deepStrictEqual(
        calls.sort(),
        [
            "public",
            "website:https://example.com",
            "x"
        ]
    );

    assert.ok(
        result.text.includes(
            "OFFICIAL COMPANY WEBSITE RESEARCH"
        )
    );

    assert.ok(
        result.text.includes(
            "PUBLIC WEB SEARCH RESEARCH"
        )
    );

    assert.ok(
        result.text.includes(
            "X / SOCIAL ACTIVITY RESEARCH"
        )
    );

    assert.deepStrictEqual(
        result.sources.map(
            (source) => source.sourceType
        ),
        [
            "official_website",
            "public_web",
            "x_social"
        ]
    );

    for (
        const source
        of result.sources
    ) {
        assert.ok(
            result.text.includes(
                `SOURCE URL: ${source.url}`
            )
        );
    }

    const partialResult =
        await researchAllSources(
            {
                website:
                    "https://example.com"
            },
            {
                researchWebsite: async (url) => ({
                    source:
                        url,
                    text:
                        "Official only.",
                    pages_researched:
                        []
                }),
                researchPublicWeb: async () => {
                    throw new Error(
                        "web unavailable"
                    );
                },
                researchXSocial: async () => ({
                    text:
                        "X remains available.",
                    sources: [
                        {
                            url:
                                "https://x.com/example/status/2"
                        }
                    ],
                    sourceCount:
                        1
                })
            }
        );

    assert.ok(
        partialResult.text.includes(
            "Public web research could not be completed"
        )
    );

    assert.ok(
        partialResult.text.includes(
            "X remains available."
        )
    );

    console.log(
        "PASS: Official, public web, and X research are combined with source URLs preserved."
    );
}


main().catch(
    (error) => {
        console.error(error);
        process.exitCode = 1;
    }
);
