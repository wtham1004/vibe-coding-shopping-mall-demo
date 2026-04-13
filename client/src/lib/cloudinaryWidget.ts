const SCRIPT_SRC =
  'https://upload-widget.cloudinary.com/latest/global/all.js'

let scriptPromise: Promise<void> | null = null

function loadCloudinaryScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window is not available'))
  }
  if (window.cloudinary?.createUploadWidget) {
    return Promise.resolve()
  }
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => {
      scriptPromise = null
      reject(new Error('Cloudinary 스크립트 로드 실패'))
    }
    document.body.appendChild(s)
  })
  return scriptPromise
}

export function getCloudinaryEnv(): {
  cloudName: string | undefined
  uploadPreset: string | undefined
} {
  return {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  }
}

/**
 * Cloudinary Upload Widget을 열고, 업로드 성공 시 `secure_url`을 콜백으로 전달합니다.
 */
export async function openCloudinaryUploadWidget(
  onSuccess: (secureUrl: string) => void,
  onError?: (message: string) => void,
): Promise<void> {
  const { cloudName, uploadPreset } = getCloudinaryEnv()
  if (!cloudName?.trim() || !uploadPreset?.trim()) {
    onError?.(
      'VITE_CLOUDINARY_CLOUD_NAME 또는 VITE_CLOUDINARY_UPLOAD_PRESET이 설정되지 않았습니다.',
    )
    return
  }

  try {
    await loadCloudinaryScript()
  } catch (e) {
    onError?.(e instanceof Error ? e.message : '스크립트를 불러오지 못했습니다.')
    return
  }

  const api = window.cloudinary
  if (!api?.createUploadWidget) {
    onError?.('Cloudinary 위젯 API를 찾을 수 없습니다.')
    return
  }

  const widget = api.createUploadWidget(
    { cloudName: cloudName.trim(), uploadPreset: uploadPreset.trim() },
    (error, result) => {
      if (error) {
        const msg =
          typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as { message: unknown }).message === 'string'
            ? (error as { message: string }).message
            : String(error)
        onError?.(msg)
        return
      }
      if (result?.event === 'success' && result.info?.secure_url) {
        onSuccess(result.info.secure_url)
        widget.close()
      }
    },
  )
  widget.open()
}
