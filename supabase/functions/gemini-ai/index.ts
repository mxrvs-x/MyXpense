Deno.serve(async (req) => {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API key" }), {
        status: 500,
      });
    }

    const res = await fetch(
      // ✅ USE MODEL FROM YOUR LIST
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    );

    const data = await res.json();

    console.log("Gemini raw:", JSON.stringify(data));

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        ?.join("") || null;

    if (!text) {
      return new Response(
        JSON.stringify({ error: "No response from Gemini", raw: data }),
        { status: 500 },
      );
    }

    return new Response(JSON.stringify({ response: text }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500 },
    );
  }
});
