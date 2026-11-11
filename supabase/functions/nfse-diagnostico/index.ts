// Diagnóstico do runtime: informa se o ambiente consegue abrir conexões TLS
// com certificado de cliente (mTLS), exigência do NFS-e Nacional.
Deno.serve(() => {
  const denoAny = Deno as unknown as {
    createHttpClient?: (options: unknown) => unknown;
    version?: { deno?: string };
  };

  const temCreateHttpClient = typeof denoAny.createHttpClient === "function";

  return new Response(
    JSON.stringify({
      deno: denoAny.version?.deno ?? "desconhecida",
      createHttpClient: temCreateHttpClient,
      fetchLength: typeof fetch,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
