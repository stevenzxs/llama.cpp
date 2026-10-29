import { resolveLocale, translate } from '../../src/lib/utils/i18n';
import { describe, expect, it } from 'vitest';

describe('interface localization', () => {
	it('uses an explicit supported locale before browser preferences', () => {
		expect(resolveLocale('en', ['zh-CN'])).toBe('en');
		expect(resolveLocale('zh-CN', ['en-US'])).toBe('zh-CN');
	});

	it('detects Simplified Chinese and falls back to English', () => {
		expect(resolveLocale(null, ['zh-CN', 'en'])).toBe('zh-CN');
		expect(resolveLocale(null, ['zh-SG'])).toBe('zh-CN');
		expect(resolveLocale(null, ['en-US', 'zh-CN'])).toBe('en');
		expect(resolveLocale(null, ['zh-TW'])).toBe('en');
		expect(resolveLocale('invalid', ['fr-FR'])).toBe('en');
		expect(resolveLocale(null, [])).toBe('en');
	});

	it('translates interface text without changing unknown values', () => {
		expect(translate('zh-CN', 'New chat')).toBe('新建对话');
		expect(translate('en', 'New chat')).toBe('New chat');
		expect(translate('zh-CN', 'create_workbook')).toBe('create_workbook');
		expect(translate('zh-CN', 'constructor')).toBe('constructor');
	});

	it('interpolates parameters in either language', () => {
		expect(translate('zh-CN', 'Default: {value}', { value: 42 })).toBe('默认值：42');
		expect(translate('en', 'Default: {value}', { value: 42 })).toBe('Default: 42');
	});
});
