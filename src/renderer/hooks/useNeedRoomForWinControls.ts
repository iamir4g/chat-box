import { useState } from 'react'

import platform from '@/platform'
import { useEffect } from 'react'

function useNeedRoomForWinControls() {
  const [needRoomForMacWindowControls, setNeedRoomForMacWindowControls] = useState(false)
  const [needRoomForWindowsWindowControls, setNeedRoomForWindowsWindowControls] = useState(false)
  useEffect(() => {
    platform.getPlatform().then((platform) => {
      setNeedRoomForMacWindowControls(platform === 'darwin')
      setNeedRoomForWindowsWindowControls(platform === 'win32' || platform === 'linux')
    })
  }, [])
  return { needRoomForMacWindowControls, needRoomForWindowsWindowControls }
}

export default useNeedRoomForWinControls
