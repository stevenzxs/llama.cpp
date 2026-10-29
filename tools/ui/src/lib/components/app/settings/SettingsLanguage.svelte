<script lang="ts">
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select';
	import { localeStore, t } from '$lib/stores/locale.svelte';
</script>

<div class="mb-6 space-y-2">
	<Label for="interface-language">{t('Language')}</Label>

	<Select.Root
		onValueChange={(value) => {
			if (value === 'en' || value === 'zh-CN') localeStore.setLocale(value);
		}}
		type="single"
		value={localeStore.locale}
	>
		<Select.Trigger class="w-full" id="interface-language">
			{localeStore.locale === 'zh-CN' ? '简体中文' : 'English'}
		</Select.Trigger>

		<Select.Content>
			<Select.Item value="en">English</Select.Item>

			<Select.Item value="zh-CN">简体中文</Select.Item>
		</Select.Content>
	</Select.Root>

	<p class="text-xs text-muted-foreground">{t('Interface language is saved automatically.')}</p>
</div>
