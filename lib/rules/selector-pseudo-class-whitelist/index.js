'use strict';

const _ = require('lodash');
const isStandardSyntaxRule = require('../../utils/isStandardSyntaxRule');
const matchesStringOrRegExp = require('../../utils/matchesStringOrRegExp');
const parseSelector = require('../../utils/parseSelector');
const postcss = require('postcss');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'selector-pseudo-class-whitelist';

const messages = ruleMessages(ruleName, {
	rejected: (selector) => `Unexpected pseudo-class "${selector}"`,
});

const rule = function(whitelist) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: whitelist,
			possible: [_.isString, _.isRegExp],
		});

		if (!validOptions) {
			return;
		}

		root.walkRules((rule) => {
			if (!isStandardSyntaxRule(rule)) {
				return;
			}

			const selector = rule.selector;

			if (!selector.includes(':')) {
				return;
			}

			parseSelector(selector, result, rule, (selectorTree) => {
				selectorTree.walkPseudos((pseudoNode) => {
					const value = pseudoNode.value;

					// Ignore pseudo-elements
					if (value.slice(0, 2) === '::') {
						return;
					}

					const name = value.slice(1);

					if (matchesStringOrRegExp(postcss.vendor.unprefixed(name), whitelist)) {
						return;
					}

					report({
						index: pseudoNode.sourceIndex,
						message: messages.rejected(name),
						node: rule,
						result,
						ruleName,
					});
				});
			});
		});
	};
};

rule.primaryOptionArray = true;

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
