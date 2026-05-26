function normalizeText(input: string) {
  return input.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

function deriveTitle(originalUrl: string, content: string) {
  const firstLine = content
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) {
    return originalUrl;
  }

  return firstLine.replace(/^#+\s*/, "").replace(/^Title:\s*/i, "").trim() || originalUrl;
}

export async function importFromUrl(originalUrl: string) {
  const jinaUrl = `https://r.jina.ai/${originalUrl}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    console.log("[Jina] 请求URL:", jinaUrl);

    const response = await fetch(jinaUrl, {
      signal: controller.signal,
      redirect: "follow",
    });

    console.log("[Jina] 状态码:", response.status);

    if (!response.ok) {
      console.log("[Jina] 失败原因:", "非 200 状态码");
      throw new Error("链接内容无法自动解析，请改用手动粘贴正文继续导入");
    }

    const content = normalizeText(await response.text());
    console.log("[Jina] 内容长度:", content.length, "前100字:", content.slice(0, 100));

    if (content.length < 100) {
      console.log("[Jina] 失败原因:", "返回内容少于 100 个字符");
      throw new Error("链接内容无法自动解析，请改用手动粘贴正文继续导入");
    }

    return {
      title: deriveTitle(originalUrl, content),
      contentText: content,
      contentMarkdown: content,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log("[Jina] 失败原因:", "请求超时或被中止");
    } else if (error instanceof Error) {
      console.log("[Jina] 失败原因:", error.message);
    } else {
      console.log("[Jina] 失败原因:", "未知错误");
    }
    throw new Error("链接内容无法自动解析，请改用手动粘贴正文继续导入");
  } finally {
    clearTimeout(timeout);
  }
}
