import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  TextField,
  IconButton,
  Button,
  Badge,
  CircularProgress,
  useTheme,
} from "@mui/material";
import {
  FiSend as Send,
  FiUser as AccountCircle,
  FiSearch as Search,
  FiMoreVertical as MoreVert,
  FiMessageSquare as ChatIcon,
} from "react-icons/fi";
import api from "../lib/api.js";
import { wsManager } from "../lib/websocket.js";

export default function Inbox() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef(null);
  const theme = useTheme();

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    api
      .get("/crm/conversations/")
      .then((res) => {
        // Sort conversations by last message timestamp descending
        const sorted = res.data.sort((a, b) => {
          return (
            new Date(b.last_message_at || b.created_at) -
            new Date(a.last_message_at || a.created_at)
          );
        });
        setConversations(sorted);
        setLoadingChats(false);
      })
      .catch((err) => {
        console.error("Error fetching conversations:", err);
        setLoadingChats(false);
      });
  }, []);

  // Listen to real-time WebSockets
  useEffect(() => {
    const handleWebSocketEvent = (event) => {
      if (event.type === "message") {
        const incomingMsg = event.message;
        const incomingConv = event.conversation;

        // 1. Update conversations list
        setConversations((prevConvs) => {
          const filtered = prevConvs.filter((c) => c.id !== incomingConv.id);
          // Push new/updated conversation to the top
          return [incomingConv, ...filtered];
        });

        // 2. Append message if it belongs to the active conversation
        if (activeConv && activeConv.id === event.conversation_id) {
          setMessages((prevMsgs) => {
            // Avoid duplicate appends just in case
            if (prevMsgs.some((m) => m.id === incomingMsg.id)) return prevMsgs;
            return [...prevMsgs, incomingMsg];
          });

          // Clear active conversation unread count locally
          api.post(`/crm/conversations/${activeConv.id}/`).catch(() => {});
        }
      }
    };

    const unsubscribe = wsManager.subscribe(handleWebSocketEvent);
    return () => unsubscribe();
  }, [activeConv]);

  // Load messages when active conversation changes
  const handleSelectConversation = async (conv) => {
    setActiveConv(conv);
    setLoadingMessages(true);

    // Clear unread count on select
    if (conv.unread_count > 0) {
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c)),
      );
    }

    try {
      const res = await api.get(
        `/crm/messages/by_conversation/?conversation_id=${conv.id}`,
      );
      setMessages(res.data);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    const payload = {
      sender_type: "agent",
      content_type: "text",
      content_text: newMessage,
    };

    const messageText = newMessage;
    setNewMessage("");

    try {
      // POST message creation trigger
      const res = await api.post(
        `/crm/conversations/${activeConv.id}/add_message/`,
        payload,
      );

      // Append locally for instantaneous feedback (WebSocket also broadcasts, but this is a fail-safe)
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });

      // Update last message in active conversation locally
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConv.id) {
            return {
              ...c,
              last_message_text: messageText,
              last_message_at: new Date().toISOString(),
            };
          }
          return c;
        }),
      );
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const term = search.toLowerCase();
    const name = conv.contact_detail?.name?.toLowerCase() || "";
    const phone = conv.contact_detail?.phone?.toLowerCase() || "";
    return name.includes(term) || phone.includes(term);
  });

  return (
    <Box
      sx={{
        height: "calc(100vh - 120px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Paper
        sx={{
          flexGrow: 1,
          display: "flex",
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Grid container sx={{ height: "100%" }}>
          {/* Sidebar Conversations List */}
          <Grid
            item
            xs={12}
            sm={4}
            sx={{
              borderRight: "1px solid",
              borderColor: "divider",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search chats..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Search
                      sx={{ color: "text.secondary", mr: 1, fontSize: 20 }}
                    />
                  ),
                }}
              />
            </Box>
            <Divider />
            <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
              {loadingChats ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : filteredConversations.length === 0 ? (
                <Typography
                  align="center"
                  color="text.secondary"
                  sx={{ py: 4, fontWeight: 500 }}
                >
                  No active conversations.
                </Typography>
              ) : (
                <List disablePadding>
                  {filteredConversations.map((conv) => {
                    const active = activeConv?.id === conv.id;
                    const date = conv.last_message_at
                      ? new Date(conv.last_message_at)
                      : null;
                    const timeString = date
                      ? date.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "";

                    return (
                      <ListItem
                        key={conv.id}
                        disablePadding
                        sx={{
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          bgcolor: active ? "action.selected" : "transparent",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <Box
                          onClick={() => handleSelectConversation(conv)}
                          sx={{
                            width: "100%",
                            p: 2,
                            display: "flex",
                            gap: 2,
                            cursor: "pointer",
                            alignItems: "center",
                          }}
                        >
                          <Badge
                            color="primary"
                            badgeContent={conv.unread_count}
                          >
                            <Avatar sx={{ bgcolor: "primary.light" }}>
                              {conv.contact_detail?.name
                                ?.substring(0, 2)
                                .toUpperCase() || <AccountCircle />}
                            </Avatar>
                          </Badge>

                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                              }}
                            >
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: conv.unread_count > 0 ? 800 : 600,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {conv.contact_detail?.name ||
                                  conv.contact_detail?.phone}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {timeString}
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontWeight: conv.unread_count > 0 ? 700 : 400,
                              }}
                            >
                              {conv.last_message_text || "No messages yet"}
                            </Typography>
                          </Box>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>
          </Grid>

          {/* Active Chat Conversation Panel */}
          <Grid
            item
            xs={12}
            sm={8}
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "background.default"
                  : "#f1f5f9",
            }}
          >
            {activeConv ? (
              <>
                {/* Chat Panel Header */}
                <Box
                  sx={{
                    px: 3,
                    py: 2,
                    bgcolor: "background.paper",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                      {activeConv.contact_detail?.name
                        ?.substring(0, 2)
                        .toUpperCase() || <AccountCircle />}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {activeConv.contact_detail?.name ||
                          activeConv.contact_detail?.phone}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activeConv.contact_detail?.phone}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton>
                    <MoreVert />
                  </IconButton>
                </Box>

                {/* Message Thread Body */}
                <Box
                  sx={{
                    flexGrow: 1,
                    overflowY: "auto",
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  {loadingMessages ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 4 }}
                    >
                      <CircularProgress size={30} />
                    </Box>
                  ) : messages.length === 0 ? (
                    <Box
                      sx={{
                        flexGrow: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
                        No messages yet. Send one below!
                      </Typography>
                    </Box>
                  ) : (
                    messages.map((msg) => {
                      const isMe =
                        msg.sender_type === "agent" ||
                        msg.sender_type === "bot";
                      return (
                        <Box
                          key={msg.id}
                          sx={{
                            display: "flex",
                            justifyContent: isMe ? "flex-end" : "flex-start",
                          }}
                        >
                          <Paper
                            sx={{
                              p: 2,
                              maxWidth: "70%",
                              borderRadius: isMe
                                ? "16px 16px 2px 16px"
                                : "16px 16px 16px 2px",
                              bgcolor: isMe
                                ? "primary.main"
                                : "background.paper",
                              color: isMe
                                ? "primary.contrastText"
                                : "text.primary",
                              boxShadow: "0 1px 2px rgb(0 0 0 / 0.05)",
                            }}
                          >
                            <Typography variant="body2">
                              {msg.content_text}
                            </Typography>
                            <Typography
                              variant="caption"
                              align="right"
                              display="block"
                              sx={{
                                mt: 0.5,
                                opacity: 0.8,
                                fontSize: "10px",
                              }}
                            >
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Typography>
                          </Paper>
                        </Box>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Chat Panel Bottom Input */}
                <Box
                  component="form"
                  onSubmit={handleSendMessage}
                  sx={{
                    p: 2,
                    bgcolor: "background.paper",
                    borderTop: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      fullWidth
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 6,
                        },
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      endIcon={<Send />}
                      sx={{ borderRadius: 6, px: 3 }}
                    >
                      Send
                    </Button>
                  </Box>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 3,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "primary.light",
                    width: 64,
                    height: 64,
                    mb: 2,
                  }}
                >
                  <ChatIcon
                    sx={{ fontSize: 32, color: "primary.contrastText" }}
                  />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  No Chat Selected
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Select a contact from the list on the left to start messaging
                  in real-time.
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
