const fs = require("fs");
const path = require("path");

const {
    createArrayCsvWriter,
    createObjectCsvWriter
} = require("csv-writer");


// --------------------------------------------------
// Supporting trigger CSV headers
// --------------------------------------------------

const TRIGGER_HEADERS = [
    {
        id: "company",
        title: "company"
    },
    {
        id: "website",
        title: "website"
    },
    {
        id: "trigger",
        title: "trigger"
    },
    {
        id: "category",
        title: "category"
    },
    {
        id: "score",
        title: "score"
    },
    {
        id: "type",
        title: "type"
    }
];


// --------------------------------------------------
// Supporting evidence CSV headers
// --------------------------------------------------

const EVIDENCE_HEADERS = [
    {
        id: "company",
        title: "company"
    },
    {
        id: "website",
        title: "website"
    },
    {
        id: "trigger",
        title: "trigger"
    },
    {
        id: "trigger_type",
        title: "trigger_type"
    },
    {
        id: "source",
        title: "source"
    },
    {
        id: "description",
        title: "description"
    }
];


// --------------------------------------------------
// Ensure output directory exists
// --------------------------------------------------

function ensureOutputDirectory(filePath) {

    const directory =
        path.dirname(
            filePath
        );

    if (
        !fs.existsSync(
            directory
        )
    ) {

        fs.mkdirSync(
            directory,
            {
                recursive: true
            }
        );
    }

    return directory;
}


// --------------------------------------------------
// Safely parse JSON array fields
// --------------------------------------------------

function parseJsonArray(value) {

    if (
        Array.isArray(
            value
        )
    ) {

        return value;
    }

    if (
        typeof value !== "string" ||
        value.trim() === ""
    ) {

        return [];
    }

    try {

        const parsed =
            JSON.parse(
                value
            );

        if (
            Array.isArray(
                parsed
            )
        ) {

            return parsed;
        }

        return [];

    } catch (error) {

        return [];
    }
}


// --------------------------------------------------
// Normalize text
// --------------------------------------------------

function normalizeText(
    value,
    fallback = ""
) {

    if (
        value === null ||
        value === undefined
    ) {

        return fallback;
    }

    const text =
        String(
            value
        ).trim();

    return text || fallback;
}


// --------------------------------------------------
// Normalize services
// --------------------------------------------------

function normalizeServices(value) {

    if (
        Array.isArray(
            value
        )
    ) {

        return value
            .map(
                (service) =>
                    normalizeText(
                        service
                    )
            )
            .filter(Boolean)
            .join(
                ", "
            );
    }

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }

    return String(
        value
    ).trim();
}


// --------------------------------------------------
// Format category
// --------------------------------------------------

function formatCategory(category) {

    const text =
        normalizeText(
            category
        );

    if (
        !text
    ) {

        return "";
    }

    return text
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\b\w/g,
            (character) =>
                character.toUpperCase()
        );
}


// --------------------------------------------------
// Get all triggers
// --------------------------------------------------

function getAllTriggers(company) {

    const predefined =
        parseJsonArray(
            company?.detected_triggers
        );

    const additional =
        parseJsonArray(
            company?.additional_triggers
        );

    return [
        ...predefined.map(
            (trigger) => ({
                ...trigger,
                trigger_type:
                    "Predefined"
            })
        ),

        ...additional.map(
            (trigger) => ({
                ...trigger,
                trigger_type:
                    "Additional"
            })
        )
    ];
}


// --------------------------------------------------
// Format one trigger
// --------------------------------------------------

function formatTrigger(trigger) {

    const name =
        normalizeText(
            trigger?.name,
            "Unnamed trigger"
        );

    const score =
        trigger?.score !== undefined &&
        trigger?.score !== null
            ? `${trigger.score}/10`
            : "";

    if (
        score
    ) {

        return `${name} (${score})`;
    }

    return name;
}


// --------------------------------------------------
// Growth signals
// --------------------------------------------------

function getGrowthSignals(company) {

    const triggers =
        getAllTriggers(
            company
        );

    const growthSignals =
        triggers.filter(
            (trigger) =>
                normalizeText(
                    trigger?.category
                )
                    .toLowerCase() ===
                "growth"
        );

    if (
        growthSignals.length === 0
    ) {

        return "None";
    }

    return growthSignals
        .map(
            formatTrigger
        )
        .join(
            " | "
        );
}


