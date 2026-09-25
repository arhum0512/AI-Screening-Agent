const {
    isDailyQuotaExceeded,
    isTemporaryRateLimit
} = require("../src/ai/grokClient");


// --------------------------------------------------
// Simulated batch processor
// --------------------------------------------------

async function processBatch(
    companies,
    processor
) {

    const results = [];

    let processedCount = 0;

    let dailyQuotaExhausted = false;


    for (const company of companies) {

        processedCount++;


        try {

            const result =
                await processor(
                    company
                );


            results.push(
                result
            );

        } catch (error) {

            const status =
                error?.status ||
                error?.response?.status ||
                null;


            if (
                status === 429 &&
                isDailyQuotaExceeded(
                    error
                )
            ) {

                dailyQuotaExhausted =
                    true;

                break;
            }


            if (
                status === 429 &&
                isTemporaryRateLimit(
                    error
                )
            ) {

                continue;
            }


            // Normal company error:
            // continue processing remaining companies.

            continue;
        }
    }


    return {
        results,
        processedCount,
        dailyQuotaExhausted
    };
}


// --------------------------------------------------
// Test helper
// --------------------------------------------------

function runTest(
    name,
    condition
) {

    const passed =
        Boolean(
            condition
        );


    console.log(
        `${passed ? "PASS" : "FAIL"}: ${name}`
    );


    return passed;
}


// --------------------------------------------------
// Test data
// --------------------------------------------------

const companies = [
    {
        id: "1",
        website: "https://company1.com"
    },
    {
        id: "2",
        website: "https://company2.com"
    },
    {
        id: "3",
        website: "https://company3.com"
    },
    {
        id: "4",
        website: "https://company4.com"
    }
];


// --------------------------------------------------
// Main test runner
// --------------------------------------------------

async function main() {

    console.log(
        "\n========================================"
    );

    console.log(
        "BATCH QUOTA HANDLING TEST"
    );

    console.log(
        "========================================\n"
    );


    const tests = [];


    // --------------------------------------------------
    // Scenario 1:
    // Every company succeeds
    // --------------------------------------------------

    const allSuccess =
        await processBatch(
            companies,
            async (company) => {

                return {
                    id:
                        company.id,

                    status:
                        "success"
                };
            }
        );


    tests.push(
        runTest(
            "All-success batch should process all 4 companies",

            allSuccess.processedCount ===
            4
        )
    );


    tests.push(
        runTest(
            "All-success batch should produce 4 successful results",

            allSuccess.results.length ===
            4
        )
    );


    tests.push(
        runTest(
            "All-success batch should not mark quota exhausted",

            allSuccess.dailyQuotaExhausted ===
            false
        )
    );


    // --------------------------------------------------
    // Scenario 2:
    // Normal company error
    // --------------------------------------------------

    const normalFailure =
        await processBatch(
            companies,
            async (company) => {

                if (
                    company.id ===
                    "2"
                ) {

                    const error =
                        new Error(
                            "Website research failed."
                        );


                    error.status =
                        500;


                    throw error;
                }


                return {
                    id:
                        company.id,

                    status:
                        "success"
                };
            }
        );


    tests.push(
        runTest(
            "Normal company failure should not stop the batch",

            normalFailure.processedCount ===
            4
        )
    );


    tests.push(
        runTest(
            "Normal failure scenario should preserve 3 successful results",

            normalFailure.results.length ===
            3
        )
    );


    tests.push(
        runTest(
            "Normal failure should not mark daily quota exhausted",

            normalFailure.dailyQuotaExhausted ===
            false
        )
    );


    // --------------------------------------------------
    // Scenario 3:
    // Daily Gemini quota exhausted on company 3
    // --------------------------------------------------

    const dailyQuota =
        await processBatch(
            companies,
            async (company) => {

                if (
                    company.id ===
                    "3"
                ) {

                    const error =
                        new Error(
                            "RESOURCE_EXHAUSTED: GenerateRequestsPerDayPerProjectPerModel-FreeTier"
                        );


                    error.status =
                        429;


                    throw error;
                }


                return {
                    id:
                        company.id,

                    status:
                        "success"
                };
            }
        );


    tests.push(
        runTest(
            "Daily quota should stop batch after company 3",

            dailyQuota.processedCount ===
            3
        )
    );


    tests.push(
        runTest(
            "Company 4 should not be attempted after daily quota exhaustion",

            dailyQuota.processedCount <
            companies.length
        )
    );


    tests.push(
        runTest(
            "Results completed before quota exhaustion should be preserved",

            dailyQuota.results.length ===
            2
        )
    );


    tests.push(
        runTest(
            "Daily quota flag should be true",

            dailyQuota.dailyQuotaExhausted ===
            true
        )
    );


    // --------------------------------------------------
    // Scenario 4:
    // Temporary rate limit
    // --------------------------------------------------

    const temporary429 =
        await processBatch(
            companies,
            async (company) => {

                if (
                    company.id ===
                    "2"
                ) {

                    const error =
                        new Error(
                            "Too many requests. Please retry later."
                        );


                    error.status =
                        429;


                    throw error;
                }


                return {
                    id:
                        company.id,

                    status:
                        "success"
                };
            }
        );


    tests.push(
        runTest(
            "Temporary 429 should not stop entire batch",

            temporary429.processedCount ===
            4
        )
    );


    tests.push(
        runTest(
            "Temporary 429 should not set daily quota flag",

            temporary429.dailyQuotaExhausted ===
            false
        )
    );


    tests.push(
        runTest(
            "Temporary 429 scenario should preserve later successful companies",

            temporary429.results.length ===
            3
        )
    );


    // --------------------------------------------------
    // Scenario 5:
    // Daily quota exhausted on first company
    // --------------------------------------------------

    const immediateQuota =
        await processBatch(
            companies,
            async () => {

                const error =
                    new Error(
                        "RESOURCE_EXHAUSTED: requests per day quota exceeded"
                    );


                error.status =
                    429;


                throw error;
            }
        );


    tests.push(
        runTest(
            "Quota on first company should stop after first attempt",

            immediateQuota.processedCount ===
            1
        )
    );


    tests.push(
        runTest(
            "Quota on first company should produce zero successful results",

            immediateQuota.results.length ===
            0
        )
    );


    tests.push(
        runTest(
            "Quota on first company should set quota flag",

            immediateQuota.dailyQuotaExhausted ===
            true
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
            "\nBatch quota handling test completed successfully."
        );

    } else {

        console.log(
            "\nBatch quota handling test failed."
        );

        process.exitCode =
            1;
    }
}


// --------------------------------------------------
// Run
// --------------------------------------------------

main();