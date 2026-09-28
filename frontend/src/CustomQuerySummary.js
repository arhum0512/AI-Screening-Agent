import React from "react";


const h =
  React.createElement;


export function CustomQuerySummary({ summary }) {
  if (!summary) {
    return null;
  }

  return h(
    "section",
    {
      className:
        "mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6",
      "data-testid":
        "custom-query-summary"
    },
    h(
      "div",
      {
        className:
          "flex items-center gap-3"
      },
      h(
        "span",
        {
          className:
            "flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700"
        },
        "✓"
      ),
      h(
        "h4",
        {
          className:
            "text-lg font-bold text-slate-950"
        },
        "Custom screening completed successfully"
      )
    ),
    h(
      "dl",
      {
        className:
          "mt-5 grid gap-3 text-sm sm:grid-cols-3"
      },
      h(
        "div",
        {
          className:
            "rounded-xl border border-emerald-100 bg-white/80 p-4"
        },
        h(
          "dt",
          {
            className:
              "text-slate-500"
          },
          "Companies processed"
        ),
        h(
          "dd",
          {
            className:
              "mt-1 text-xl font-bold text-slate-950"
          },
          summary.companiesProcessed
        )
      ),
      h(
        "div",
        {
          className:
            "rounded-xl border border-emerald-100 bg-white/80 p-4"
        },
        h(
          "dt",
          {
            className:
              "text-slate-500"
          },
          "Questions answered"
        ),
        h(
          "dd",
          {
            className:
              "mt-1 text-xl font-bold text-slate-950"
          },
          summary.questionsAnswered
        )
      ),
      summary.score
        ? h(
            "div",
            {
              className:
                "rounded-xl border border-cyan-100 bg-white/80 p-4"
            },
            h(
              "dt",
              {
                className:
                  "text-slate-500"
              },
              "Score"
            ),
            h(
              "dd",
              {
                className:
                  "mt-1 text-xl font-bold text-slate-950"
              },
              `${summary.score.value} / ${summary.score.max}`
            )
          )
        : null
    )
  );
}
