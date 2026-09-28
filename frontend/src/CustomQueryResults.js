import React from "react";


const h =
  React.createElement;


export function CustomQueryResults({ results = [] }) {
  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  return h(
    "div",
    {
      className:
        "mt-8 space-y-5 border-t border-slate-200/80 pt-7",
      "data-testid":
        "custom-query-results"
    },
    results.map(
      (result, resultIndex) =>
        h(
          "article",
          {
            key:
              `${result.website}-${resultIndex}`,
            className:
              "rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-6"
          },
          h(
            "h4",
            {
              className:
                "text-xl font-bold text-slate-950"
            },
            result.company
          ),
          h(
            "a",
            {
              href:
                result.website,
              target:
                "_blank",
              rel:
                "noreferrer",
              className:
                "mt-1 inline-block text-sm text-indigo-700 hover:underline"
            },
            result.website
          ),
          h(
            "div",
            {
              className:
                "mt-6 space-y-5"
            },
            ...(result.answers || []).map(
              (answer, answerIndex) =>
                h(
                  "section",
                  {
                    key:
                      `${answer.question}-${answerIndex}`,
                    className:
                      "rounded-xl border border-slate-200 bg-white/90 p-5"
                  },
                  h(
                    "h5",
                    {
                      className:
                        "font-bold text-slate-900"
                    },
                    answer.question
                  ),
                  h(
                    "p",
                    {
                      className:
                        "mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700"
                    },
                    answer.answer
                  ),
                  Array.isArray(answer.evidence) &&
                  answer.evidence.length > 0
                    ? h(
                        "div",
                        {
                          className:
                            "mt-4 space-y-3 border-t border-slate-100 pt-4"
                        },
                        h(
                          "p",
                          {
                            className:
                              "text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                          },
                          "Evidence"
                        ),
                        ...answer.evidence.map(
                          (item, evidenceIndex) =>
                            h(
                              "div",
                              {
                                key:
                                  `${item.source}-${evidenceIndex}`,
                                className:
                                  "text-sm leading-6 text-slate-600"
                              },
                              h(
                                "p",
                                null,
                                item.description
                              ),
                              h(
                                "a",
                                {
                                  href:
                                    item.source,
                                  target:
                                    "_blank",
                                  rel:
                                    "noreferrer",
                                  className:
                                    "break-all text-indigo-700 hover:underline"
                                },
                                item.source
                              )
                            )
                        )
                      )
                    : null
                )
            )
          ),
          result.score
            ? h(
                "section",
                {
                  className:
                    "mt-6 rounded-xl border border-cyan-200 bg-cyan-50 p-5"
                },
                h(
                  "p",
                  {
                    className:
                      "text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700"
                  },
                  "Score"
                ),
                h(
                  "p",
                  {
                    className:
                      "mt-2 text-2xl font-bold text-slate-950"
                  },
                  `${result.score.value}/${result.score.max}`
                ),
                h(
                  "p",
                  {
                    className:
                      "mt-2 text-sm leading-6 text-slate-600"
                  },
                  result.score.reason
                ),
                Array.isArray(result.score.evidence) &&
                result.score.evidence.length > 0
                  ? h(
                      "div",
                      {
                        className:
                          "mt-4 space-y-2 border-t border-cyan-200 pt-4"
                      },
                      ...result.score.evidence.map(
                        (item, evidenceIndex) =>
                          h(
                            "div",
                            {
                              key:
                                `${item.source}-${evidenceIndex}`,
                              className:
                                "text-sm leading-6 text-slate-600"
                            },
                            h(
                              "p",
                              null,
                              item.description
                            ),
                            h(
                              "a",
                              {
                                href:
                                  item.source,
                                target:
                                  "_blank",
                                rel:
                                  "noreferrer",
                                className:
                                  "break-all text-cyan-800 hover:underline"
                              },
                              item.source
                            )
                          )
                      )
                    )
                  : null
              )
            : null
        )
    )
  );
}
