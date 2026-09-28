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


function buildPublicResearchPrompt(company) {

    const website =
        company?.website ||
        "";

    const companyName =
        company?.company ||
        company?.name ||
        "";


    return `
Research this company using current public web sources.

Company:
${companyName || "Unknown"}

Website:
${website}

SEARCH REQUIREMENTS

Research across the public web and actively look for evidence from these source types where available:

1. Official company website
2. General web/search results
3. Clutch
4. Trustpilot
5. Crunchbase
6. LinkedIn company profile
7. Google Business Profile or other public business-listing information
8. Recent news and press releases
9. Hiring/careers activity
10. Public social-media or activity signals visible through web search
11. Other credible and relevant public sources

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


async function researchPublicWeb(
    company
) {

    const client =
        createGrokClient();


    const model =
        process.env.GROK_MODEL ||
        "grok-4.7";


    const prompt =
        buildPublicResearchPrompt(
            company
        );


    const maxAttempts =
        3;


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
                        {
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

    extractResponseText,

    extractSources
};
