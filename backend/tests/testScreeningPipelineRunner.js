const path = require("path");

const {
    runScreening
} = require("../src/screeningPipeline");


async function main() {

    console.log(
        "\n========================================"
    );

    console.log(
        "SCREENING PIPELINE RUNNER TEST"
    );

    console.log(
        "========================================\n"
    );


    const companiesPath =
        path.join(
            __dirname,
            "..",
            "input",
            "companies.csv"
        );


    const outputDirectory =
        path.join(
            __dirname,
            "..",
            "output"
        );


    try {

        const result =
            await runScreening({
                companiesPath,
                outputDirectory
            });


        console.log(
            "\n========================================"
        );

        console.log(
            "PIPELINE RESULT"
        );

        console.log(
            "========================================"
        );


        console.log(
            `Success: ${result.success}`
        );

        console.log(
            `Message: ${result.message}`
        );

        console.log(
            `Total companies: ${result.totalCompanies}`
        );

        console.log(
            `Successful companies: ${result.successfulCompanies}`
        );

        console.log(
            `Failed companies: ${result.failedCompanies}`
        );

        console.log(
            `Daily quota exhausted: ${result.dailyQuotaExhausted}`
        );


        console.log(
            "\nConfiguration sources:"
        );

        console.log(
            result.configSources
        );


        console.log(
            "\nGenerated files:"
        );

        console.log(
            result.files
        );


        console.log(
            "\n========================================"
        );

        console.log(
            "SCREENING PIPELINE TEST COMPLETED"
        );

        console.log(
            "========================================"
        );


    } catch (error) {

        console.error(
            "\nScreening pipeline test failed."
        );

        console.error(
            error.message
        );

        process.exitCode =
            1;
    }
}


main();