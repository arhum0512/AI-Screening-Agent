const assert = require("assert");

const {
    validateScreeningResult,
    validateEvidenceItem,
    isValidSourceUrl
} = require("../src/validation/outputValidator");

const {
    buildEvidenceRows,
    collectEvidence
} = require("../src/csvWriter");


function main() {

    assert.strictEqual(
        isValidSourceUrl(
            "https://example.com/news?id=1"
        ),
        true
    );

    const malformedSources = [
        "Company website",
        "[News](https://example.com/news)",
        "https://example.com/news — Company expanded",
        "javascript:alert(1)",
        "/relative/source"
    ];

    malformedSources.forEach(
        (source) => {
            assert.ok(
                validateEvidenceItem(
                    {
                        source,
                        description:
                            "A separate evidence description."
                    },
                    "test"
                ).some(
                    (error) =>
                        error.includes(
                            "absolute HTTP(S) URL"
                        )
                ),
                `Expected malformed source to fail: ${source}`
            );
        }
    );

    const structurallyValidResult = {
        website:
            "https://example.com",
        company:
            "Example",
        business_type:
            "Software",
        services:
            [],
        team_size:
            "Unknown",
        detected_triggers:
            [],
        additional_triggers:
            [],
        evidence: [
            {
                source:
                    "https://invented.example/evidence",
                description:
                    "This URL was not supplied by any research layer."
            }
        ],
        reason:
            "Test result.",
        confidence:
            "Low"
    };

    const provenanceValidation =
        validateScreeningResult(
            structurallyValidResult,
            {
                allowedSourceUrls: [
                    "https://example.com"
                ]
            }
        );

    assert.strictEqual(
        provenanceValidation.valid,
        false
    );

    assert.ok(
        provenanceValidation.errors.some(
            (error) =>
                error.includes(
                    "not present in the supplied research"
                )
        )
    );

    const company = {
        company:
            "Example",
        website:
            "https://example.com",
        detected_triggers:
            JSON.stringify([
                {
                    name:
                        "Hiring rapidly",
                    category:
                        "growth",
                    score:
                        8,
                    evidence: [
                        {
                            source:
                                "https://example.com/careers?team=sales,engineering",
                            description:
                                "Roles are open in sales, engineering, and operations."
                        },
                        {
                            source:
                                "https://example.com/incomplete"
                        }
                    ]
                }
            ]),
        additional_triggers:
            "[]",
        evidence:
            JSON.stringify([
                {
                    source:
                        "",
                    description:
                        "Missing source should not become a malformed CSV row."
                }
            ])
    };

    const rows =
        buildEvidenceRows([
            company
        ]);

    assert.strictEqual(
        rows.length,
        1
    );

    assert.strictEqual(
        rows[0].source,
        "https://example.com/careers?team=sales,engineering"
    );

    assert.strictEqual(
        rows[0].description,
        "Roles are open in sales, engineering, and operations."
    );

    assert.strictEqual(
        collectEvidence(
            company
        ).length,
        1
    );

    console.log(
        "PASS: Malformed AI evidence is rejected and CSV source/description fields stay separate."
    );
}


try {
    main();
} catch (error) {
    console.error(error);
    process.exitCode = 1;
}
