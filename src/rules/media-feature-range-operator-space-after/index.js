import {
  report,
  ruleMessages,
  validateOptions,
  whitespaceChecker
} from "../../utils"

export const ruleName = "media-feature-range-operator-space-after"

export const messages = ruleMessages(ruleName, {
  expectedAfter: () => `Expected single space after range operator`,
  rejectedAfter: () => `Unexpected whitespace after range operator`,
})

const rangeOperatorRegex = /[^><](>=?|<=?|=)/g

export default function (expectation) {
  const checker = whitespaceChecker("space", expectation, messages)
  return (root, result) => {
    const validOptions = validateOptions(result, ruleName, {
      actual: expectation,
      possible: [
        "always",
        "never",
      ],
    })
    if (!validOptions) { return }

    root.eachAtRule(atRule => {
      findMediaOperator(atRule, checkAfterOperator)
    })

    function checkAfterOperator(match, params, node) {
      checker.after({
        source: params,
        index: match.index + match[1].length,
        err: m => {
          report({
            message: m,
            node: node,
            result,
            ruleName,
          })
        },
      })
    }
  }
}

export function findMediaOperator(atRule, cb) {
  if (atRule.name !== "media") { return }

  const params = atRule.params
  let match
  while ((match = rangeOperatorRegex.exec(params)) !== null) {
    cb(match, params, atRule)
  }
}
