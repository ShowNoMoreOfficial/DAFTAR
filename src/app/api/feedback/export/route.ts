import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (_req, { session }) => {
  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  const feedbacks = await prisma.teamFeedback.findMany({
    where: { status: "NEW" },
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });

  let markdown = `# DAFTAR Team Feedback Report\n`;
  markdown += `Generated: ${new Date().toISOString()}\n`;
  markdown += `Total new items: ${feedbacks.length}\n\n`;

  const grouped = {
    bug: feedbacks.filter((f) => f.type === "bug"),
    suggestion: feedbacks.filter((f) => f.type === "suggestion"),
    content_quality: feedbacks.filter((f) => f.type === "content_quality"),
    ux_issue: feedbacks.filter((f) => f.type === "ux_issue"),
  };

  for (const [type, items] of Object.entries(grouped)) {
    if (items.length === 0) continue;
    markdown += `## ${type.toUpperCase()} (${items.length})\n\n`;
    for (const item of items) {
      markdown += `### ${item.user.name} — ${item.page}\n`;
      markdown += `${item.message}\n`;
      if (item.rating) markdown += `Rating: ${item.rating}/5\n`;
      markdown += `Date: ${item.createdAt.toISOString()}\n\n`;
    }
  }

  return new Response(markdown, {
    headers: { "Content-Type": "text/markdown" },
  });
});
