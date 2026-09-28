require("dotenv").config();

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
    runScreening
} = require("../src/screeningPipeline");

const {
    isValidSourceUrl
} = require("../src/validation/outputValidator");


async function main() {

    if (!process.env.GROK_API_KEY) {
        throw new Error(
            "GROK_API_KEY is required for the live custom-query test."
        );
    }

    const testDirectory =
        path.join(
            __dirname,
            "temp-live-custom-query"
        );

    const companiesPath =
        path.join(
            testDirectory,
            "companies.csv"
        );

    const promptPath =
        path.join(
            testDirectory,
            "prompt.txt"
        );

    fs.mkdirSync(
        testDirectory,
        {
            recursive:
                true
        }
    );

    fs.writeFileSync(
        companiesPath,
        "website\nhttps://www.hubspot.com\n",
        "utf8"
    );

    fs.writeFileSync(
        promptPath,
        "What services do they provide?\nDo they provide Android application development services?",
        "utf8"
    );

    try {

        const result =
            await runScreening({
                companiesPath,
                promptPath,
                scoringInstructions:
                    "If they provide Android application development services, score 10. Otherwise score 0.",
                outputDirectory:
                    path.join(
                        testDirectory,
                        "output"
                    )
            });

        assert.strictEqual(
            result.mode,
            "custom_query"
        );

        assert.strictEqual(
            result.successfulCompanies,
            1
        );

        const customResult =
            result.results[0];

        assert.ok(
            customResult.answers.length >= 2
        );

        assert.ok(
            customResult.score.value >= 0 &&
            customResult.score.value <= 10
        );

        assert.strictEqual(
            customResult.score.max,
            10
        );

        assert.strictEqual(
            Object.prototype.hasOwnProperty.call(
                customResult,
                "team_size"
            ),
            false
        );

        assert.strictEqual(
            Object.prototype.hasOwnProperty.call(
                customResult,
                "detected_triggers"
            ),
            false
        );

        customResult.answers.forEach(
            (answer) => {

                answer.evidence.forEach(
                    (item) => {
                        assert.ok(
                            isValidSourceUrl(
                                item.source
                            )
                        );
                    }
                );
            }
        );

        console.log(
            JSON.stringify(
                customResult,
                null,
                2
            )
        );

        console.log(
            "PASS: Live HubSpot custom-query test returned focused, validated output."
        );

    } finally {

        if (fs.existsSync(testDirectory)) {
            fs.rmSync(
                testDirectory,
                {
                    recursive:
                        true,
                    force:
                        true
                }
            );
        }
    }
}


main().catch(
    (error) => {
        console.error(error);
        process.exitCode = 1;
    }
);
