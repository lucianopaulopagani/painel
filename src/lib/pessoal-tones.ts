/**
 * Cores das listas suspensas do departamento Pessoal.
 *
 * Mesmo padrão em todos os módulos: OK e Enviado em verde, Não Possui em azul,
 * Possui em vermelho, Pendente em vermelho, Em Andamento em âmbar e Desativado
 * no tom neutro.
 */

const GREEN =
  "bg-status-success text-status-success-foreground hover:bg-status-success/90";
const BLUE =
  "bg-status-info text-status-info-foreground hover:bg-status-info/90";
const RED =
  "bg-status-danger text-status-danger-foreground hover:bg-status-danger/90";
const AMBER =
  "bg-status-warning text-status-warning-foreground hover:bg-status-warning/90";
const NEUTRAL = "bg-muted text-muted-foreground hover:bg-muted/80";

/** Colunas de marcação: OK, Não Possui e Possui. */
export const PESSOAL_FLAG_TONE: Record<string, string> = {
  OK: GREEN,
  "Não Possui": BLUE,
  Possui: RED,
};

/** Coluna Status. */
export const PESSOAL_STATUS_TONE: Record<string, string> = {
  Concluído: GREEN,
  Pendente: RED,
  "Em Andamento": AMBER,
  "Em Ajuste": "bg-primary/10 text-primary hover:bg-primary/15",
  Desativado: NEUTRAL,
  "Sem Movimento": NEUTRAL,
};

/** Cores dos cartões do dashboard por status (mesmos tons, sem hover). */
export const PESSOAL_STATUS_CARD_TONE: Record<string, string> = {
  Concluído: "bg-status-success text-status-success-foreground",
  Pendente: "bg-status-danger text-status-danger-foreground",
  "Em Andamento": "bg-status-warning text-status-warning-foreground",
  "Em Ajuste": "bg-primary/10 text-primary",
  "Sem Movimento": "bg-muted text-muted-foreground",
};

/** Coluna Envio (e marcações simples como Enviado). */
export const PESSOAL_ENVIO_TONE: Record<string, string> = {
  Enviado: GREEN,
  Pendente: RED,
  Desativado: NEUTRAL,
};

/** Cores dos cartões do dashboard por Envio (mesmos tons, sem hover). */
export const PESSOAL_ENVIO_CARD_TONE: Record<string, string> = {
  Enviado: "bg-status-success text-status-success-foreground",
  Pendente: "bg-status-danger text-status-danger-foreground",
  Desativado: "bg-muted text-muted-foreground",
};
