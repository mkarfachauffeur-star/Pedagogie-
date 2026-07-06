import { test, expect } from '@playwright/test'

const RECETTE_PASSWORD = process.env.RECETTE_PASSWORD || 'Recette2026!'
const MANAGER_EMAIL = process.env.E2E_MANAGER_EMAIL || 'recette01.gerant@recette.pedagogia.local'
const STUDENT_EMAIL = process.env.E2E_STUDENT_EMAIL || 'recette01.eleve01@recette.pedagogia.local'

test.describe('Auth', () => {
  test('page login charge', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /connexion/i })).toBeVisible()
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible()
  })

  test('connexion gérant recette', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/e-mail|email/i).fill(MANAGER_EMAIL)
    await page.getByLabel(/^mot de passe$/i).fill(RECETTE_PASSWORD)
    await page.getByRole('button', { name: /connexion/i }).click()
    await page.waitForURL(/\/manager\//, { timeout: 30_000 })
    await expect(page).toHaveURL(/\/manager\//)
  })

  test('connexion élève recette', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/e-mail|email/i).fill(STUDENT_EMAIL)
    await page.getByLabel(/^mot de passe$/i).fill(RECETTE_PASSWORD)
    await page.getByRole('button', { name: /connexion/i }).click()
    await page.waitForURL(/\/student\//, { timeout: 30_000 })
    await expect(page).toHaveURL(/\/student\//)
  })

  test('mot de passe oublié self-service', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /mot de passe oublié/i }).click()
    await expect(page.getByText('Un lien sécurisé sera envoyé')).toBeVisible()
    await page.locator('input[type="email"]').first().fill('test@gmail.com')
    await page.getByRole('button', { name: /envoyer le lien/i }).click()
    await expect(page.getByText(/e-mail avec un lien/i)).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('Routes publiques', () => {
  for (const path of ['/', '/blog', '/contact', '/mentions-legales', '/politique-confidentialite', '/cgu', '/cgv', '/cookies']) {
    test(`${path} HTTP 200`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res?.status()).toBeLessThan(400)
    })
  }
})

test.describe('SEO', () => {
  test('viewport et title', async ({ page }) => {
    await page.goto('/')
    const viewport = page.locator('meta[name="viewport"]')
    await expect(viewport).toHaveCount(1)
    await expect(page).toHaveTitle(/Pedagogia/i)
  })
})
