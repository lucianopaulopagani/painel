import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ChatUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface ChatMemberRow {
  id: string;
  conversation_id: string;
  profile_id: string;
  is_admin: boolean;
  last_read_at: string | null;
}

export interface ChatConversationRow {
  id: string;
  type: "direct" | "group";
  name: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  chat_members?: ChatMemberRow[] | null;
}

export interface ChatMessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  created_at: string;
}

export interface ChatPresenceRow {
  profile_id: string;
  last_seen_at: string;
  typing_conversation_id: string | null;
  typing_at: string | null;
}

export const chatKeys = {
  users: ["chat", "users"] as const,
  conversations: ["chat", "conversations"] as const,
  messages: (id: string) => ["chat", "messages", id] as const,
  presence: ["chat", "presence"] as const,
};

/** Diretório de colegas (id, nome, avatar). */
export function useChatUsers() {
  return useQuery({
    queryKey: chatKeys.users,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("chat_users");
      if (error) throw error;
      return (data ?? []) as ChatUser[];
    },
  });
}

export function useChatConversations() {
  return useQuery({
    queryKey: chatKeys.conversations,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*, chat_members(*)")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as ChatConversationRow[];
    },
  });
}

export function useChatMessages(conversationId: string | null) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId ?? ""),
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as ChatMessageRow[];
    },
  });
}

export function useChatPresence() {
  return useQuery({
    queryKey: chatKeys.presence,
    queryFn: async () => {
      const { data, error } = await supabase.from("chat_presence").select("*");
      if (error) throw error;
      return (data ?? []) as ChatPresenceRow[];
    },
  });
}

/** Todas as mensagens visíveis (para prévias e não lidas na lista). */
export function useAllChatMessages() {
  return useQuery({
    queryKey: ["chat", "messages", "all"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as ChatMessageRow[];
    },
  });
}

/** Assina o tempo real de mensagens e presença. */
export function useChatRealtime(conversationId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("chat-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat", "messages"] });
          queryClient.invalidateQueries({ queryKey: chatKeys.conversations });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_presence" },
        () => {
          queryClient.invalidateQueries({ queryKey: chatKeys.presence });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, conversationId]);
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      conversation_id: string;
      sender_id: string;
      body: string | null;
      attachment_url?: string | null;
      attachment_name?: string | null;
      attachment_type?: string | null;
    }) => {
      const { error } = await supabase.from("chat_messages").insert(payload);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["chat", "messages"] }),
  });
}

/** Cria (ou reaproveita) uma conversa privada 1:1. */
export function useStartDirectChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      myId,
      otherId,
    }: {
      myId: string;
      otherId: string;
    }) => {
      const { data: existing, error: readError } = await supabase
        .from("chat_conversations")
        .select("id, chat_members(profile_id)")
        .eq("type", "direct");
      if (readError) throw readError;

      const found = (existing ?? []).find((conversation) => {
        const ids = (conversation.chat_members ?? []).map(
          (member: { profile_id: string }) => member.profile_id
        );
        return ids.includes(myId) && ids.includes(otherId);
      });
      if (found) return found.id as string;

      const { data: created, error: createError } = await supabase
        .from("chat_conversations")
        .insert({ type: "direct", created_by: myId })
        .select("id")
        .single();
      if (createError) throw createError;

      const { error: memberError } = await supabase
        .from("chat_members")
        .insert([
          { conversation_id: created.id, profile_id: myId },
          { conversation_id: created.id, profile_id: otherId },
        ]);
      if (memberError) throw memberError;

      return created.id as string;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations }),
  });
}

/** Cria um grupo (somente gestores). */
export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      myId,
      name,
      description,
      memberIds,
    }: {
      myId: string;
      name: string;
      description: string;
      memberIds: string[];
    }) => {
      const { data: created, error } = await supabase
        .from("chat_conversations")
        .insert({
          type: "group",
          name,
          description: description || null,
          created_by: myId,
        })
        .select("id")
        .single();
      if (error) throw error;

      const members = Array.from(new Set([myId, ...memberIds])).map((id) => ({
        conversation_id: created.id,
        profile_id: id,
        is_admin: id === myId,
      }));
      const { error: memberError } = await supabase
        .from("chat_members")
        .insert(members);
      if (memberError) throw memberError;

      return created.id as string;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations }),
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
    }: {
      id: string;
      name: string;
      description: string;
    }) => {
      const { error } = await supabase
        .from("chat_conversations")
        .update({ name, description: description || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations }),
  });
}

export function useAddGroupMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      profileId,
    }: {
      conversationId: string;
      profileId: string;
    }) => {
      const { error } = await supabase
        .from("chat_members")
        .insert({ conversation_id: conversationId, profile_id: profileId });
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations }),
  });
}

export function useRemoveGroupMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      profileId,
    }: {
      conversationId: string;
      profileId: string;
    }) => {
      const { error } = await supabase
        .from("chat_members")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("profile_id", profileId);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations }),
  });
}

/** Marca a conversa como lida (confirmação de leitura). */
export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      profileId,
    }: {
      conversationId: string;
      profileId: string;
    }) => {
      const { error } = await supabase
        .from("chat_members")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("profile_id", profileId);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations }),
  });
}

/** Atualiza presença (online) e o indicador "digitando...". */
export function useChatHeartbeat(
  profileId: string,
  typingConversationId: string | null
) {
  useEffect(() => {
    if (!profileId) return;

    const ping = async () => {
      await supabase.from("chat_presence").upsert(
        {
          profile_id: profileId,
          last_seen_at: new Date().toISOString(),
          typing_conversation_id: typingConversationId,
          typing_at: typingConversationId ? new Date().toISOString() : null,
        },
        { onConflict: "profile_id" }
      );
    };

    ping();
    const interval = setInterval(ping, 20000);
    return () => clearInterval(interval);
  }, [profileId, typingConversationId]);
}