// --------------------------------------------------
// Operational signals
// --------------------------------------------------

function getOperationalSignals(company) {

    const triggers =
        getAllTriggers(
            company
        );

    const operationalSignals =
        triggers.filter(
            (trigger) => {

                const category =
                    normalizeText(
                        trigger?.category
                    )
                        .toLowerCase()
                        .replace(
                            /\s+/g,
                            "_"
                        );

                return (
                    category === "pain_point" ||
                    category === "workflow_tool"
                );
            }
        );

    if (
        operationalSignals.length === 0
    ) {

        return "None";
    }

    return operationalSignals
        .map(
            formatTrigger
        )
        .join(
            " | "
        );
}


// --------------------------------------------------
// Collect evidence
// --------------------------------------------------

function collectEvidence(company) {

    const collectedEvidence = [];
    const seenEvidence = new Set();

    function addEvidenceItem(item) {

        const source =
            normalizeText(
                item?.source
            );

        const description =
            normalizeText(
                item?.description
            );

        if (
            !source ||
            !description
        ) {

            return;
        }

        const key =
            `${source}|||${description}`;

        if (
            seenEvidence.has(
                key
            )
        ) {

            return;
        }

        seenEvidence.add(
            key
        );

        collectedEvidence.push({
            source:
                source,

            description:
                description
        });
    }

    const triggers =
        getAllTriggers(
            company
        );

    triggers.forEach(
        (trigger) => {

            const evidence =
                Array.isArray(
                    trigger?.evidence
                )
                    ? trigger.evidence
                    : [];

            evidence.forEach(
                addEvidenceItem
            );
        }
    );

    const generalEvidence =
        parseJsonArray(
            company?.evidence
        );

    generalEvidence.forEach(
        addEvidenceItem
    );

    const scoringEvidence =
        parseJsonArray(
            company?.scoring_evidence
        );

    scoringEvidence.forEach(
        addEvidenceItem
    );

    return collectedEvidence;
}


// --------------------------------------------------
// Format evidence
// --------------------------------------------------

function formatEvidenceForCsv(company) {

    const evidence =
        collectEvidence(
            company
        );

    if (
        evidence.length === 0
    ) {

        return "No supporting evidence available.";
    }

    return evidence
        .map(
            (item, index) => {

                const source =
                    item.source ||
                    "Unknown source";

                const description =
                    item.description ||
                    "No description";

                return (
                    `${index + 1}. ` +
                    `${source} — ` +
                    `${description}`
                );
            }
        )
        .join(
            " | "
        );
}


// --------------------------------------------------
// Backward-compatible trigger formatter
// --------------------------------------------------

function formatTriggersForCsv(value) {

    const triggers =
        parseJsonArray(
            value
        );

    if (
        triggers.length === 0
    ) {

        return "None";
    }

    return triggers
        .map(
            formatTrigger
        )
        .join(
            " | "
        );
}


// --------------------------------------------------
// Create Field = Value rows
// --------------------------------------------------

function createVerticalCompanyRows(company) {

    return [
        [
            `Website = ${normalizeText(
                company?.website
            )}`
        ],

        [
            `Company = ${normalizeText(
                company?.company
            )}`
        ],

        [
            `Score = ${company?.company_score ?? 0} / 10`
        ],

        ...(
            normalizeText(
                company?.scoring_reason
            )
                ? [
                    [
                        `Scoring Rule Reason = ${normalizeText(
                            company?.scoring_reason
                        )}`
                    ]
                ]
                : []
        ),

        [
            `Business Type = ${normalizeText(
                company?.business_type
            )}`
        ],

        [
            `Services = ${normalizeServices(
                company?.services
            )}`
        ],

        [
            `Team Size = ${normalizeText(
                company?.team_size
            )}`
        ],

        [
            `Growth Signals = ${getGrowthSignals(
                company
            )}`
        ],

        [
            `Operational Signals = ${getOperationalSignals(
                company
            )}`
        ],

        [
            `Evidence = ${formatEvidenceForCsv(
                company
            )}`
        ],

        [
            `Reason = ${normalizeText(
                company?.reason
            )}`
        ],

        [
            `Confidence = ${normalizeText(
                company?.confidence
            )}`
        ]
    ];
}


