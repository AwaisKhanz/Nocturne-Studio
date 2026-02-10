import { NextResponse } from "next/server";

type Provider = "openai" | "google" | "xai";

type ModelConfig = {
  provider: Provider;
  apiModel: string;
};

const MODEL_MAP: Record<string, ModelConfig> = {
  "openai-gpt-image-1": { provider: "openai", apiModel: "gpt-image-1" },
  "gemini-2.5-flash-image": {
    provider: "google",
    apiModel: "gemini-2.5-flash-image",
  },
  "grok-imagine-image": {
    provider: "xai",
    apiModel: "grok-imagine-image",
  },
};

type ImagePayload = {
  id: string;
  src: string;
  alt: string;
};

async function generateWithOpenAI({
  prompt,
  apiKey,
  model,
}: {
  prompt: string;
  apiKey: string;
  model: string;
}): Promise<ImagePayload> {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: "1024x1024",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(errorText || "OpenAI image generation failed.") as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  const data = (await response.json()) as {
    data?: { b64_json?: string; url?: string }[];
  };
  const item = data.data?.[0];
  const src = item?.b64_json
    ? `data:image/png;base64,${item.b64_json}`
    : item?.url || "";

  if (!src) {
    throw new Error("OpenAI did not return image data.");
  }

  return {
    id: `${Date.now()}-0`,
    src,
    alt: `${prompt} image`,
  };
}

async function generateWithGemini({
  prompt,
  apiKey,
  model,
}: {
  prompt: string;
  apiKey: string;
  model: string;
}): Promise<ImagePayload> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(errorText || "Gemini image generation failed.") as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  const data = (await response.json()) as {
    candidates?: {
      content?: {
        parts?: {
          inlineData?: { data?: string; mimeType?: string };
          inline_data?: { data?: string; mime_type?: string };
        }[];
      };
    }[];
  };

  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(
    (part) => part.inlineData?.data || part.inline_data?.data
  );
  const inline = imagePart?.inlineData || imagePart?.inline_data;

  if (!inline?.data) {
    throw new Error("Gemini did not return image data.");
  }

  const mimeType = 
    ('mimeType' in inline ? inline.mimeType : undefined) || 
    ('mime_type' in inline ? inline.mime_type : undefined) || 
    "image/png";
  
  return {
    id: `${Date.now()}-0`,
    src: `data:${mimeType};base64,${inline.data}`,
    alt: `${prompt} image`,
  };
}

async function generateWithXAI({
  prompt,
  apiKey,
  model,
}: {
  prompt: string;
  apiKey: string;
  model: string;
}): Promise<ImagePayload> {
  const response = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(errorText || "Grok image generation failed.") as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  const data = (await response.json()) as {
    data?: { b64_json?: string; url?: string }[];
  };
  const item = data.data?.[0];
  const src = item?.b64_json
    ? `data:image/png;base64,${item.b64_json}`
    : item?.url || "";

  if (!src) {
    throw new Error("Grok did not return image data.");
  }

  return {
    id: `${Date.now()}-0`,
    src,
    alt: `${prompt} image`,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      prompt?: string;
      model?: string;
      apiKey?: string;
    };

    const prompt = body.prompt?.trim();
    const modelId = body.model?.trim() || "";
    const config = MODEL_MAP[modelId];

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    if (!config) {
      return NextResponse.json(
        { error: "Selected model is not supported yet." },
        { status: 400 }
      );
    }

    const apiKey = body.apiKey?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required for this model." },
        { status: 401 }
      );
    }

    const image =
      config.provider === "openai"
        ? await generateWithOpenAI({ prompt, apiKey, model: config.apiModel })
        : config.provider === "xai"
          ? await generateWithXAI({ prompt, apiKey, model: config.apiModel })
          : await generateWithGemini({ prompt, apiKey, model: config.apiModel });

    return NextResponse.json({ model: modelId, image });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      typeof error === "object" && error && "status" in error
        ? Number((error as { status?: number }).status) || 500
        : 500;
    const safeStatus = status >= 400 && status < 600 ? status : 500;
    return NextResponse.json({ error: message }, { status: safeStatus });
  }
}
