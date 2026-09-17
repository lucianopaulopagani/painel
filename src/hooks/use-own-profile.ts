import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/** Redimensiona a imagem para data URL (avatar pequeno, ~160px). */
export function fileToDataUrl(
  file: File,
  maxSize = 160
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Imagem inválida."));
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível processar a imagem."));
          return;
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/** Atualiza o próprio perfil (nome e foto). */
export function useUpdateOwnProfile() {
  return useMutation({
    mutationFn: async ({
      full_name,
      avatar_url,
    }: {
      full_name?: string;
      avatar_url?: string;
    }) => {
      const { data, error } = await supabase.rpc("update_own_profile", {
        full_name: full_name ?? null,
        avatar_url: avatar_url ?? null,
      });
      if (error) throw error;
      if (data === false) throw new Error("Não foi possível atualizar o perfil.");
    },
  });
}

/** Altera a própria senha (sessão autenticada). */
export function useChangeOwnPassword() {
  return useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
  });
}
