import { zhCN } from '../constants/locales/zh-CN';

export type Locale = 'en' | 'zh-CN';

export function resolveLocale(saved: string | null, languages: readonly string[]): Locale {
	if (saved === 'en' || saved === 'zh-CN') return saved;

	for (const language of languages) {
		if (/^zh(?:-(?:CN|SG|Hans)(?:-|$)|$)/i.test(language)) return 'zh-CN';

		if (/^en(?:-|$)/i.test(language)) return 'en';
	}

	return 'en';
}

export function translate(
	locale: Locale,
	text: string,
	parameters: Record<string, string | number> = {}
): string {
	const translated = locale === 'zh-CN' && Object.hasOwn(zhCN, text) ? zhCN[text] : text;

	return translated.replace(/\{(\w+)\}/g, (match, key: string) =>
		Object.hasOwn(parameters, key) ? String(parameters[key]) : match
	);
}
