import supabase, { FUNCTIONS_URL, STORAGE_BUCKET } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

type MessageHandler = (msg: any) => void;
type PresenceHandler = (users: any[]) => void;
type TypingHandler = (data: { userId: string; username: string }) => void;

class SupabaseRealtimeService {
    private channels: Map<string, RealtimeChannel> = new Map();

    // ─── Public Room Channel ───────────────────────────────────
    joinRoom(
        roomId: string,
        userId: string,
        username: string,
        handlers: {
            onMessage: MessageHandler;
            onPresence: PresenceHandler;
            onTyping: TypingHandler;
            onStopTyping: TypingHandler;
        }
    ) {
        const channelKey = `room:${roomId}`;
        this.leaveRoom(roomId); // cleanup old

        const channel = supabase.channel(channelKey, {
            config: { presence: { key: userId } }
        });

        // 1. Listen for new messages (DB changes)
        channel.on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
            async (payload) => {
                // Enrich with sender profile
                const msg = payload.new as any;
                if (!msg.sender_id || msg.sender_id === 'SYSTEM_AI') {
                    handlers.onMessage(msg);
                    return;
                }
                const { data: profile } = await supabase
                    .from('profiles').select('username, first_name, avatar_url, role')
                    .eq('id', msg.sender_id).single();
                handlers.onMessage({ ...msg, username: profile?.username || 'User', avatarUrl: profile?.avatar_url, role: profile?.role });
            }
        );

        // 2. Presence (online users)
        channel.on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const users = Object.values(state).flat() as any[];
            handlers.onPresence(users);
        });

        // 3. Typing broadcasts (ephemeral)
        channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
            handlers.onTyping(payload);
        });
        channel.on('broadcast', { event: 'stopTyping' }, ({ payload }) => {
            handlers.onStopTyping(payload);
        });

        // Subscribe and track presence
        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({ user_id: userId, username, online_at: new Date().toISOString() });
            }
        });

        this.channels.set(channelKey, channel);
        return channel;
    }

    leaveRoom(roomId: string) {
        const key = `room:${roomId}`;
        const ch = this.channels.get(key);
        if (ch) { ch.unsubscribe(); this.channels.delete(key); }
    }

    // ─── Send Public Message ───────────────────────────────────
    async sendPublicMessage(roomId: string, senderId: string, content: string, type = 'TEXT', receiverId?: string) {
        const { data, error } = await supabase.from('messages').insert({
            room_id: roomId,
            sender_id: senderId,
            content,
            type,
            receiver_id: receiverId || null,
        }).select().single();

        if (error) throw new Error(error.message);
        return data;
    }

    // ─── Typing Indicators ─────────────────────────────────────
    sendTyping(roomId: string, userId: string, username: string) {
        const channel = this.channels.get(`room:${roomId}`);
        channel?.send({ type: 'broadcast', event: 'typing', payload: { userId, username } });
    }

    sendStopTyping(roomId: string, userId: string, username: string) {
        const channel = this.channels.get(`room:${roomId}`);
        channel?.send({ type: 'broadcast', event: 'stopTyping', payload: { userId, username } });
    }

    // ─── Private Messages ──────────────────────────────────────
    subscribeToPrivateMessages(userId: string, onMessage: MessageHandler) {
        const key = `private:${userId}`;
        this.channels.get(key)?.unsubscribe();

        const channel = supabase
            .channel(key)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'private_messages',
                filter: `receiver_id=eq.${userId}`
            }, (payload) => {
                onMessage(payload.new);
            })
            .subscribe();

        this.channels.set(key, channel);
        return channel;
    }

    async sendPrivateMessage(senderId: string, receiverId: string, content: string) {
        const { data, error } = await supabase.from('private_messages').insert({
            sender_id: senderId,
            receiver_id: receiverId,
            content,
            status: 'sent'
        }).select().single();

        if (error) throw new Error(error.message);
        return data;
    }

    async getPrivateHistory(userId: string, recipientId: string) {
        const { data, error } = await supabase
            .from('private_messages')
            .select('*')
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${userId})`)
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);
        return data;
    }

    // ─── Mark Private Messages as Delivered ───────────────────
    async markDelivered(messageId: string) {
        await supabase.from('private_messages').update({ status: 'delivered' }).eq('id', messageId);
    }

    // ─── Cleanup All ───────────────────────────────────────────
    disconnectAll() {
        this.channels.forEach(ch => ch.unsubscribe());
        this.channels.clear();
    }
}

export const realtimeService = new SupabaseRealtimeService();
export default realtimeService;
