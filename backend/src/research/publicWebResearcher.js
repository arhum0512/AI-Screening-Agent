const OpenAI =
    require("openai");


function sleep(milliseconds) {

    return new Promise(
        (resolve) =>
            setTimeout(
                resolve,
                milliseconds
            )
    );
}


function getErrorStatus(error) {

    return (
        error?.status ||
        error?.statusCode ||
        error?.response?.status ||
        null
    );
}


function createGrokClient() {

    if (
        !process.env.GROK_API_KEY
    ) {

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


function extractResponseText(response) {

    if (
        response?.output_text &&
        typeof response.output_text === "string"
    ) {

        return response.output_text.trim();
    }


    const textParts = [];


    for (
        const item of response?.output || []
    ) {

        if (
            item?.type !== "message"
        ) {

            continue;
        }


        for (
            const content of item?.content || []
        ) {

            if (
                content?.type === "output_text" &&
                typeof content?.text === "string"
            ) {

                textParts.push(
                    content.text
                );
            }
        }
    }


    return textParts
        .join("\n")
        .trim();
}


function extractSources(response) {

    const sourceMap =
        new Map();


    function addSource(
        url,
        title = ""
    ) {

        if (
            !url ||
            typeof url !== "string"
        ) {

            return;
        }


        const cleanedUrl =
            url.trim();


        if (
            !cleanedUrl ||
            sourceMap.has(
                cleanedUrl
            )
        ) {

            return;
        }


        sourceMap.set(
            cleanedUrl,
            {
                url:
                    cleanedUrl,

                title:
                    typeof title === "string"
                        ? title.trim()
                        : ""
            }
        );
    }


    for (
        const citation of response?.citations || []
    ) {

        if (
            typeof citation === "string"
        ) {

            addSource(
                citation
            );

        } else {

            addSource(
                citation?.url,
                citation?.title
            );
        }
    }


    for (
        const item of response?.output || []
    ) {

        if (
            item?.type === "message"
        ) {

            for (
                const content of item?.content || []
            ) {

                for (
                    const annotation of content?.annotations || []
                ) {

                    if (
                        annotation?.url
                    ) {

                        addSource(
                            annotation.url,
                            annotation.title
                        );
                    }
                }
            }
        }


        if (
            item?.type === "web_search_call" ||
            item?.type === "x_search_call"
        ) {

            for (
                const source of item?.action?.sources || []
            ) {

                addSource(
                    source?.url,
                    source?.title
                );
            }
        }
    }


    return Array.from(
        sourceMap.values()
    );
}


function buildPublicResearchPrompt(
    company,
    source = null
) {

    const website =
        company?.website ||
        "";

    const companyName =
        company?.company ||
        company?.name ||
        "";


    const sourceInstructions =
        source?.domain
            ? `Research only ${source.name} (${source.domain}). Use results from that domain only. Do not use the company website or any other platform unless it is hosted on ${source.domain}.`
            : `Research across the public web. Broad public URLs are allowed, but do not use X Search.`;

    return `
Research this company using current public web sources.

Company:
${companyName || "Unknown"}

Website:
${website}

SOURCE SCOPE

${sourceInstructions}

SEARCH REQUIREMENTS

Search only within the source scope above. Do not broaden the search to other platforms.

IMPORTANT SIGNALS TO LOOK FOR

Growth:
- rapid hiring
- increasing clients
- larger clients
- expansion of services
- new markets
- new offices or locations
- funding or investment
- acquisitions
- new departments
- major growth announcements

Operational pain:
- project delays
- missed deadlines
- bottlenecks
- poor handoffs
- project overload
- lack of visibility
- resource allocation problems
- communication issues
- accountability issues
- founder or manager bottlenecks
- manual reporting
- excessive meetings
- remote-team coordination problems
- project-management struggles

Workflow/tool signals:
- Excel
- Google Sheets
- WhatsApp
- Slack
- Notion
- Trello
- Asana
- ClickUp
- Monday
- Jira
- Basecamp
- Wrike
- Teamwork
- Airtable

RULES

- Do not invent information.
- Prefer recent and direct evidence.
- Clearly distinguish confirmed facts from weak signals.
- Include useful evidence with source context.
- Do not calculate a company score.
- Do not return screening JSON.
- This is only the research stage.
- If a particular source has no useful information, say so briefly.
- Avoid repeating the same evidence from multiple duplicate pages.

Return a concise but useful research brief.
`;
}


function urlMatchesDomain(url, domain) {
    if (!domain) {
        return true;
    }

    try {
        const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
        return hostname === domain || hostname.endsWith(`.${domain}`);
    } catch (error) {
        return false;
    }
}


async function researchPublicWeb(
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


    const prompt =
        buildPublicResearchPrompt(
            company,
            options.source
        );


    const maxAttempts =
        options.maxAttempts ||
        3;

    const domain =
        options.source?.domain ||
        null;


    for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
    ) {

        try {

            console.log(
                `Public web research attempt ${attempt}/${maxAttempts}...`
            );


            const response =
                await client.responses.create({

                    model,

                    input: [
                        {
                            role:
                                "user",

                            content:
                                prompt
                        }
                    ],

                    tools: [
                        domain
                            ? {
                                type:
                                    "web_search",
                                filters: {
                                    allowed_domains: [
                                        domain
                                    ]
                                }
                            }
                            : {
                                type:
                                    "web_search"
                            }
                    ],

                    include: [
                        "web_search_call.action.sources"
                    ]
                });


            const text =
                extractResponseText(
                    response
                );


            if (
                !text
            ) {

                throw new Error(
                    "Public web research returned no usable text."
                );
            }


            const sources =
                extractSources(
                    response
                ).filter(
                    (source) =>
                        urlMatchesDomain(
                            source.url,
                            domain
                        )
                );


            console.log(
                `Public web research completed. Sources found: ${sources.length}`
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


            console.error(
                "Public web research error:",
                error.message
            );


            const retryable =
                status === 408 ||
                status === 429 ||
                status === 500 ||
                status === 502 ||
                status === 503 ||
                status === 504;


            if (
                retryable &&
                attempt < maxAttempts
            ) {

                const waitTime =
                    5000 *
                    Math.pow(
                        2,
                        attempt - 1
                    );


                console.log(
                    `Retrying public web research in ${waitTime / 1000} seconds...`
                );


                await sleep(
                    waitTime
                );


                continue;
            }


            throw error;
        }
    }


    throw new Error(
        "Public web research failed after all retry attempts."
    );
}


module.exports = {

    researchPublicWeb,

    buildPublicResearchPrompt,

    urlMatchesDomain,

    extractResponseText,

    extractSources
};
