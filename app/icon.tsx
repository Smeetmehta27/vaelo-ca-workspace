import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
          <polygon points="20,20 43,20 62,98" fill="#101111" />
          <polygon points="87,20 99,20 62,98" fill="#101111" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