// --------------------------------------------------
// Build vertical successful-company rows
// --------------------------------------------------

function buildVerticalSummaryRows(companies) {

    const rows = [];

    companies.forEach(
        (company, index) => {

            if (
                index > 0
            ) {

                rows.push(
                    [
                        ""
                    ]
                );
            }

            rows.push(
                ...createVerticalCompanyRows(
                    company
                )
            );
        }
    );

    return rows;
}


// --------------------------------------------------
// Build failed-company rows
// --------------------------------------------------

function buildFailedCompanyRows(failedCompanies) {

    const rows = [];

    failedCompanies.forEach(
        (company, index) => {

            if (
                index > 0
            ) {

                rows.push(
                    [
                        ""
                    ]
                );
            }

            rows.push(
                [
                    `Website = ${normalizeText(
                        company?.website
                    )}`
                ],

                [
                    "Status = Failed"
                ],

                [
                    `Reason = ${normalizeText(
                        company?.reason,
                        "Unknown processing error."
                    )}`
                ]
            );
        }
    );

    return rows;
}


// --------------------------------------------------
// Build trigger detail rows
// --------------------------------------------------

function buildTriggerRows(companies) {

    const rows = [];

    companies.forEach(
        (company) => {

            const triggers =
                getAllTriggers(
                    company
                );

            triggers.forEach(
                (trigger) => {

                    rows.push({
                        company:
                            normalizeText(
                                company?.company
                            ),

                        website:
                            normalizeText(
                                company?.website
                            ),

                        trigger:
                            normalizeText(
                                trigger?.name
                            ),

                        category:
                            formatCategory(
                                trigger?.category
                            ),

                        score:
                            trigger?.score ?? "",

                        type:
                            normalizeText(
                                trigger?.trigger_type
                            )
                    });
                }
            );
        }
    );

    return rows;
}


// --------------------------------------------------
// Build evidence detail rows
// --------------------------------------------------

function buildEvidenceRows(companies) {

    const rows = [];

    companies.forEach(
        (company) => {

            const seenEvidence =
                new Set();

            function addEvidenceRow(
                triggerName,
                triggerType,
                item
            ) {

                const source =
                    normalizeText(
                        item?.source
                    );

                const description =
                    normalizeText(
                        item?.description
                    );

                if (
                    !source ||
                    !description
                ) {

                    return;
                }

                const key =
                    `${source}|||${description}`;

                if (
                    seenEvidence.has(
                        key
                    )
                ) {

                    return;
                }

                seenEvidence.add(
                    key
                );

                rows.push({
                    company:
                        normalizeText(
                            company?.company
                        ),

                    website:
                        normalizeText(
                            company?.website
                        ),

                    trigger:
                        triggerName,

                    trigger_type:
                        triggerType,

                    source:
                        source,

                    description:
                        description
                });
            }

            const triggers =
                getAllTriggers(
                    company
                );

            triggers.forEach(
                (trigger) => {

                    const evidence =
                        Array.isArray(
                            trigger?.evidence
                        )
                            ? trigger.evidence
                            : [];

                    evidence.forEach(
                        (item) => {

                            addEvidenceRow(
                                normalizeText(
                                    trigger?.name,
                                    "Unnamed trigger"
                                ),

                                normalizeText(
                                    trigger?.trigger_type
                                ),

                                item
                            );
                        }
                    );
                }
            );

            const generalEvidence =
                parseJsonArray(
                    company?.evidence
                );

            generalEvidence.forEach(
                (item) => {

                    addEvidenceRow(
                        "General Evidence",
                        "General",
                        item
                    );
                }
            );

            const scoringEvidence =
                parseJsonArray(
                    company?.scoring_evidence
                );

            scoringEvidence.forEach(
                (item) => {

                    addEvidenceRow(
                        "Scoring Evidence",
                        "Manual Scoring",
                        item
                    );
                }
            );
        }
    );

    return rows;
}


// --------------------------------------------------
// Output paths
// --------------------------------------------------

