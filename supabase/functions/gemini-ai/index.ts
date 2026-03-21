Deno.serve(async (req) => {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
      });
    }

    const apiKey = Deno.env.get("AIzaSyC--A03NkYdBMIMTUYgHqiIOkdlUsgbYeE");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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

    // 🔥 Extract text properly
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

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
    console.error("Function error:", err);

    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500 },
    );
  }
});
