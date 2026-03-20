import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import {
  getDriveClient,
  getOrCreateBrandFolder,
  uploadFileToDrive,
} from "@/lib/google-drive";

// ─── GET /api/files — list shared files ───

export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const { searchParams } = new URL(req.url);
  const brandId = searchParams.get("brandId");
  const deliverableId = searchParams.get("deliverableId");
  const direction = searchParams.get("direction");

  const where: Record<string, unknown> = {};

  // Client users can only see their brands' files
  if (session.user.role === "CLIENT") {
    const clientBrands = await prisma.userBrandAccess.findMany({
      where: { userId: session.user.id },
      select: { brandId: true },
    });
    where.brandId = { in: clientBrands.map((b: { brandId: string }) => b.brandId) };
  }

  if (brandId) where.brandId = brandId;
  if (deliverableId) where.deliverableId = deliverableId;
  if (direction) where.direction = direction;

  const files = await prisma.sharedFile.findMany({
    where,
    include: {
      uploadedBy: { select: { name: true, role: true } },
      deliverable: { select: { id: true, platform: true, status: true } },
      brand: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(files);
}, { requireAuth: true });

// ─── POST /api/files — upload file to Drive + track in DB ───

export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const brandId = formData.get("brandId") as string | null;
  const deliverableId = (formData.get("deliverableId") as string) || null;
  const category = (formData.get("category") as string) || "general";
  const notes = (formData.get("notes") as string) || null;

  if (!file || !brandId) {
    return NextResponse.json(
      { error: "File and brandId required" },
      { status: 400 },
    );
  }

  // Determine direction based on user role
  const direction = session.user.role === "CLIENT" ? "from_client" : "to_client";

  // Get Drive access token from session
  const accessToken = (session as any).accessToken as string | undefined;
  if (!accessToken) {
    return NextResponse.json(
      {
        error:
          "Google Drive not connected. Please log out and log back in to grant Drive access.",
      },
      { status: 403 },
    );
  }

  const refreshToken = (session as any).refreshToken as string | undefined;
  const drive = getDriveClient(accessToken, refreshToken);

  // Get or create the brand folder
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  // Get client email for sharing
  const client = await prisma.client.findFirst({
    where: { brands: { some: { id: brandId } } },
    include: { user: { select: { email: true } } },
  });

  const brandFolderId = await getOrCreateBrandFolder(
    drive,
    brand.name,
    client?.user?.email ?? undefined,
  );

  // Upload to Drive
  const buffer = Buffer.from(await file.arrayBuffer());
  const driveFile = await uploadFileToDrive(
    drive,
    brandFolderId,
    file.name,
    file.type,
    buffer,
  );

  // Track in database
  const sharedFile = await prisma.sharedFile.create({
    data: {
      brandId,
      deliverableId: deliverableId || undefined,
      uploadedById: session.user.id,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      driveFileId: driveFile.id,
      driveFolderId: brandFolderId,
      viewUrl: driveFile.webViewLink,
      downloadUrl: driveFile.webContentLink,
      category,
      notes,
      direction,
    },
    include: {
      uploadedBy: { select: { name: true, role: true } },
      brand: { select: { name: true } },
    },
  });

  // Notify the other party
  const notifUserId =
    direction === "to_client"
      ? client?.userId // Notify client
      : (await prisma.user.findFirst({ where: { role: "ADMIN" } }))?.id;

  if (notifUserId) {
    await prisma.notification.create({
      data: {
        userId: notifUserId,
        type: "FILE_SHARED",
        title: `New file: ${file.name}`,
        message: `${session.user.name} shared "${file.name}" for ${brand.name}${notes ? ` — "${notes}"` : ""}`,
        link:
          direction === "to_client"
            ? "/files"
            : `/files?brandId=${brandId}`,
      },
    });
  }

  return NextResponse.json(sharedFile);
}, { requireAuth: true });
