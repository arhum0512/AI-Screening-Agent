const OpenAI = require("openai");


// --------------------------------------------------
// Create AI client
// --------------------------------------------------

function createAIClient() {

    const provider =
        process.env.AI_PROVIDER;


    if (!provider) {

        throw new Error(
            "AI_PROVIDER is not configured in the .env file."
        );
    }


    // --------------------------------------------------
    // Gemini
    // --------------------------------------------------

    if (
        provider.toLowerCase() ===
        "gemini"
    ) {

        if (
            !process.env.GEMINI_API_KEY
        ) {

            throw new Error(
                "GEMINI_API_KEY is missing from the .env file."
            );
        }


        return {

            provider:
                "gemini",

            model:
                process.env.GEMINI_MODEL ||
                "gemini-3.7-flash",

            client:
                new OpenAI({

                    apiKey:
                        process.env.GEMINI_API_KEY,

                    baseURL:
                        "https://generativelanguage.googleapis.com/v1beta/openai/"

                })
        };
    }


    // --------------------------------------------------
    // Grok
    // --------------------------------------------------

    if (
        provider.toLowerCase() ===
        "grok"
    ) {

        if (
            !process.env.GROK_API_KEY
        ) {

            throw new Error(
                "GROK_API_KEY is missing from the .env file."
            );
        }


        return {

            provider:
                "grok",

            model:
                process.env.GROK_MODEL ||
                "grok-4.7",

            client:
                new OpenAI({

                    apiKey:
                        process.env.GROK_API_KEY,

                    baseURL:
                        "https://api.x.ai/v1"

                })
        };
    }


    throw new Error(
        `Unsupported AI provider: ${provider}`
    );
}


// --------------------------------------------------
// Sleep helper
// --------------------------------------------------

function sleep(milliseconds) {

    return new Promise(
        (resolve) =>
            setTimeout(
                resolve,
                milliseconds
            )
    );
}


// --------------------------------------------------
// Extract HTTP status code
// --------------------------------------------------

function getErrorStatus(error) {

    return (
        error?.status ||
        error?.statusCode ||
        error?.response?.status ||
        null
    );
}


// --------------------------------------------------
// Convert error into searchable text
// --------------------------------------------------

