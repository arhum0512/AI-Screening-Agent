const fs = require("fs");
const csv = require("csv-parser");


// --------------------------------------------------
// Normalize website URL
// --------------------------------------------------

function normalizeWebsiteUrl(
    website
) {

    if (
        website === undefined ||
        website === null
    ) {
        return null;
    }


    let normalized =
        String(website)
            .trim();


    if (!normalized) {
        return null;
    }


    /*
     * Detect whether ANY protocol/scheme already exists.
     *
     * Examples:
     *
     * https://example.com
     * http://example.com
     * ftp://example.com
     *
     * If a protocol exists, we do NOT automatically
     * prepend https://.
     *
     * This allows us to properly reject unsupported
     * schemes such as ftp:// instead of turning them
     * into malformed URLs.
     */

    const hasProtocol =
        /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(
            normalized
        );


    /*
     * If no protocol exists:
     *
     * example.com
     *
     * becomes:
     *
     * https://example.com
     */

    if (!hasProtocol) {

        normalized =
            `https://${normalized}`;
    }


    try {

        const parsedUrl =
            new URL(
                normalized
            );


        // --------------------------------------------------
        // Only HTTP and HTTPS are supported
        // --------------------------------------------------

        if (
            parsedUrl.protocol !== "http:" &&
            parsedUrl.protocol !== "https:"
        ) {

            return null;
        }


        // --------------------------------------------------
        // Hostname must exist
        // --------------------------------------------------

        if (
            !parsedUrl.hostname
        ) {

            return null;
        }


        // --------------------------------------------------
        // Reject obviously malformed hostnames
        // --------------------------------------------------

        if (
            parsedUrl.hostname.includes(
                " "
            )
        ) {

            return null;
        }


        // --------------------------------------------------
        // Remove simple root trailing slash
        // --------------------------------------------------

        if (
            parsedUrl.pathname === "/" &&
            !parsedUrl.search &&
            !parsedUrl.hash
        ) {

            return (
                `${parsedUrl.protocol}//${parsedUrl.host}`
            );
        }


        return parsedUrl.toString();


    } catch (error) {

        return null;
    }
}


// --------------------------------------------------
// Clean CSV row
// --------------------------------------------------

function cleanCompanyRow(
    row
) {

    const cleanedRow = {};


    for (
        const [key, value]
        of Object.entries(
            row || {}
        )
    ) {

        const cleanedKey =
            String(key)
                .trim();


        /*
         * Skip completely empty column names.
         */

        if (!cleanedKey) {
            continue;
        }


        cleanedRow[
            cleanedKey
        ] =
            typeof value === "string"
                ? value.trim()
                : value;
    }


    return cleanedRow;
}


// --------------------------------------------------
// Validate company row
// --------------------------------------------------

function validateCompanyRow(
    row,
    rowNumber
) {

    const errors = [];


    if (
        !row ||
        typeof row !== "object"
    ) {

        errors.push(
            `Row ${rowNumber}: row is invalid.`
        );


        return {
            valid:
                false,

            errors,

            company:
                null
        };
    }


    // --------------------------------------------------
    // Website column must exist
    // --------------------------------------------------

    if (
        row.website === undefined ||
        row.website === null ||
        String(row.website).trim() === ""
    ) {

        errors.push(
            `Row ${rowNumber}: website is required.`
        );


        return {
            valid:
                false,

            errors,

            company:
                null
        };
    }


    // --------------------------------------------------
    // Normalize and validate website
    // --------------------------------------------------

    const normalizedWebsite =
        normalizeWebsiteUrl(
            row.website
        );


    if (!normalizedWebsite) {

        errors.push(
            `Row ${rowNumber}: invalid or unsupported website "${row.website}".`
        );


        return {
            valid:
                false,

            errors,

            company:
                null
        };
    }


    // --------------------------------------------------
    // Return normalized company
    // --------------------------------------------------

    return {

        valid:
            true,

        errors: [],

        company: {
            ...row,

            website:
                normalizedWebsite
        }
    };
}


// --------------------------------------------------
// Read companies from CSV
// --------------------------------------------------

function readCompanies(
    filePath
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const companies = [];

            /*
             * Row 1 is the header row.
             * First actual company row is row 2.
             */
            let rowNumber = 1;

            let skippedRows = 0;


            // --------------------------------------------------
            // Check that input file exists
            // --------------------------------------------------

            if (
                !fs.existsSync(
                    filePath
                )
            ) {

                reject(
                    new Error(
                        `Input CSV file was not found: ${filePath}`
                    )
                );

                return;
            }


            // --------------------------------------------------
            // Read CSV
            // --------------------------------------------------

            fs.createReadStream(
                filePath
            )

                .pipe(
                    csv({
                        skipLines:
                            0,

                        skipComments:
                            true
                    })
                )


                .on(
                    "data",
                    (rawRow) => {

                        rowNumber++;


                        const row =
                            cleanCompanyRow(
                                rawRow
                            );


                        // --------------------------------------------------
                        // Ignore completely empty rows
                        // --------------------------------------------------

                        const hasAnyValue =
                            Object.values(
                                row
                            ).some(
                                (value) =>
                                    String(
                                        value ?? ""
                                    )
                                        .trim()
                                        .length > 0
                            );


                        if (!hasAnyValue) {

                            return;
                        }


                        // --------------------------------------------------
                        // Validate row
                        // --------------------------------------------------

                        const validation =
                            validateCompanyRow(
                                row,
                                rowNumber
                            );


                        if (
                            !validation.valid
                        ) {

                            skippedRows++;


                            validation.errors.forEach(
                                (error) => {

                                    console.warn(
                                        `CSV Warning: ${error}`
                                    );

                                }
                            );


                            return;
                        }


                        companies.push(
                            validation.company
                        );
                    }
                )


                .on(
                    "end",
                    () => {

                        if (
                            skippedRows > 0
                        ) {

                            console.log(
                                `CSV rows skipped: ${skippedRows}`
                            );

                        }


                        resolve(
                            companies
                        );
                    }
                )


                .on(
                    "error",
                    (error) => {

                        reject(
                            new Error(
                                `Unable to read input CSV: ${error.message}`
                            )
                        );
                    }
                );

        }
    );
}


// --------------------------------------------------
// Exports
// --------------------------------------------------

module.exports = {
    readCompanies,
    normalizeWebsiteUrl,
    cleanCompanyRow,
    validateCompanyRow
};
