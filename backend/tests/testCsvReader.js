const fs = require("fs");
const path = require("path");

const {
    readCompanies,
    normalizeWebsiteUrl,
    cleanCompanyRow,
    validateCompanyRow
} = require("../src/csvReader");


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
// Start tests
// --------------------------------------------------

async function main() {

    console.log(
        "\n========================================"
    );

    console.log(
        "CSV READER TEST"
    );

    console.log(
        "========================================\n"
    );


    const tests = [];


    // --------------------------------------------------
    // URL normalization tests
    // --------------------------------------------------

    tests.push(
        runTest(
            "Domain without protocol should get https://",

            normalizeWebsiteUrl(
                "example.com"
            ) ===
            "https://example.com"
        )
    );


    tests.push(
        runTest(
            "HTTPS URL should be preserved",

            normalizeWebsiteUrl(
                "https://example.com"
            ) ===
            "https://example.com"
        )
    );


    tests.push(
        runTest(
            "HTTP URL should be preserved",

            normalizeWebsiteUrl(
                "http://example.com"
            ) ===
            "http://example.com"
        )
    );


    tests.push(
        runTest(
            "Root trailing slash should be removed",

            normalizeWebsiteUrl(
                "https://example.com/"
            ) ===
            "https://example.com"
        )
    );


    tests.push(
        runTest(
            "URL path should be preserved",

            normalizeWebsiteUrl(
                "https://example.com/about"
            ) ===
            "https://example.com/about"
        )
    );


    tests.push(
        runTest(
            "Blank website should return null",

            normalizeWebsiteUrl(
                ""
            ) ===
            null
        )
    );


    tests.push(
        runTest(
            "Null website should return null",

            normalizeWebsiteUrl(
                null
            ) ===
            null
        )
    );


    tests.push(
        runTest(
            "FTP URL should be rejected",

            normalizeWebsiteUrl(
                "ftp://example.com"
            ) ===
            null
        )
    );


    // --------------------------------------------------
    // Row cleaning tests
    // --------------------------------------------------

    const cleanedRow =
        cleanCompanyRow({
            " id ":
                " 1 ",

            " website ":
                " example.com "
        });


    tests.push(
        runTest(
            "Column names should be trimmed",

            Object.prototype.hasOwnProperty.call(
                cleanedRow,
                "id"
            ) &&
            Object.prototype.hasOwnProperty.call(
                cleanedRow,
                "website"
            )
        )
    );


    tests.push(
        runTest(
            "Cell values should be trimmed",

            cleanedRow.id ===
            "1" &&
            cleanedRow.website ===
            "example.com"
        )
    );


    // --------------------------------------------------
    // Row validation tests
    // --------------------------------------------------

    const validCompany =
        validateCompanyRow(
            {
                id:
                    "1",

                website:
                    "example.com"
            },
            2
        );


    tests.push(
        runTest(
            "Valid company row should pass",

            validCompany.valid ===
            true
        )
    );


    tests.push(
        runTest(
            "Valid company website should be normalized",

            validCompany.company.website ===
            "https://example.com"
        )
    );


    const missingWebsite =
        validateCompanyRow(
            {
                id:
                    "2"
            },
            3
        );


    tests.push(
        runTest(
            "Missing website should fail",

            missingWebsite.valid ===
            false
        )
    );


    const blankWebsite =
        validateCompanyRow(
            {
                id:
                    "3",

                website:
                    "   "
            },
            4
        );


    tests.push(
        runTest(
            "Blank website should fail",

            blankWebsite.valid ===
            false
        )
    );


    const unsupportedWebsite =
        validateCompanyRow(
            {
                id:
                    "4",

                website:
                    "ftp://example.com"
            },
            5
        );


    tests.push(
        runTest(
            "Unsupported website protocol should fail",

            unsupportedWebsite.valid ===
            false
        )
    );


    // --------------------------------------------------
    // Temporary CSV integration test
    // --------------------------------------------------

    const tempFilePath =
        path.join(
            __dirname,
            "..",
            "input",
            "test-companies-temp.csv"
        );


    const tempCsv =
`id,website
1,example.com
2,https://microsoft.com
3,https://shopify.com/
4,
5,ftp://example.com
`;


    fs.writeFileSync(
        tempFilePath,
        tempCsv,
        "utf8"
    );


    try {

        const companies =
            await readCompanies(
                tempFilePath
            );


        tests.push(
            runTest(
                "Temporary CSV should return 3 valid companies",

                companies.length ===
                3
            )
        );


        tests.push(
            runTest(
                "First CSV website should be normalized",

                companies[0].website ===
                "https://example.com"
            )
        );


        tests.push(
            runTest(
                "Microsoft website should be preserved",

                companies[1].website ===
                "https://microsoft.com"
            )
        );


        tests.push(
            runTest(
                "Shopify trailing slash should be removed",

                companies[2].website ===
                "https://shopify.com"
            )
        );

    } finally {

        if (
            fs.existsSync(
                tempFilePath
            )
        ) {

            fs.unlinkSync(
                tempFilePath
            );
        }
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
            "\nCSV reader test completed successfully."
        );

    } else {

        console.log(
            "\nCSV reader test failed."
        );

        process.exitCode =
            1;
    }
}


// --------------------------------------------------
// Run
// --------------------------------------------------

main();