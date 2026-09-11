import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "fiscal:mes-referencia";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function readStoredMonth(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? currentMonth();
  } catch {
    return currentMonth();
  }
}

export function MovimentoFiscal() {
  const [mes, setMes] = useState<string>(readStoredMonth);

  const handleChange = (value: string) => {
    setMes(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // armazenamento indisponível — mantém apenas em memória
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Movimento Fiscal</h2>
        <p className="text-sm text-muted-foreground">
          Mês de referência das informações fiscais.
        </p>
      </div>

      <div className="max-w-xs">
        <Label htmlFor="mes-referencia">Mês de referência</Label>
        <Input
          id="mes-referencia"
          type="month"
          value={mes}
          onChange={(e) => handleChange(e.target.value)}
          className="mt-1.5"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Pode ser digitado ou escolhido. O último mês informado fica fixo
          (salvo neste dispositivo).
        </p>
      </div>
    </div>
  );
}
