const fs = require("fs");
const path = require("path");

const {
    createObjectCsvWriter
} = require("csv-writer");


const CUSTOM_RESULT_HEADERS = [
    {
        id:
            "company",
        title:
            "company"
    },
    {
        id:
            "website",
        title:
            "website"
    },
    {
        id:
            "question",
        title:
            "question"
    },
    {
        id:
            "answer",
        title:
            "answer"
    },
    {
        id:
            "source",
        title:
            "source"
    },
    {
        id:
            "description",
        title:
            "description"
    },
    {
        id:
            "score",
        title:
            "score"
    },
    {
        id:
            "score_reason",
        title:
            "score_reason"
    }
];


function buildCustomResultRows(results) {

    const rows = [];

    results.forEach(
        (result) => {

            result.answers.forEach(
                (answer) => {

                    const evidence =
                        answer.evidence.length > 0
                            ? answer.evidence
                            : [
                                {
                                    source:
                                        "",
                                    description:
                                        ""
                                }
                            ];

                    evidence.forEach(
                        (item) => {

                            rows.push({
                                company:
                                    result.company,
                                website:
                                    result.website,
                                question:
                                    answer.question,
                                answer:
                                    answer.answer,
                                source:
                                    item.source,
                                description:
                                    item.description,
                                score:
                                    result.score
                                        ? `${result.score.value}/${result.score.max}`
                                        : "",
                                score_reason:
                                    result.score?.reason ||
                                    ""
                            });
                        }
                    );
                }
            );

            if (
                result.score &&
                Array.isArray(
                    result.score.evidence
                )
            ) {

                result.score.evidence.forEach(
                    (item) => {

                        rows.push({
                            company:
                                result.company,
                            website:
                                result.website,
                            question:
                                "Scoring evidence",
                            answer:
                                result.score.reason,
                            source:
                                item.source,
                            description:
                                item.description,
                            score:
                                `${result.score.value}/${result.score.max}`,
                            score_reason:
                                result.score.reason
                        });
                    }
                );
            }
        }
    );

    return rows;
}


async function writeCustomQueryResults(
    filePath,
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
            filePath:
                null,
            rowsWritten:
                0
        };
    }

    fs.mkdirSync(
        path.dirname(filePath),
        {
            recursive:
                true
        }
    );

    const rows =
        buildCustomResultRows(
            results
        );

    const writer =
        createObjectCsvWriter({
            path:
                filePath,
            header:
                CUSTOM_RESULT_HEADERS
        });

    await writer.writeRecords(
        rows
    );

    return {
        written:
            results.length,
        filePath,
        rowsWritten:
            rows.length
    };
}


module.exports = {
    CUSTOM_RESULT_HEADERS,
    buildCustomResultRows,
    writeCustomQueryResults
};