function getOutputPaths(mainFilePath) {

    const outputDirectory =
        path.dirname(
            mainFilePath
        );

    return {
        summary:
            mainFilePath,

        triggers:
            path.join(
                outputDirectory,
                "detected-triggers.csv"
            ),

        evidence:
            path.join(
                outputDirectory,
                "evidence.csv"
            ),

        failed:
            path.join(
                outputDirectory,
                "failed-companies.csv"
            )
    };
}


// --------------------------------------------------
// Write main successful-company CSV
// --------------------------------------------------

async function writeVerticalSummary(
    filePath,
    companies
) {

    const rows =
        buildVerticalSummaryRows(
            companies
        );

    const csvWriter =
        createArrayCsvWriter({
            path:
                filePath,

            header:
                [
                    "Screening Result"
                ],

            alwaysQuote:
                false
        });

    await csvWriter.writeRecords(
        rows
    );

    return rows.length;
}


// --------------------------------------------------
// Write failed-company CSV
// --------------------------------------------------

async function writeFailedCompanies(
    filePath,
    failedCompanies
) {

    if (
        !Array.isArray(
            failedCompanies
        )
    ) {

        throw new Error(
            "Failed company output data must be an array."
        );
    }

    if (
        failedCompanies.length === 0
    ) {

        return {
            written:
                0,

            filePath:
                null
        };
    }

    ensureOutputDirectory(
        filePath
    );

    const rows =
        buildFailedCompanyRows(
            failedCompanies
        );

    const csvWriter =
        createArrayCsvWriter({
            path:
                filePath,

            header:
                [
                    "Failed Screening Result"
                ],

            alwaysQuote:
                false
        });

    await csvWriter.writeRecords(
        rows
    );

    return {
        written:
            failedCompanies.length,

        filePath:
            filePath
    };
}


// --------------------------------------------------
// Write object CSV
// --------------------------------------------------

async function writeObjectCsv(
    filePath,
    headers,
    rows
) {

    const csvWriter =
        createObjectCsvWriter({
            path:
                filePath,

            header:
                headers,

            alwaysQuote:
                false
        });

    await csvWriter.writeRecords(
        rows
    );
}


// --------------------------------------------------
// Main successful-company writer
// --------------------------------------------------

async function writeCompanies(
    filePath,
    companies
) {

    if (
        !Array.isArray(
            companies
        )
    ) {

        throw new Error(
            "CSV output data must be an array."
        );
    }

    if (
        companies.length === 0
    ) {

        console.log(
            "No companies to write."
        );

        return {
            written:
                0,

            filePath:
                null,

            filePaths:
                null
        };
    }

    try {

        ensureOutputDirectory(
            filePath
        );

        const outputPaths =
            getOutputPaths(
                filePath
            );

        const triggerRows =
            buildTriggerRows(
                companies
            );

        const evidenceRows =
            buildEvidenceRows(
                companies
            );

        await writeVerticalSummary(
            outputPaths.summary,
            companies
        );

        await writeObjectCsv(
            outputPaths.triggers,
            TRIGGER_HEADERS,
            triggerRows
        );

        await writeObjectCsv(
            outputPaths.evidence,
            EVIDENCE_HEADERS,
            evidenceRows
        );

        return {
            written:
                companies.length,

            filePath:
                outputPaths.summary,

            filePaths:
                outputPaths,

            triggerRowsWritten:
                triggerRows.length,

            evidenceRowsWritten:
                evidenceRows.length
        };

    } catch (error) {

        throw new Error(
            `Unable to write output CSV files: ${error.message}`
        );
    }
}


// --------------------------------------------------
// Exports
// --------------------------------------------------

module.exports = {
    writeCompanies,
    writeFailedCompanies,
    ensureOutputDirectory,
    parseJsonArray,
    normalizeText,
    normalizeServices,
    formatCategory,
    formatTriggersForCsv,
    formatEvidenceForCsv,
    getAllTriggers,
    getGrowthSignals,
    getOperationalSignals,
    collectEvidence,
    createVerticalCompanyRows,
    buildVerticalSummaryRows,
    buildFailedCompanyRows,
    buildTriggerRows,
    buildEvidenceRows,
    getOutputPaths,
    writeVerticalSummary,
    TRIGGER_HEADERS,
    EVIDENCE_HEADERS
};
