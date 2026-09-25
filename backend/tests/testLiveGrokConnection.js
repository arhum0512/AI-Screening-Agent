require("dotenv").config();

const {
    askAI
} = require(
    "../src/ai/grokClient"
);


// --------------------------------------------------
// Main test
// --------------------------------------------------

async function main() {

    console.log(
        "\n========================================"
    );

    console.log(
        "LIVE GROK CONNECTION TEST"
    );

    console.log(
        "========================================\n"
    );


    console.log(
        `Configured provider: ${process.env.AI_PROVIDER}`
    );


    console.log(
        `Configured model: ${process.env.GROK_MODEL}`
    );


    // --------------------------------------------------
    // Validate environment configuration
    // --------------------------------------------------

    if (
        process.env.AI_PROVIDER !==
        "grok"
    ) {

        console.error(
            "\nERROR: AI_PROVIDER must be set to grok in .env"
        );

        process.exitCode =
            1;

        return;
    }


    if (
        !process.env.GROK_API_KEY
    ) {

        console.error(
            "\nERROR: GROK_API_KEY is missing from .env"
        );

        process.exitCode =
            1;

        return;
    }


    if (
        !process.env.GROK_MODEL
    ) {

        console.error(
            "\nERROR: GROK_MODEL is missing from .env"
        );

        process.exitCode =
            1;

        return;
    }


    try {

        // --------------------------------------------------
        // Send small live request
        // --------------------------------------------------

        console.log(
            "\nSending small test request to Grok..."
        );


        const response =
            await askAI(
                "Briefly confirm that this API request was received successfully."
            );


        // --------------------------------------------------
        // Validate response
        // --------------------------------------------------

        const validResponse =
            typeof response ===
                "string" &&
            response.trim().length >
                0;


        console.log(
            "\nResponse received:"
        );


        console.log(
            response
        );


        if (
            validResponse
        ) {

            console.log(
                "\n========================================"
            );

            console.log(
                "GROK CONNECTION TEST PASSED"
            );

            console.log(
                "========================================"
            );


            console.log(
                "\nVerified:"
            );


            console.log(
                "- Grok provider selected"
            );


            console.log(
                "- API key accepted"
            );


            console.log(
                "- Grok model accessible"
            );


            console.log(
                "- API request completed"
            );


            console.log(
                "- Non-empty response returned"
            );

        } else {

            console.error(
                "\nERROR: Grok returned an empty or invalid response."
            );


            process.exitCode =
                1;
        }


    } catch (error) {

        console.error(
            "\n========================================"
        );

        console.error(
            "GROK CONNECTION TEST FAILED"
        );

        console.error(
            "========================================"
        );


        console.error(
            error.message
        );


        process.exitCode =
            1;
    }
}


// --------------------------------------------------
// Run
// --------------------------------------------------

main();