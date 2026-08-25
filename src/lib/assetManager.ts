import { saveAsset, getAssetPath } from "./tauri";

export const handleAssetSave = async (id: string, data: string, mimeType: string) => {
  return await saveAsset(id, data, mimeType);
};

export const handleAssetLoad = async (id: string) => {
  return await getAssetPath(id);
};
