import { BookmarkletImportPage } from "@/components/bookmarklet-import-page";

export default async function BookmarkletImportRoute({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const params = await searchParams;

  return <BookmarkletImportPage targetUrl={params.url?.trim() ?? ""} />;
}
