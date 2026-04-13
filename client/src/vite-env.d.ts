/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API origin (e.g. https://api.example.com). Omit to use same-origin / Vite proxy in dev. */
  readonly VITE_API_URL?: string;
  /** Cloudinary cloud name (public, client-side). */
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string;
  /** Unsigned upload preset name for the widget. */
  readonly VITE_CLOUDINARY_UPLOAD_PRESET?: string;
  /** 아임포트(PortOne) 고객사 식별코드 (미설정 시 기본 imp68362372). */
  readonly VITE_IAMPORT_IMP_CODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
