'use strict';

const _ = require('lodash');
const declarationValueIndex = require('../../utils/declarationValueIndex');
const isNumbery = require('../../utils/isNumbery');
const isStandardSyntaxValue = require('../../utils/isStandardSyntaxValue');
const isVariable = require('../../utils/isVariable');
const keywordSets = require('../../reference/keywordSets');
const matchesStringOrRegExp = require('../../utils/matchesStringOrRegExp');
const postcss = require('postcss');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'font-weight-notation';

const messages = ruleMessages(ruleName, {
	expected: (type) => `Expected ${type} font-weight notation`,
	invalidNamed: (name) => `Unexpected invalid font-weight name "${name}"`,
});

const NORMAL_KEYWORD = 'normal';
const WEIGHTS_WITH_KEYWORD_EQUIVALENTS = ['400', '700'];

const rule = function(expectation, options) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: expectation,
				possible: ['numeric', 'named-where-possible'],
			},
			{
				actual: options,
				possible: {
					ignoreValues: [_.isString, _.isRegExp],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		root.walkDecls((decl) => {
			if (decl.prop.toLowerCase() === 'font-weight') {
				checkWeight(decl.value, decl);
			}

			if (decl.prop.toLowerCase() === 'font') {
				checkFont(decl);
			}
		});

		function checkFont(decl) {
			const valueList = postcss.list.space(decl.value);
			// We do not need to more carefully distinguish font-weight
			// numbers from unitless line-heights because line-heights in
			// `font` values need to be part of a font-size/line-height pair
			const hasNumericFontWeight = valueList.some(isNumbery);

			for (const value of postcss.list.space(decl.value)) {
				const valueLower = value.toLowerCase();
				const isNormalKeyword = valueLower === NORMAL_KEYWORD;

				if (
					(isNormalKeyword && !hasNumericFontWeight) ||
					isNumbery(value) ||
					(!isNormalKeyword && keywordSets.fontWeightKeywords.has(valueLower))
				) {
					checkWeight(value, decl);

					return;
				}
			}
		}

		function checkWeight(weightValue, decl) {
			if (!isStandardSyntaxValue(weightValue)) {
				return;
			}

			if (isVariable(weightValue)) {
				return;
			}

			if (keywordSets.basicKeywords.has(weightValue.toLowerCase())) {
				return;
			}

			const ignoreValues = (options && options.ignoreValues) || [];

			if (
				ignoreValues.length > 0 &&
				matchesStringOrRegExp(weightValue.toLowerCase(), ignoreValues)
			) {
				return;
			}

			const weightValueOffset = decl.value.indexOf(weightValue);

			if (expectation === 'numeric') {
				if (decl.parent.type === 'atrule' && decl.parent.name.toLowerCase() === 'font-face') {
					const weightValueNumbers = postcss.list.space(weightValue);

					if (!weightValueNumbers.every(isNumbery)) {
						return complain(messages.expected('numeric'));
					}

					return;
				}

				if (!isNumbery(weightValue)) {
					return complain(messages.expected('numeric'));
				}
			}

			if (expectation === 'named-where-possible') {
				if (isNumbery(weightValue)) {
					if (WEIGHTS_WITH_KEYWORD_EQUIVALENTS.includes(weightValue)) {
						complain(messages.expected('named'));
					}

					return;
				}

				if (
					!keywordSets.fontWeightKeywords.has(weightValue.toLowerCase()) &&
					weightValue.toLowerCase() !== NORMAL_KEYWORD
				) {
					return complain(messages.invalidNamed(weightValue));
				}

				return;
			}

			function complain(message) {
				report({
					ruleName,
					result,
					message,
					node: decl,
					index: declarationValueIndex(decl) + weightValueOffset,
				});
			}
		}
	};
};

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
