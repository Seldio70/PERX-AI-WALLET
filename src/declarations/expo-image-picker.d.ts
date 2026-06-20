// Local shim so the project typechecks before `npm install expo-image-picker` runs.
// When the real package is installed, its bundled .d.ts files take precedence.
declare module "expo-image-picker" {
  export const MediaTypeOptions: {
    All: "All";
    Images: "Images";
    Videos: "Videos";
  };

  export interface ImagePickerAsset {
    uri: string;
    width?: number;
    height?: number;
    type?: string;
    fileName?: string | null;
  }

  export interface ImagePickerResult {
    canceled: boolean;
    assets?: ImagePickerAsset[] | null;
  }

  export interface ImagePickerOptions {
    mediaTypes?: "All" | "Images" | "Videos";
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    base64?: boolean;
  }

  export interface PermissionResponse {
    granted: boolean;
    canAskAgain?: boolean;
    status?: string;
  }

  export function requestMediaLibraryPermissionsAsync(): Promise<PermissionResponse>;
  export function launchImageLibraryAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
}
