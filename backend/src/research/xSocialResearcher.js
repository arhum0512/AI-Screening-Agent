const OpenAI = require("openai");

const {
    extractResponseText,
    extractSources
} = require("./publicWebResearcher");


function createGrokClient() {

    if (!process.env.GROK_API_KEY) {

        throw new Error(
            "GROK_API_KEY is missing from the environment."
        );
    }

    return new OpenAI({
        apiKey:
            process.env.GROK_API_KEY,
        baseURL:
            "https://api.x.ai/v1"
    });
}


function getErrorStatus(error) {

    return (
        error?.status ||
        error?.statusCode ||
        error?.response?.status ||
        null
    );
}


function sleep(milliseconds) {

    return new Promise(
        (resolve) =>
            setTimeout(
                resolve,
                milliseconds
            )
    );
}


function buildXResearchPrompt(company) {

    const website =
        company?.website ||
        "";

    const companyName =
        company?.company ||
        company?.name ||
        "";

    return `
Research recent public activity on X for this company.

Company:
${companyName || "Unknown"}

Website:
${website}

Look for company-authored posts and credible public posts that provide concrete evidence of:

- hiring or team growth
- new clients, services, markets, offices, funding, or acquisitions
- operational pain points, delays, bottlenecks, handoff, reporting, or coordination problems
- workflow or project-management tools the company actually uses

Rules:

- Use X Search for this research.
- Do not invent posts, claims, handles, or URLs.
- Distinguish the screened company from similarly named organizations.
- Prefer recent, direct, company-authored evidence.
- Include the exact X post or profile URL for every useful claim.
- Do not calculate scores and do not return screening JSON.
- If no reliable company-specific activity is found, say so clearly.

Return a concise research brief with inline citations.
`;
}


async function researchXSocial(
    company,
    options = {}
) {

    const client =
        options.client ||
        createGrokClient();

    const model =
        options.model ||
        process.env.GROK_MODEL ||
        "grok-4.7";

    const maxAttempts =
        options.maxAttempts ||
        3;

    const sleepFunction =
        options.sleep ||
        sleep;

    for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
    ) {

        try {

            const response =
                await client.responses.create({
                    model,
                    input: [
                        {
                            role:
                                "user",
                            content:
                                buildXResearchPrompt(
                                    company
                                )
                        }
                    ],
                    tools: [
                        {
                            type:
                                "x_search"
                        }
                    ]
                });

            const text =
                extractResponseText(
                    response
                );

            if (!text) {

                throw new Error(
                    "X/social research returned no usable text."
                );
            }

            const sources =
                extractSources(
                    response
                );

            return {
                text,
                sources,
                sourceCount:
                    sources.length
            };

        } catch (error) {

            const status =
                getErrorStatus(
                    error
                );

            const retryable =
                [
                    408,
                    429,
                    500,
                    502,
                    503,
                    504
                ].includes(
                    status
                );

            if (
                retryable &&
                attempt < maxAttempts
            ) {

                await sleepFunction(
                    5000 *
                    Math.pow(
                        2,
                        attempt - 1
                    )
                );

                continue;
            }

            throw error;
        }
    }

    throw new Error(
        "X/social research failed after all retry attempts."
    );
}


module.exports = {
    researchXSocial,
    buildXResearchPrompt,
    createGrokClient
};
