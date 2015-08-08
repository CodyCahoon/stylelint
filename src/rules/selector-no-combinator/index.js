import selectorParser from "postcss-selector-parser"
import {
  report,
  ruleMessages,
  validateOptions
} from "../../utils"

export const ruleName = "selector-no-combinator"

export const messages = ruleMessages(ruleName, {
  rejected: "Unexpected combinator",
})

export default function (o) {
  return (root, result) => {
    const validOptions = validateOptions(result, ruleName, {
      actual: o,
      possible: [],
    })
    if (!validOptions) { return }

    root.eachRule(rule => {
      selectorParser(selectorAST => {
        selectorAST.eachCombinator(() => {
          report({
            message: messages.rejected,
            node: rule,
            ruleName,
            result,
          })
        })
      })
        .process(rule.selector)
    })
  }
}
