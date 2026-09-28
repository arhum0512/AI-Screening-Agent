const fs = require("fs");
const path = require("path");

const {
    createObjectCsvWriter
} = require("csv-writer");


const CUSTOM_RESULT_HEADERS = [
    { id: "company", title: "company" },
    { id: "website", title: "website" },
    { id: "question", title: "question" },
    { id: "answer", title: "answer" },
    { id: "score", title: "score" },
    { id: "score_max", title: "score_max" },
    { id: "score_reason", title: "score_reason" }
];


const CUSTOM_EVIDENCE_HEADERS = [
    { id: "company", title: "company" },
    { id: "website", title: "website" },
    { id: "question", title: "question" },
    { id: "source_url", title: "source_url" },
    {
        id:
            "evidence_description",
        title:
            "evidence_description"
    }
];


function sanitizeSpreadsheetText(value) {

    const text =
        String(
            value ??
            ""
        );

    if (/^[=+\-@]/.test(text)) {
        return `'${text}`;
    }

    return text;
}


function formatAnswerForCsv(value) {

    const text =
        String(
            value ??
            ""
        ).trim();

    const lines =
        text
            .split(/\r?\n/)
            .map(
                (line) =>
                    line
                        .trim()
                        .replace(
                            /^(?:[-*•]|\d+[.)])\s*/,
                            ""
                        )
            )
            .filter(Boolean);

    const formatted =
        lines.length > 1
            ? lines.join("; ")
            : text;

    return sanitizeSpreadsheetText(
        formatted
    );
}


function buildCustomResultRows(results) {

    const rows = [];

    results.forEach(
        (result) => {

            result.answers.forEach(
                (answer) => {

                    rows.push({
                        company:
                            sanitizeSpreadsheetText(
                                result.company
                            ),
                        website:
                            result.website,
                        question:
                            sanitizeSpreadsheetText(
                                answer.question
                            ),
                        answer:
                            formatAnswerForCsv(
                                answer.answer
                            ),
                        score:
                            result.score
                                ? result.score.value
                                : "",
                        score_max:
                            result.score
                                ? result.score.max
                                : "",
                        score_reason:
                            result.score
                                ? sanitizeSpreadsheetText(
                                    result.score.reason
                                )
                                : ""
                    });
                }
            );
        }
    );

    return rows;
}


function buildCustomEvidenceRows(results) {

    const rows = [];
    const seen = new Set();

    function addEvidence(
        result,
        question,
        item
    ) {

        const key =
            `${item.source}\u0000${item.description}`;

        if (seen.has(key)) {
            return;
        }

        seen.add(key);

        rows.push({
            company:
                sanitizeSpreadsheetText(
                    result.company
                ),
            website:
                result.website,
            question:
                sanitizeSpreadsheetText(
                    question
                ),
            source_url:
                item.source,
            evidence_description:
                sanitizeSpreadsheetText(
                    item.description
                )
        });
    }

    results.forEach(
        (result) => {

            result.answers.forEach(
                (answer) => {

                    answer.evidence.forEach(
                        (item) => {
                            addEvidence(
                                result,
                                answer.question,
                                item
                            );
                        }
                    );
                }
            );

            for (
                const item
                of result.score?.evidence || []
            ) {
                addEvidence(
                    result,
                    "Scoring evidence",
                    item
                );
            }
        }
    );

    return rows;
}


async function writeCsv(
    filePath,
    headers,
    rows
) {

    const writer =
        createObjectCsvWriter({
            path:
                filePath,
            header:
                headers,
            encoding:
                "utf8"
        });

    await writer.writeRecords(
        rows
    );
}


async function writeCustomQueryResults(
    resultsPath,
    evidencePath,
    results
) {

    if (!Array.isArray(results)) {
        throw new Error(
            "Custom query output data must be an array."
        );
    }

    if (results.length === 0) {
        return {
            written:
                0,
            resultsPath:
                null,
            evidencePath:
                null,
            resultRowsWritten:
                0,
            evidenceRowsWritten:
                0
        };
    }

    fs.mkdirSync(
        path.dirname(resultsPath),
        {
            recursive:
                true
        }
    );

    const resultRows =
        buildCustomResultRows(
            results
        );

    const evidenceRows =
        buildCustomEvidenceRows(
            results
        );

    await writeCsv(
        resultsPath,
        CUSTOM_RESULT_HEADERS,
        resultRows
    );

    await writeCsv(
        evidencePath,
        CUSTOM_EVIDENCE_HEADERS,
        evidenceRows
    );

    return {
        written:
            results.length,
        resultsPath,
        evidencePath,
        resultRowsWritten:
            resultRows.length,
        evidenceRowsWritten:
            evidenceRows.length
    };
}


module.exports = {
    CUSTOM_RESULT_HEADERS,
    CUSTOM_EVIDENCE_HEADERS,
    sanitizeSpreadsheetText,
    formatAnswerForCsv,
    buildCustomResultRows,
    buildCustomEvidenceRows,
    writeCustomQueryResults
};
