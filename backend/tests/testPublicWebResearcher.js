require("dotenv").config();

const {
    researchPublicWeb
} = require(
    "../src/research/publicWebResearcher"
);


async function runTest() {

    const company = {

        website:
            "https://www.hubspot.com",

        company:
            "HubSpot"
    };


    console.log(
        "\nTesting public web researcher...\n"
    );


    const result =
        await researchPublicWeb(
            company
        );


    console.log(
        "\n========================================"
    );

    console.log(
        "RESEARCH TEXT"
    );

    console.log(
        "========================================\n"
    );

    console.log(
        result.text
    );


    console.log(
        "\n========================================"
    );

    console.log(
        "SOURCES"
    );

    console.log(
        "========================================\n"
    );


    result.sources.forEach(
        (
            source,
            index
        ) => {

            console.log(
                `${index + 1}. ${source.title || "Untitled"}`
            );

            console.log(
                `   ${source.url}`
            );
        }
    );


    console.log(
        `\nTotal sources: ${result.sourceCount}`
    );


    console.log(
        "\nPublic web researcher test completed successfully."
    );
}


runTest()
    .catch(
        (error) => {

            console.error(
                "\nPublic web researcher test failed:"
            );

            console.error(
                error.message
            );

            process.exit(
                1
            );
        }
    );