function getErrorText(error) {

    try {

        return [
            error?.message,
            JSON.stringify(
                error?.error || {}
            ),
            JSON.stringify(
                error?.response?.data || {}
            )
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

    } catch (conversionError) {

        return String(
            error?.message || ""
        ).toLowerCase();
    }
}


// --------------------------------------------------
// Detect daily Gemini quota exhaustion
// --------------------------------------------------

function isDailyQuotaExceeded(error) {

    const errorText =
        getErrorText(
            error
        );


    /*
     * Gemini daily quota errors commonly contain
     * quota identifiers such as:
     *
     * GenerateRequestsPerDayPerProjectPerModel
     *
     * or wording such as:
     *
     * free_tier_requests
     * per day
     * daily quota
     *
     * These are not useful to retry immediately.
     */

    return (
        errorText.includes(
            "perday"
        ) ||

        errorText.includes(
            "per_day"
        ) ||

        errorText.includes(
            "requestsperday"
        ) ||

        errorText.includes(
            "daily quota"
        ) ||

        errorText.includes(
            "requests per day"
        ) ||

        errorText.includes(
            "generaterequestsperday"
        )
    );
}


// --------------------------------------------------
// Detect temporary rate limit
// --------------------------------------------------

function isTemporaryRateLimit(error) {

    const status =
        getErrorStatus(
            error
        );


    if (status !== 429) {
        return false;
    }


    /*
     * A daily quota limit should NOT be treated
     * as a short-lived rate limit.
     */

    if (
        isDailyQuotaExceeded(
            error
        )
    ) {

        return false;
    }


    return true;
}


// --------------------------------------------------
// Extract Gemini retry delay if available
// --------------------------------------------------

function extractRetryDelayMilliseconds(
    error
) {

    const rawMessage =
        String(
            error?.message || ""
        );


    /*
     * Example API messages may contain:
     *
     * "Please retry in 17.823s"
     *
     * or:
     *
     * "retryDelay":"17s"
     */


    const retryInMatch =
        rawMessage.match(
            /retry\s+in\s+([\d.]+)\s*s/i
        );


    if (retryInMatch) {

        const seconds =
            Number(
                retryInMatch[1]
            );


        if (
            Number.isFinite(seconds) &&
            seconds > 0
        ) {

            return Math.ceil(
                seconds * 1000
            );
        }
    }


    const retryDelayMatch =
        rawMessage.match(
            /retryDelay["']?\s*:\s*["']?([\d.]+)s/i
        );


    if (retryDelayMatch) {

        const seconds =
            Number(
                retryDelayMatch[1]
            );


        if (
            Number.isFinite(seconds) &&
            seconds > 0
        ) {

            return Math.ceil(
                seconds * 1000
            );
        }
    }


    return null;
}


// --------------------------------------------------
// Calculate retry wait time
// --------------------------------------------------

function calculateRetryDelay(
    error,
    attempt
) {

    const apiDelay =
        extractRetryDelayMilliseconds(
            error
        );


    /*
     * If Gemini explicitly supplies a retry delay,
     * respect it.
     */

    if (apiDelay) {

        /*
         * Small safety buffer so we do not retry
         * exactly on the boundary.
         */

        return apiDelay + 1000;
    }


    /*
     * Otherwise use exponential backoff:
     *
     * Attempt 1 -> 5 seconds
     * Attempt 2 -> 10 seconds
     * Attempt 3 -> 20 seconds
     */

    const baseDelay =
        5000;


    return (
        baseDelay *
        Math.pow(
            2,
            attempt - 1
        )
    );
}


// --------------------------------------------------
// Ask AI
// --------------------------------------------------

async function askAI(prompt) {

    const ai =
        createAIClient();


    const maxAttempts = 3;


    for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
    ) {

        try {

            console.log(
                `AI request attempt ${attempt}/${maxAttempts}...`
            );


            const response =
                await ai.client.chat.completions.create({

                    model:
                        ai.model,

                    messages: [
                        {
                            role:
                                "user",

                            content:
                                prompt
                        }
                    ],

                    temperature:
                        0

                });


            const content =
                response
                    ?.choices
                    ?.[0]
                    ?.message
                    ?.content;


            if (!content) {

                throw new Error(
                    "AI returned an empty response."
                );
            }


            return content;


        } catch (error) {

            const status =
                getErrorStatus(
                    error
                );


            console.error(
                `${ai.provider} API Error:`,
                error.message
            );


            // --------------------------------------------------
            // Daily Gemini quota exhausted
            // --------------------------------------------------

            if (
                status === 429 &&
                isDailyQuotaExceeded(
                    error
                )
            ) {

                console.error(
                    "\nGemini daily quota has been exhausted."
                );


                console.error(
                    "The application will not retry this request because immediate retries cannot restore a daily quota."
                );


                console.error(
                    "Try again after the Gemini quota resets or use another configured AI provider."
                );


                throw error;
            }


            // --------------------------------------------------
            // Temporary 429 rate limit
            // --------------------------------------------------

            if (
                status === 429 &&
                isTemporaryRateLimit(
                    error
                ) &&
                attempt < maxAttempts
            ) {

                const waitTime =
                    calculateRetryDelay(
                        error,
                        attempt
                    );


                console.log(
                    `Temporary AI rate limit reached. Retrying in ${Math.ceil(waitTime / 1000)} seconds...`
                );


                await sleep(
                    waitTime
                );


                continue;
            }


            // --------------------------------------------------
            // Temporary server/service errors
            // --------------------------------------------------

            if (
                (
                    status === 408 ||
                    status === 500 ||
                    status === 502 ||
                    status === 503 ||
                    status === 504
                ) &&
                attempt < maxAttempts
            ) {

                const waitTime =
                    calculateRetryDelay(
                        error,
                        attempt
                    );


                console.log(
                    `Temporary AI service issue. Retrying in ${Math.ceil(waitTime / 1000)} seconds...`
                );


                await sleep(
                    waitTime
                );


                continue;
            }


            // --------------------------------------------------
            // All retries exhausted
            // --------------------------------------------------

            if (
                attempt === maxAttempts
            ) {

                console.error(
                    `\nAI request failed after ${maxAttempts} attempts.`
                );
            }


            throw error;
        }
    }


    throw new Error(
        "AI request failed after all retry attempts."
    );
}


// --------------------------------------------------
// Parse AI JSON response
// --------------------------------------------------

function parseAIResponse(
    responseText
) {

    try {

        if (
            typeof responseText !==
            "string"
        ) {

            throw new Error(
                "AI response must be a string."
            );
        }


        let cleanedResponse =
            responseText.trim();


        // --------------------------------------------------
        // Remove Markdown JSON code fence
        // --------------------------------------------------

        if (
            cleanedResponse.startsWith(
                "```json"
            )
        ) {

            cleanedResponse =
                cleanedResponse
                    .replace(
                        /^```json\s*/i,
                        ""
                    )
                    .replace(
                        /\s*```$/,
                        ""
                    )
                    .trim();

        } else if (
            cleanedResponse.startsWith(
                "```"
            )
        ) {

            cleanedResponse =
                cleanedResponse
                    .replace(
                        /^```\s*/,
                        ""
                    )
                    .replace(
                        /\s*```$/,
                        ""
                    )
                    .trim();
        }


        // --------------------------------------------------
        // Parse JSON
        // --------------------------------------------------

        return JSON.parse(
            cleanedResponse
        );


    } catch (error) {

        throw new Error(
            `Unable to parse AI response as JSON: ${error.message}`
        );
    }
}


// --------------------------------------------------
// Exports
// --------------------------------------------------

module.exports = {
    askAI,
    parseAIResponse,
    createAIClient,
    getErrorStatus,
    getErrorText,
    isDailyQuotaExceeded,
    isTemporaryRateLimit,
    extractRetryDelayMilliseconds,
    calculateRetryDelay
};
