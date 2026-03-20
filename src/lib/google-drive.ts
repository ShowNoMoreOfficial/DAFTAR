import { google } from "googleapis";

/**
 * Get an authenticated Drive client using user's OAuth tokens.
 */
export function getDriveClient(accessToken: string, refreshToken?: string) {
  const auth = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
    process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
  );

  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.drive({ version: "v3", auth });
}

type DriveClient = ReturnType<typeof getDriveClient>;

/**
 * Create a shared folder for a brand's client deliverables.
 * Returns the folder ID.
 */
export async function getOrCreateBrandFolder(
  drive: DriveClient,
  brandName: string,
  clientEmail?: string,
): Promise<string> {
  const folderName = `Daftar — ${brandName}`;

  // Check if folder already exists
  const existing = await drive.files.list({
    q: `name='${folderName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
    spaces: "drive",
  });

  if (existing.data.files && existing.data.files.length > 0) {
    return existing.data.files[0].id!;
  }

  // Create the folder
  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      description: `Shared deliverables for ${brandName} — managed by Daftar`,
    },
    fields: "id",
  });

  // Share with client if email provided
  if (clientEmail && folder.data.id) {
    await drive.permissions.create({
      fileId: folder.data.id,
      requestBody: {
        type: "user",
        role: "writer",
        emailAddress: clientEmail,
      },
      sendNotificationEmail: true,
    });
  }

  return folder.data.id!;
}

/**
 * Upload a file to a specific folder.
 */
export async function uploadFileToDrive(
  drive: DriveClient,
  folderId: string,
  fileName: string,
  mimeType: string,
  content: Buffer,
): Promise<{ id: string; webViewLink: string; webContentLink: string | null }> {
  const { Readable } = await import("stream");

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: Readable.from(content),
    },
    fields: "id, webViewLink, webContentLink, size, mimeType",
  });

  return {
    id: file.data.id!,
    webViewLink: file.data.webViewLink!,
    webContentLink: file.data.webContentLink || null,
  };
}

/**
 * List files in a folder.
 */
export async function listFolderFiles(
  drive: DriveClient,
  folderId: string,
): Promise<DriveFile[]> {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields:
      "files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, iconLink, owners)",
    orderBy: "createdTime desc",
    pageSize: 100,
  });

  return (res.data.files || []).map((f) => ({
    id: f.id!,
    name: f.name!,
    mimeType: f.mimeType!,
    size: parseInt(f.size || "0"),
    createdAt: f.createdTime!,
    updatedAt: f.modifiedTime!,
    viewUrl: f.webViewLink!,
    downloadUrl: f.webContentLink || "",
    thumbnailUrl: f.thumbnailLink || undefined,
    iconUrl: f.iconLink || undefined,
    owner: f.owners?.[0]?.emailAddress || "unknown",
  }));
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  viewUrl: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  iconUrl?: string;
  owner: string;
}

/**
 * Make a file publicly viewable and return the link.
 */
export async function makeFilePublic(
  drive: DriveClient,
  fileId: string,
): Promise<string> {
  await drive.permissions.create({
    fileId,
    requestBody: {
      type: "anyone",
      role: "reader",
    },
  });

  const file = await drive.files.get({
    fileId,
    fields: "webViewLink",
  });

  return file.data.webViewLink!;
}
