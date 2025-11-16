import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Clock,
  Eye,
  Search,
  Filter,
  ArrowUp,
  Download,
  Image as ImageIcon,
  FileText,
  Paperclip,
  MessageCircle,
  Send
} from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  startAfter,
  DocumentSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface Message {
  id: string;
  text: string;
  from: string;
  createdAt: Timestamp;
  type?: string;
  attachments?: string[];
  metadata?: {
    edited?: boolean;
    editedAt?: Timestamp;
    deleted?: boolean;
    deletedAt?: Timestamp;
    reactions?: Record<string, string[]>;
  };
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  participants: string[];
  groupName?: string;
  blocked?: boolean;
  blockedReason?: string;
  lastMessage?: {
    text: string;
    from: string;
    createdAt: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const ChatViewer: React.FC = () => {
  const [chatId, setChatId] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation data
  const fetchConversation = async () => {
    if (!chatId.trim()) return;

    setLoading(true);
    setError("");
    setConversation(null);
    setMessages([]);

    try {
      const conversationDoc = await getDoc(doc(db, 'conversations', chatId));

      if (!conversationDoc.exists()) {
        setError("Conversazione non trovata");
        setLoading(false);
        return;
      }

      const conversationData = {
        id: conversationDoc.id,
        ...conversationDoc.data()
      } as Conversation;

      setConversation(conversationData);

      // Load user data for participants
      await loadUsersData(conversationData.participants);

      // Load messages
      await loadMessages(chatId);

    } catch (err: any) {
      setError("Errore nel caricamento: " + err.message);
      console.error("Error fetching conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load user data
  const loadUsersData = async (userIds: string[]) => {
    const usersData: Record<string, User> = {};

    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            usersData[userId] = {
              id: userId,
              ...userDoc.data()
            } as User;
          }
        } catch (error) {
          console.error('Error loading user:', userId, error);
        }
      })
    );

    setUsers(usersData);
  };

  // Load messages
  const loadMessages = async (conversationId: string) => {
    setMessagesLoading(true);

    try {
      const messagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message)).reverse(); // Show chronologically

        setMessages(messagesData);
        setMessagesLoading(false);

        // Scroll to bottom after loading
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading messages:', error);
      setError("Errore nel caricamento dei messaggi");
      setMessagesLoading(false);
    }
  };

  // Filter messages based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMessages(messages);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = messages.filter(message => {
      const userDisplayName = getUserDisplayName(message.from).toLowerCase();
      return (
        message.text.toLowerCase().includes(searchLower) ||
        userDisplayName.includes(searchLower) ||
        message.id.toLowerCase().includes(searchLower)
      );
    });

    setFilteredMessages(filtered);
  }, [messages, searchTerm]);

  // Get user display name
  const getUserDisplayName = (userId: string) => {
    const user = users[userId];
    if (!user) return `User ${userId.slice(0, 8)}`;

    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.email || userId;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Export conversation
  const exportConversation = () => {
    if (!conversation || messages.length === 0) return;

    const conversationText = messages.map(message => {
      const user = getUserDisplayName(message.from);
      const timestamp = formatTimestamp(message.createdAt);
      return `[${timestamp}] ${user}: ${message.text}`;
    }).join('\n');

    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_${chatId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Visualizza Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Inserisci ID della conversazione..."
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchConversation()}
              className="flex-1"
            />
            <Button
              onClick={fetchConversation}
              disabled={loading || !chatId.trim()}
            >
              {loading ? "Caricamento..." : "Carica Chat"}
            </Button>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation Info */}
      {conversation && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {conversation.type === 'direct' ? (
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                ) : (
                  <User className="w-5 h-5 text-purple-500" />
                )}
                {conversation.groupName || `Conversazione ${conversation.id.slice(0, 12)}`}
                {conversation.blocked && (
                  <Badge variant="destructive">Bloccata</Badge>
                )}
              </CardTitle>

              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <Button variant="outline" size="sm" onClick={exportConversation}>
                    <Download className="w-4 h-4 mr-2" />
                    Esporta
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>ID:</strong> {conversation.id}
              </div>
              <div>
                <strong>Tipo:</strong> {conversation.type === 'direct' ? 'Chat Diretta' : 'Gruppo'}
              </div>
              <div>
                <strong>Partecipanti:</strong> {conversation.participants.length}
              </div>
              <div>
                <strong>Messaggi:</strong> {messages.length}
              </div>
              <div>
                <strong>Creata:</strong> {formatTimestamp(conversation.createdAt)}
              </div>
              <div>
                <strong>Aggiornata:</strong> {formatTimestamp(conversation.updatedAt)}
              </div>
              {conversation.lastMessage && (
                <div className="md:col-span-2">
                  <strong>Ultimo messaggio:</strong> {conversation.lastMessage.text.slice(0, 50)}...
                </div>
              )}
            </div>

            {conversation.blockedReason && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                <strong>Motivo blocco:</strong> {conversation.blockedReason}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      {conversation && (
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Messaggi ({filteredMessages.length})
              </CardTitle>
            </div>

            {/* Search Messages */}
            {messages.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca nei messaggi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4 py-4">
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredMessages.length > 0 ? (
                  filteredMessages.map((message, index) => {
                    const user = users[message.from];
                    const isConsecutive = index > 0 &&
                      filteredMessages[index - 1].from === message.from &&
                      message.createdAt.toDate().getTime() - filteredMessages[index - 1].createdAt.toDate().getTime() < 5 * 60 * 1000;

                    return (
                      <div key={message.id} className={`${isConsecutive ? 'ml-12' : ''}`}>
                        {!isConsecutive && (
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                              {user?.profileImage ? (
                                <img
                                  src={user.profileImage}
                                  alt={getUserDisplayName(message.from)}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <span className="text-sm font-medium">
                                  {getUserDisplayName(message.from).charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {getUserDisplayName(message.from)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(message.createdAt)}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className={`${isConsecutive ? 'ml-0' : 'ml-11'} mb-2`}>
                          {message.metadata?.deleted ? (
                            <div className="text-sm text-gray-400 italic">
                              Messaggio eliminato
                            </div>
                          ) : (
                            <>
                              {/* Message Text */}
                              <div className="bg-gray-50 rounded-lg p-3 max-w-2xl">
                                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                              </div>

                              {/* Attachments */}
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {message.attachments.map((attachment, attIndex) => (
                                    <div key={attIndex} className="flex items-center gap-2 p-2 bg-gray-100 rounded text-sm">
                                      <Paperclip className="w-4 h-4 text-gray-500" />
                                      <span>Allegato {attIndex + 1}</span>
                                      <Button variant="ghost" size="sm" onClick={() => setSelectedImage(attachment)}>
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {isConsecutive && (
                          <div className="text-xs text-gray-400 ml-11 -mt-1 mb-2">
                            {formatTimestamp(message.createdAt)}
                          </div>
                        )}

                        <Separator className="my-3" />
                      </div>
                    );
                  })
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Send className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nessun messaggio in questa conversazione</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nessun messaggio trovato</p>
                    <p className="text-sm">Prova a modificare la ricerca</p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Anteprima Allegato</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="text-center">
              <img
                src={selectedImage}
                alt="Anteprima"
                className="max-w-full max-h-[70vh] mx-auto rounded-lg"
                onError={(e) => {
                  // Fallback for non-image attachments
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="mt-4">
                <Button variant="outline" onClick={() => window.open(selectedImage, '_blank')}>
                  <Download className="w-4 h-4 mr-2" />
                  Apri in nuova scheda
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
