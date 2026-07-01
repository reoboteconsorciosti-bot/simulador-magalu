'use server'

import { clearCurrentSession } from './auth'

export async function logoutAction() {
  await clearCurrentSession()
}
