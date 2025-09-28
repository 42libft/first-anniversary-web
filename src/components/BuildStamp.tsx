import { APP_BUILD_ID } from '../constants/build'

export const BuildStamp = () => (
  <div
    style={{
      position: 'fixed',
      left: 8,
      top: 8,
      fontSize: 10,
      opacity: 0.6,
      pointerEvents: 'none',
      zIndex: 99,
      color: '#cdd7ff',
    }}
  >
    build: {APP_BUILD_ID}
  </div>
)

