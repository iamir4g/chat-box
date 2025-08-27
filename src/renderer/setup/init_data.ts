import { initSessionsIfNeeded } from '../stores/sessionStorageMutations'

export async function initData() {
  await initSessionsIfNeeded()
}
