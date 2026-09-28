import assert from "node:assert";
import React from "react";
import {
  renderToStaticMarkup
} from "react-dom/server";

import {
  CustomQueryResults
} from "../src/CustomQueryResults.js";


const markup =
  renderToStaticMarkup(
    React.createElement(
      CustomQueryResults,
      {
        results: [
          {
            company:
              "Example Company",
            website:
              "https://example.com",
            answers: [
              {
                question:
                  "What services do they provide?",
                answer:
                  "Web Development, Mobile Development, UI/UX Design",
                evidence: [
                  {
                    source:
                      "https://example.com/services",
                    description:
                      "The services page lists these offerings."
                  }
                ]
              },
              {
                question:
                  "Android Application Development",
                answer:
                  "Yes",
                evidence: [
                  {
                    source:
                      "https://example.com/mobile",
                    description:
                      "The mobile page lists Android development."
                  }
                ]
              }
            ],
            score: {
              value:
                10,
              max:
                10,
              reason:
                "Android development is supported by evidence."
            }
          }
        ]
      }
    )
  );


assert.ok(
  markup.includes(
    "What services do they provide?"
  )
);

assert.ok(
  markup.includes(
    "Android Application Development"
  )
);

assert.ok(
  markup.includes(
    "https://example.com/mobile"
  )
);

assert.ok(
  markup.includes(
    "10/10"
  )
);

assert.ok(
  !markup.includes(
    "Team Size"
  )
);

assert.ok(
  !markup.includes(
    "Growth Signals"
  )
);

console.log(
  "PASS: Custom query results render focused answers, evidence, and score without unrelated screening fields."
);
