import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#101111',
        }}
      >
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width="180" height="180">
          <polygon points="20,20 43,20 62,98" fill="#FAFAFA" />
          <polygon points="87,20 99,20 62,98" fill="#FAFAFA" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
