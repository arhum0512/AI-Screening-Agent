const {
    parseAIResponse,
    getErrorStatus,
    getErrorText,
    isDailyQuotaExceeded,
    isTemporaryRateLimit,
    extractRetryDelayMilliseconds,
    calculateRetryDelay
} = require("../src/ai/grokClient");


// --------------------------------------------------
// Test helper
// --------------------------------------------------

function runTest(
    name,
    condition
) {

    const passed =
        Boolean(condition);


    console.log(
        `${passed ? "PASS" : "FAIL"}: ${name}`
    );


    return passed;
}


// --------------------------------------------------
// Start tests
// --------------------------------------------------

console.log(
    "\n========================================"
);

console.log(
    "AI CLIENT HELPER TEST"
);

console.log(
    "========================================\n"
);


const tests = [];


// --------------------------------------------------
// Test 1
// getErrorStatus
// --------------------------------------------------

tests.push(
    runTest(
        "getErrorStatus should return 503",

        getErrorStatus({
            response: {
                status: 503
            }
        }) === 503
    )
);


// --------------------------------------------------
// Test 2
// Daily quota detection
// --------------------------------------------------

const dailyQuotaError = {

    status:
        429,

    message:
        "RESOURCE_EXHAUSTED: GenerateRequestsPerDayPerProjectPerModel-FreeTier"
};


tests.push(
    runTest(
        "Daily quota error should be detected",

        isDailyQuotaExceeded(
            dailyQuotaError
        ) === true
    )
);


// --------------------------------------------------
// Test 3
// Daily quota should not count as temporary
// --------------------------------------------------

tests.push(
    runTest(
        "Daily quota error should not be treated as temporary",

        isTemporaryRateLimit(
            dailyQuotaError
        ) === false
    )
);


// --------------------------------------------------
// Test 4
// Temporary 429 detection
// --------------------------------------------------

const temporaryRateLimitError = {

    status:
        429,

    message:
        "Too many requests. Please retry later."
};


tests.push(
    runTest(
        "Temporary 429 should be detected as temporary",

        isTemporaryRateLimit(
            temporaryRateLimitError
        ) === true
    )
);


// --------------------------------------------------
// Test 5
// Extract retry delay from "retry in"
// --------------------------------------------------

const retryInError = {

    message:
        "Rate limit reached. Please retry in 12s."
};


tests.push(
    runTest(
        "Retry delay should extract 12 seconds",

        extractRetryDelayMilliseconds(
            retryInError
        ) === 12000
    )
);


// --------------------------------------------------
// Test 6
// Extract retryDelay format
// --------------------------------------------------

const retryDelayError = {

    message:
        'RESOURCE_EXHAUSTED: "retryDelay":"17s"'
};


tests.push(
    runTest(
        "retryDelay should extract 17 seconds",

        extractRetryDelayMilliseconds(
            retryDelayError
        ) === 17000
    )
);


// --------------------------------------------------
// Test 7
// Fallback delay attempt 1
// --------------------------------------------------

tests.push(
    runTest(
        "Attempt 1 fallback delay should be 5000ms",

        calculateRetryDelay(
            {
                message:
                    "Temporary service problem"
            },
            1
        ) === 5000
    )
);


// --------------------------------------------------
// Test 8
// Fallback delay attempt 2
// --------------------------------------------------

tests.push(
    runTest(
        "Attempt 2 fallback delay should be 10000ms",

        calculateRetryDelay(
            {
                message:
                    "Temporary service problem"
            },
            2
        ) === 10000
    )
);


// --------------------------------------------------
// Test 9
// API retry delay with safety buffer
// --------------------------------------------------

tests.push(
    runTest(
        "API retry delay should include 1-second safety buffer",

        calculateRetryDelay(
            {
                message:
                    "Please retry in 7s."
            },
            1
        ) === 8000
    )
);


// --------------------------------------------------
// Test 10
// Normal JSON parsing
// --------------------------------------------------

const normalJson =
    '{"status":"success"}';


const parsedNormalJson =
    parseAIResponse(
        normalJson
    );


tests.push(
    runTest(
        "Normal JSON should parse correctly",

        parsedNormalJson.status ===
        "success"
    )
);


// --------------------------------------------------
// Test 11
// JSON code fence parsing
// --------------------------------------------------

const jsonCodeFence = `
\`\`\`json
{
    "status": "success"
}
\`\`\`
`;


const parsedJsonCodeFence =
    parseAIResponse(
        jsonCodeFence
    );


tests.push(
    runTest(
        "JSON code fence should be removed",

        parsedJsonCodeFence.status ===
        "success"
    )
);


// --------------------------------------------------
// Test 12
// Generic code fence parsing
// --------------------------------------------------

const genericCodeFence = `
\`\`\`
{
    "status": "success"
}
\`\`\`
`;


const parsedGenericCodeFence =
    parseAIResponse(
        genericCodeFence
    );


tests.push(
    runTest(
        "Generic code fence should be removed",

        parsedGenericCodeFence.status ===
        "success"
    )
);


// --------------------------------------------------
// Test 13
// Malformed JSON should throw
// --------------------------------------------------

let malformedJsonThrows =
    false;


try {

    parseAIResponse(
        "{invalid json}"
    );

} catch (error) {

    malformedJsonThrows =
        error.message.includes(
            "Unable to parse AI response as JSON"
        );
}


tests.push(
    runTest(
        "Malformed JSON should throw parsing error",

        malformedJsonThrows
    )
);


// --------------------------------------------------
// Test 14
// Non-string response should throw
// --------------------------------------------------

let nonStringThrows =
    false;


try {

    parseAIResponse({
        status:
            "success"
    });

} catch (error) {

    nonStringThrows =
        error.message.includes(
            "AI response must be a string"
        );
}


tests.push(
    runTest(
        "Non-string AI response should throw",

        nonStringThrows
    )
);


// --------------------------------------------------
// Test 15
// getErrorText nested error
// --------------------------------------------------

const nestedErrorText =
    getErrorText({

        message:
            "RESOURCE_EXHAUSTED",

        response: {

            data: {

                error: {

                    message:
                        "Quota exceeded"
                }
            }
        }
    });


tests.push(
    runTest(
        "getErrorText should include nested error text",

        nestedErrorText.includes(
            "quota exceeded"
        )
    )
);


// --------------------------------------------------
// Final summary
// --------------------------------------------------

const passedCount =
    tests.filter(Boolean).length;


console.log(
    "\n========================================"
);

console.log(
    `Passed: ${passedCount}/${tests.length}`
);

console.log(
    "========================================"
);


if (
    passedCount ===
    tests.length
) {

    console.log(
        "\nAI client helper test completed successfully."
    );

} else {

    console.log(
        "\nAI client helper test failed."
    );

    process.exitCode = 1;
}