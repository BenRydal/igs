import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const fixtures = join(fileURLToPath(new URL('.', import.meta.url)), '../fixtures')

export default async function (ctx) {
  const { page } = ctx
  await ctx.open('/')
  await ctx.openPanel('Data')
  await page.getByRole('button', { name: 'Import files' }).click()
  const dialog = page.getByRole('dialog', { name: 'Import Data' })
  await dialog.waitFor()
  ctx.check(
    await dialog.getByRole('button', { name: 'Import', exact: true }).isDisabled(),
    'Import is disabled with no files'
  )
  await ctx.shot('import-dialog-empty')

  await page
    .locator('input[type=file]')
    .setInputFiles([join(fixtures, 'alex.csv'), join(fixtures, 'talk.csv')])
  await ctx.shot('import-dialog-files-chosen')
  ctx.check(await dialog.getByText('alex.csv').isVisible(), 'alex.csv listed')
  ctx.check(await dialog.getByText('talk.csv').isVisible(), 'talk.csv listed')
  await dialog.getByRole('button', { name: 'Import 2 files' }).click()
  await dialog.waitFor({ state: 'hidden' })
  await page.waitForTimeout(800)
  await ctx.shot('imported')

  const panel = page.getByRole('tabpanel', { name: 'Data panel' })
  ctx.check(
    await panel.getByText('Movement', { exact: true }).isVisible(),
    'Movement row listed after import'
  )
  ctx.check(
    await panel.getByText('Conversation', { exact: true }).isVisible(),
    'Conversation row listed after import'
  )
  await ctx.openPanel('People')
  await ctx.shot('people-after-import')
  ctx.check(
    await page.getByRole('button', { name: 'alex', exact: true }).isVisible(),
    'person named from the file name'
  )
  ctx.check(
    await page.getByRole('button', { name: 'sam', exact: true }).isVisible(),
    'speaker without a movement file becomes a person'
  )
  ctx.noPageErrors()
}
