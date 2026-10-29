import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const url = process.env.UI_TEST_URL ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];

try {
	const context = await browser.newContext({
		locale: 'zh-CN',
		viewport: { height: 1000, width: 1440 }
	});
	const page = await context.newPage();

	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto(url);
	await page.getByText('你好', { exact: true }).waitFor();
	assert.equal(await page.locator('html').getAttribute('lang'), 'zh-CN');
	console.log('Chinese greeting and document language verified.');
	console.log((await page.locator('body').innerText()).slice(0, 3500));
	await page.getByRole('button', { exact: true, name: '设置' }).click();
	await page.getByText('界面语言', { exact: true }).waitFor();
	await page.locator('#interface-language').click();
	await page.getByRole('option', { exact: true, name: 'English' }).click();
	await page.getByText('Language', { exact: true }).waitFor();
	assert.equal(await page.locator('html').getAttribute('lang'), 'en');
	assert.equal(await page.evaluate(() => localStorage.getItem('LlamaUi.locale')), 'en');
	await page.reload();
	await page.getByRole('button', { exact: true, name: 'Settings' }).click();
	await page.getByText('Language', { exact: true }).waitFor();
	console.log('English switching and reload persistence verified.');
	await page.locator('#interface-language').click();
	await page.getByRole('option', { exact: true, name: '简体中文' }).click();
	await page.getByText('界面语言', { exact: true }).waitFor();
	console.log((await page.locator('body').innerText()).slice(0, 5000));
	await page.screenshot({ fullPage: true, path: 'test-results/i18n-settings-zh.png' });
	await page.keyboard.press('Escape');
	await page.getByRole('button', { name: /MCP/ }).first().click();
	console.log('MCP dialog:', (await page.locator('body').innerText()).slice(0, 2000));
	await page.keyboard.press('Escape');
	await page.getByRole('button', { exact: true, name: '设置' }).click();
	await page.setViewportSize({ height: 844, width: 390 });
	await page.getByText('界面语言', { exact: true }).waitFor();
	await page.waitForTimeout(500);
	assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
	await page.screenshot({ fullPage: true, path: 'test-results/i18n-settings-mobile.png' });
	assert.deepEqual(errors, []);
	console.log('Mobile layout and absence of browser runtime errors verified.');
} finally {
	await browser.close();
}
