const {
    configureResearch,
    researchWebsite
} = require("../src/research/webResearcher");

const {
    loadConfig
} = require("../src/configLoader");


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
// Main test
// --------------------------------------------------

async function main() {

    console.log(
        "\n========================================"
    );

    console.log(
        "WEB RESEARCHER TEST"
    );

    console.log(
        "========================================\n"
    );


    const tests = [];


    try {

        // --------------------------------------------------
        // Load configuration
        // --------------------------------------------------

        const config =
            loadConfig();


        configureResearch(
            config.research
        );


        tests.push(
            runTest(
                "Research configuration should load successfully",

                Boolean(
                    config.research
                )
            )
        );


        // --------------------------------------------------
        // Research public test website
        // --------------------------------------------------

        const website =
            "https://example.com";


        console.log(
            `Researching: ${website}`
        );


        const research =
            await researchWebsite(
                website
            );


        console.log(
            "Website research completed."
        );


        // --------------------------------------------------
        // Result checks
        // --------------------------------------------------

        tests.push(
            runTest(
                "Research result should be an object",

                research !== null &&
                typeof research ===
                "object"
            )
        );


        tests.push(
            runTest(
                "Research result should contain text",

                typeof research.text ===
                "string" &&
                research.text.length >
                0
            )
        );


        tests.push(
            runTest(
                "Research text should contain source information",

                research.text.includes(
                    "SOURCE"
                )
            )
        );


        tests.push(
            runTest(
                "Research text should contain example.com",

                research.text
                    .toLowerCase()
                    .includes(
                        "example.com"
                    )
            )
        );


        tests.push(
            runTest(
                "Research text should stay within configured maximum length",

                research.text.length <=
                config.research
                    .max_research_text_length
            )
        );


        // --------------------------------------------------
        // Display details
        // --------------------------------------------------

        console.log(
            "\n========================================"
        );

        console.log(
            "RESEARCH DETAILS"
        );

        console.log(
            "========================================"
        );


        console.log(
            `Research text length: ${research.text.length}`
        );


        console.log(
            "\nResearch preview:"
        );


        console.log(
            research.text.substring(
                0,
                500
            )
        );


    } catch (error) {

        console.error(
            "\nWeb researcher test encountered an error:"
        );


        console.error(
            error.message
        );


        tests.push(
            false
        );
    }


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
            "\nWeb researcher test completed successfully."
        );

    } else {

        console.log(
            "\nWeb researcher test failed."
        );

        process.exitCode =
            1;
    }
}


// --------------------------------------------------
// Run
// --------------------------------------------------

main();