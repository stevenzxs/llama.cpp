import { browser } from '$app/environment';
import { LOCALE_LOCALSTORAGE_KEY } from '$lib/constants/storage.constants';
import { type Locale, resolveLocale, translate } from '$lib/utils/i18n';

class LocaleStore {
	locale = $state<Locale>('en');

	initialize(): void {
		if (!browser) return;

		let saved: string | null = null;

		try {
			saved = localStorage.getItem(LOCALE_LOCALSTORAGE_KEY);
		} catch {
			// Browser storage can be disabled.
		}
		this.locale = resolveLocale(saved, navigator.languages);
		document.documentElement.lang = this.locale;
	}

	setLocale(locale: Locale): void {
		this.locale = locale;

		if (!browser) return;

		document.documentElement.lang = locale;
		try {
			localStorage.setItem(LOCALE_LOCALSTORAGE_KEY, locale);
		} catch {
			// Keep the selection for this session if storage is unavailable.
		}
	}

	t(text: string, parameters?: Record<string, string | number>): string {
		return translate(this.locale, text, parameters);
	}
}

export const localeStore = new LocaleStore();
export const t = (text: string, parameters?: Record<string, string | number>): string =>
	localeStore.t(text, parameters);
