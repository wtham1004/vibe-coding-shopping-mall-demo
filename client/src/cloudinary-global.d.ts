export {}

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: { cloudName: string; uploadPreset: string },
        callback: (
          error: unknown,
          result: { event: string; info?: { secure_url?: string } },
        ) => void,
      ) => { open: () => void; destroy: () => void; close: () => void }
    }
  }
}
