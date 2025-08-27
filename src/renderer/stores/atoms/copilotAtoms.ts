import { atomWithStorage } from 'jotai/utils'
import { CopilotDetail } from '../../../shared/types' // Need this import
import storage, { StorageKey } from '../../storage'
import { atom } from 'jotai' // Need this import for openCopilotDialogAtom

// myCopilots
export const myCopilotsAtom = atomWithStorage<CopilotDetail[]>(StorageKey.MyCopilots, [], storage)

// Related UI state, moved here for proximity to copilots
export const openCopilotDialogAtom = atom(false) // 是否展示copilot窗口 