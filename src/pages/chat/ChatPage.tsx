import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  Loader2,
  MessageSquarePlus,
  Paperclip,
  Search,
  Send,
  Settings,
  Smile,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { cn, getInitials } from "@/lib/utils";
import {
  useAddGroupMember,
  useAllChatMessages,
  useChatConversations,
  useChatHeartbeat,
  useChatMessages,
  useChatPresence,
  useChatRealtime,
  useChatUsers,
  useCreateGroup,
  useMarkConversationRead,
  useRemoveGroupMember,
  useSendMessage,
  useStartDirectChat,
  useUpdateGroup,
  type ChatConversationRow,
  type ChatMessageRow,
} from "./use-chat";

const EMOJIS = ["😀", "😅", "🙏", "👍", "✅", "📌", "📄", "⏰", "📊", "🎉", "🚀", "❗"];
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

function formatTime(value: string): string {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

function formatDay(value: string): string {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Hoje";
  return date.toLocaleDateString("pt-BR");
}

export default function ChatPage() {
  const { profile } = useAuth();
  useDocumentTitle("WebChat P4");
  const myId = profile?.id ?? "";
  const isManager = profile?.role === "admin" || profile?.chat_admin === true;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [typingConv, setTypingConv] = useState<string | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<number | null>(null);

  const { data: users } = useChatUsers();
  const { data: conversations, isLoading: loadingConversations } =
    useChatConversations();
  const { data: allMessages } = useAllChatMessages();
  const { data: presence } = useChatPresence();

  const sendMessage = useSendMessage();
  const startDirect = useStartDirectChat();
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const addMember = useAddGroupMember();
  const removeMember = useRemoveGroupMember();
  const markRead = useMarkConversationRead();

  useChatRealtime(activeId);
  useChatHeartbeat(myId, typingConv);

  const userById = useMemo(
    () => new Map((users ?? []).map((user) => [user.id, user])),
    [users]
  );

  const presenceById = useMemo(
    () => new Map((presence ?? []).map((row) => [row.profile_id, row])),
    [presence]
  );

  const isOnline = (profileId: string): boolean => {
    const row = presenceById.get(profileId);
    if (!row) return false;
    return Date.now() - new Date(row.last_seen_at).getTime() < 2 * 60 * 1000;
  };

  const conversationTitle = (conversation: ChatConversationRow): string => {
    if (conversation.type === "group") return conversation.name ?? "Grupo";
    const other = (conversation.chat_members ?? []).find(
      (member) => member.profile_id !== myId
    );
    return other ? userById.get(other.profile_id)?.full_name ?? "Colega" : "Conversa";
  };

  const conversationAvatar = (conversation: ChatConversationRow) => {
    if (conversation.type === "group") return null;
    const other = (conversation.chat_members ?? []).find(
      (member) => member.profile_id !== myId
    );
    return other ? userById.get(other.profile_id)?.avatar_url ?? null : null;
  };

  const myLastRead = (conversation: ChatConversationRow): string | null =>
    (conversation.chat_members ?? []).find(
      (member) => member.profile_id === myId
    )?.last_read_at ?? null;

  const lastMessageOf = (conversationId: string): ChatMessageRow | undefined =>
    (allMessages ?? []).find(
      (message) => message.conversation_id === conversationId
    );

  const unreadCount = (conversation: ChatConversationRow): number => {
    const lastRead = myLastRead(conversation);
    return (allMessages ?? []).filter(
      (message) =>
        message.conversation_id === conversation.id &&
        message.sender_id !== myId &&
        (!lastRead || message.created_at > lastRead)
    ).length;
  };

  const sortedConversations = useMemo(() => {
    const list = (conversations ?? []).filter((conversation) =>
      conversationTitle(conversation)
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    );
    return list.sort((a, b) => {
      const aLast = lastMessageOf(a.id)?.created_at ?? a.created_at;
      const bLast = lastMessageOf(b.id)?.created_at ?? b.created_at;
      return bLast.localeCompare(aLast);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, allMessages, search, myId, userById]);

  const activeConversation =
    (conversations ?? []).find((conversation) => conversation.id === activeId) ??
    null;

  const { data: activeMessages, isLoading: loadingMessages } =
    useChatMessages(activeId);

  // Marca como lida ao abrir a conversa / receber mensagem.
  useEffect(() => {
    if (!activeId || !myId) return;
    markRead.mutate({ conversationId: activeId, profileId: myId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, myId, activeMessages?.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages?.length, activeId]);

  const typingName = (conversation: ChatConversationRow): string | null => {
    const now = Date.now();
    for (const member of conversation.chat_members ?? []) {
      if (member.profile_id === myId) continue;
      const row = presenceById.get(member.profile_id);
      if (
        row?.typing_conversation_id === conversation.id &&
        row.typing_at &&
        now - new Date(row.typing_at).getTime() < 6000
      ) {
        return userById.get(member.profile_id)?.full_name ?? "Alguém";
      }
    }
    return null;
  };

  const isReadByOthers = (message: ChatMessageRow): boolean => {
    if (!activeConversation) return false;
    return (activeConversation.chat_members ?? []).some(
      (member) =>
        member.profile_id !== myId &&
        member.last_read_at !== null &&
        member.last_read_at >= message.created_at
    );
  };

  const handleTextChange = (value: string) => {
    setText(value);
    if (!activeId) return;
    setTypingConv(activeId);
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => setTypingConv(null), 3000);
  };

  const handleSend = () => {
    if (!activeId || !myId) return;
    if (!text.trim() && !attachment) return;
    sendMessage.mutate(
      {
        conversation_id: activeId,
        sender_id: myId,
        body: text.trim() || null,
        attachment_url: attachment?.url ?? null,
        attachment_name: attachment?.name ?? null,
        attachment_type: attachment?.type ?? null,
      },
      {
        onSuccess: () => {
          setText("");
          setAttachment(null);
          setTypingConv(null);
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : "Erro ao enviar."
          ),
      }
    );
  };

  const handleAttachment = (file: File) => {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("Arquivo muito grande (máximo 2 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setAttachment({
        url: String(reader.result),
        name: file.name,
        type: file.type || "application/octet-stream",
      });
    reader.readAsDataURL(file);
  };

  const handleStartDirect = (otherId: string) => {
    startDirect.mutate(
      { myId, otherId },
      {
        onSuccess: (id) => {
          setActiveId(id);
          setNewChatOpen(false);
        },
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "Erro ao abrir."),
      }
    );
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast.error("Informe o nome do grupo.");
      return;
    }
    createGroup.mutate(
      {
        myId,
        name: groupName.trim(),
        description: groupDescription.trim(),
        memberIds: groupMembers,
      },
      {
        onSuccess: (id) => {
          setActiveId(id);
          setNewGroupOpen(false);
          setGroupName("");
          setGroupDescription("");
          setGroupMembers([]);
          toast.success("Grupo criado.");
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : "Erro ao criar grupo."
          ),
      }
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Lista de conversas */}
      <aside className="flex w-full max-w-sm flex-col border-r bg-card/40 sm:w-80">
        <div className="flex items-center gap-2 border-b p-3">
          <Avatar className="h-9 w-9">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} />
            ) : null}
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              {getInitials(profile?.full_name ?? "?")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">
              {profile?.full_name}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
              online
              {isManager && (
                <Badge variant="secondary" className="ml-1 text-[10px]">
                  Gestor
                </Badge>
              )}
            </div>
          </div>
          {isManager && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Criar grupo (gestores)"
              onClick={() => setNewGroupOpen(true)}
            >
              <Users className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Nova conversa"
            onClick={() => setNewChatOpen(true)}
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        </div>

        <div className="border-b p-2">
          <div className="flex items-center gap-2 rounded-md border px-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar conversa"
              className="h-8 w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sortedConversations.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Nenhuma conversa ainda. Use o ícone de nova conversa para começar.
            </p>
          ) : (
            <ul>
              {sortedConversations.map((conversation) => {
                const last = lastMessageOf(conversation.id);
                const unread = unreadCount(conversation);
                const typing = typingName(conversation);
                const avatar = conversationAvatar(conversation);
                const other = (conversation.chat_members ?? []).find(
                  (member) => member.profile_id !== myId
                );
                const online =
                  conversation.type === "direct" && other
                    ? isOnline(other.profile_id)
                    : false;
                return (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(conversation.id)}
                      className={cn(
                        "flex w-full items-center gap-3 border-b px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                        activeId === conversation.id && "bg-muted"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          {avatar ? <AvatarImage src={avatar} /> : null}
                          <AvatarFallback className="bg-secondary text-xs font-semibold">
                            {conversation.type === "group" ? (
                              <Users className="h-4 w-4" />
                            ) : (
                              getInitials(conversationTitle(conversation))
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {online && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-status-success" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">
                            {conversationTitle(conversation)}
                          </span>
                          {last && (
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {formatTime(last.created_at)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-muted-foreground">
                            {typing
                              ? "digitando..."
                              : last
                                ? last.attachment_name
                                  ? `📎 ${last.attachment_name}`
                                  : last.body ?? ""
                                : "Sem mensagens"}
                          </span>
                          {unread > 0 && (
                            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Conversa ativa */}
      <main className="flex min-w-0 flex-1 flex-col">
        {!activeConversation ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
            <MessageSquarePlus className="h-8 w-8" />
            <p className="text-sm">Selecione uma conversa para começar.</p>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b px-4 py-2.5">
              <Avatar className="h-9 w-9">
                {conversationAvatar(activeConversation) ? (
                  <AvatarImage
                    src={conversationAvatar(activeConversation) ?? undefined}
                  />
                ) : null}
                <AvatarFallback className="bg-secondary text-xs font-semibold">
                  {activeConversation.type === "group" ? (
                    <Users className="h-4 w-4" />
                  ) : (
                    getInitials(conversationTitle(activeConversation))
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">
                  {conversationTitle(activeConversation)}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {typingName(activeConversation)
                    ? `${typingName(activeConversation)} está digitando...`
                    : activeConversation.type === "group"
                      ? `${activeConversation.chat_members?.length ?? 0} participantes`
                      : "Conversa privada"}
                </div>
              </div>
              {activeConversation.type === "group" && isManager && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Gerenciar grupo"
                  onClick={() => {
                    setGroupName(activeConversation.name ?? "");
                    setGroupDescription(activeConversation.description ?? "");
                    setGroupOpen(true);
                  }}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </header>

            <div className="flex-1 overflow-y-auto bg-muted/20 p-4">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {(activeMessages ?? []).map((message, index) => {
                    const mine = message.sender_id === myId;
                    const previous = (activeMessages ?? [])[index - 1];
                    const showDay =
                      !previous ||
                      formatDay(previous.created_at) !==
                        formatDay(message.created_at);
                    const sender = userById.get(message.sender_id);
                    return (
                      <div key={message.id} className="flex flex-col gap-2">
                        {showDay && (
                          <div className="my-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
                            {formatDay(message.created_at)}
                          </div>
                        )}
                        <div
                          className={cn(
                            "flex",
                            mine ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm",
                              mine
                                ? "bg-primary text-primary-foreground"
                                : "bg-card"
                            )}
                          >
                            {!mine && activeConversation.type === "group" && (
                              <div className="mb-0.5 text-[11px] font-semibold text-primary">
                                {sender?.full_name ?? "Colega"}
                              </div>
                            )}
                            {message.attachment_url && (
                              <a
                                href={message.attachment_url}
                                download={message.attachment_name ?? undefined}
                                className={cn(
                                  "mb-1 flex items-center gap-2 rounded border px-2 py-1 text-xs",
                                  mine
                                    ? "border-primary-foreground/30 text-primary-foreground"
                                    : "border-border text-foreground"
                                )}
                              >
                                <Paperclip className="h-3 w-3" />
                                <span className="truncate">
                                  {message.attachment_name}
                                </span>
                              </a>
                            )}
                            {message.body && <div>{message.body}</div>}
                            <div
                              className={cn(
                                "mt-0.5 flex items-center justify-end gap-1 text-[10px]",
                                mine
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground"
                              )}
                            >
                              {formatTime(message.created_at)}
                              {mine &&
                                (isReadByOthers(message) ? (
                                  <CheckCheck className="h-3 w-3 text-sky-300" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <footer className="border-t p-2">
              {attachment && (
                <div className="mb-2 flex items-center justify-between gap-2 rounded border bg-muted/40 px-2 py-1 text-xs">
                  <span className="flex items-center gap-2 truncate">
                    <Paperclip className="h-3 w-3" />
                    {attachment.name}
                  </span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setAttachment(null)}
                  >
                    remover
                  </button>
                </div>
              )}
              {showEmojis && (
                <div className="mb-2 flex flex-wrap gap-1 rounded border bg-card p-2">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="rounded px-1.5 py-1 text-lg hover:bg-muted"
                      onClick={() => {
                        setText((prev) => prev + emoji);
                        setShowEmojis(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Emojis"
                  onClick={() => setShowEmojis((prev) => !prev)}
                >
                  <Smile className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Anexar arquivo (XML, PDF, Excel, comprovante)"
                  onClick={() => fileRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  placeholder="Escreva uma mensagem"
                  className="min-h-9 flex-1 resize-none"
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={handleSend}
                  disabled={sendMessage.isPending}
                  title="Enviar"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAttachment(file);
                  e.target.value = "";
                }}
              />
            </footer>
          </>
        )}
      </main>

      {/* Nova conversa */}
      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova conversa</DialogTitle>
            <DialogDescription>
              Escolha um colega para conversar em particular.
            </DialogDescription>
          </DialogHeader>
          <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
            {(users ?? [])
              .filter((user) => user.id !== myId)
              .map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => handleStartDirect(user.id)}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted"
                  >
                    <Avatar className="h-8 w-8">
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url} />
                      ) : null}
                      <AvatarFallback className="bg-secondary text-xs font-semibold">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm">{user.full_name}</span>
                  </button>
                </li>
              ))}
          </ul>
        </DialogContent>
      </Dialog>

      {/* Novo grupo (somente gestores) */}
      <Dialog open={newGroupOpen} onOpenChange={setNewGroupOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar grupo</DialogTitle>
            <DialogDescription>
              Somente gestores podem criar salas coletivas.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="group-name">Nome do grupo</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ex.: Equipe Fiscal"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="group-desc">Descrição</Label>
              <Input
                id="group-desc"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Ex.: Fechamento mensal"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Participantes</Label>
              <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded border p-1">
                {(users ?? [])
                  .filter((user) => user.id !== myId)
                  .map((user) => (
                    <li key={user.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 accent-primary"
                          checked={groupMembers.includes(user.id)}
                          onChange={() =>
                            setGroupMembers((prev) =>
                              prev.includes(user.id)
                                ? prev.filter((id) => id !== user.id)
                                : [...prev, user.id]
                            )
                          }
                        />
                        <span className="truncate text-sm">
                          {user.full_name}
                        </span>
                      </label>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setNewGroupOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleCreateGroup}>
              Criar grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gerenciar grupo */}
      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar grupo</DialogTitle>
            <DialogDescription>
              Edite as informações e os participantes do grupo.
            </DialogDescription>
          </DialogHeader>
          {activeConversation && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-group-name">Nome</Label>
                <Input
                  id="edit-group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-group-desc">Descrição</Label>
                <Input
                  id="edit-group-desc"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  updateGroup.mutate(
                    {
                      id: activeConversation.id,
                      name: groupName.trim(),
                      description: groupDescription.trim(),
                    },
                    {
                      onSuccess: () => toast.success("Grupo atualizado."),
                      onError: (error) =>
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Erro ao atualizar."
                        ),
                    }
                  )
                }
              >
                Salvar informações
              </Button>

              <div className="flex flex-col gap-1.5">
                <Label>Participantes</Label>
                <ul className="flex flex-col gap-1">
                  {(activeConversation.chat_members ?? []).map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between gap-2 rounded border px-2 py-1"
                    >
                      <span className="truncate text-sm">
                        {userById.get(member.profile_id)?.full_name ?? "Colega"}
                        {member.is_admin ? " (admin)" : ""}
                      </span>
                      {member.profile_id !== myId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            removeMember.mutate(
                              {
                                conversationId: activeConversation.id,
                                profileId: member.profile_id,
                              },
                              {
                                onSuccess: () => toast.success("Removido."),
                              }
                            )
                          }
                        >
                          Remover
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Adicionar participante</Label>
                <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded border p-1">
                  {(users ?? [])
                    .filter(
                      (user) =>
                        !(activeConversation.chat_members ?? []).some(
                          (member) => member.profile_id === user.id
                        )
                    )
                    .map((user) => (
                      <li key={user.id}>
                        <button
                          type="button"
                          onClick={() =>
                            addMember.mutate(
                              {
                                conversationId: activeConversation.id,
                                profileId: user.id,
                              },
                              {
                                onSuccess: () =>
                                  toast.success("Participante adicionado."),
                              }
                            )
                          }
                          className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-muted"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          {user.full_name}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
