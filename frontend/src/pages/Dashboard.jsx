import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  useTheme,
} from "@mui/material";
import {
  FiMessageSquare as ChatBubbleOutline,
  FiUsers as PeopleOutline,
  FiTrendingUp as TrendingUp,
  FiArrowRight as ArrowForward,
} from "react-icons/fi";
import {
  FaWhatsapp as WhatsApp,
  FaRupeeSign as RupeeIcon,
} from "react-icons/fa";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../lib/api.js";

// Premium mockup dashboard chart data in case database is empty on start
const defaultChartData = [
  { name: "Mon", Inbound: 12, Outbound: 19 },
  { name: "Tue", Inbound: 15, Outbound: 25 },
  { name: "Wed", Inbound: 18, Outbound: 30 },
  { name: "Thu", Inbound: 14, Outbound: 28 },
  { name: "Fri", Inbound: 25, Outbound: 40 },
  { name: "Sat", Inbound: 8, Outbound: 15 },
  { name: "Sun", Inbound: 10, Outbound: 18 },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    conversations: 0,
    contacts: 0,
    pipelines: 0,
    pipelineValue: 0.0,
  });
  const theme = useTheme();

  useEffect(() => {
    // Proactively fetch stats
    const fetchStats = async () => {
      try {
        const [convs, contacts, deals] = await Promise.all([
          api.get("/crm/conversations/"),
          api.get("/crm/contacts/"),
          api.get("/crm/deals/"),
        ]);

        const totalValue = deals.data.reduce(
          (acc, deal) => acc + parseFloat(deal.value || 0),
          0,
        );

        setStats({
          conversations: convs.data.length,
          contacts: contacts.data.length,
          pipelines: deals.data.length,
          pipelineValue: totalValue,
        });
      } catch (err) {
        console.error("Error loading dashboard statistics:", err);
      }
    };
    fetchStats();
  }, []);

  const metricCards = [
    {
      title: "Active Conversations",
      value: stats.conversations,
      icon: (
        <ChatBubbleOutline
          size={28}
          style={{ color: theme.palette.primary.main }}
        />
      ),
      color: theme.palette.primary.main,
      bg:
        theme.palette.mode === "dark" ? "rgba(16, 185, 129, 0.15)" : "#eff6ff",
    },
    {
      title: "Total Contacts",
      value: stats.contacts,
      icon: (
        <PeopleOutline
          size={28}
          style={{ color: theme.palette.secondary.main }}
        />
      ),
      color: theme.palette.secondary.main,
      bg: theme.palette.mode === "dark" ? "rgba(37, 99, 235, 0.15)" : "#ecfdf5",
    },
    {
      title: "Deals in Pipeline",
      value: stats.pipelines,
      icon: (
        <TrendingUp size={28} style={{ color: theme.palette.warning.main }} />
      ),
      color: theme.palette.warning.main,
      bg:
        theme.palette.mode === "dark" ? "rgba(245, 158, 11, 0.15)" : "#fffbef",
    },
    {
      title: "Pipeline Value",
      value: stats.pipelineValue
        ? `₹${stats.pipelineValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "₹0.00",
      icon: <RupeeIcon size={28} style={{ color: theme.palette.error.main }} />,
      color: theme.palette.error.main,
      bg: theme.palette.mode === "dark" ? "rgba(239, 68, 68, 0.15)" : "#fef2f2",
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Welcome Back!
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Here is an overview of your WhatsApp CRM performance.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<WhatsApp />}
          href="/inbox"
          sx={{ borderRadius: 2 }}
        >
          Open Chat Inbox
        </Button>
      </Box>

      {/* Metric Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metricCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card
              sx={{
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
              }}
            >
              <CardContent
                sx={{
                  p: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 600, mb: 0.5 }}
                  >
                    {card.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {card.value}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "12px",
                    bgcolor: card.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Chart Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card
            sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Messaging Activity
              </Typography>
              <Box sx={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <AreaChart data={defaultChartData}>
                    <defs>
                      <linearGradient
                        id="colorInbound"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={theme.palette.primary.main}
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor={theme.palette.primary.main}
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorOutbound"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={theme.palette.secondary.main}
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor={theme.palette.secondary.main}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={
                        theme.palette.mode === "dark" ? "#1e293b" : "#e2e8f0"
                      }
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      style={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="Inbound"
                      stroke={theme.palette.primary.main}
                      fillOpacity={1}
                      fill="url(#colorInbound)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="Outbound"
                      stroke={theme.palette.secondary.main}
                      fillOpacity={1}
                      fill="url(#colorOutbound)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Quick Actions
              </Typography>
              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  endIcon={<ArrowForward />}
                  href="/contacts"
                  sx={{ justifyContent: "space-between", py: 1.5 }}
                >
                  Manage CRM Contacts
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  endIcon={<ArrowForward />}
                  href="/pipelines"
                  sx={{ justifyContent: "space-between", py: 1.5 }}
                >
                  View Deals Kanban Pipeline
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  endIcon={<ArrowForward />}
                  href="/inbox"
                  sx={{ justifyContent: "space-between", py: 1.5 }}
                >
                  Go to WhatsApp Inbox
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
