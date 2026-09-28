require("dotenv").config();

const OpenAI =
    require("openai");


async function testGrokWebSearch() {

    if (
        !process.env.GROK_API_KEY
    ) {

        throw new Error(
            "GROK_API_KEY is missing from .env"
        );
    }


    const client =
        new OpenAI({

            apiKey:
                process.env.GROK_API_KEY,

            baseURL:
                "https://api.x.ai/v1"
        });


    const model =
        process.env.GROK_MODEL ||
        "grok-4.7";


    console.log(
        "Testing Grok Web Search..."
    );

    console.log(
        `Model: ${model}`
    );


    const response =
        await client.responses.create({

            model,

            input: [
                {
                    role:
                        "user",

                    content:
                        `
Research HubSpot using current public web sources.

Look for information from sources such as:
- official company website
- web search results
- Crunchbase
- LinkedIn
- Trustpilot
- Clutch
- news/public sources

Return a short summary of what you found.

Do not invent information.
Use only information supported by public sources.
`
                }
            ],

            tools: [
                {
                    type:
                        "web_search"
                }
            ],

            include: [
                "web_search_call.action.sources"
            ]
        });


    console.log(
        "\n========================================"
    );

    console.log(
        "WEB SEARCH RESULT"
    );

    console.log(
        "========================================\n"
    );


    console.log(
        response.output_text
    );


    console.log(
        "\n========================================"
    );

    console.log(
        "SOURCES"
    );

    console.log(
        "========================================\n"
    );


    const sources =
        new Set();


    for (
        const citation of response.citations || []
    ) {

        if (
            typeof citation === "string"
        ) {

            sources.add(
                citation
            );

        } else if (
            citation?.url
        ) {

            sources.add(
                citation.url
            );
        }
    }


    for (
        const item of response.output || []
    ) {

        if (
            item.type === "message"
        ) {

            for (
                const content of item.content || []
            ) {

                for (
                    const annotation of content.annotations || []
                ) {

                    if (
                        annotation?.url
                    ) {

                        sources.add(
                            annotation.url
                        );
                    }
                }
            }
        }


        if (
            item.type === "web_search_call"
        ) {

            for (
                const source of item?.action?.sources || []
            ) {

                if (
                    source?.url
                ) {

                    sources.add(
                        source.url
                    );
                }
            }
        }
    }


    if (
        sources.size === 0
    ) {

        console.log(
            "No source URLs returned."
        );

    } else {

        Array
            .from(
                sources
            )
            .forEach(
                (
                    source,
                    index
                ) => {

                    console.log(
                        `${index + 1}. ${source}`
                    );
                }
            );
    }


    console.log(
        "\nGrok Web Search test completed successfully."
    );
}


testGrokWebSearch()
    .catch(
        (error) => {

            console.error(
                "\nGrok Web Search test failed:"
            );

            console.error(
                error.message
            );

            process.exit(
                1
            );
        }
    );